import { physical } from '../lib/geometry'
import type { MonitorClass } from '../data'
import { PANEL_COLORS, SizeComparisonSvg } from './SizeComparisonSvg'

export interface AspectExplainerProps {
  diagonal: number
  /** One representative panel per aspect ratio at this diagonal, widest first.
   *  When they share a resolution width, the taller one simply adds rows. */
  panels: { c: MonitorClass; ratioName: string }[]
  /** Link into the interactive comparison tool, preloaded with these panels. */
  compareHref: string
}

const inch = (n: number) => `${n.toFixed(1)}″`

export function AspectExplainer({ diagonal, panels, compareHref }: AspectExplainerProps) {
  const rows = panels.map(({ c, ratioName }) => ({ c, ratioName, ...physical(c) }))
  const nameList = rows.map((r) => r.ratioName).join(' vs ')
  const widest = rows[0]
  const tallest = rows[rows.length - 1]
  const sameWidthPx = rows.every((r) => r.c.resWidth === rows[0].c.resWidth)
  // At a shared resolution width, the taller ratio just adds rows below.
  const extraRowsPct = sameWidthPx
    ? Math.round((tallest.c.resHeight / widest.c.resHeight - 1) * 100)
    : null

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 text-[var(--text-primary)]">
      <header className="mb-6 flex items-center gap-2.5">
        <a href="../" className="flex items-center gap-2.5 no-underline">
          <img src="../icon.svg" alt="" width={32} height={32} className="size-8 rounded-full" />
          <span className="font-semibold">Monitorture</span>
        </a>
      </header>

      <h1 className="text-2xl font-bold sm:text-3xl">
        {nameList} at {diagonal}″
      </h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        Both are {diagonal}″ monitors, but the aspect ratio changes the <em>shape</em> of the screen —
        not just the pixel count.{' '}
        {sameWidthPx ? (
          <>
            At the same {rows[0].c.resWidth}px width, {tallest.ratioName} is{' '}
            <strong>{extraRowsPct}% taller</strong> ({widest.c.resHeight}→{tallest.c.resHeight} rows) — extra
            vertical room stacked below the same width.
          </>
        ) : (
          <>
            {widest.ratioName} is wider and shorter; {tallest.ratioName} is narrower and taller.
          </>
        )}{' '}
        Here are both panels drawn to scale.
      </p>

      <figure className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <SizeComparisonSvg classes={rows.map((r) => r.c)} labels={rows.map((r) => r.ratioName)} />
        <figcaption className="mt-2 text-center text-xs text-[var(--text-muted)]">
          {nameList} at {diagonal}″ — physical panel outlines to scale.
        </figcaption>
      </figure>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-[var(--text-muted)]">
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Aspect</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Resolution</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Width × Height</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Screen area</th>
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
                  {r.ratioName}
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">
                  {r.c.resWidth} × {r.c.resHeight}
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">
                  {inch(r.widthIn)} × {inch(r.heightIn)}
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 tabular-nums">
                  {Math.round(r.widthIn * r.heightIn)} in²
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 flex flex-col gap-3 text-[var(--text-secondary)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Which shape should you pick?</h2>
        <p>
          A <strong>{widest.ratioName}</strong> screen is wider relative to its height. It fills 16:9 video
          and most games edge-to-edge with no black bars, and its shorter height is easier to take in without
          looking up and down.
        </p>
        <p>
          A <strong>{tallest.ratioName}</strong> screen trades a little width for noticeably more{' '}
          <strong>height</strong>
          {extraRowsPct ? ` (about ${extraRowsPct}% more at the same width)` : ''}. Those extra rows show more
          of a document, web page, timeline or code without scrolling, which is why 16:10 is popular for
          productivity, coding and design — at the cost of small letterbox bars on full-screen 16:9 video.
        </p>
      </section>

      <div className="mt-8">
        <a
          href={compareHref}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white no-underline"
        >
          Compare these shapes in the interactive tool →
        </a>
      </div>
    </div>
  )
}
