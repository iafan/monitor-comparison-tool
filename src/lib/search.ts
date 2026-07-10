/**
 * Order-independent, multi-term prefix search. The query is split into
 * whitespace-separated terms, and an item matches only if EVERY term is a prefix
 * of some word in the item's text. Words are split on anything that isn't a
 * letter, digit or dot (so "34\" · 3440×1440 · Flat" → 34, 3440, 1440, flat and
 * "31.5" stays intact).
 *
 * So "32 f" and "flat 32" both match a "32 inch flat" panel, and "2560 1000"
 * matches a 2560-wide 1000R panel regardless of term order.
 *
 * An empty query matches everything.
 */
export function matchesQuery(query: string, haystack: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const words = haystack.toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean)
  return terms.every((term) => words.some((word) => word.startsWith(term)))
}
