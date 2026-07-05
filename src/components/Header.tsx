interface Props {
  onAdd: () => void
}

export function Header({ onAdd }: Props) {
  return (
    <header className="mb-4 flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={onAdd}
        className="min-h-11 cursor-pointer rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white"
      >
        + Add monitor
      </button>
    </header>
  )
}
