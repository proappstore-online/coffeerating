import { initPro } from '@proappstore/sdk'
import { useProAuth, useTheme } from '@proappstore/sdk/hooks'
import { Avatar, ThemeToggle, TextSizeToggle, ProProfilePage } from '@proappstore/sdk/ui'
import { useState, useEffect, useCallback } from 'react'
import { Settings } from 'lucide-react'

export const app = initPro({ appId: 'coffeerating' })

// ── Cities / CBDs (pick one — the whole app scopes to it) ─────
const CITIES: { id: string; label: string }[] = [
  { id: 'sydney', label: 'Sydney CBD' },
  { id: 'melbourne', label: 'Melbourne CBD' },
  { id: 'brisbane', label: 'Brisbane CBD' },
  { id: 'perth', label: 'Perth CBD' },
  { id: 'adelaide', label: 'Adelaide CBD' },
  { id: 'auckland', label: 'Auckland CBD' },
  { id: 'london', label: 'London' },
  { id: 'nyc', label: 'New York City' },
  { id: 'sf', label: 'San Francisco' },
  { id: 'seattle', label: 'Seattle' },
  { id: 'toronto', label: 'Toronto' },
  { id: 'singapore', label: 'Singapore' },
]
const cityLabel = (id: string | null) => CITIES.find((c) => c.id === id)?.label ?? 'Choose city'
const CITY_KEY = 'cr_city'

// ── Data model (cafes scoped by city, with address + coords) ──
const MIGRATIONS = [
  { name: '0001_create_cafes', sql: `CREATE TABLE IF NOT EXISTS cafes (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, lat REAL, lng REAL, created_at TEXT NOT NULL)` },
  { name: '0002_create_ratings', sql: `CREATE TABLE IF NOT EXISTS ratings (id TEXT PRIMARY KEY, cafe_id TEXT NOT NULL, user_id TEXT NOT NULL, photo_key TEXT NOT NULL, stars INTEGER NOT NULL, drink_desc TEXT, review TEXT, created_at TEXT NOT NULL)` },
  { name: '0003_add_cafe_city', sql: `ALTER TABLE cafes ADD COLUMN city TEXT` },
]

interface RatingRow {
  id: string; cafe_name: string; cafe_address: string | null; photo_key: string; stars: number
  drink_desc: string | null; review: string | null; created_at: string
}

type View = 'home' | 'submit' | 'profile' | 'settings'

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5" role={onChange ? 'radiogroup' : undefined} aria-label="Stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange?.(n)}
          className={`text-lg leading-none ${onChange ? 'cursor-pointer' : 'cursor-default'} ${n <= value ? 'text-amber-500' : 'text-[var(--line)]'}`}>★</button>
      ))}
    </div>
  )
}

function CityPicker({ current, onPick, onClose }: { current: string | null; onPick: (id: string) => void; onClose?: () => void }) {
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

// ── Café picker: choose an existing café or add a new one ─────
interface CafeOption { id?: string; name: string; isNew: boolean; address?: string | null; lat?: number | null; lng?: number | null }

function CafeSelect({ city, onSelect }: { city: string; onSelect: (c: CafeOption | null) => void }) {
  const [all, setAll] = useState<{ id: string; name: string; address: string | null }[]>([])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<CafeOption | null>(null)
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    setAll([]); setQ(''); setChosen(null); onSelect(null)
    app.db.query<{ id: string; name: string; address: string | null }>(
      'SELECT id, name, address FROM cafes WHERE city = ? ORDER BY name LIMIT 200', [city])
      .then((r) => setAll(r.rows)).catch(() => setAll([]))
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
    <div className="relative">
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

function Feed({ city }: { city: string }) {
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

function SubmitForm({ city, onDone }: { city: string; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [cafe, setCafe] = useState<CafeOption | null>(null)
  const [stars, setStars] = useState(0)
  const [drink, setDrink] = useState('')
  const [review, setReview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFile = (f: File | null) => { setFile(f); setPreview(f ? URL.createObjectURL(f) : null) }

  const submit = useCallback(async () => {
    if (!file) return setError('A photo is required.')
    if (!cafe) return setError('Pick or add a café.')
    if (stars < 1) return setError('Give it a star rating.')
    setSaving(true); setError(null)
    try {
      const id = crypto.randomUUID()
      const { key } = await app.storage.uploadUserPublic(`ratings/${id}/photo.jpg`, file, file.type || 'image/jpeg')
      let cafeId = cafe.id
      if (!cafeId) {
        cafeId = `${city}-${cafe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`
        await app.db.execute(
          'INSERT OR IGNORE INTO cafes (id, name, city, address, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [cafeId, cafe.name, city, cafe.address ?? null, cafe.lat ?? null, cafe.lng ?? null, new Date().toISOString()])
      }
      await app.db.execute(
        'INSERT INTO ratings (id, cafe_id, user_id, photo_key, stars, drink_desc, review, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, cafeId, app.auth.user?.id ?? 'anon', key, stars, drink.trim() || null, review.trim() || null, new Date().toISOString()])
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit. Try again.')
    } finally { setSaving(false) }
  }, [file, cafe, stars, drink, review, city, onDone])

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-[var(--ink)]">Rate a coffee <span className="text-sm font-normal text-[var(--muted)]">in {cityLabel(city)}</span></h2>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--ink)]">Photo</span>
        <div className="mt-1 rounded-xl border border-dashed border-[var(--line)] overflow-hidden">
          {preview ? <img src={preview} alt="preview" className="w-full aspect-[4/3] object-cover" />
            : <div className="aspect-[4/3] flex items-center justify-center text-[var(--muted)] text-sm">Tap to take a photo</div>}
          <input type="file" accept="image/*" capture="environment" aria-label="Coffee photo" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} className="block w-full text-xs p-2" />
        </div>
      </label>
      <div>
        <span className="text-sm font-semibold text-[var(--ink)]">Café</span>
        <div className="mt-1"><CafeSelect city={city} onSelect={setCafe} /></div>
      </div>
      <div><span className="text-sm font-semibold text-[var(--ink)]">Rating</span><div className="mt-1"><Stars value={stars} onChange={setStars} /></div></div>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--ink)]">Drink <span className="text-[var(--muted)] font-normal">(optional)</span></span>
        <input value={drink} onChange={(e) => setDrink(e.target.value)} placeholder="Oat flat white, extra hot"
          className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--ink)]">Review <span className="text-[var(--muted)] font-normal">(optional)</span></span>
        <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={2}
          className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]" />
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving} className="btn btn-primary flex-1 disabled:opacity-50">{saving ? 'Submitting…' : 'Submit'}</button>
        <button onClick={onDone} className="btn btn-secondary">Cancel</button>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useProAuth(app)
  const { theme } = useTheme()
  const [view, setView] = useState<View>('home')
  const [feedKey, setFeedKey] = useState(0)
  const [city, setCity] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  // app.db requires auth (the data worker rejects anonymous reads), so migrate
  // only once a user is signed in — the first signed-in visit creates the tables.
  useEffect(() => { if (user) app.db.migrate(MIGRATIONS).catch(() => {}) }, [user])
  useEffect(() => {
    const local = (() => { try { return localStorage.getItem(CITY_KEY) } catch { return null } })()
    if (local) setCity(local)
    if (user) app.kv.get<string>('city').then((v) => { if (v) setCity(v) }).catch(() => {})
  }, [user])

  const chooseCity = useCallback((id: string) => {
    setCity(id); setPicking(false)
    try { localStorage.setItem(CITY_KEY, id) } catch { /* private mode */ }
    if (user) app.kv.set('city', id).catch(() => {})
  }, [user])

  const needCity = !city || picking

  return (
    <div className="min-h-[100dvh] flex flex-col" data-theme={theme}>
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setView('home')} className="font-bold text-[var(--ink)] display-font">coffeerating</button>
            {city && (
              <button onClick={() => setPicking(true)} title="Change city"
                className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] rounded-full border border-[var(--line)] px-2 py-0.5 hover:border-[var(--accent)] whitespace-nowrap">
                📍 {cityLabel(city)}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? null : user ? (
              <>
                <button onClick={() => setView('settings')} aria-label="Settings" title="Settings" className="text-[var(--muted)] hover:text-[var(--ink)] p-1"><Settings size={18} /></button>
                <button onClick={() => setView('profile')} aria-label="Profile"><Avatar user={user} size={28} /></button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => app.auth.signIn('github')} className="btn btn-primary text-xs">Sign in</button>
                <button onClick={() => app.auth.signIn('google')} className="btn btn-secondary text-xs">Google</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {needCity ? (
          <CityPicker current={city} onPick={chooseCity} onClose={city ? () => setPicking(false) : undefined} />
        ) : view === 'home' ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--ink)] display-font">Coffee in {cityLabel(city)}</h1>
                <p className="text-sm text-[var(--muted)]">Anonymous photo + stars, in under 30 seconds.</p>
              </div>
              {user && <button onClick={() => setView('submit')} className="btn btn-primary whitespace-nowrap">Rate a coffee</button>}
            </div>
            {user ? (
              <Feed key={`${city}-${feedKey}`} city={city!} />
            ) : (
              <div className="text-center py-16 space-y-4">
                <p className="text-[var(--muted)]">Sign in to see and rate coffee in {cityLabel(city)}.</p>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => app.auth.signIn('github')} className="btn btn-primary">Sign in with GitHub</button>
                  <button onClick={() => app.auth.signIn('google')} className="btn btn-secondary">Google</button>
                </div>
                <p className="text-xs text-[var(--muted)]">Ratings are anonymous — your name is never shown.</p>
              </div>
            )}
          </div>
        ) : view === 'submit' ? (
          <SubmitForm city={city!} onDone={() => { setFeedKey((k) => k + 1); setView('home') }} />
        ) : view === 'profile' && user ? (
          <ProProfilePage app={app} />
        ) : view === 'settings' ? (
          <div className="max-w-md space-y-4">
            <h2 className="text-xl font-bold text-[var(--ink)]">Settings</h2>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--ink)]">City</span>
                <button onClick={() => setPicking(true)} className="text-sm font-semibold text-[var(--accent)]">{cityLabel(city)} · Change</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--ink)]">Theme</span><ThemeToggle />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--ink)]">Text size</span><TextSizeToggle />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
