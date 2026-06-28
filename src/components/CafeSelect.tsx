import { useState, useEffect, useRef } from 'react'
import { app, cityLabel, type CafeOption } from '../shared'

export function CafeSelect({ city, onSelect }: { city: string; onSelect: (c: CafeOption | null) => void }) {
  const [all, setAll] = useState<{ id: string; name: string; address: string | null }[]>([])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<CafeOption | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setAll([]); setQ(''); setChosen(null); onSelect(null)
    app.db.query<{ id: string; name: string; address: string | null }>(
      'SELECT id, name, address FROM cafes WHERE city = ? ORDER BY name LIMIT 200', [city])
      .then((r) => setAll(r.rows)).catch(() => setAll([]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city])

  const ql = q.trim().toLowerCase()
  const matches = ql ? all.filter((c) => c.name.toLowerCase().includes(ql)) : all.slice(0, 8)
  const exact = all.some((c) => c.name.toLowerCase() === ql)

  const pickExisting = (c: { id: string; name: string; address: string | null }) => {
    const opt: CafeOption = { id: c.id, name: c.name, isNew: false, address: c.address }
    setChosen(opt); setQ(c.name); setOpen(false); onSelect(opt)
  }

  const addNew = async () => {
    const name = q.trim(); if (!name) return
    setOpen(false); setGeocoding(true)
    let address: string | null = null, lat: number | null = null, lng: number | null = null
    try {
      const g = await app.maps.geocode(`${name}, ${cityLabel(city)}`)
      if (g[0]) { address = g[0].displayName ?? null; lat = g[0].lat; lng = g[0].lng }
    } catch { /* geocode best-effort */ }
    setGeocoding(false)
    const opt: CafeOption = { name, isNew: true, address, lat, lng }
    setChosen(opt); onSelect(opt)
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); if (chosen) { setChosen(null); onSelect(null) } }}
        onFocus={() => setOpen(true)} placeholder="Search or add a café" aria-label="Café"
        className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]" />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] shadow-lg max-h-56 overflow-y-auto">
          {matches.map((c) => (
            <button key={c.id} type="button" onClick={() => pickExisting(c)} className="block w-full text-left px-3 py-2 hover:bg-[var(--panel)]">
              <span className="text-sm text-[var(--ink)] font-medium">{c.name}</span>
              {c.address && <span className="block text-[11px] text-[var(--muted)] truncate">{c.address}</span>}
            </button>
          ))}
          {ql && !exact && (
            <button type="button" onClick={addNew} className="block w-full text-left px-3 py-2 text-sm text-[var(--accent)] font-semibold hover:bg-[var(--panel)] border-t border-[var(--line)]">
              ➕ Add "{q.trim()}" — looks up its address
            </button>
          )}
          {!ql && matches.length === 0 && <div className="px-3 py-2 text-xs text-[var(--muted)]">No cafés yet — type a name to add one.</div>}
        </div>
      )}
      {geocoding && <p className="mt-1 text-xs text-[var(--muted)]">Looking up the address…</p>}
      {chosen?.address && <p className="mt-1 text-xs text-[var(--muted)]">📍 {chosen.address}</p>}
      {chosen?.isNew && !chosen.address && !geocoding && <p className="mt-1 text-xs text-[var(--muted)]">New café (address not found — saved by name).</p>}
    </div>
  )
}
