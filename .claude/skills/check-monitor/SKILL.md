---
name: check-monitor
description: Research a monitor's real-world specs from a model name/number — curvature radius, native resolution, size class, and actual visible (active-area) dimensions — by cross-checking multiple online sources, resolving disagreements, and mapping the result onto this app's data model (generic classes + specific models in src/data). Use when the user names a specific monitor (e.g. "Dell S3425DW", "Alienware AW3423DWF", "LG 45GX950A") and wants its specifications, or asks to add/verify a monitor against the comparison tool.
---

# check-monitor

Produce a confident, sourced spec report for a given monitor model, then relate it
to the presets this app ships. The goal is accuracy through corroboration — never a
single-source guess.

## Inputs
A monitor name or model number (e.g. `Dell S3425DW`, `Samsung Odyssey OLED G9 G95SC`,
`LG UltraGear 45GX950A`). If the user gives only a vague description ("that 40-inch
Dell ultrawide"), first identify the exact model, then proceed.

## Method

1. **Gather from multiple independent sources.** Run several `WebSearch` queries and
   prefer at least three source *types* before committing to a value:
   - the manufacturer's own product/spec page,
   - retail listings (Amazon, Newegg, Walmart) — good for resolution, panel, refresh,
   - a spec database (displayspecifications.com, productchart.com) — good for active-area mm,
   - independent editorial reviews (RTINGS, TFTCentral, Digital Camera World, EFTM,
     Tom's Hardware) — often the *only* place curvature is stated when the maker omits it.

   Note: `WebFetch` is frequently blocked (HTTP 403) for manufacturer/spec-DB/PDF hosts
   behind the agent proxy. Rely on `WebSearch` result excerpts; they usually carry the
   numbers. Don't report a spec you couldn't find in an excerpt.

2. **Resolve disagreements explicitly.** When sources conflict (curvature is the usual
   culprit — makers often don't publish it), weigh them: manufacturer > consensus of
   reviews > lone listing. Sanity-check against the model's predecessor (e.g. an
   S3422DW→S3425DW line usually keeps the same curve). State which value you chose and why.

3. **Report a confidence level per attribute** (High / Medium / Low). "Unanimous across
   sources" = High. "Reviewer-reported, maker silent" = still High if the reviews agree.
   "Single unverified listing" = Low.

4. **Compute the actual visible (active-area) size yourself** from resolution + diagonal —
   don't rely on finding it quoted. See the geometry below. Report the flat-chord
   width × height in both mm and inches, and note that a curved panel's measured
   *arc length* across the surface is marginally longer than the chord.

5. **Map to this app's data model.** The app stores monitors as generic *classes*
   (geometry) plus specific *models* that reference a class — see `src/data/`:
   - `src/data/monitorClasses.ts` — the `MONITOR_CLASSES` list. Class id scheme is
     `<diagonal>-<width>x<height>[-<curve>r]`, e.g. `34-3440x1440-1800r` (curved) or
     `31.5-2560x1440` (flat, no curve suffix).
   - `src/data/models/<class-id>.ts` — one file per class, exporting `models`.
   - `src/data/modelSources.ts` — `MODEL_SOURCES`, keyed by model id → the list of
     `{ name, url }` sources you cross-checked for that model.
   - `src/data/index.ts` — the per-class imports + integrity checks (which also assert
     every `MODEL_SOURCES` key is a real model id).

   Work out the monitor's **class id** from its geometry. State whether that class
   already exists in `MONITOR_CLASSES`, and produce a **paste-ready model entry** (see
   output below). If the class is new, also give the class object to add and note that a
   new `src/data/models/<class-id>.ts` file + its import line in `index.ts` are needed.
   Also produce a **`MODEL_SOURCES` entry** for `src/data/modelSources.ts`, keyed by the
   same model id, listing every source you actually used as `{ name, url }`.
   (The Custom-mode resolution/curvature pickers in `src/constants.ts` — `PRESETS`,
   `CURVATURE_PRESETS` — are separate; mention them only if a resolution/radius the tool
   can't yet offer is worth adding.)

## Active-area geometry

For a rectangular panel of pixel resolution `W × H` and viewable diagonal `D`:

```
aspect         = W / H
diag_factor    = sqrt(aspect^2 + 1)
height         = D / diag_factor
width          = height * aspect
ppi            = W / width          (width in inches)
```

Worked example — 34" 3440×1440:
- aspect = 3440/1440 = 2.3889
- diag_factor = sqrt(2.3889² + 1) = 2.58975
- height = 34 / 2.58975 = 13.13" = 333.5 mm
- width  = 13.13 × 2.3889 = 31.36" = 796.7 mm
- ppi    = 3440 / 31.36 ≈ 110

(The standard industry figure for this panel is 797.22 × 333.72 mm; small differences
come from rounding the nominal "34 inch" to the true viewable diagonal.)

Common aspect ratios: 16:9 (1.778), 21:9 UW = 3440×1440 (2.389), 21:9 = 3840×1600
(2.4), 32:9 = 5120×1440 (3.556), 16:10 (1.6).

## Output format

Lead with a table, then the details that need nuance:

```
## <Model> — Display Report

<one line on how many/which source types were cross-checked>

| Attribute        | Value                          | Confidence |
|------------------|--------------------------------|------------|
| Size class       | e.g. 34" ultrawide (21:9)      | High       |
| Viewable diagonal| e.g. 34.0" (86.4 cm)           | High       |
| Resolution       | e.g. 3440 × 1440 (UW-QHD)      | High       |
| Curvature        | e.g. 1800R                     | High       |
| Panel / refresh  | e.g. VA, 120 Hz                | High       |
| Pixel density    | e.g. ~110 PPI                  | Derived    |

### Actual visible (active-area) size
≈ <w> mm × <h> mm  (<w>" × <h>"), viewable diagonal <D>.
<curved-panel arc-vs-chord note if applicable>

### Notes / disagreements
<which sources conflicted, what you picked, and why; flat vs. arc caveat>

### Data-model entry
Class id: `<diagonal>-<w>x<h>[-<curve>r]`  — <"already in MONITOR_CLASSES" | "NEW">

Paste into `src/data/models/<class-id>.ts` (create the file + add its import to
`src/data/index.ts` if the class is new):

    {
      id: '<brand-model-slug>',
      brand: '<Brand>',
      name: '<Full Name>',
      classId: '<class-id>',
      panelType: '<IPS|VA|TN|OLED|QD-OLED|WOLED>',
      releaseYear: <year>,
    },

<if the class is NEW, also give the MonitorClass object to add to MONITOR_CLASSES>

Paste into `src/data/modelSources.ts` under `MODEL_SOURCES` (same model id key):

    '<brand-model-slug>': [
      { name: '<Source name>', url: '<url>' },
      ...every source actually used
    ],

Sources:
- [title](url)  ← every source actually used (same set as the MODEL_SOURCES entry)
```

## Rules
- Always end with a **Sources** list of the URLs you actually used (markdown links).
- Never present a spec you only assumed. If a value can't be corroborated, say so and
  mark it Low confidence rather than inventing it.
- Flat panels have no curvature — say "Flat (no curvature)", don't force an R value.
- Keep the physical-size math to the flat chord unless the user explicitly asks for arc length.
