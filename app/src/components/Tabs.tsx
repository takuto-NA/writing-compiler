export type TabItem<T extends string> = {
  value: T
  label: string
  disabled?: boolean
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T
  onChange: (v: T) => void
  items: Array<TabItem<T>>
}) {
  return (
    <div
      className="inline-flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1"
      role="tablist"
    >
      {items.map((it) => {
        const active = it.value === value
        const base =
          'rounded-md px-3 py-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
        const state = active
          ? 'bg-indigo-600 text-white'
          : 'bg-transparent text-zinc-300 hover:bg-zinc-900'
        const disabled = it.disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''

        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-disabled={Boolean(it.disabled)}
            disabled={Boolean(it.disabled)}
            className={`${base} ${state} ${disabled}`}
            onClick={() => {
              if (it.disabled) return
              onChange(it.value)
            }}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

