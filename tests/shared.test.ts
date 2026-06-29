import { describe, it, expect, vi } from 'vitest'

vi.mock('@proappstore/sdk', () => ({
  initPro: () => ({}),
}))

import { timeAgo, cityLabel, CITIES, CITY_KEY, MIGRATIONS } from '../src/shared'

describe('timeAgo', () => {
  it('returns "just now" for timestamps less than 60s ago', () => {
    const now = new Date().toISOString()
    expect(timeAgo(now)).toBe('just now')
  })

  it('returns minutes for timestamps less than 1h ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(timeAgo(fiveMinAgo)).toBe('5m ago')
  })

  it('returns hours for timestamps less than 24h ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    expect(timeAgo(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days for timestamps older than 24h', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString()
    expect(timeAgo(twoDaysAgo)).toBe('2d ago')
  })
})

describe('cityLabel', () => {
  it('returns the label for a known city id', () => {
    expect(cityLabel('sydney')).toBe('Sydney CBD')
    expect(cityLabel('nyc')).toBe('New York City')
  })

  it('returns "Choose city" for null', () => {
    expect(cityLabel(null)).toBe('Choose city')
  })

  it('returns "Choose city" for unknown id', () => {
    expect(cityLabel('mars')).toBe('Choose city')
  })
})

describe('CITIES', () => {
  it('has 12 entries', () => {
    expect(CITIES).toHaveLength(12)
  })

  it('each entry has id and label', () => {
    for (const c of CITIES) {
      expect(c.id).toBeTruthy()
      expect(c.label).toBeTruthy()
    }
  })
})

describe('CITY_KEY', () => {
  it('is cr_city', () => {
    expect(CITY_KEY).toBe('cr_city')
  })
})

describe('MIGRATIONS', () => {
  it('has 3 migrations in order', () => {
    expect(MIGRATIONS).toHaveLength(3)
    expect(MIGRATIONS[0].name).toBe('0001_create_cafes')
    expect(MIGRATIONS[1].name).toBe('0002_create_ratings')
    expect(MIGRATIONS[2].name).toBe('0003_add_cafe_city')
  })

  it('each migration has name and sql', () => {
    for (const m of MIGRATIONS) {
      expect(m.name).toBeTruthy()
      expect(m.sql).toBeTruthy()
    }
  })
})
