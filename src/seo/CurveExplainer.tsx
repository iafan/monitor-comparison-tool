import type { MonitorClass } from '../data'
import { PANEL_COLORS } from './SizeComparisonSvg'
import { CurveComparisonSvg } from './CurveComparisonSvg'
import { curveMetrics, curveNote } from './curve'

export interface CurveExplainerProps {
  diagonal: number
  resWidth: number
  resHeight: number
  /** The same panel at different curvatures, gentlest (flat) → tightest. */
  variants: { c: MonitorClass; name: string }[]
  /** Link into the interactive comparison tool, preloaded with these panels. */
  compareHref: string
}

const meters = (mm: number | null) => (mm == null ? '—' : `${(mm / 1000).toFixed(2)} m`)

export function CurveExplainer({ diagonal, resWidth, resHeight, variants, compareHref }: CurveExplainerProps) {
  const rows = variants.map(({ c, name }) => ({ c, name, ...curveMetrics(c) }))
  const nameList = rows.map((r) => r.name).join(' vs ')
  const tightest = rows.reduce((a, b) => ((b.radiusMm ?? Infinity) < (a.radiusMm ?? Infinity) ? b : a))
  const gentlest = rows.reduce((a, b) => ((b.radiusMm ?? Infinity) > (a.radiusMm ?? Infinity) ? b : a))

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 text-[var(--text-primary)]">
      <header className="mb-6 flex items-center gap-2.5">
        <a href="../" className="flex items-center gap-2.5 no-underline">
          <img src="../icon.svg" alt="" width={32} height={32} className="size-8 rounded-full" />
          <span className="font-semibold">Monitorture</span>
        </a>
      </header>

      <h1 className="text-2xl font-bold sm:text-3xl">
        {diagonal}″ {resWidth}×{resHeight}: {nameList}
      </h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        Same panel — same {diagonal}″ diagonal, same {resWidth}×{resHeight} grid — bent to different
        radii. A monitor's <em>R</em> number is the radius, in millimetres, of the circle the screen is
        a slice of: a smaller number is a tighter curve. Here's this panel from above at {nameList},
        drawn to scale.
      </p>

      <figure className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <CurveComparisonSvg variants={variants} />
        <figcaption className="mt-2 text-center text-xs text-[var(--text-muted)]">
          Top-down — a deeper arc is a tighter curve; the dashed line is a flat panel for reference.
        </figcaption>
      </figure>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-[var(--text-muted)]">
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Curve</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Curve depth</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Screen wrap</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Ideal distance</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Best for</th>
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
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Which curve should you pick?</h2>
        <p>
          The radius doubles as the <strong>ideal viewing distance</strong>: sit about that far away and
          every point of the screen is the same distance from your eyes, so nothing at the edges needs
          re-focusing. The {tightest.name} version wants you at ~{meters(tightest.idealDistanceMm)}
          {gentlest.radiusMm ? (
            <>
              , the {gentlest.name} version at ~{meters(gentlest.idealDistanceMm)}
            </>
          ) : (
            <> — while the flat panel is happy at any distance</>
          )}
          .
        </p>
        <p>
          The catch is that a curve bends every straight line. For films, games and a wraparound feel a
          tighter radius wins. For work built on straight edges and exact geometry —{' '}
          <strong>documents, spreadsheets, CAD, photo and layout</strong> — a bowed horizon is
          distracting, so a flatter panel (or none) reads truer. Match the curve to whichever you do
          most, then sit near its ideal distance.
        </p>
      </section>

      <div className="mt-8">
        <a
          href={compareHref}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white no-underline"
        >
          Compare these curves in the interactive tool →
        </a>
      </div>
    </div>
  )
}
