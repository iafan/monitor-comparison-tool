import { physical } from '../lib/geometry'
import type { MonitorClass } from '../data'
import { PANEL_COLORS, SizeComparisonSvg } from './SizeComparisonSvg'

export interface ResolutionExplainerProps {
  resWidth: number
  resHeight: number
  /** Marketing name, e.g. "QHD". */
  marketingName: string
  /** Aspect-ratio label, e.g. "16:9". */
  ratioLabel: string
  /** Classes sharing this resolution, sorted by diagonal ascending. */
  classes: MonitorClass[]
  /** Link into the interactive comparison tool, preloaded with these panels. */
  compareHref: string
}

/** A one-line read on how a given pixel density feels at a normal desk distance. */
function ppiNote(ppi: number): string {
  if (ppi < 95) return 'On the coarse side — pixels and soft text are visible'
  if (ppi < 120) return 'Comfortable — the common desktop sweet spot'
  if (ppi < 150) return 'Sharp — you may prefer slight UI scaling'
  return 'Very sharp — best with OS scaling'
}

const inch = (n: number) => `${n.toFixed(1)}″`

export function ResolutionExplainer({
  resWidth,
  resHeight,
  marketingName,
  ratioLabel,
  classes,
  compareHref,
}: ResolutionExplainerProps) {
  const rows = classes.map((c) => ({ c, ...physical(c) }))
  const sizeList = classes.map((c) => `${c.diagonal}″`).join(', ')

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 text-[var(--text-primary)]">
      <header className="mb-6 flex items-center gap-2.5">
        <a href="../" className="flex items-center gap-2.5 no-underline">
          <img src="../icon.svg" alt="" width={32} height={32} className="size-8 rounded-full" />
          <span className="font-semibold">Monitorture</span>
        </a>
      </header>

      <h1 className="text-2xl font-bold sm:text-3xl">
        {marketingName} ({resWidth}×{resHeight}) at {sizeList}
      </h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        {resWidth}×{resHeight} ({ratioLabel}) is a resolution, not a size. The <em>same</em> pixel
        grid can arrive on a {classes[0].diagonal}″ panel or a {classes[classes.length - 1].diagonal}″
        one — and it looks and feels quite different on each. Here's the same {marketingName} grid at{' '}
        {sizeList}, drawn to scale.
      </p>

      <figure className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <SizeComparisonSvg classes={classes} />
        <figcaption className="mt-2 text-center text-xs text-[var(--text-muted)]">
          {marketingName} {resWidth}×{resHeight} at {sizeList} — physical panel sizes to scale.
        </figcaption>
      </figure>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-[var(--text-muted)]">
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Size</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Width × Height</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">PPI</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Pixel pitch</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">How it feels</th>
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
                  {r.c.diagonal}″
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">
                  {inch(r.widthIn)} × {inch(r.heightIn)}
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">{Math.round(r.ppi)}</td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">
                  {r.pitchMm.toFixed(3)} mm
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 text-[var(--text-secondary)]">
                  {ppiNote(r.ppi)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 flex flex-col gap-3 text-[var(--text-secondary)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Why resolution alone doesn't tell you the size
        </h2>
        <p>
          Resolution is only the pixel count. Stretch those pixels across a bigger diagonal and each
          one gets larger, so <strong>pixel density (PPI) falls</strong> — text and edges look softer,
          even though nothing about the resolution changed. Shrink the diagonal and density rises,
          giving crisper text but smaller UI that you may want to scale up.
        </p>
        <p>
          For a normal desk viewing distance, roughly <strong>~95–120 PPI</strong> is the comfortable
          range where the interface reads well at 100% scaling. Below that, pixels start to show;
          well above it, everything is sharp but the UI shrinks until you turn on OS scaling. Viewing
          distance matters too — the farther you sit, the more forgiving a lower PPI becomes.
        </p>
        <p>
          So a {marketingName} panel can be a crisp {classes[0].diagonal}″ (~
          {Math.round(rows[0].ppi)} PPI) or a roomy but softer {classes[classes.length - 1].diagonal}″
          (~{Math.round(rows[rows.length - 1].ppi)} PPI) — same pixels, different experience.
        </p>
      </section>

      <div className="mt-8">
        <a
          href={compareHref}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white no-underline"
        >
          Compare these sizes in the interactive tool →
        </a>
      </div>
    </div>
  )
}
