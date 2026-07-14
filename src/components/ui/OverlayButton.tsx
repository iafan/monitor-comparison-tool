import type { ButtonHTMLAttributes } from 'react'

/**
 * Interactive control overlaid on a canvas/scene — the translucent black pill
 * with a hover lift used for the 3D simulator's reset / center / full-screen
 * controls. Positioning and spacing (padding, gap, text size) come from the
 * caller via `className`. PointerDown is stopped from reaching a drag surface
 * underneath, then forwarded to any handler the caller passes.
 */
export function OverlayButton({
  className = '',
  onPointerDown,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.stopPropagation()
        onPointerDown?.(e)
      }}
      className={`flex cursor-pointer items-center rounded-md bg-black/55 text-white hover:bg-black/70 ${className}`}
      {...props}
    />
  )
}
