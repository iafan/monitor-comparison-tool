import { PANEL_TYPES_HUB_PATH } from './panelTech'

export interface ArtifactsExplainerProps {
  /** Link into the interactive comparison tool. */
  compareHref: string
}

interface Artifact {
  id: string
  name: string
  affects: string
  what: string
  why: string
  fix: string
}

// The common visual artifacts, in the order they tend to come up. Each notes which
// panels show it, its cause, and how to reduce it — so a reader arriving from a
// panel page can jump straight to the effect that page mentioned.
const ARTIFACTS: Artifact[] = [
  {
    id: 'ghosting',
    name: 'Ghosting & inverse ghosting',
    affects: 'LCD (VA, IPS, TN); emissive panels are effectively immune',
    what: 'A faint trailing copy follows a moving object (ghosting), or a bright halo runs ahead of it (inverse ghosting / overshoot).',
    why: 'Pixels take time to finish changing color. If a pixel has not settled before the next frame is drawn, the old image lingers as a trail. Monitors fight this with “overdrive”, which pushes pixels harder to change faster — but too much overdrive overshoots the target shade and leaves a bright inverse-ghost halo instead.',
    fix: 'Set the monitor’s overdrive / “response time” control to the level that is clean at your actual refresh rate (one setting rarely suits every rate). Higher refresh rates also shorten the window each frame is shown, hiding residual trails.',
  },
  {
    id: 'black-smear',
    name: 'Black smearing',
    affects: 'VA panels most of all',
    what: 'Dark objects moving over dark backgrounds leave a muddy, delayed trail — text scrolling on a dark page, or shadows in a dark game.',
    why: 'It is ghosting’s worst case on VA: the vertically-aligned crystals are slowest to change when moving between dark shades, so dark-to-dark transitions lag the most. It is the direct trade-off for VA’s excellent contrast.',
    fix: 'Largely inherent to VA. A better overdrive tune helps a little; if fast dark-scene motion is critical, an IPS or emissive panel avoids it.',
  },
  {
    id: 'persistence-blur',
    name: 'Persistence blur (sample-and-hold)',
    affects: 'All panels, including fast OLED',
    what: 'Moving content looks softly blurred even on a panel with near-instant pixel response — the reason 60 Hz OLED still blurs in motion despite ~0 ms response.',
    why: 'Your eyes track a moving object smoothly, but each frame is held static on screen for the whole refresh interval. Your eye moves while the image does not, smearing that frame across your retina. This is about how long each frame is shown, not how fast pixels switch — so instant-response panels still show it.',
    fix: 'Raise the refresh rate (each frame is held for less time) or use backlight strobing / black-frame insertion (BFI), which blanks the screen between frames at the cost of some brightness.',
  },
  {
    id: 'burn-in',
    name: 'Burn-in & image retention',
    affects: 'OLED (organic panels); LCD — including mini-LED — does not suffer organic burn-in',
    what: 'Static elements — a taskbar, HUD, logo or channel bug — leave a faint permanent ghost after long exposure. Temporary retention fades on its own; true burn-in does not.',
    why: 'OLED pixels are organic and age with use. Areas driven bright and unchanging for hundreds of hours wear faster than their neighbours, so the difference eventually shows as a fixed pattern.',
    fix: 'Use pixel-shift and logo/taskbar dimming, auto-hide the taskbar, vary content, run the panel-refresh / compensation cycle, and avoid leaving a static bright image on screen for hours. Inorganic LCD panels (including mini-LED) sidestep it entirely.',
  },
  {
    id: 'vrr-flicker',
    name: 'VRR flicker (gamma flicker)',
    affects: 'OLED especially, with variable refresh rate (G-Sync / FreeSync)',
    what: 'Brightness flickers or “pumps” in dark scenes and on loading screens when the frame rate swings up and down.',
    why: 'A pixel’s brightness depends slightly on how long it is held between refreshes. When frame times change rapidly under VRR, near-black shades shift brightness with them, and the eye reads that as flicker. OLED’s near-instant pixels make the shift more visible than on LCD.',
    fix: 'Cap the frame rate to keep frame times steady, keep it in the VRR range, and apply any firmware fixes the maker ships. Some users disable VRR for the worst offenders.',
  },
  {
    id: 'ips-glow',
    name: 'IPS glow & backlight bleed',
    affects: 'IPS most visibly; any backlit LCD can bleed',
    what: 'A silvery angular glow washes the corners over dark content (IPS glow), and light leaks around the panel edges (backlight bleed).',
    why: 'A backlit LCD cannot fully block its always-on backlight. IPS glow is angle-dependent — it shifts as you move your head — while bleed is fixed leakage around the edges and varies unit to unit. Emissive panels have no backlight, so neither occurs.',
    fix: 'Sit more square-on and a touch further back, lower brightness in dark rooms, and add some bias lighting so raised blacks are less obvious. Severe bleed can be a warranty matter.',
  },
]

export function ArtifactsExplainer({ compareHref }: ArtifactsExplainerProps) {
  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 text-[var(--text-primary)]">
      <header className="mb-6 flex items-center gap-2.5">
        <a href="../" className="flex items-center gap-2.5 no-underline">
          <img src="../icon.svg" alt="" width={32} height={32} className="size-8 rounded-full" />
          <span className="font-semibold">Monitorture</span>
        </a>
      </header>

      <h1 className="text-2xl font-bold sm:text-3xl">Monitor smearing, ghosting &amp; burn-in explained</h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        The image faults people notice on monitors almost all trace back to the{' '}
        <a href={`../${PANEL_TYPES_HUB_PATH}/`} className="text-[var(--series-1)]">
          panel technology
        </a>{' '}
        and how fast its pixels change. Here is what each artifact looks like, what causes it, which panels show
        it, and how to reduce it.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-[var(--text-muted)]">
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Artifact</th>
              <th className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">Mainly affects</th>
            </tr>
          </thead>
          <tbody>
            {ARTIFACTS.map((a) => (
              <tr key={a.id}>
                <td className="border-b border-[var(--border)] px-2.5 py-2 font-semibold">
                  <a href={`#${a.id}`} className="text-[var(--series-1)] no-underline">
                    {a.name}
                  </a>
                </td>
                <td className="border-b border-[var(--border)] px-2.5 py-2 text-[var(--text-secondary)]">{a.affects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {ARTIFACTS.map((a) => (
          <section key={a.id} id={a.id} className="scroll-mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{a.name}</h2>
            <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">Mainly affects: {a.affects}</p>
            <dl className="mt-3 flex flex-col gap-2.5 text-[var(--text-secondary)]">
              <div>
                <dt className="inline font-semibold text-[var(--text-primary)]">What you see. </dt>
                <dd className="inline">{a.what}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-[var(--text-primary)]">Why it happens. </dt>
                <dd className="inline">{a.why}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-[var(--text-primary)]">How to reduce it. </dt>
                <dd className="inline">{a.fix}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>

      <section className="mt-8 flex flex-col gap-3 text-[var(--text-secondary)]">
        <p>
          The short version: <strong>ghosting and smearing</strong> are about pixel response (slow on VA, worst
          in the dark; fast on IPS; near-instant on emissive panels). <strong>Persistence blur</strong> is about
          refresh rate and affects every panel. <strong>Burn-in and VRR flicker</strong> are OLED’s to manage,
          the price of its perfect blacks. Matching the panel to how you actually use the screen is what keeps
          these from ever bothering you — start with the{' '}
          <a href={`../${PANEL_TYPES_HUB_PATH}/`} className="text-[var(--series-1)]">
            panel-types comparison
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
