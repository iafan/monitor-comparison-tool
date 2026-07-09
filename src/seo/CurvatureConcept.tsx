import type { MonitorClass } from '../data'
import { PANEL_COLORS } from './SizeComparisonSvg'
import { CurveComparisonSvg } from './CurveComparisonSvg'
import { curveMetrics, curveNote } from './curve'

export interface CurvatureConceptProps {
  /** The representative panel (a wide screen) shown flat and at each preset
   *  radius, gentlest → tightest. */
  variants: { c: MonitorClass; name: string }[]
  /** Diagonal of the representative panel, for the copy. */
  exampleDiagonal: number
  /** Link into the interactive tool with a flat-vs-curved example loaded. */
  compareHref: string
}

const meters = (mm: number | null) => (mm == null ? '—' : `${(mm / 1000).toFixed(2)} m`)

export function CurvatureConcept({ variants, exampleDiagonal, compareHref }: CurvatureConceptProps) {
  const rows = variants.map(({ c, name }) => ({ c, name, ...curveMetrics(c) }))

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 text-[var(--text-primary)]">
      <header className="mb-6 flex items-center gap-2.5">
        <a href="../" className="flex items-center gap-2.5 no-underline">
          <img src="../icon.svg" alt="" width={32} height={32} className="size-8 rounded-full" />
          <span className="font-semibold">Monitorture</span>
        </a>
      </header>

      <h1 className="text-2xl font-bold sm:text-3xl">Monitor curvature explained: what 1000R, 1800R & 2300R mean</h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        A curved monitor's spec always ends in an <em>R</em> — 1000R, 1800R, 2300R. That number is the
        radius of curvature in millimetres: imagine the screen is one arc cut from a giant circle, and
        the R value is that circle's radius. A <strong>smaller R is a tighter curve</strong> (1000R
        bends far more than 3800R). Below is the same {exampleDiagonal}″ ultrawide from above, flat and
        at each common radius, drawn to scale.
      </p>

      <figure className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <CurveComparisonSvg variants={variants} />
        <figcaption className="mt-2 text-center text-xs text-[var(--text-muted)]">
          One {exampleDiagonal}″ panel, top-down — a deeper arc is a tighter curve; the dashed line is flat.
        </figcaption>
      </figure>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-[var(--text-muted)]">
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Curvature</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Curve depth</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Screen wrap</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Ideal distance</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Character</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.c.id}>
                <td className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">
                  <span
                    className="mr-2 inline-block size-2.5 rounded-[3px] align-middle"
                    style={{ background: PANEL_COLORS[i % PANEL_COLORS.length] }}
                  />
                  {r.name}
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">
                  {r.depthMm ? `${Math.round(r.depthMm)} mm` : '—'}
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">
                  {r.wrapDeg ? `${Math.round(r.wrapDeg)}°` : '—'}
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">{meters(r.idealDistanceMm)}</td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 text-[var(--text-secondary)]">
                  {curveNote(r.radiusMm)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 flex flex-col gap-3 text-[var(--text-secondary)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The radius is your ideal viewing distance</h2>
        <p>
          The neat trick of the R value: sit about <strong>R millimetres away</strong> and every point of
          the screen is the same distance from your eyes. At 1000R that's ~1.0 m; at 1800R ~1.8 m; at
          2300R ~2.3 m. Since most people sit ~0.6–0.8 m from a desk monitor, the tighter curves
          (1000R–1500R) actually match desk ergonomics best, while gentle curves (1800R and up) have a
          sweet spot further back than you really sit — so at the desk their curve is subtle.
        </p>

        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Curvature and straight-line work</h2>
        <p>
          Your eyes take in roughly <strong>±15° left and right</strong> comfortably without moving your
          head, and up to about ±30° with eye movement. On a flat ultrawide the far edges fall outside
          that cone <em>and</em> face away from you, so they look smaller and, on VA/IPS panels, dimmer.
          A curve rotates those edges back toward you and keeps them square-on — that's the win for
          immersion.
        </p>
        <p>
          The cost is that a curve makes every horizontal line bow. For film, games and a wraparound
          feel that's a fair trade. For work built on straight edges and exact geometry —{' '}
          <strong>CAD, drafting, spreadsheets, documents, photo and page layout</strong> — a bowed
          horizon fights what you're doing, and the tighter the curve the more it shows. If that's your
          main use, lean flat or very gentle (2300R+); if it's media and gaming, a tighter radius pays
          off. And whichever you choose, sitting near its ideal distance is what makes the curve
          disappear into a natural, equidistant view.
        </p>
      </section>

      <div className="mt-8">
        <a
          href={compareHref}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white no-underline"
        >
          See flat vs curved in the interactive tool →
        </a>
      </div>
    </div>
  )
}
