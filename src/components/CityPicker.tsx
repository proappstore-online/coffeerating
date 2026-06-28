import { CITIES } from '../shared'

export function CityPicker({ current, onPick, onClose }: { current: string | null; onPick: (id: string) => void; onClose?: () => void }) {
  return (
    <div className="max-w-md mx-auto space-y-4 py-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--ink)] display-font">Choose your city</h2>
        <p className="text-sm text-[var(--muted)]">CoffeeRating scopes ratings to one CBD. You can change it anytime.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CITIES.map((c) => (
          <button key={c.id} onClick={() => onPick(c.id)}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold text-left transition-colors ${current === c.id ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]' : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)]'}`}>
            {c.label}
          </button>
        ))}
      </div>
      {onClose && <button onClick={onClose} className="btn btn-secondary w-full">Cancel</button>}
    </div>
  )
}
