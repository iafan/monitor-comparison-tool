import { MONITOR_CLASSES, classDefaultName, classLabel, makeClassId } from './monitorClasses'
import { MODEL_SOURCES } from './modelSources'
import type { MonitorClass, MonitorModel, SourceLink } from './types'

// One import per class file under models/. When you add a class, add its file
// here too. (Kept explicit rather than glob-based so it type-checks under tsc.)
import { models as models_24_1920x1080 } from './models/24-1920x1080'
import { models as models_24_1920x1200 } from './models/24-1920x1200'
import { models as models_26_5_2560x1440 } from './models/26.5-2560x1440'
import { models as models_26_5_3840x2160 } from './models/26.5-3840x2160'
import { models as models_27_2560x1440 } from './models/27-2560x1440'
import { models as models_27_3840x2160 } from './models/27-3840x2160'
import { models as models_27_5120x2880 } from './models/27-5120x2880'
import { models as models_31_5_2560x1440 } from './models/31.5-2560x1440'
import { models as models_31_5_3840x2160 } from './models/31.5-3840x2160'
import { models as models_31_5_6016x3384 } from './models/31.5-6016x3384'
import { models as models_32_2560x1440 } from './models/32-2560x1440'
import { models as models_32_6144x3456 } from './models/32-6144x3456'
import { models as models_34_3440x1440_800r } from './models/34-3440x1440-800r'
import { models as models_34_3440x1440_1800r } from './models/34-3440x1440-1800r'
import { models as models_34_3440x1440_1900r } from './models/34-3440x1440-1900r'
import { models as models_37_5_3840x1600_2300r } from './models/37.5-3840x1600-2300r'
import { models as models_39_5120x2160_1500r } from './models/39-5120x2160-1500r'
import { models as models_51_5_6144x2560_4200r } from './models/51.5-6144x2560-4200r'
import { models as models_52_5120x2160_1000r } from './models/52-5120x2160-1000r'

/** Every catalogued specific model, flattened across the per-class files. */
export const MONITOR_MODELS: MonitorModel[] = [
  ...models_24_1920x1080,
  ...models_24_1920x1200,
  ...models_26_5_2560x1440,
  ...models_26_5_3840x2160,
  ...models_27_2560x1440,
  ...models_27_3840x2160,
  ...models_27_5120x2880,
  ...models_31_5_2560x1440,
  ...models_31_5_3840x2160,
  ...models_31_5_6016x3384,
  ...models_32_2560x1440,
  ...models_32_6144x3456,
  ...models_34_3440x1440_800r,
  ...models_34_3440x1440_1800r,
  ...models_34_3440x1440_1900r,
  ...models_37_5_3840x1600_2300r,
  ...models_39_5120x2160_1500r,
  ...models_51_5_6144x2560_4200r,
  ...models_52_5120x2160_1000r,
]

const CLASS_BY_ID = new Map(MONITOR_CLASSES.map((c) => [c.id, c]))

export function getClass(id: string): MonitorClass | undefined {
  return CLASS_BY_ID.get(id)
}

/** Research sources for a model id (empty if none catalogued). */
export function sourcesFor(modelId: string): SourceLink[] {
  return MODEL_SOURCES[modelId] ?? []
}

/** The catalogued models that belong to a class id. */
export function modelsInClass(classId: string): MonitorModel[] {
  return MONITOR_MODELS.filter((m) => m.classId === classId)
}

/** Geometry + name resolved from a picker selection. */
export interface CatalogueGeometry {
  name: string
  resWidth: number
  resHeight: number
  diagonal: number
  curveRadius: number | null
  /** The class this geometry came from — absent for a self-contained custom token. */
  classId?: string
  /** The specific model, when the selection was a model rather than a bare class. */
  modelId?: string
}

/**
 * A self-contained selection token for an arbitrary monitor (the viewer's own
 * list), encoding geometry + name so it resolves without the live monitor list:
 *   `@<w>x<h>_<diag>[_<curve>]:<uri-encoded name>`
 */
export function monitorSelectionToken(m: {
  resWidth: number
  resHeight: number
  diagonal: number
  curveRadius: number | null
  name: string
}): string {
  const curve = m.curveRadius ? `_${m.curveRadius}` : ''
  return `@${m.resWidth}x${m.resHeight}_${m.diagonal}${curve}:${encodeURIComponent(m.name)}`
}

/**
 * Resolves a picker selection — a class id, a model id, or a self-contained
 * custom `@…` token (see monitorSelectionToken) — to concrete geometry plus a
 * display name. Returns undefined for an unknown/invalid id.
 */
export function resolveSelection(id: string): CatalogueGeometry | undefined {
  if (id.startsWith('@')) {
    const body = id.slice(1)
    const colon = body.indexOf(':')
    const geom = colon === -1 ? body : body.slice(0, colon)
    const name = colon === -1 ? '' : decodeURIComponent(body.slice(colon + 1))
    const [wh, diagStr, curveStr] = geom.split('_')
    const [w, h] = (wh ?? '').split('x').map(Number)
    const diagonal = Number(diagStr)
    const curveRadius = curveStr != null ? Number(curveStr) : null
    if (![w, h, diagonal].every((n) => Number.isFinite(n) && n > 0)) return undefined
    if (curveRadius != null && !Number.isFinite(curveRadius)) return undefined
    return {
      name: name || `${diagonal}" ${w}×${h}`,
      resWidth: w,
      resHeight: h,
      diagonal,
      curveRadius,
    }
  }
  const model = MONITOR_MODELS.find((m) => m.id === id)
  if (model) {
    const c = CLASS_BY_ID.get(model.classId)
    if (!c) return undefined
    return {
      name: model.name,
      resWidth: c.resWidth,
      resHeight: c.resHeight,
      diagonal: c.diagonal,
      curveRadius: c.curveRadius,
      classId: c.id,
      modelId: model.id,
    }
  }
  const c = CLASS_BY_ID.get(id)
  if (!c) return undefined
  return {
    name: classDefaultName(c),
    resWidth: c.resWidth,
    resHeight: c.resHeight,
    diagonal: c.diagonal,
    curveRadius: c.curveRadius,
    classId: c.id,
  }
}

/** Convenience for building a monitor's geometry fields from a class. */
export function classGeometry(id: string): Pick<
  MonitorClass,
  'resWidth' | 'resHeight' | 'diagonal' | 'curveRadius'
> {
  const c = CLASS_BY_ID.get(id)
  if (!c) throw new Error(`Unknown monitor class "${id}"`)
  const { resWidth, resHeight, diagonal, curveRadius } = c
  return { resWidth, resHeight, diagonal, curveRadius }
}

// Integrity checks — run once when this module first loads. Cheap, and they turn
// a mistyped id or dangling reference into an immediate, obvious failure.
for (const c of MONITOR_CLASSES) {
  const expected = makeClassId(c)
  if (c.id !== expected) {
    throw new Error(`Monitor class id "${c.id}" does not match its geometry (expected "${expected}")`)
  }
}
const MODEL_IDS = new Set(MONITOR_MODELS.map((m) => m.id))
for (const m of MONITOR_MODELS) {
  if (!CLASS_BY_ID.has(m.classId)) {
    throw new Error(`Model "${m.id}" references unknown class "${m.classId}"`)
  }
  // URL encoding tells models (letter-led) from classes (digit-led) by first char,
  // so a model id must start with a letter.
  if (!/^[a-z]/i.test(m.id)) {
    throw new Error(`Model id "${m.id}" must start with a letter (URL serialization depends on it)`)
  }
}
for (const id of Object.keys(MODEL_SOURCES)) {
  if (!MODEL_IDS.has(id)) {
    throw new Error(`MODEL_SOURCES has sources for unknown model "${id}"`)
  }
}

export { MONITOR_CLASSES, MODEL_SOURCES, classDefaultName, classLabel, makeClassId }
export type { MonitorClass, MonitorModel, PanelType, SourceLink } from './types'
