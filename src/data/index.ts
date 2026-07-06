import { MONITOR_CLASSES, classLabel, makeClassId } from './monitorClasses'
import type { MonitorClass, MonitorModel } from './types'

// One import per class file under models/. When you add a class, add its file
// here too. (Kept explicit rather than glob-based so it type-checks under tsc.)
import { models as models_31_5_2560x1440 } from './models/31.5-2560x1440'
import { models as models_34_3440x1440_1800r } from './models/34-3440x1440-1800r'

/** Every catalogued specific model, flattened across the per-class files. */
export const MONITOR_MODELS: MonitorModel[] = [
  ...models_31_5_2560x1440,
  ...models_34_3440x1440_1800r,
]

const CLASS_BY_ID = new Map(MONITOR_CLASSES.map((c) => [c.id, c]))

export function getClass(id: string): MonitorClass | undefined {
  return CLASS_BY_ID.get(id)
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
for (const m of MONITOR_MODELS) {
  if (!CLASS_BY_ID.has(m.classId)) {
    throw new Error(`Model "${m.id}" references unknown class "${m.classId}"`)
  }
}

export { MONITOR_CLASSES, classLabel, makeClassId }
export type { MonitorClass, MonitorModel, PanelType } from './types'
