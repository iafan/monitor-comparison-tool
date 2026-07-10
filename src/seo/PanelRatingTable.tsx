import { PANEL_TECHS, RATING_ATTRS, type RatingKey } from './panelTech'
import { PANEL_COLORS } from './SizeComparisonSvg'

interface Props {
  /** Slug of the technology to visually highlight (its column is emphasised and
   *  every other is dimmed). Omit on the hub to show all four evenly. */
  highlightSlug?: string
}

/** Five dots, `value` of them filled in the column's color — a compact,
 *  server-rendered rating that needs no chart library. */
function Dots({ value, color }: { value: number; color: string }) {
  return (
    <span className="inline-flex gap-[3px]" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="inline-block size-2 rounded-full"
          style={{
            background: n <= value ? color : 'transparent',
            border: `1px solid ${n <= value ? color : 'var(--border)'}`,
          }}
        />
      ))}
    </span>
  )
}

/**
 * The panel-technology comparison matrix: one row per rated attribute, one column
 * per technology, cells drawn as filled dots. Pure markup so it renders identically
 * server-side and inlines straight into the static pages. Shared by the hub (all
 * columns) and each detail page (its own column highlighted).
 */
export function PanelRatingTable({ highlightSlug }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="text-[var(--text-muted)]">
            <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Rated 1–5 (more is better)</th>
            {PANEL_TECHS.map((t, i) => {
              const dim = highlightSlug && t.slug !== highlightSlug
              return (
                <th
                  key={t.slug}
                  className="border-b border-[var(--border)] px-2.5 py-2 text-center font-semibold"
                  style={{ opacity: dim ? 0.45 : 1 }}
                >
                  <span
                    className="mr-1.5 inline-block size-2.5 rounded-[3px] align-middle"
                    style={{ background: PANEL_COLORS[i % PANEL_COLORS.length] }}
                  />
                  {t.name}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {RATING_ATTRS.map((attr) => (
            <tr key={attr.key}>
              <td className="border-b border-[var(--border)] px-2.5 py-2">
                <span className="font-medium text-[var(--text-primary)]">{attr.label}</span>
                <span className="ml-1.5 text-xs text-[var(--text-muted)]">— {attr.hint}</span>
              </td>
              {PANEL_TECHS.map((t, i) => {
                const dim = highlightSlug && t.slug !== highlightSlug
                return (
                  <td
                    key={t.slug}
                    className="border-b border-[var(--border)] px-2.5 py-2 text-center"
                    style={{ opacity: dim ? 0.45 : 1 }}
                  >
                    <span className="inline-flex justify-center">
                      <Dots value={t.ratings[attr.key as RatingKey]} color={PANEL_COLORS[i % PANEL_COLORS.length]} />
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
