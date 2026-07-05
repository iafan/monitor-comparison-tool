import { ALIGN_LABELS, ALIGNMENTS, TOPVIEW_ALIGN_LABELS, TOPVIEW_ALIGNS } from '../constants'
import type { Alignment, TopViewAlign } from '../types'

interface Props {
  value: Alignment
  onChange: (alignment: Alignment) => void
  /** Top-view vertical alignment; the strip only renders when showTopView is true. */
  topViewAlign: TopViewAlign
  onTopViewAlignChange: (align: TopViewAlign) => void
  showTopView: boolean
}

type Horizontal = 'left' | 'center' | 'right'
type Vertical = 'top' | 'center' | 'bottom'

/** Stemless arrowhead pointing in direction (dx, dy) from a center point. */
function trianglePoints(cx: number, cy: number, dx: number, dy: number, size: number): string {
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux
  const tip = `${cx + ux * size},${cy + uy * size}`
  const baseX = cx - ux * size * 0.5
  const baseY = cy - uy * size * 0.5
  const b1 = `${baseX + px * size * 0.85},${baseY + py * size * 0.85}`
  const b2 = `${baseX - px * size * 0.85},${baseY - py * size * 0.85}`
  return `${tip} ${b1} ${b2}`
}

function diamondPoints(cx: number, cy: number, r: number): string {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`
}

const hRange = (h: Horizontal): [number, number] =>
  h === 'left' ? [5, 13] : h === 'right' ? [11, 19] : [7, 17]
const vRange = (v: Vertical): [number, number] =>
  v === 'top' ? [5, 13] : v === 'bottom' ? [11, 19] : [7, 17]

const tickProps = {
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
}

/** 9-point front-view icon: edge/corner lines for the anchored sides + a direction arrow. */
function FrontIcon({ align }: { align: Alignment }) {
  const [v, h] = (align === 'center' ? ['center', 'center'] : align.split('-')) as [
    Vertical,
    Horizontal,
  ]
  const dx = h === 'left' ? -1 : h === 'right' ? 1 : 0
  const dy = v === 'top' ? -1 : v === 'bottom' ? 1 : 0
  const [hx1, hx2] = hRange(h)
  const [vy1, vy2] = vRange(v)

  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      {v === 'top' && <line x1={hx1} y1={5} x2={hx2} y2={5} {...tickProps} />}
      {v === 'bottom' && <line x1={hx1} y1={19} x2={hx2} y2={19} {...tickProps} />}
      {h === 'left' && <line x1={5} y1={vy1} x2={5} y2={vy2} {...tickProps} />}
      {h === 'right' && <line x1={19} y1={vy1} x2={19} y2={vy2} {...tickProps} />}
      {dx === 0 && dy === 0 ? (
        <polygon points={diamondPoints(12, 12, 3.2)} fill="currentColor" />
      ) : (
        <polygon points={trianglePoints(12, 12, dx, dy, 5)} fill="currentColor" />
      )}
    </svg>
  )
}

/** Top-view icon: a horizontal reference line at back/center/front + a direction arrow. */
function TopIcon({ pos }: { pos: TopViewAlign }) {
  const y = pos === 'back' ? 6 : pos === 'front' ? 18 : 12
  const dy = pos === 'back' ? -1 : pos === 'front' ? 1 : 0

  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <line x1={6} y1={y} x2={18} y2={y} {...tickProps} />
      {dy === 0 ? (
        <polygon points={diamondPoints(12, 12, 3.2)} fill="currentColor" />
      ) : (
        <polygon points={trianglePoints(12, 12, 0, dy, 5)} fill="currentColor" />
      )}
    </svg>
  )
}

const cellBase =
  'flex aspect-square min-h-11 cursor-pointer items-center justify-center rounded-md border'
const cellSelected = 'border-[var(--series-1)] bg-[var(--series-1)] text-white'
const cellIdle = 'border-[var(--border)] bg-[var(--page-plane)] text-[var(--text-muted)]'

export function AlignmentPicker({
  value,
  onChange,
  topViewAlign,
  onTopViewAlignChange,
  showTopView,
}: Props) {
  return (
    <section className="mb-6">
      <h2 className="mb-2.5 text-base font-semibold text-[var(--text-secondary)]">View alignment</h2>
      <div className="flex flex-wrap items-start gap-4">
        <div>
          {showTopView && <p className="mb-1 text-xs text-[var(--text-muted)]">Front</p>}
          <div
            className="grid max-w-[180px] grid-cols-3 gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-1)] p-2.5"
            role="group"
            aria-label="Front view alignment"
          >
            {ALIGNMENTS.map((key) => {
              const selected = key === value
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(key)}
                  aria-label={ALIGN_LABELS[key]}
                  aria-pressed={selected}
                  className={`${cellBase} ${selected ? cellSelected : cellIdle}`}
                >
                  <FrontIcon align={key} />
                </button>
              )
            })}
          </div>
        </div>

        {showTopView && (
          <div>
            <p className="mb-1 text-xs text-[var(--text-muted)]">Top</p>
            <div
              className="flex flex-col gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-1)] p-2.5"
              role="group"
              aria-label="Top view alignment"
            >
              {TOPVIEW_ALIGNS.map((key) => {
                const selected = key === topViewAlign
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onTopViewAlignChange(key)}
                    aria-label={TOPVIEW_ALIGN_LABELS[key]}
                    aria-pressed={selected}
                    className={`${cellBase} w-11 ${selected ? cellSelected : cellIdle}`}
                  >
                    <TopIcon pos={key} />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
