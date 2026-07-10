import { PANEL_COLORS } from './SizeComparisonSvg'
import { PanelRatingTable } from './PanelRatingTable'
import { PanelStackSvg } from './PanelStackSvg'
import { PANEL_TECHS, PANEL_TYPES_HUB_PATH, VISUAL_ARTIFACTS_PATH, techBySlug, type ProCon } from './panelTech'

export interface PanelTechExplainerProps {
  /** Which technology this page documents (its slug in panelTech.ts). */
  slug: string
}

function ProConList({ items, kind }: { items: ProCon[]; kind: 'pro' | 'con' }) {
  const color = kind === 'pro' ? 'var(--series-2)' : 'var(--danger)'
  const mark = kind === 'pro' ? '＋' : '－'
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {items.map((it) => (
        <li key={it.title} className="flex gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: color, color: 'white' }}
          >
            {mark}
          </span>
          <span>
            <span className="font-semibold text-[var(--text-primary)]">{it.title}.</span>{' '}
            <span className="text-[var(--text-secondary)]">{it.body}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function PanelTechExplainer({ slug }: PanelTechExplainerProps) {
  const tech = techBySlug(slug)
  const color = PANEL_COLORS[PANEL_TECHS.indexOf(tech) % PANEL_COLORS.length]
  const others = PANEL_TECHS.filter((t) => t.slug !== slug)
  const emissive = tech.family === 'Self-emissive'

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 text-[var(--text-primary)]">
      <header className="mb-6 flex items-center gap-2.5">
        <a href="../" className="flex items-center gap-2.5 no-underline">
          <img src="../icon.svg" alt="" width={32} height={32} className="size-8 rounded-full" />
          <span className="font-semibold">Monitorture</span>
        </a>
      </header>

      <nav className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-muted)]">
        <a href={`../${PANEL_TYPES_HUB_PATH}/`} className="text-[var(--series-1)] no-underline">
          Panel types
        </a>
        {PANEL_TECHS.map((t) => (
          <span key={t.slug}>
            <span className="mr-2">/</span>
            {t.slug === slug ? (
              <span className="font-semibold text-[var(--text-primary)]">{t.name}</span>
            ) : (
              <a href={`../${t.slug}/`} className="text-[var(--series-1)] no-underline">
                {t.name}
              </a>
            )}
          </span>
        ))}
      </nav>

      <h1 className="text-2xl font-bold sm:text-3xl">
        {tech.name} monitors explained
        <span className="block text-base font-normal text-[var(--text-muted)] sm:text-lg">
          {tech.fullName} · {tech.family}
        </span>
      </h1>
      <p className="mt-3 text-[var(--text-secondary)]">{tech.tagline}</p>

      <figure className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <PanelStackSvg emissive={emissive} color={color} zonedBacklight={tech.slug === 'mini-led-monitors'} />
        <figcaption className="mt-2 text-center text-xs text-[var(--text-muted)]">
          {emissive
            ? 'Each pixel emits its own light — one that is off emits nothing, so black is truly black, with no backlight to leak or bloom.'
            : tech.slug === 'mini-led-monitors'
              ? 'A mini-LED backlight splits into local-dimming zones that darken behind dark areas — deeper blacks than a plain LCD, but a zone is far larger than a pixel, so light still blooms around bright objects.'
              : 'The always-on backlight is only ever blocked, never switched off — so a little light always leaks through “black”, raising it.'}
        </figcaption>
      </figure>

      <section className="mt-8 flex flex-col gap-3 text-[var(--text-secondary)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">How it works</h2>
        {tech.howItWorks.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--series-2)' }}>
            Pros
          </h2>
          <ProConList items={tech.pros} kind="pro" />
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--danger)' }}>
            Cons
          </h2>
          <ProConList items={tech.cons} kind="con" />
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-[var(--border)] p-4 text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Best for: </span>
        {tech.bestFor}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">How {tech.name} compares</h2>
        <p className="mt-2 mb-3 text-sm text-[var(--text-secondary)]">
          Seven axes across all four technologies, with {tech.name} highlighted.
        </p>
        <PanelRatingTable highlightSlug={slug} />
      </section>

      <section className="mt-8 flex flex-col gap-3 text-[var(--text-secondary)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Related</h2>
        <p>
          Wondering about the trailing, haloing or image-retention effects mentioned above? See{' '}
          <a href={`../${VISUAL_ARTIFACTS_PATH}/`} className="text-[var(--series-1)]">
            monitor smearing, ghosting &amp; burn-in explained
          </a>
          . Or compare the other panel types:{' '}
          {others.map((t, i) => (
            <span key={t.slug}>
              <a href={`../${t.slug}/`} className="text-[var(--series-1)]">
                {t.name}
              </a>
              {i < others.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </section>

      <div className="mt-8">
        <a
          href={`../${PANEL_TYPES_HUB_PATH}/`}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white no-underline"
        >
          Compare all panel types side by side →
        </a>
      </div>
    </div>
  )
}
