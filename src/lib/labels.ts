export interface LabelSpot {
  id: string
  name: string
  color: string
  left: number
  top: number
}

/**
 * Nudges overlapping labels apart vertically: processed top-to-bottom, each
 * label is pushed down until it clears the previous one by at least minGap.
 */
export function deoverlap(spots: LabelSpot[], minGap: number): LabelSpot[] {
  const sorted = [...spots].sort((a, b) => a.top - b.top)
  sorted.forEach((spot, i) => {
    if (i === 0) return
    const prev = sorted[i - 1]
    if (spot.top < prev.top + minGap) spot.top = prev.top + minGap
  })
  return sorted
}
