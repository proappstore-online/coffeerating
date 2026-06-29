import { useState, useCallback } from 'react'
import { app, cityLabel, COFFEE_TYPES, type CafeOption } from '../shared'
import { Stars } from './Stars'
import { CafeSelect } from './CafeSelect'

export function SubmitForm({ city, onDone }: { city: string; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [cafe, setCafe] = useState<CafeOption | null>(null)
  const [stars, setStars] = useState(0)
  const [coffeeType, setCoffeeType] = useState('')
  const [milkType, setMilkType] = useState('')
  const [drink, setDrink] = useState('')
  const [review, setReview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFile = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(f); setPreview(f ? URL.createObjectURL(f) : null)
  }

  const submit = useCallback(async () => {
    if (!file) return setError('A photo is required.')
    if (!cafe) return setError('Pick or add a café.')
    if (stars < 1) return setError('Give it a star rating.')
    if (!coffeeType) return setError('Pick a coffee type.')
    setSaving(true); setError(null)
    try {
      const id = crypto.randomUUID()
      const { key } = await app.storage.uploadUserPublic(`ratings/${id}/photo.jpg`, file, file.type || 'image/jpeg')
      let cafeId = cafe.id
      if (!cafeId) {
        cafeId = `${city}-${cafe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)}`
        await app.db.execute(
          'INSERT OR IGNORE INTO cafes (id, name, city, address, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [cafeId, cafe.name, city, cafe.address ?? null, cafe.lat ?? null, cafe.lng ?? null, new Date().toISOString()])
      }
      await app.db.execute(
        'INSERT INTO ratings (id, cafe_id, user_id, photo_key, stars, drink_desc, review, coffee_type, milk_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, cafeId, app.auth.user?.id ?? 'anon', key, stars, drink.trim() || null, review.trim() || null, coffeeType, milkType || null, new Date().toISOString()])
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit. Try again.')
    } finally { setSaving(false) }
  }, [file, cafe, stars, coffeeType, milkType, drink, review, city, onDone])

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
      <div>
        <span className="text-sm font-semibold text-[var(--ink)]">Coffee type</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {COFFEE_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setCoffeeType(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${coffeeType === t ? 'bg-[var(--accent)] text-white' : 'border border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="text-sm font-semibold text-[var(--ink)]">Milk type <span className="text-[var(--muted)] font-normal">(optional)</span></span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {(['Full Cream', 'Skim', 'Oat', 'Almond', 'Soy', 'Coconut', 'Black (no milk)'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setMilkType(milkType === t ? '' : t)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${milkType === t ? 'bg-[var(--accent)] text-white' : 'border border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
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
