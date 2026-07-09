import { physical } from '../lib/geometry'
import type { MonitorClass } from '../data'
import { PANEL_COLORS } from './SizeComparisonSvg'
import { PixelDensitySvg } from './PixelDensitySvg'
import { inch, ppiNote } from './ResolutionExplainer'

export interface SizeExplainerProps {
  /** The fixed panel diagonal, in inches. */
  diagonal: number
  /** The resolutions offered at this diagonal, sorted by pixel count ascending,
   *  each with its marketing name (e.g. "QHD"). */
  resolutions: { c: MonitorClass; name: string }[]
  /** Link into the interactive comparison tool, preloaded with these panels. */
  compareHref: string
}

/** Lowercase only the first letter, so acronyms like "OS"/"UI" keep their caps
 *  when a note is dropped mid-sentence. */
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

export function SizeExplainer({ diagonal, resolutions, compareHref }: SizeExplainerProps) {
  const rows = resolutions.map(({ c, name }) => ({ c, name, ...physical(c) }))
  const nameList = rows.map((r) => r.name).join(' vs ')
  const lowest = rows[0]
  const highest = rows[rows.length - 1]
  const d = `${diagonal}`

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 text-[var(--text-primary)]">
      <header className="mb-6 flex items-center gap-2.5">
        <a href="../" className="flex items-center gap-2.5 no-underline">
          <img src="../icon.svg" alt="" width={32} height={32} className="size-8 rounded-full" />
          <span className="font-semibold">Monitorture</span>
        </a>
      </header>

      <h1 className="text-2xl font-bold sm:text-3xl">
        {d}″ monitor: {nameList}
      </h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        A {d}″ monitor is the same physical size — about {inch(highest.widthIn)} wide by{' '}
        {inch(highest.heightIn)} tall — whatever resolution you pick. What changes is{' '}
        <em>pixel density</em>: more pixels in that fixed area means smaller pixels, sharper text and
        finer detail. Here's how {nameList} compare on a {d}″ screen.
      </p>

      <figure className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <PixelDensitySvg resolutions={resolutions} />
        <figcaption className="mt-2 text-center text-xs text-[var(--text-muted)]">
          The same tiny patch of a {d}″ screen — each resolution's actual pixel grid, drawn to scale.
        </figcaption>
      </figure>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-[var(--text-muted)]">
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Resolution</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Pixels</th>
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
                  {r.name}
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">
                  {r.c.resWidth} × {r.c.resHeight}
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">{Math.round(r.ppi)}</td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">{r.pitchMm.toFixed(3)} mm</td>
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
          Which resolution should you get at {d}″?
        </h2>
        <p>
          Because the diagonal is fixed, a higher resolution doesn't make the screen bigger — it makes
          each pixel <strong>smaller</strong>, so text and edges look crisper. The trade-off is that the
          interface also shrinks: past roughly <strong>~150 PPI</strong> you'll usually want to turn on
          OS scaling to keep menus and text readable.
        </p>
        <p>
          For a normal desk viewing distance, about <strong>~95–120 PPI</strong> is the comfortable band
          where the UI reads well at 100% scaling. On a {d}″ panel that means{' '}
          {lowest.name} sits at ~{Math.round(lowest.ppi)} PPI ({lcFirst(ppiNote(lowest.ppi))}), while{' '}
          {highest.name} reaches ~{Math.round(highest.ppi)} PPI ({lcFirst(ppiNote(highest.ppi))}) —
          same screen, noticeably different sharpness.
        </p>
        <p>
          Viewing distance matters too: the farther you sit, the less a lower PPI shows, so a higher
          resolution pays off most when the screen is close.
        </p>
      </section>

      <div className="mt-8">
        <a
          href={compareHref}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white no-underline"
        >
          Compare these on a {d}″ screen in the interactive tool →
        </a>
      </div>
    </div>
  )
}
