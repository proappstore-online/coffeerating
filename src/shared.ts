import { initPro } from '@proappstore/sdk'

export const app = initPro({ appId: 'coffeerating' })

export const CITIES: { id: string; label: string }[] = [
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

export const cityLabel = (id: string | null) => CITIES.find((c) => c.id === id)?.label ?? 'Choose city'

export const CITY_KEY = 'cr_city'

export const COFFEE_TYPES = [
  'Espresso', 'Latte', 'Cappuccino', 'Flat White', 'Americano',
  'Macchiato', 'Cold Brew', 'Mocha', 'Cortado', 'Other',
] as const

export const MIGRATIONS = [
  { name: '0001_create_cafes', sql: `CREATE TABLE IF NOT EXISTS cafes (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, lat REAL, lng REAL, created_at TEXT NOT NULL)` },
  { name: '0002_create_ratings', sql: `CREATE TABLE IF NOT EXISTS ratings (id TEXT PRIMARY KEY, cafe_id TEXT NOT NULL, user_id TEXT NOT NULL, photo_key TEXT NOT NULL, stars INTEGER NOT NULL, drink_desc TEXT, review TEXT, created_at TEXT NOT NULL)` },
  { name: '0003_add_cafe_city', sql: `ALTER TABLE cafes ADD COLUMN city TEXT` },
  { name: '0004_add_coffee_type', sql: `ALTER TABLE ratings ADD COLUMN coffee_type TEXT` },
  { name: '0005_add_milk_type', sql: `ALTER TABLE ratings ADD COLUMN milk_type TEXT` },
]

export interface RatingRow {
  id: string; cafe_name: string; cafe_address: string | null; photo_key: string; stars: number
  drink_desc: string | null; review: string | null; coffee_type: string | null; milk_type: string | null; created_at: string
}

export interface CafeOption {
  id?: string; name: string; isNew: boolean; address?: string | null; lat?: number | null; lng?: number | null
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
