interface Props {
  /** Self-emissive panels (OLED) draw the per-pixel diagram; backlit panels
   *  (VA, IPS, mini-LED) draw the layered light-path cross-section. */
  emissive: boolean
  /** Backlit only: draw the backlight as independently dimmable zones (mini-LED),
   *  some switched off, rather than a uniform "always on" backlight. */
  zonedBacklight?: boolean
}

/**
 * A schematic cross-section of how the panel makes an image — the single idea
 * behind almost every pro and con on the page. Backlit LCD: an always-on backlight
 * pushed through a crystal shutter and color filter (light is only ever blocked,
 * never truly switched off). Self-emissive: each pixel makes its own light and can
 * switch fully off. Pure SVG with CSS-variable text so it renders identically
 * server-side and adapts to light/dark. The prose takeaway lives in the page's
 * figcaption (HTML wraps; fixed-width SVG text would clip).
 */
export function PanelStackSvg({ emissive, zonedBacklight = false }: Props) {
  const W = 560

  if (emissive) {
    // A 6×3 grid of self-emitting pixels; three are "off" (true black), the rest lit.
    const cols = 6
    const rows = 3
    const gap = 10
    const gridX = 40
    const gridY = 44
    const cellW = (W - 2 * gridX - (cols - 1) * gap) / cols
    const cellH = 34
    const H = gridY + rows * cellH + (rows - 1) * gap + 16
    const off = new Set(['1-1', '3-0', '4-2'])
    const subColors = ['var(--series-3)', 'var(--series-2)', 'var(--series-1)']
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Self-emissive panel: each pixel makes its own light and can switch fully off"
      >
        <text x={W / 2} y={24} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--text-primary)">
          Self-emissive — each pixel makes its own light
        </text>
        <rect x={W - 30} y={12} width={12} height={12} rx={2} fill="#0b0b0b" stroke="var(--border)" />
        <text x={W - 34} y={22} textAnchor="end" fontSize={11} fill="var(--text-muted)">
          off
        </text>
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const x = gridX + c * (cellW + gap)
            const y = gridY + r * (cellH + gap)
            const isOff = off.has(`${c}-${r}`)
            return (
              <g key={`${c}-${r}`}>
                <rect
                  x={x}
                  y={y}
                  width={cellW}
                  height={cellH}
                  rx={4}
                  fill={isOff ? '#0b0b0b' : 'var(--surface-1)'}
                  stroke="var(--border)"
                />
                {!isOff &&
                  subColors.map((sc, s) => (
                    <rect
                      key={s}
                      x={x + 3 + s * ((cellW - 6) / 3)}
                      y={y + 4}
                      width={(cellW - 6) / 3 - 2}
                      height={cellH - 8}
                      rx={1.5}
                      fill={sc}
                    />
                  ))}
              </g>
            )
          }),
        )}
      </svg>
    )
  }

  // Backlit LCD as a labelled cross-section: light rises from the backlight
  // (bottom), through the liquid-crystal shutter, to the RGB color filter and your
  // eye (top). Each layer carries a small illustration of what it does — an "on"
  // backlight is yellow, so mini-LED's dark (dimmed) zones read at a glance; the
  // shutter shows per-pixel cells blocking or passing; the filter shows RGB
  // stripes. Label sits left, illustration right, so text never clips.
  const YELLOW = '#f5c518'
  // A varied (non-periodic) shutter open/closed pattern, shared with the filter:
  // a closed subpixel gets no light, so its color stripe above is dimmed to ~25%.
  const OPEN = [
    true, true, false, true, true, false, false, true, false, true, true, true,
    false, false, true, false, true, true, false, true, false, false, true, true,
  ]
  const RGB_BRIGHT = ['#e5484d', '#30a46c', '#3b82f6']
  const RGB_DARK = ['#391213', '#0c291b', '#0f203d'] // ~25% brightness (dimmed subpixel)
  const M = 40
  const layerW = W - 2 * M
  const layerH = 56
  const gap = 12
  const top = 58
  const labelW = 194
  const ix = M + labelW
  const iw = layerW - labelW - 14
  const rows = [
    { key: 'filter', label: 'RGB color filter', sub: 'adds red, green, blue' },
    { key: 'shutter', label: 'Liquid-crystal shutter', sub: 'blocks or passes light' },
    { key: 'backlight', label: 'LED backlight', sub: zonedBacklight ? 'split into dimmable zones' : 'always on, uniform' },
  ] as const
  const H = top + rows.length * layerH + (rows.length - 1) * gap + 14
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Backlit LCD cross-section: a backlight at the bottom shines up through a liquid-crystal shutter and an RGB color filter to the viewer"
    >
      <text x={W / 2} y={24} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--text-primary)">
        Backlit LCD — a backlight shines up through the crystals
      </text>
      <text x={W / 2} y={45} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
        ↑ to your eye
      </text>
      {rows.map((r, i) => {
        const y = top + i * (layerH + gap)
        const iy = y + 10
        const ih = layerH - 20
        return (
          <g key={r.key}>
            <rect x={M} y={y} width={layerW} height={layerH} rx={8} fill="none" stroke="var(--border)" />
            <text x={M + 12} y={y + layerH / 2 - 2} fontSize={13} fontWeight={600} fill="var(--text-primary)">
              {r.label}
            </text>
            <text x={M + 12} y={y + layerH / 2 + 16} fontSize={11} fill="var(--text-muted)">
              {r.sub}
            </text>

            {r.key === 'filter' &&
              // One stripe per subpixel; dimmed to ~25% where the shutter below is
              // closed (no light reaches that subpixel's color).
              Array.from({ length: 24 }).map((_, k) => (
                <rect
                  key={k}
                  x={ix + (k * iw) / 24}
                  y={iy}
                  width={iw / 24 + 0.6}
                  height={ih}
                  fill={(OPEN[k] ? RGB_BRIGHT : RGB_DARK)[k % 3]}
                />
              ))}

            {r.key === 'shutter' &&
              // One cell per subpixel, aligned 1:1 with the stripes above: open
              // cells (light) pass light, closed cells (dark) block it. Open cells
              // are drawn light — not transparent — so they read in dark mode too.
              Array.from({ length: 24 }).map((_, k) => {
                const cw = iw / 24
                return (
                  <rect
                    key={k}
                    x={ix + (k * iw) / 24}
                    y={iy}
                    width={cw + 0.6}
                    height={ih}
                    fill={OPEN[k] ? '#d7dbe0' : '#15171a'}
                  />
                )
              })}

            {r.key === 'backlight' &&
              (zonedBacklight ? (
                // Just two zones — each spans many subpixels, the whole point of
                // mini-LED (a zone is far coarser than a pixel, hence blooming).
                Array.from({ length: 2 }).map((_, k) => {
                  const zw = iw / 2
                  const on = k === 0 // one zone lit, one dimmed (not off-black)
                  return (
                    <rect
                      key={k}
                      x={ix + k * zw + 1.5}
                      y={iy}
                      width={zw - 3}
                      height={ih}
                      rx={2}
                      fill={on ? YELLOW : '#9a7a10'}
                      stroke="var(--text-muted)"
                      strokeOpacity={0.5}
                    />
                  )
                })
              ) : (
                <rect x={ix} y={iy} width={iw} height={ih} rx={2} fill={YELLOW} />
              ))}
          </g>
        )
      })}
    </svg>
  )
}
