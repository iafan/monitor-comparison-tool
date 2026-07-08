// Serializes the app's shareable view into a compact URL fragment and back.
//
// The URL is the state's canonical, shareable form: reloading or sharing a link
// reproduces the same view. Everything is driven by the SETTINGS registry below —
// one entry per serialized setting.
//
// ── To expose a NEW setting in the URL ────────────────────────────────────────
//   1. Add the field to AppState (below).
//   2. Append ONE `Setting<T>` to SETTINGS with:
//        - `key`      a short, UNIQUE, URL-safe key (never reuse/rename an old
//                     one — that would break existing shared links);
//        - `get/set`  read it from AppState / write it into a decoded draft;
//        - `isDefault` so default values are omitted from the URL (compact);
//        - `encode/decode` the value ↔ a string (decode returns undefined to
//                     ignore an invalid value).
//   That's all — ordering, default-omission and round-tripping are automatic.
//
// Keys are emitted sorted alphabetically, so a given state always produces a
// byte-identical URL (stable for diffing/caching/sharing). Custom-monitor names
// are percent-encoded with spaces rendered as `+`; every structural delimiter
// (`& = ; :`) is a character encodeURIComponent escapes, so names can't collide.
// Theme is intentionally NOT serialized — it's the viewer's own preference.
import { CHECK_SCREEN_IDS, DEFAULT_MONITORS, DEFAULT_VIEW } from '../constants'
import { MONITOR_MODELS, classDefaultName, getClass, resolveSelection } from '../data'
import { uid } from './storage'
import type {
  Alignment,
  Monitor,
  Preferences,
  Theme,
  Tool,
  TopViewAlign,
  ViewSettings,
  VisibleAreaFrame,
} from '../types'

export interface AppState {
  tool: Tool
  /** Explicit theme choice; null = follow the system preference. */
  themeChoice: Theme | null
  monitors: Monitor[]
  alignment: Alignment
  topViewAlign: TopViewAlign
  preferences: Preferences
  /** Selected Monitor Check screen id, or null. Fullscreen itself is never serialized. */
  checkScreen: string | null
  /** Monitor Geometry visible-area frame, or null for the full-screen default. */
  visibleFrame: VisibleAreaFrame | null
  /** 3D Viewer settings (monitor, eye distance, head angle). */
  view: ViewSettings
}

/** A decoded (partial) state; preferences arrive field-by-field from several keys. */
type Decoded = Partial<Omit<AppState, 'preferences'>> & { preferences?: Partial<Preferences> }

interface Setting<T> {
  key: string
  get: (s: AppState) => T
  set: (d: Decoded, v: T) => void
  isDefault: (v: T) => boolean
  encode: (v: T) => string
  /** Returns undefined for an invalid token (which is then ignored). */
  decode: (raw: string) => T | undefined
  /**
   * Whether this setting is part of the *current view* and should appear in the
   * URL. The URL is a permalink to the view, not a dump of all state — e.g.
   * comparison settings are irrelevant while the Geometry/Check tool is active,
   * so they're omitted there. Absent ⇒ always relevant.
   */
  relevant?: (s: AppState) => boolean
}

const inComparison = (s: AppState) => s.tool === 'comparison'
const inView = (s: AppState) => s.tool === 'view'

// ── Monitor list codec ────────────────────────────────────────────────────────
// Each monitor is one token; tokens are `;`-joined. A leading `-` marks hidden.
// The type is inferred from the first character — no marker is needed for model
// or class because their ids can't be confused:
//   custom  → `@<w>x<h>_<diag>[_<curve>]:<percent-encoded name>`   (the `@` marks custom)
//   class   → `<classId>`   digit-led, e.g. `34-3440x1440-1800r`  (geometry + default name)
//   model   → `<modelId>`   letter-led, e.g. `dell-s3425dw`       (geometry + name from catalogue)
// Class ids always start with a digit (the diagonal); model ids are asserted to
// start with a letter in src/data, so digit-vs-letter reliably tells them apart.
// Colors aren't serialized — they're derived from enabled position at render time.

// Percent-encode a custom monitor name, but render spaces as the friendlier `+`
// (a literal `+` in a name is escaped to %2B by encodeURIComponent, so this round-trips).
function encodeName(name: string): string {
  return encodeURIComponent(name).replace(/%20/g, '+')
}
function decodeName(raw: string): string {
  return decodeURIComponent(raw.replace(/\+/g, '%20'))
}

function encodeMonitor(m: Monitor): string {
  const vis = m.visible ? '' : '-'
  const model = m.modelId ? MONITOR_MODELS.find((x) => x.id === m.modelId) : undefined
  if (model && model.name === m.name) return `${vis}${model.id}` // letter-led ⇒ model
  const cls = m.classId ? getClass(m.classId) : undefined
  if (cls && classDefaultName(cls) === m.name) return `${vis}${cls.id}` // digit-led ⇒ class
  const curve = m.curveRadius ? `_${m.curveRadius}` : ''
  return `${vis}@${m.resWidth}x${m.resHeight}_${m.diagonal}${curve}:${encodeName(m.name)}` // @ ⇒ custom
}

function decodeMonitor(token: string): Monitor | null {
  let visible = true
  let t = token
  if (t.startsWith('-')) {
    visible = false
    t = t.slice(1)
  }
  const base = { id: uid(), visible }

  if (t.startsWith('@')) {
    // custom: geometry before the first ':', percent-encoded name after it.
    const body = t.slice(1)
    const colon = body.indexOf(':')
    const geom = colon === -1 ? body : body.slice(0, colon)
    const name = colon === -1 ? '' : decodeName(body.slice(colon + 1))
    const [wh, diagStr, curveStr] = geom.split('_')
    const [w, h] = (wh ?? '').split('x').map(Number)
    const diagonal = Number(diagStr)
    const curveRadius = curveStr != null ? Number(curveStr) : null
    if (![w, h, diagonal].every((n) => Number.isFinite(n) && n > 0)) return null
    if (curveRadius != null && !Number.isFinite(curveRadius)) return null
    return { ...base, name: name || 'Monitor', resWidth: w, resHeight: h, diagonal, curveRadius }
  }

  // No prefix: digit-led ⇒ class id, letter-led ⇒ model id (see codec note above).
  if (/^\d/.test(t)) {
    const cls = getClass(t)
    if (!cls) return null
    const { resWidth, resHeight, diagonal, curveRadius } = cls
    return { ...base, name: classDefaultName(cls), resWidth, resHeight, diagonal, curveRadius, classId: cls.id }
  }
  const model = MONITOR_MODELS.find((x) => x.id === t)
  const mcls = model && getClass(model.classId)
  if (!model || !mcls) return null
  const { resWidth, resHeight, diagonal, curveRadius } = mcls
  return { ...base, name: model.name, resWidth, resHeight, diagonal, curveRadius, classId: mcls.id, modelId: model.id }
}

/** True when the list is exactly the seeded defaults (so `m` can be omitted). */
function isSeededDefault(monitors: Monitor[]): boolean {
  if (monitors.length !== DEFAULT_MONITORS.length) return false
  return monitors.every((m, i) => {
    const d = DEFAULT_MONITORS[i]
    return (
      m.visible &&
      m.name === d.name &&
      m.resWidth === d.resWidth &&
      m.resHeight === d.resHeight &&
      m.diagonal === d.diagonal &&
      m.curveRadius === d.curveRadius
    )
  })
}

// ── Small value codecs ──────────────────────────────────────────────────────
const ALIGN_CODE: Record<Alignment, string> = {
  'top-left': 'tl',
  'top-center': 'tc',
  'top-right': 'tr',
  'center-left': 'cl',
  center: 'c',
  'center-right': 'cr',
  'bottom-left': 'bl',
  'bottom-center': 'bc',
  'bottom-right': 'br',
}
const ALIGN_BY_CODE = Object.fromEntries(Object.entries(ALIGN_CODE).map(([k, v]) => [v, k])) as Record<
  string,
  Alignment
>

// ── The registry: one entry per serialized setting ─────────────────────────────
// Each entry is individually typed via `as Setting<T>`; the array is `Setting<any>[]`
// so the encode/decode loops below can treat the heterogeneous entries uniformly.
/* eslint-disable @typescript-eslint/no-explicit-any */
const SETTINGS: Setting<any>[] = [
  {
      key: 'a',
      get: (s) => s.alignment,
      set: (d, v) => (d.alignment = v),
      isDefault: (v) => v === 'center',
      encode: (v) => ALIGN_CODE[v],
      decode: (raw) => ALIGN_BY_CODE[raw],
      relevant: inComparison,
    } as Setting<Alignment>,
    {
      key: 'd',
      get: (s) => s.preferences,
      set: (d, v) => (d.preferences = { ...d.preferences, ...v }),
      isDefault: (v) => !v.deskEnabled,
      encode: (v) => `${v.deskWidth}_${v.deskDepth}_${v.deskX}_${v.deskY}`,
      decode: (raw) => {
        const [deskWidth, deskDepth, deskX, deskY] = raw.split('_').map(Number)
        if (![deskWidth, deskDepth, deskX, deskY].every(Number.isFinite)) return undefined
        return { deskEnabled: true, deskWidth, deskDepth, deskX, deskY } as Partial<Preferences> as Preferences
      },
      relevant: inComparison,
    } as Setting<Preferences>,
    {
      key: 'f',
      get: (s) => s.visibleFrame,
      set: (d, v) => (d.visibleFrame = v),
      isDefault: (v) => v == null, // null = full-screen default → omitted
      encode: (v) => (v ? `${v.topX}_${v.topY}_${v.botX}_${v.botY}_${v.radius}` : ''),
      decode: (raw) => {
        const [topX, topY, botX, botY, radius] = raw.split('_').map(Number)
        const vals = [topX, topY, botX, botY, radius]
        if (!vals.every((n) => Number.isFinite(n) && n >= 0)) return undefined
        return { topX, topY, botX, botY, radius } as VisibleAreaFrame
      },
      relevant: (s) => s.tool === 'geometry',
    } as Setting<VisibleAreaFrame | null>,
    {
      key: 'm',
      get: (s) => s.monitors,
      set: (d, v) => (d.monitors = v),
      isDefault: isSeededDefault,
      encode: (v) => v.map(encodeMonitor).join(';'),
      decode: (raw) =>
        raw
          .split(';')
          .filter(Boolean)
          .map(decodeMonitor)
          .filter((m): m is Monitor => m !== null),
      relevant: inComparison,
    } as Setting<Monitor[]>,
    {
      key: 's',
      get: (s) => s.checkScreen,
      set: (d, v) => (d.checkScreen = v),
      isDefault: (v) => v == null,
      encode: (v) => v as string,
      decode: (raw) => ((CHECK_SCREEN_IDS as readonly string[]).includes(raw) ? raw : undefined),
      relevant: (s) => s.tool === 'check',
    } as Setting<string | null>,
    {
      key: 't',
      get: (s) => s.tool,
      set: (d, v) => (d.tool = v),
      isDefault: (v) => v === 'comparison',
      encode: (v) => (v === 'check' ? 'k' : v === 'geometry' ? 'g' : 'v'),
      decode: (raw) =>
        raw === 'k' ? 'check' : raw === 'g' ? 'geometry' : raw === 'v' ? 'view' : undefined,
    } as Setting<Tool>,
    {
      // 3D Viewer state as one compact token: `<selection>_<distanceIn>`.
      // Class/model ids never contain `_`, so it's an unambiguous separator.
      // (Head angle is deliberately not serialized — it's ephemeral.)
      key: 'v',
      get: (s) => s.view,
      set: (d, v) => (d.view = v),
      isDefault: (v) =>
        v.selection === DEFAULT_VIEW.selection && v.distanceIn === DEFAULT_VIEW.distanceIn,
      encode: (v) => `${v.selection}_${v.distanceIn}`,
      decode: (raw) => {
        // Tolerate a trailing legacy head-angle segment from older links.
        const parts = raw.split('_')
        if (parts.length < 2) return undefined
        const [selection, distStr] = parts
        if (!resolveSelection(selection)) return undefined
        const distanceIn = Number(distStr)
        if (!Number.isFinite(distanceIn)) return undefined
        return { selection, distanceIn }
      },
      relevant: inView,
    } as Setting<ViewSettings>,
    {
      key: 'tv',
      get: (s) => s.topViewAlign,
      set: (d, v) => (d.topViewAlign = v),
      isDefault: (v) => v === 'front',
      encode: (v) => (v === 'back' ? 'b' : 'c'),
      decode: (raw) => (raw === 'b' ? 'back' : raw === 'c' ? 'center' : undefined),
      relevant: inComparison,
    } as Setting<TopViewAlign>,
    {
      key: 'u',
      get: (s) => s.preferences.unit,
      set: (d, v) => (d.preferences = { ...d.preferences, unit: v }),
      isDefault: (v) => v === 'in',
      encode: (v) => v,
      decode: (raw) => (raw === 'cm' || raw === 'mm' ? raw : undefined),
      relevant: inComparison,
    } as Setting<Preferences['unit']>,
]

/**
 * Serialize state → compact fragment (no leading `#`). Only settings that are
 * relevant to the current view AND non-default are emitted; keys sorted
 * alphabetically so a given view always produces a byte-identical URL.
 */
export function encodeState(state: AppState): string {
  return SETTINGS.filter((f) => (!f.relevant || f.relevant(state)) && !f.isDefault(f.get(state)))
    .map((f) => `${f.key}=${f.encode(f.get(state))}`)
    .sort()
    .join('&')
}

/** Parse a fragment (no leading `#`) into a partial state; unknown/invalid parts are ignored. */
export function decodeState(fragment: string): Decoded {
  const draft: Decoded = {}
  for (const pair of fragment.split('&').filter(Boolean)) {
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    const key = pair.slice(0, eq)
    const setting = SETTINGS.find((f) => f.key === key)
    if (!setting) continue
    const value = setting.decode(pair.slice(eq + 1))
    if (value !== undefined) setting.set(draft, value)
  }
  return draft
}

/** Merge a decoded fragment onto a base state. */
export function applyDecoded(base: AppState, d: Decoded): AppState {
  return {
    tool: d.tool ?? base.tool,
    themeChoice: d.themeChoice ?? base.themeChoice,
    monitors: d.monitors ?? base.monitors,
    alignment: d.alignment ?? base.alignment,
    topViewAlign: d.topViewAlign ?? base.topViewAlign,
    checkScreen: d.checkScreen ?? base.checkScreen,
    visibleFrame: d.visibleFrame ?? base.visibleFrame,
    view: d.view ?? base.view,
    preferences: { ...base.preferences, ...d.preferences },
  }
}
