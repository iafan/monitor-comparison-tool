import { PANEL_COLORS } from './SizeComparisonSvg'
import { PanelRatingTable } from './PanelRatingTable'
import { PANEL_TECHS, VISUAL_ARTIFACTS_PATH } from './panelTech'

export interface PanelTypesHubProps {
  /** Link into the interactive comparison tool. */
  compareHref: string
}

export function PanelTypesHub({ compareHref }: PanelTypesHubProps) {
  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 text-[var(--text-primary)]">
      <header className="mb-6 flex items-center gap-2.5">
        <a href="../" className="flex items-center gap-2.5 no-underline">
          <img src="../icon.svg" alt="" width={32} height={32} className="size-8 rounded-full" />
          <span className="font-semibold">Monitorture</span>
        </a>
      </header>

      <h1 className="text-2xl font-bold sm:text-3xl">VA vs IPS vs OLED vs Mini-LED: monitor display tech explained</h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        The display technology decides how a monitor makes its image — and that, more than any spec on the box,
        shapes how it looks. It splits in two: <strong>backlit LCD</strong> (VA and IPS), where an always-on
        backlight is selectively blocked, and <strong>self-emissive</strong> (OLED), where every pixel makes its
        own light and can switch fully off. <strong>Mini-LED</strong>, the fourth card below, is not a panel type
        at all but a backlight upgrade for those LCDs — thousands of dimming zones that add OLED-like HDR. That
        backlit-vs-emissive split drives blacks, contrast, motion, brightness and burn-in. Here is how they
        compare, then a page on each.
      </p>

      <figure className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <PanelRatingTable />
        <figcaption className="mt-3 text-center text-xs text-[var(--text-muted)]">
          A rule-of-thumb rating on seven axes — real panels vary by generation and price.
        </figcaption>
      </figure>

      <section className="mt-8 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The four technologies</h2>
        {PANEL_TECHS.map((t, i) => (
          <a
            key={t.slug}
            href={`../${t.slug}/`}
            className="block rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 no-underline"
          >
            <div className="flex items-baseline gap-2">
              <span
                className="inline-block size-3 rounded-[3px]"
                style={{ background: PANEL_COLORS[i % PANEL_COLORS.length] }}
              />
              <span className="text-base font-semibold text-[var(--text-primary)]">{t.name}</span>
              <span className="text-sm text-[var(--text-muted)]">
                {t.fullName} · {t.family}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{t.tagline}</p>
            <span className="mt-2 inline-block text-sm font-semibold text-[var(--series-1)]">
              Read about {t.name} →
            </span>
          </a>
        ))}
      </section>

      <section className="mt-8 flex flex-col gap-3 text-[var(--text-secondary)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">How to choose</h2>
        <p>
          For <strong>color-critical work and bright rooms</strong>, or when several people share the screen,
          IPS is the safe all-rounder. For <strong>dark-room films and immersive games on a budget</strong>, VA’s
          deep blacks are hard to beat — usually in a curved ultrawide that offsets its narrow angles. For the{' '}
          <strong>best possible image and motion</strong> in a controlled-light room, OLED is the enthusiast pick,
          provided you can manage burn-in and full-field brightness. <strong>Mini-LED</strong> isn’t a separate
          panel but a backlight: bolt it onto an IPS or VA and you get OLED-like HDR and brightness with no
          burn-in, though bright objects can bloom against black.
        </p>
        <p>
          Many of the differences show up as visible artifacts —{' '}
          <a href={`../${VISUAL_ARTIFACTS_PATH}/`} className="text-[var(--series-1)]">
            smearing, ghosting, burn-in and more explained here
          </a>
          .
        </p>
      </section>

      <div className="mt-8">
        <a
          href={compareHref}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white no-underline"
        >
          Open the interactive comparison tool →
        </a>
      </div>
    </div>
  )
}
