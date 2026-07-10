---
name: extract-monitors
description: Given a URL of a page that lists several monitors (a manufacturer lineup page, a retailer category listing, or a review roundup), fetch it, extract every monitor it lists along with whatever preliminary specs the page exposes, drop the ones already catalogued in this app's dataset, then run the check-monitor skill on each *new* model to produce a full, sourced spec report and paste-ready data-model entries. Use when the user gives a page URL and wants all the monitors on it researched/added, rather than naming a single model.
---

# extract-monitors

Turn one page URL into a batch run of `check-monitor`. This skill does the
*discovery* half — pull the list of monitors and their on-page hints off the URL —
filter out the ones the app already ships, then hand each *new* model to the
`check-monitor` skill, which does the *verification* half (multi-source corroboration,
active-area geometry, data-model mapping).

Think of it as: **one page in → new monitors only → many `check-monitor` reports out**,
plus a single roll-up table so the batch is scannable at a glance.

## Inputs
A single URL. Typical kinds:
- a manufacturer lineup/category page (e.g. Dell's ultrawide monitors page),
- a retailer category listing (Amazon/Newegg/Best Buy search or category),
- an editorial roundup ("Best ultrawide monitors of 2026").

If the user pastes a URL with no other instruction, assume they want every distinct
monitor model on that page researched. If they add a filter ("just the OLEDs", "only
34-inch ones"), apply it during extraction.

## Method

### 1. Fetch the page and extract the monitor list
- Use `WebFetch` on the URL with a prompt like *"List every distinct monitor model on
  this page. For each, give the exact brand + model name/number and any specs shown:
  size, resolution, panel type, refresh rate, curvature, price."*
- **WebFetch is frequently blocked (HTTP 403) behind the agent proxy**, especially for
  manufacturer and retailer hosts. If it fails or returns nothing usable:
  - Retry once, then fall back to `WebSearch` for the page's contents (e.g. search the
    page title or `site:<host> monitors`) and reconstruct the list from result excerpts.
  - If you still can't recover a list, stop and tell the user the URL couldn't be read
    (with the error), rather than inventing models.
- Build a **candidate list**. For each entry capture the *exact* model identifier
  (brand + model number — resolve marketing names like "Odyssey OLED G9" to the model
  code `G95SC` when the page shows it) and the **preliminary specs the page exposed**.
  Mark anything not on the page as unknown — do not fill gaps yet; that's check-monitor's job.

### 2. Normalize and de-duplicate
- Collapse duplicate listings (same model appearing twice, size variants of one family
  listed separately are *distinct* models — keep them separate).
- Drop non-monitors (docks, stands, accessories, bundles) and anything outside a
  user-supplied filter.
### 3. Filter out monitors already in the dataset
Before spending any research, drop every candidate the app already catalogues — the
point is to research *new* monitors, not re-verify shipped ones.

- The catalogue is `MONITOR_MODELS` in `src/data/index.ts` (flattened from the per-class
  files in `src/data/models/*.ts`). Read it — don't rely on memory — since it changes.
- Match a candidate as **already present** if either:
  - its computed model id slug (the `id` field scheme, e.g. `dell-s3425dw`) matches an
    existing model's `id`, or
  - its brand + model name/number matches an existing model's `brand` + `name`
    (case-insensitive, ignoring punctuation/spacing — `Dell S3425DW` == `dell-s3425dw`).
  When unsure whether a slightly different name is the same model, treat it as a
  potential match and flag it rather than silently researching a duplicate.
- Keep only the **new** candidates for step 4. Report what was skipped: list the
  already-catalogued models under a "Skipped (already in dataset)" note so the user sees
  they were considered.
- If **nothing new** remains, say so and stop — don't run check-monitor on an empty list.

### 4. Run check-monitor on each new model
For every model in the filtered (new-only) list, run the **check-monitor** skill's method against it
(same model-identification → multi-source corroboration → active-area geometry →
data-model mapping → sourced output). Seed each run with the preliminary specs from
step 1 as *hints to verify*, not as facts.

- **Parallelize** when the list is more than 2-3 models: dispatch one subagent per
  model (via the Agent tool) so the web research runs concurrently, each instructed to
  follow the check-monitor skill and return that skill's full output block for its
  model. For 1-3 models, just run them inline.
- Each per-model result must stand on its own exactly as `check-monitor` specifies:
  its report table, active-area size, notes/disagreements, the paste-ready
  `src/data/models/<class-id>.ts` entry, the `MODEL_SOURCES` entry, and its Sources list.
- Preserve check-monitor's confidence discipline: never present an uncorroborated spec;
  mark unresolved values Low and say so.

### 5. Roll up
After the per-model reports, emit one summary table across the researched (new) models
so the page can be understood at a glance, and flag any **new classes** the batch would
introduce.

## Output format

```
# <Page title or URL> — Monitor Batch Report

Source page: <url>
Extracted <N> monitors (<how the list was obtained: WebFetch / WebSearch fallback>).
<K> already in dataset (skipped), <M> new → researched below.

Skipped (already in dataset): <brand + name, …> — or "none".

## Summary (new models)
| Model | Size / Res | Panel / Refresh | Curvature | Class id | Class status |
|-------|-----------|-----------------|-----------|----------|--------------|
| …     | 34" 3440×1440 | QD-OLED, 165 Hz | 1800R | 34-3440x1440-1800r | existing |
| …     | …         | …               | …         | …        | NEW ⚠        |

New classes this page would add: <list of NEW class ids, or "none">.

---

<full check-monitor report for model 1>

---

<full check-monitor report for model 2>

…
```

## Rules
- This skill discovers and delegates; it does **not** relax check-monitor's standards.
  Every reported spec must trace to a source in that model's Sources list.
- Preliminary on-page specs are **hints to verify**, never the final answer — a lineup
  page's "165 Hz" still gets corroborated by check-monitor.
- If extraction is uncertain (garbled names, ambiguous variants), list what you found
  and ask the user to confirm before spending research on the wrong models.
- Keep size variants and refresh variants of a family as separate models.
- Never run check-monitor on a model already in `MONITOR_MODELS` — filter first (step 3),
  and read the catalogue live rather than trusting a remembered list.
- Report the batch honestly: if some models couldn't be resolved or a source was thin,
  say which ones and why rather than padding the table.
