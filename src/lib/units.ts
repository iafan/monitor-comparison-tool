import type { Unit } from '../types'

export const UNITS: Unit[] = ['in', 'cm', 'mm']

export const UNIT_PER_INCH: Record<Unit, number> = { in: 1, cm: 2.54, mm: 25.4 }
export const UNIT_DECIMALS: Record<Unit, number> = { in: 1, cm: 1, mm: 0 }
export const UNIT_LABELS: Record<Unit, string> = { in: 'in', cm: 'cm', mm: 'mm' }

export function fromInches(inches: number, unit: Unit): number {
  return inches * UNIT_PER_INCH[unit]
}

export function toInches(value: number, unit: Unit): number {
  return value / UNIT_PER_INCH[unit]
}

/** Value converted to the unit and rounded to that unit's display precision. */
export function roundToUnit(inches: number, unit: Unit): number {
  return Number(fromInches(inches, unit).toFixed(UNIT_DECIMALS[unit]))
}

/** Human string, e.g. "27.5 in" or "69.9 cm". Set withUnit=false for the number only. */
export function formatLength(inches: number, unit: Unit, withUnit = true): string {
  const value = fromInches(inches, unit).toLocaleString(undefined, {
    minimumFractionDigits: UNIT_DECIMALS[unit],
    maximumFractionDigits: UNIT_DECIMALS[unit],
  })
  return withUnit ? `${value} ${UNIT_LABELS[unit]}` : value
}
