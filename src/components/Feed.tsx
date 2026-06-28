import { useState, useEffect } from 'react'
import { app, cityLabel, timeAgo, type RatingRow } from '../shared'
import { Stars } from './Stars'

export function Feed({ city }: { city: string }) {
  const [rows, setRows] = useState<RatingRow[] | null>(null)
  const [sort, setSort] = useState<'recent' | 'top'>('recent')

  useEffect(() => {
    let cancelled = false
    setRows(null)
    const order = sort === 'top' ? 'r.stars DESC, r.created_at DESC' : 'r.created_at DESC'
    app.db.query<RatingRow>(
      `SELECT r.id, c.name AS cafe_name, c.address AS cafe_address, r.photo_key, r.stars, r.drink_desc, r.review, r.created_at
       FROM ratings r JOIN cafes c ON c.id = r.cafe_id
       WHERE c.city = ? ORDER BY ${order} LIMIT 50`, [city])
      .then((res) => { if (!cancelled) setRows(res.rows) })
      .catch(() => { if (!cancelled) setRows([]) })
    return () => { cancelled = true }
  }, [sort, city])

  if (rows === null) return <p className="text-center text-[var(--muted)] py-12">Loading ratings…</p>
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">No ratings in {cityLabel(city)} yet</p>
        <p className="text-sm mt-1">Be the first — rate a coffee.</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">
        {(['recent', 'top'] as const).map((s) => (
          <button key={s} onClick={() => setSort(s)}
            className={`px-2.5 py-1 rounded-full font-semibold ${sort === s ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] border border-[var(--line)]'}`}>
            {s === 'recent' ? 'Most recent' : 'Top rated'}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((r) => (
          <article key={r.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden">
            <img src={app.storage.publicUrl(r.photo_key)} alt="" className="w-full aspect-[4/3] object-cover bg-[var(--line)]" loading="lazy" />
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <Stars value={r.stars} />
                <span className="text-[11px] text-[var(--muted)]">{timeAgo(r.created_at)}</span>
              </div>
              <p className="font-semibold text-[var(--ink)] text-sm">{r.cafe_name}</p>
              {r.cafe_address && <p className="text-[11px] text-[var(--muted)] truncate">📍 {r.cafe_address}</p>}
              {r.drink_desc && <p className="text-xs text-[var(--muted)]">{r.drink_desc}</p>}
              {r.review && <p className="text-sm text-[var(--ink)]">{r.review}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
