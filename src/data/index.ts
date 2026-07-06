import { MONITOR_CLASSES, classLabel, makeClassId } from './monitorClasses'
import { MODEL_SOURCES } from './modelSources'
import type { MonitorClass, MonitorModel, SourceLink } from './types'

// One import per class file under models/. When you add a class, add its file
// here too. (Kept explicit rather than glob-based so it type-checks under tsc.)
import { models as models_27_2560x1440 } from './models/27-2560x1440'
import { models as models_31_5_2560x1440 } from './models/31.5-2560x1440'
import { models as models_32_2560x1440 } from './models/32-2560x1440'
import { models as models_34_3440x1440_1800r } from './models/34-3440x1440-1800r'
import { models as models_37_5_3840x1600_2300r } from './models/37.5-3840x1600-2300r'

/** Every catalogued specific model, flattened across the per-class files. */
export const MONITOR_MODELS: MonitorModel[] = [
  ...models_27_2560x1440,
  ...models_31_5_2560x1440,
  ...models_32_2560x1440,
  ...models_34_3440x1440_1800r,
  ...models_37_5_3840x1600_2300r,
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
}
for (const id of Object.keys(MODEL_SOURCES)) {
  if (!MODEL_IDS.has(id)) {
    throw new Error(`MODEL_SOURCES has sources for unknown model "${id}"`)
  }
}

export { MONITOR_CLASSES, MODEL_SOURCES, classLabel, makeClassId }
export type { MonitorClass, MonitorModel, PanelType, SourceLink } from './types'
