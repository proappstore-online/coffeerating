import { useProAuth, useTheme } from '@proappstore/sdk/hooks'
import { Avatar, ThemeToggle, TextSizeToggle, ProProfilePage } from '@proappstore/sdk/ui'
import { useState, useEffect, useCallback } from 'react'
import { Settings } from 'lucide-react'
import { app, cityLabel, CITY_KEY, MIGRATIONS } from './shared'
import { CityPicker } from './components/CityPicker'
import { Feed } from './components/Feed'
import { SubmitForm } from './components/SubmitForm'

type View = 'home' | 'submit' | 'profile' | 'settings'

export default function App() {
  const { user, loading } = useProAuth(app)
  const { theme } = useTheme()
  const [view, setView] = useState<View>('home')
  const [feedKey, setFeedKey] = useState(0)
  const [city, setCity] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

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
            <Feed key={`${city}-${feedKey}`} city={city!} />
          </div>
        ) : view === 'submit' ? (
          <SubmitForm city={city!} onDone={() => { setFeedKey((k) => k + 1); setView('home') }} />
        ) : view === 'profile' && user ? (
          <ProProfilePage app={app} showThemeToggle={false} />
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
