// Content model for the display-technology explainer pages (VA / IPS / OLED /
// Mini-LED) and the visual-artifacts page. Like everything under src/seo/, this
// is used ONLY by the build-pages script — it is not imported by the app, so it
// adds nothing to the app bundle. The prose lives here as data so the components
// stay presentational and the hub, detail pages and artifact cross-links all read
// from one source of truth.

/** URL path (single segment) of the panel-types hub / overview page. */
export const PANEL_TYPES_HUB_PATH = 'monitor-panel-types'
/** URL path (single segment) of the visual-artifacts explainer. */
export const VISUAL_ARTIFACTS_PATH = 'monitor-visual-artifacts'

/** The axes the comparison matrix rates every technology on, 1 (worst) – 5 (best).
 *  `hint` explains what a high score means so the dots are self-describing. */
export const RATING_ATTRS: { key: string; label: string; hint: string }[] = [
  { key: 'contrast', label: 'Contrast & blacks', hint: 'How dark blacks look in a dim room' },
  { key: 'motion', label: 'Motion / response', hint: 'Pixel response — freedom from smearing & ghosting' },
  { key: 'angles', label: 'Viewing angles', hint: 'How well color & contrast hold off-axis' },
  { key: 'brightness', label: 'Brightness', hint: 'Sustained, full-field brightness for a lit room' },
  { key: 'color', label: 'Color', hint: 'Gamut and color volume' },
  { key: 'burnin', label: 'Burn-in safety', hint: 'Freedom from permanent image retention' },
  { key: 'value', label: 'Value / availability', hint: 'Price and how easy it is to actually buy one' },
]

export type RatingKey = (typeof RATING_ATTRS)[number]['key']

export interface ProCon {
  title: string
  body: string
}

export interface PanelTech {
  /** URL path segment AND the id used for cross-linking. */
  slug: string
  /** Short spec-sheet name, e.g. "VA". */
  name: string
  /** Expansion of the acronym, e.g. "Vertical Alignment". */
  fullName: string
  /** How the panel makes an image at the physical level. */
  family: 'Backlit LCD' | 'Self-emissive'
  /** One-line summary for the hub cards. */
  tagline: string
  /** <title> / og:title for the detail page. */
  seoTitle: string
  /** meta description for the detail page. */
  seoDescription: string
  /** How it works — one or more paragraphs. */
  howItWorks: string[]
  pros: ProCon[]
  cons: ProCon[]
  /** Who each technology suits, in one line. */
  bestFor: string
  ratings: Record<RatingKey, number>
}

export const PANEL_TECHS: PanelTech[] = [
  {
    slug: 'va-panel-monitors',
    name: 'VA',
    fullName: 'Vertical Alignment',
    family: 'Backlit LCD',
    tagline: 'The contrast champion of LCD — deep blacks and cheap curves, at the cost of motion and viewing angles.',
    seoTitle: 'VA panel monitors explained: pros, cons & black smearing',
    seoDescription:
      'What a VA (Vertical Alignment) monitor is, how it works, and its pros and cons: the best contrast and deepest blacks of any LCD, but slow dark-transition response (black smearing) and narrow viewing angles.',
    howItWorks: [
      'VA is an LCD technology, so the panel never makes its own light — a backlight is always on behind it, and each pixel is a tiny shutter that lets more or less of that light through, tinted by a red/green/blue color filter.',
      'In a VA panel the liquid crystals stand vertically (perpendicular to the glass) when no voltage is applied, which blocks the backlight very effectively. That is why VA blocks light better than any other LCD and produces its signature deep blacks — but rotating those crystals in and out of the way takes time, which is the root of its motion weakness.',
    ],
    pros: [
      {
        title: 'The best contrast of any LCD',
        body: 'Native contrast of roughly 2,500:1 to 5,000:1 — three to five times an IPS panel’s ~1,000:1. In a dim room blacks look genuinely dark rather than grey, which makes VA the value pick for films and moody, dark games.',
      },
      {
        title: 'Clean dark scenes — little IPS-style glow',
        body: 'Because the crystals block the backlight so well, VA panels show much less of the corner “glow” and edge bleed that plague IPS on dark content, so black scenes stay uniform.',
      },
      {
        title: 'Bright and inexpensive',
        body: 'Paired with quantum-dot films and, increasingly, mini-LED backlights, VA hits high SDR and HDR brightness for far less money than OLED. It is the dominant panel in affordable curved ultrawides.',
      },
      {
        title: 'Immune to burn-in',
        body: 'As an inorganic LCD, a VA panel can display a static taskbar, HUD or spreadsheet forever with no risk of permanent image retention.',
      },
    ],
    cons: [
      {
        title: 'Black smearing — slow dark transitions',
        body: 'VA’s crystals are slowest to change when moving between dark shades, so dark objects moving over dark backgrounds leave a muddy trailing smear (“black smear”). It is the classic VA weakness and the reason VA is a compromise for fast, competitive games.',
      },
      {
        title: 'Narrow viewing angles',
        body: 'Contrast and gamma shift noticeably as you move off-centre; on a large flat VA the far corners look washed out or color-shifted from a normal seating position. This is a big reason VA ultrawides are almost always curved — the curve turns the edges back toward you.',
      },
      {
        title: 'Overdrive is hard to tune',
        body: 'Speeding the panel up with overdrive to fight smearing can overshoot and create inverse ghosting (bright halos behind moving objects), and a setting that looks clean at one refresh rate often misbehaves at another.',
      },
      {
        title: 'Dark detail can crush off-axis',
        body: 'Combined with the angle sensitivity, subtle shadow detail can disappear or “gamma shift” depending on exactly where your eyes are relative to the screen.',
      },
    ],
    bestFor: 'Dark-room media and immersive single-player games on a budget, especially curved ultrawides. Less ideal for competitive FPS or sharing the screen at an angle.',
    ratings: { contrast: 5, motion: 2, angles: 2, brightness: 4, color: 3, burnin: 5, value: 4 },
  },
  {
    slug: 'ips-panel-monitors',
    name: 'IPS',
    fullName: 'In-Plane Switching',
    family: 'Backlit LCD',
    tagline: 'The all-rounder — the best color and viewing angles in LCD, held back by grey blacks and IPS glow.',
    seoTitle: 'IPS panel monitors explained: pros, cons & IPS glow',
    seoDescription:
      'What an IPS (In-Plane Switching) monitor is, how it works, and its pros and cons: superb viewing angles and accurate color, but low native contrast, grey blacks and the corner “IPS glow” on dark scenes.',
    howItWorks: [
      'IPS is also a backlit LCD — an always-on backlight shines through a liquid-crystal shutter and an RGB color filter. What sets it apart is that the crystals rotate within the plane of the screen (parallel to the glass) rather than tilting toward you.',
      'Keeping the crystals in-plane means the light you see barely changes as your line of sight changes, which is why IPS holds its color and contrast so well off-axis. The trade-off is that this arrangement lets a little backlight through even when a pixel is meant to be black, so blacks are raised.',
    ],
    pros: [
      {
        title: 'Best-in-class viewing angles',
        body: 'Color and contrast stay stable well off-centre, so the whole screen looks uniform even on wide or tall panels and when several people share it — the standard choice whenever angle consistency matters.',
      },
      {
        title: 'Accurate, wide-gamut color',
        body: 'IPS delivers excellent, uniform color with wide gamut coverage (full sRGB and most of DCI-P3 on good units), which is why it is the default for photo, video and design work.',
      },
      {
        title: '“Fast IPS” motion without OLED prices',
        body: 'Modern Fast IPS panels reach ~1 ms grey-to-grey with far less dark smearing than VA, giving clean, responsive motion for gaming at a fraction of an OLED’s cost.',
      },
      {
        title: 'No burn-in; bright, and great with mini-LED',
        body: 'Inorganic, so static UI is safe forever, and IPS pairs well with mini-LED backlights to push high, sustained brightness for HDR.',
      },
    ],
    cons: [
      {
        title: 'Low native contrast — grey blacks',
        body: 'Around 1,000:1 native contrast means blacks look dark grey rather than black in a dim room. This is IPS’s defining weakness and the flip side of its great angles.',
      },
      {
        title: 'IPS glow',
        body: 'A silvery, angular sheen over dark content in the corners, worst when you sit close or off-axis. It shifts as you move your head, distinguishing it from fixed backlight bleed.',
      },
      {
        title: 'Backlight bleed',
        body: 'Light leaking around the panel edges shows up on dark scenes. How much varies unit to unit — a bit of a “panel lottery”.',
      },
      {
        title: 'Limited HDR without mini-LED',
        body: 'An edge-lit IPS cannot switch off light behind dark areas, so HDR contrast is modest. Mini-LED local dimming helps a lot but adds cost and can cause blooming (a halo of light around bright objects on black).',
      },
    ],
    bestFor: 'Color-critical work, mixed use, bright rooms, and any time people view the screen from an angle. Less ideal for dark-room cinema where deep blacks matter most.',
    ratings: { contrast: 2, motion: 3, angles: 5, brightness: 4, color: 4, burnin: 5, value: 4 },
  },
  {
    slug: 'oled-monitors',
    name: 'OLED',
    fullName: 'Organic Light-Emitting Diode',
    family: 'Self-emissive',
    tagline: 'Perfect blacks and near-instant pixels — spectacular in a dark room, with burn-in, brightness and glossy-glare caveats.',
    seoTitle: 'OLED monitors explained: pros, cons, burn-in & VRR flicker',
    seoDescription:
      'What an OLED monitor is (including QD-OLED and WOLED), how it works, and its pros and cons: perfect blacks, infinite contrast and instant response, versus burn-in risk, limited full-field brightness, VRR flicker and glossy glare.',
    howItWorks: [
      'OLED is self-emissive: every pixel is its own organic light-emitting diode that makes its own light and switches fully off. There is no backlight, so “black” is a pixel that is simply off — emitting nothing at all.',
      'Two variants dominate monitors. WOLED (LG) uses white OLED subpixels behind a color filter with an added white subpixel for brightness. QD-OLED (Samsung) uses blue OLED exciting red and green quantum dots for purer, more saturated color. Both are emissive, so both share OLED’s perfect blacks and instant response.',
    ],
    pros: [
      {
        title: 'Perfect blacks and infinite contrast',
        body: 'Because a black pixel emits no light at all, contrast is effectively infinite with zero blooming — unmatched in a dim room and the headline reason to buy OLED.',
      },
      {
        title: 'Near-instant response (~0.03 ms)',
        body: 'Pixels change state almost instantly, so there is essentially no smearing or ghosting. At any given refresh rate OLED shows the clearest motion of any panel type.',
      },
      {
        title: 'Excellent angles and HDR highlights',
        body: 'Per-pixel emission keeps color and contrast stable off-axis, and small bright highlights can pop brilliantly against true black for striking HDR.',
      },
      {
        title: 'Very wide, precise color',
        body: 'Especially on QD-OLED, colors are wide-gamut, saturated and controlled per pixel, giving rich, vivid images.',
      },
    ],
    cons: [
      {
        title: 'Burn-in (permanent image retention)',
        body: 'Organic pixels age with use, so static elements — taskbars, HUDs, logos — can wear unevenly and etch in permanently over time. Mitigations (pixel shift, logo/taskbar dimming, panel-refresh routines) manage the risk but do not eliminate it, so OLED needs thought for desktops with fixed UI.',
      },
      {
        title: 'Limited full-field & sustained brightness (ABL)',
        body: 'An Automatic Brightness Limiter dims large bright areas — like a full-screen white document — to protect the panel and control heat. So for bright rooms and all-day productivity, a good LCD can look noticeably brighter than an OLED.',
      },
      {
        title: 'VRR flicker (gamma flicker)',
        body: 'With variable refresh rate (G-Sync / FreeSync), rapid frame-time swings shift near-black gamma and show up as flickering or brightness “pumping” in dark scenes and loading screens. It is an OLED-characteristic artifact; capping the frame rate and firmware fixes reduce it.',
      },
      {
        title: 'Glossy coatings and ambient light',
        body: 'Most OLEDs — QD-OLED especially — use a glossy or semi-glossy finish for the deepest blacks and best “pop”. That looks superb in controlled light but produces mirror-like reflections in a bright room, and because QD-OLED has no polariser layer like WOLED, its blacks can raise to a purple-grey under ambient light.',
      },
      {
        title: 'Text fringing',
        body: 'Non-standard subpixel layouts (QD-OLED’s triangular arrangement, WOLED’s extra white subpixel) can add faint color fringing on text. Software tuning helps, but it is not as crisp as an RGB-stripe LCD.',
      },
      {
        title: 'Expensive',
        body: 'OLED still commands a clear price premium over comparable LCDs.',
      },
    ],
    bestFor: 'Dark-room gaming and media, motion clarity and HDR. Take extra care for mixed desktop/productivity use with static UI, and for bright rooms where glare and full-field brightness matter.',
    ratings: { contrast: 5, motion: 5, angles: 5, brightness: 3, color: 5, burnin: 2, value: 2 },
  },
  {
    slug: 'mini-led-monitors',
    name: 'Mini-LED',
    fullName: 'Mini-LED backlight',
    family: 'Backlit LCD',
    tagline: 'Not a panel type but a backlight — thousands of local-dimming zones that give a VA or IPS LCD OLED-like HDR, at the cost of blooming.',
    seoTitle: 'Mini-LED monitors explained: local dimming, HDR & blooming',
    seoDescription:
      'What a Mini-LED monitor is — an LCD with a zoned local-dimming backlight, not a new panel type — how it works, and its pros and cons: big HDR brightness and much deeper blacks than a plain LCD, versus blooming, zone limits, and the strengths and weaknesses of the VA or IPS panel underneath.',
    howItWorks: [
      'Mini-LED is not a panel type at all — it is a backlight upgrade bolted onto an ordinary LCD. The liquid-crystal layer that forms the image (a VA or IPS panel) is unchanged; what changes is the light behind it, so a “mini-LED monitor” is really “a VA or IPS monitor with a mini-LED backlight”.',
      'Instead of a few edge LEDs, a mini-LED backlight packs thousands of tiny LEDs into hundreds or thousands of independently dimmable “local-dimming zones”. Zones behind dark areas dim or switch off while bright areas stay lit, so contrast and HDR punch improve dramatically. But a zone is far larger than a pixel, so the backlight can never be controlled as finely as the image — the root of its main weakness.',
    ],
    pros: [
      {
        title: 'Much deeper blacks and HDR contrast than a plain LCD',
        body: 'Local dimming darkens or switches off the backlight behind dark areas, pushing effective contrast far past a normal LCD’s ~1,000:1 toward OLED-like blacks in favourable scenes — the reason to pick mini-LED over an edge-lit LCD.',
      },
      {
        title: 'Very high, sustained brightness',
        body: 'Mini-LED backlights reach well over a thousand nits full-field with no automatic brightness limiter, so HDR highlights hit hard and the screen stays punchy in a bright room — a ceiling OLED cannot match.',
      },
      {
        title: 'No burn-in, and it keeps the panel’s strengths',
        body: 'It is still an inorganic LCD, so a static taskbar or HUD is safe forever, and it pairs with IPS (for angles and color) or VA (for native contrast) — you get that panel’s upsides plus far better HDR.',
      },
      {
        title: 'OLED-like HDR for less money',
        body: 'For a given brightness and HDR level, mini-LED is typically cheaper than OLED and carries none of the burn-in caveats, which is why it dominates affordable HDR monitors and TVs.',
      },
    ],
    cons: [
      {
        title: 'Blooming — halos around bright objects',
        body: 'Because each zone is much larger than a pixel, a bright object on a dark background lights its whole zone, haloing it. Small bright elements — a mouse cursor, subtitles, stars on a night sky — bloom the most. More zones reduce it but never eliminate it.',
      },
      {
        title: 'Zone count is the hard ceiling',
        body: 'Control is per zone, not per pixel: even a few thousand zones is nothing next to millions of pixels, so mini-LED can approach OLED’s blacks but never reach its per-pixel precision.',
      },
      {
        title: 'It inherits the LCD panel’s limits',
        body: 'Mini-LED fixes the backlight, not the crystals. A mini-LED VA still black-smears and shifts off-axis; a mini-LED IPS still has IPS glow. The panel type underneath still decides motion and viewing angles.',
      },
      {
        title: 'Dimming can lag or crush detail',
        body: 'The zone algorithm has to guess how bright each area should be. Aggressive tuning can trail behind fast motion or crush faint shadow detail into black, and behaviour varies a lot between models.',
      },
    ],
    bestFor: 'HDR and bright rooms on an LCD budget — an IPS mini-LED for bright, color-accurate all-round use, or a VA mini-LED for dark-room contrast — when you want OLED-like highlights with no burn-in worry.',
    ratings: { contrast: 4, motion: 3, angles: 3, brightness: 5, color: 4, burnin: 5, value: 3 },
  },
]

/** Look up a technology by its slug (used by the detail-page component). */
export function techBySlug(slug: string): PanelTech {
  const t = PANEL_TECHS.find((x) => x.slug === slug)
  if (!t) throw new Error(`Unknown panel tech slug: ${slug}`)
  return t
}
