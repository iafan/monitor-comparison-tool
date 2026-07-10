interface Props {
  /** Which crystal behaviour to draw. */
  variant: 'va' | 'ips'
}

/**
 * How an LCD actually gates light: it is a polarization valve, not a shutter.
 * A rear polarizer polarizes the backlight, the liquid crystal rotates that
 * polarization (or not), and a front polarizer crossed at 90° passes the light
 * only if it was rotated to match.
 *
 * Drawn as a 2.5D exploded stack: the panel's layers are tilted into an
 * isometric projection and pulled apart along the optical axis (backlight at the
 * bottom → your eye at the top), with faint alignment rails tying the stack
 * together. Two stacks sit side by side — the two drive states:
 *   - No voltage → the crystal doesn't twist the light → crossed front polarizer
 *     blocks it → black.
 *   - Voltage → the crystal rotates the polarization → it passes → light.
 * The crystal orientation reads honestly on each tilted sheet: IPS crystals lie
 * in the sheet plane and rotate within it; VA crystals stand along the optical
 * axis (drawn end-on as dots) and tilt when driven.
 * Pure SVG with CSS-variable text so it renders identically server-side.
 */
export function PolarizerDiagram({ variant }: Props) {
  const W = 560
  const H = 356
  const CYAN = '#22d3ee'
  const CRYSTAL = '#64748b'
  const YELLOW = '#f5c518'

  // Oblique (isometric-ish) projection of a flat sheet.
  //   sheet x-axis (sx, across the screen) → screen vector (UX, UY) — right & down
  //   sheet y-axis (sy, up the screen)     → screen vector (VX, VY) — right & up
  // Stacking (the optical axis) is straight up: successive layers subtract from oy.
  const UX = 1
  const UY = 0.34
  const VX = 0.56
  const VY = -0.34
  const Ws = 104 // sheet extent along sx
  const Hs = 68 // sheet extent along sy
  const proj = (ox: number, oy: number, sx: number, sy: number): [number, number] => [
    ox + sx * UX + sy * VX,
    oy + sx * UY + sy * VY,
  ]
  const pt = (ox: number, oy: number, sx: number, sy: number) => {
    const [x, y] = proj(ox, oy, sx, sy)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }
  const sheetPoly = (ox: number, oy: number) =>
    `${pt(ox, oy, 0, 0)} ${pt(ox, oy, Ws, 0)} ${pt(ox, oy, Ws, Hs)} ${pt(ox, oy, 0, Hs)}`

  const layerGap = 52
  const baseY = 300 // backlight (bottom layer) origin y
  const oyOf = (i: number) => baseY - i * layerGap // i: 0 backlight … 4 you-see (top)
  const midOy = (i: number) => (oyOf(i) + oyOf(i + 1)) / 2

  // A projected line segment in sheet coordinates.
  const seg = (
    ox: number,
    oy: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: string,
    sw: number,
    key: number | string,
    marker = false,
  ) => {
    const [ax, ay] = proj(ox, oy, x1, y1)
    const [bx, by] = proj(ox, oy, x2, y2)
    return (
      <line
        key={key}
        x1={ax}
        y1={ay}
        x2={bx}
        y2={by}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        markerStart={marker ? 'url(#pd-cyan)' : undefined}
        markerEnd={marker ? 'url(#pd-cyan)' : undefined}
      />
    )
  }

  // Hatch lines along a polarizer's transmission axis, drawn on its sheet.
  const hatch = (ox: number, oy: number, axis: 'h' | 'v') =>
    axis === 'h'
      ? [0.3, 0.5, 0.7].map((f, k) => seg(ox, oy, 12, Hs * f, Ws - 12, Hs * f, 'var(--text-muted)', 1.25, `h${k}`))
      : [0.2, 0.4, 0.6, 0.8].map((f, k) => seg(ox, oy, Ws * f, 12, Ws * f, Hs - 12, 'var(--text-muted)', 1.25, `v${k}`))

  // The liquid-crystal molecules on a sheet, three across.
  const crystal = (ox: number, oy: number, driven: boolean) =>
    [26, 52, 78].map((sx, i) => {
      const cy = Hs / 2
      if (variant === 'ips') {
        // in-plane: aligned with sx at rest → rotated 90° toward sy when driven
        const [dx, dy] = driven ? [0, 13] : [13, 0]
        return seg(ox, oy, sx - dx, cy - dy, sx + dx, cy + dy, CRYSTAL, 3.5, i)
      }
      // VA: stands along the optical axis (end-on dot) at rest → tilts into the plane when driven
      if (!driven) {
        const [cx, cyv] = proj(ox, oy, sx, cy)
        return <circle key={i} cx={cx} cy={cyv} r={4} fill={CRYSTAL} />
      }
      return seg(ox, oy, sx - 11, cy, sx + 11, cy, CRYSTAL, 3.5, i)
    })

  // Polarization double-arrow floating in the gap above a layer.
  const polArrow = (ox: number, oy: number, dir: 'h' | 'v', key: string) => {
    const [dx, dy] = dir === 'h' ? [24, 0] : [0, 22]
    return seg(ox, oy, Ws / 2 - dx, Hs / 2 - dy, Ws / 2 + dx, Hs / 2 + dy, CYAN, 2, key, true)
  }

  // Unpolarized light: ticks in all directions.
  const unpol = (ox: number, oy: number) => {
    const c = Hs / 2
    const cx = Ws / 2
    const dirs: [number, number][] = [
      [8, 0],
      [0, 8],
      [6, 6],
      [6, -6],
    ]
    return dirs.map(([dx, dy], k) =>
      seg(ox, oy, cx - dx, c - dy, cx + dx, c + dy, 'var(--text-muted)', 1.5, `u${k}`),
    )
  }

  const stacks = [
    { ox: 96, driven: false, label: 'No voltage' },
    { ox: 320, driven: true, label: 'Voltage' },
  ]

  // Layer-center y (for the left-hand stage labels) — same for both stacks.
  const labelY = (i: number) => proj(0, oyOf(i), Ws / 2, Hs / 2)[1]
  const stageLabels = ['Backlight', 'Rear polarizer', 'Liquid crystal', 'Front polarizer', 'You see']

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Exploded view of an ${variant.toUpperCase()} LCD: the backlight is polarized, the liquid crystal rotates that polarization or not, and a crossed front polarizer passes it only when rotated`}
    >
      <defs>
        <marker id="pd-cyan" markerWidth="6" markerHeight="6" refX="4.5" refY="2.5" orient="auto-start-reverse">
          <path d="M0,0 L5,2.5 L0,5 Z" fill={CYAN} />
        </marker>
      </defs>

      <text x={W / 2} y={16} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--text-primary)">
        How {variant === 'ips' ? 'IPS' : 'VA'} gates light by polarization
      </text>

      {/* left-hand stage labels (aligned with both stacks) */}
      {stageLabels.map((s, i) => (
        <text key={s} x={6} y={labelY(i) + 3} fontSize={9} fill="var(--text-secondary)">
          {s}
        </text>
      ))}

      {stacks.map(({ ox, driven, label }) => {
        // Alignment rails: connect each sheet corner up the exploded stack.
        const railTopOy = oyOf(4)
        const railBotOy = oyOf(0)
        const rails: [number, number][] = [
          [0, 0],
          [Ws, 0],
          [Ws, Hs],
          [0, Hs],
        ]
        return (
          <g key={label}>
            {/* rails behind everything */}
            {rails.map(([sx, sy], k) => {
              const [x1, y1] = proj(ox, railTopOy, sx, sy)
              const [x2, y2] = proj(ox, railBotOy, sx, sy)
              return (
                <line
                  key={`r${k}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--border)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                  opacity={0.6}
                />
              )
            })}

            {/* eye + light-path hint above the stack */}
            <text
              x={proj(ox, oyOf(4), Ws / 2, Hs / 2)[0]}
              y={oyOf(4) - 30}
              textAnchor="middle"
              fontSize={9.5}
              fill="var(--text-muted)"
            >
              ↑ your eye
            </text>

            {/* layer 0 — backlight (always on) */}
            <polygon points={sheetPoly(ox, oyOf(0))} fill={YELLOW} stroke="var(--border)" />
            {unpol(ox, oyOf(0))}

            {/* unpolarized still, entering the rear polarizer */}
            {unpol(ox, midOy(0))}

            {/* layer 1 — rear polarizer (transmission axis along sx) */}
            <polygon points={sheetPoly(ox, oyOf(1))} fill="var(--page-plane)" stroke="var(--border)" opacity={0.92} />
            {hatch(ox, oyOf(1), 'h')}

            {/* horizontally polarized above the rear polarizer (both states) */}
            {polArrow(ox, midOy(1), 'h', 'p1')}

            {/* layer 2 — the liquid crystal (where the drive voltage is applied) */}
            <polygon points={sheetPoly(ox, oyOf(2))} fill="var(--surface-1)" stroke="var(--border)" opacity={0.92} />
            {crystal(ox, oyOf(2), driven)}
            <text
              x={proj(ox, oyOf(2), Ws, Hs / 2)[0] + 12}
              y={proj(ox, oyOf(2), Ws, Hs / 2)[1] + 4}
              fontSize={11}
              fontWeight={700}
              fill="var(--text-primary)"
            >
              {label}
            </text>

            {/* rotated to vertical (driven) or unchanged (rest) above the crystal */}
            {polArrow(ox, midOy(2), driven ? 'v' : 'h', 'p2')}

            {/* layer 3 — front polarizer (crossed: transmission axis along sy) */}
            <polygon points={sheetPoly(ox, oyOf(3))} fill="var(--page-plane)" stroke="var(--border)" opacity={0.92} />
            {hatch(ox, oyOf(3), 'v')}

            {/* passes only when rotated to match the front polarizer */}
            {driven && polArrow(ox, midOy(3), 'v', 'p3')}

            {/* layer 4 — what you see */}
            <polygon points={sheetPoly(ox, oyOf(4))} fill={driven ? '#f7e7a3' : '#111318'} stroke="var(--border)" />
            <text
              x={proj(ox, oyOf(4), Ws / 2, Hs / 2)[0]}
              y={proj(ox, oyOf(4), Ws / 2, Hs / 2)[1] + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill={driven ? '#3a3a1a' : '#e5e7eb'}
            >
              {driven ? 'light' : 'black'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
