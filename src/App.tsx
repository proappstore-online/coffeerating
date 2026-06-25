import { initPro } from '@proappstore/sdk'
import { useProAuth, useTheme } from '@proappstore/sdk/hooks'
import { Avatar, ThemeToggle, ProProfilePage } from '@proappstore/sdk/ui'
import { useState, useEffect, useCallback } from 'react'

export const app = initPro({ appId: 'coffeerating' })

// ── Data model (see docs/data-model.md) ──────────────────────
const MIGRATIONS = [
  {
    name: '0001_create_cafes',
    sql: `CREATE TABLE IF NOT EXISTS cafes (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT,
      lat REAL, lng REAL, created_at TEXT NOT NULL
    )`,
  },
  {
    name: '0002_create_ratings',
    sql: `CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY, cafe_id TEXT NOT NULL, user_id TEXT NOT NULL,
      photo_key TEXT NOT NULL, stars INTEGER NOT NULL,
      drink_desc TEXT, review TEXT, created_at TEXT NOT NULL
    )`,
  },
]

interface RatingRow {
  id: string
  cafe_name: string
  photo_key: string
  stars: number
  drink_desc: string | null
  review: string | null
  created_at: string
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
        <button
          key={n}
          type="button"
          disabled={!onChange}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange?.(n)}
          className={`text-lg leading-none ${onChange ? 'cursor-pointer' : 'cursor-default'} ${n <= value ? 'text-amber-500' : 'text-[var(--line)]'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function Feed() {
  const [rows, setRows] = useState<RatingRow[] | null>(null)
  const [sort, setSort] = useState<'recent' | 'top'>('recent')

  useEffect(() => {
    let cancelled = false
    const order = sort === 'top' ? 'r.stars DESC, r.created_at DESC' : 'r.created_at DESC'
    app.db
      .query<RatingRow>(
        `SELECT r.id, c.name AS cafe_name, r.photo_key, r.stars, r.drink_desc, r.review, r.created_at
         FROM ratings r JOIN cafes c ON c.id = r.cafe_id
         ORDER BY ${order} LIMIT 50`,
      )
      .then((res) => { if (!cancelled) setRows(res.rows) })
      .catch(() => { if (!cancelled) setRows([]) })
    return () => { cancelled = true }
  }, [sort])

  if (rows === null) return <p className="text-center text-[var(--muted)] py-12">Loading ratings…</p>
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">No ratings yet</p>
        <p className="text-sm mt-1">Be the first — rate a coffee.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">
        {(['recent', 'top'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-2.5 py-1 rounded-full font-semibold ${sort === s ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] border border-[var(--line)]'}`}
          >
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
              {r.drink_desc && <p className="text-xs text-[var(--muted)]">{r.drink_desc}</p>}
              {r.review && <p className="text-sm text-[var(--ink)]">{r.review}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function SubmitForm({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [cafe, setCafe] = useState('')
  const [stars, setStars] = useState(0)
  const [drink, setDrink] = useState('')
  const [review, setReview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFile = (f: File | null) => {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const submit = useCallback(async () => {
    if (!file) return setError('A photo is required.')
    if (!cafe.trim()) return setError('Pick a café.')
    if (stars < 1) return setError('Give it a star rating.')
    setSaving(true)
    setError(null)
    try {
      const id = crypto.randomUUID()
      const { key } = await app.storage.uploadPublic(`ratings/${id}/photo.jpg`, file, file.type || 'image/jpeg')
      const cafeId = cafe.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) || crypto.randomUUID()
      const now = new Date().toISOString()
      await app.db.execute(
        'INSERT OR IGNORE INTO cafes (id, name, created_at) VALUES (?, ?, ?)',
        [cafeId, cafe.trim(), now],
      )
      await app.db.execute(
        'INSERT INTO ratings (id, cafe_id, user_id, photo_key, stars, drink_desc, review, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, cafeId, app.auth.user?.id ?? 'anon', key, stars, drink.trim() || null, review.trim() || null, now],
      )
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit. Try again.')
    } finally {
      setSaving(false)
    }
  }, [file, cafe, stars, drink, review, onDone])

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-[var(--ink)]">Rate a coffee</h2>

      <label className="block">
        <span className="text-sm font-semibold text-[var(--ink)]">Photo</span>
        <div className="mt-1 rounded-xl border border-dashed border-[var(--line)] overflow-hidden">
          {preview ? (
            <img src={preview} alt="preview" className="w-full aspect-[4/3] object-cover" />
          ) : (
            <div className="aspect-[4/3] flex items-center justify-center text-[var(--muted)] text-sm">Tap to take a photo</div>
          )}
          <input type="file" accept="image/*" capture="environment" aria-label="Coffee photo" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} className="block w-full text-xs p-2" />
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-[var(--ink)]">Café</span>
        <input value={cafe} onChange={(e) => setCafe(e.target.value)} placeholder="e.g. Blue Bottle, Hayes Valley"
          className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]" />
      </label>

      <div>
        <span className="text-sm font-semibold text-[var(--ink)]">Rating</span>
        <div className="mt-1"><Stars value={stars} onChange={setStars} /></div>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-[var(--ink)]">Drink <span className="text-[var(--muted)] font-normal">(optional)</span></span>
        <input value={drink} onChange={(e) => setDrink(e.target.value)} placeholder="Oat latte, extra hot, Blue Bottle beans"
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
  const { user, loading, signOut } = useProAuth(app)
  const { theme } = useTheme()
  const [view, setView] = useState<View>('home')
  const [feedKey, setFeedKey] = useState(0)

  useEffect(() => { app.db.migrate(MIGRATIONS).catch(() => {}) }, [])

  return (
    <div className="min-h-[100dvh] flex flex-col" data-theme={theme}>
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => setView('home')} className="font-bold text-[var(--ink)] display-font">coffeerating</button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? null : user ? (
              <>
                <button onClick={() => setView('settings')} className="text-xs text-[var(--muted)] hover:text-[var(--ink)]">Settings</button>
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
        {view === 'home' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--ink)] display-font">Anonymous coffee ratings</h1>
                <p className="text-sm text-[var(--muted)]">Photo + stars + café, in under 30 seconds. No public profiles.</p>
              </div>
              {user && <button onClick={() => setView('submit')} className="btn btn-primary whitespace-nowrap">Rate a coffee</button>}
            </div>
            {!user && (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
                <button onClick={() => app.auth.signIn('github')} className="text-[var(--accent)] font-semibold">Sign in</button> to rate a coffee. Browsing is open to everyone.
              </div>
            )}
            <Feed key={feedKey} />
          </div>
        )}
        {view === 'submit' && <SubmitForm onDone={() => { setFeedKey((k) => k + 1); setView('home') }} />}
        {view === 'profile' && user && <ProProfilePage app={app} user={user} onSignOut={signOut} onBack={() => setView('home')} />}
        {view === 'settings' && (
          <div className="max-w-md space-y-4">
            <h2 className="text-xl font-bold text-[var(--ink)]">Settings</h2>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 flex items-center justify-between">
              <span className="text-sm text-[var(--ink)]">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
