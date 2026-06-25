# Data Model

## Tables

### `cafes`
Stores known café locations. Populated via Google Places autocomplete. Admin-only manual additions.

```sql
CREATE TABLE cafes (
  id          TEXT PRIMARY KEY,        -- Google Place ID (or generated UUID for manual entries)
  name        TEXT NOT NULL,           -- Display name, e.g. "Stumptown Coffee Roasters"
  address     TEXT,                    -- Full address string from Places API
  lat         REAL NOT NULL,           -- Latitude (from Places API or app.maps.geocode)
  lng         REAL NOT NULL,           -- Longitude
  added_by    TEXT,                    -- user.id of who added (for manual entries)
  created_at  TEXT NOT NULL            -- ISO 8601 timestamp
);
```

### `ratings`
One row per submitted rating.

```sql
CREATE TABLE ratings (
  id              TEXT PRIMARY KEY,    -- UUID (generated client-side or via crypto.randomUUID())
  cafe_id         TEXT NOT NULL,       -- FK → cafes.id
  user_id         TEXT NOT NULL,       -- user.id (e.g. "gh:123") — NEVER shown publicly
  photo_key       TEXT NOT NULL,       -- R2 storage key, e.g. "ratings/{id}/photo.jpg"
  stars           INTEGER NOT NULL,    -- 1–5
  drink_desc      TEXT,                -- Free-text drink description (optional)
  review          TEXT,                -- Free-text review line (optional)
  created_at      TEXT NOT NULL        -- ISO 8601 timestamp
);
```

**Indexes (apply after migration):**
```sql
CREATE INDEX idx_ratings_cafe_id   ON ratings(cafe_id);
CREATE INDEX idx_ratings_created   ON ratings(created_at DESC);
CREATE INDEX idx_ratings_stars     ON ratings(stars DESC);
```

---

## Migrations

Use `app.db.migrate()` — migrations are `{ name: string; sql: string }[]`. Each runs once, in order, idempotently.

```ts
await app.db.migrate([
  {
    name: '0001_create_cafes',
    sql: `CREATE TABLE IF NOT EXISTS cafes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      added_by TEXT,
      created_at TEXT NOT NULL
    )`
  },
  {
    name: '0002_create_ratings',
    sql: `CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      cafe_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      photo_key TEXT NOT NULL,
      stars INTEGER NOT NULL,
      drink_desc TEXT,
      review TEXT,
      created_at TEXT NOT NULL
    )`
  },
  {
    name: '0003_indexes',
    sql: `CREATE INDEX IF NOT EXISTS idx_ratings_cafe_id ON ratings(cafe_id);
          CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_ratings_stars ON ratings(stars DESC)`
  }
]);
```

> **Note:** Migration object has ONLY `name` and `sql` — no `id`, `version`, `up`, or `down` fields.

---

## TypeScript Types

```ts
interface Cafe {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  added_by: string | null;
  created_at: string;
}

interface Rating {
  id: string;
  cafe_id: string;
  user_id: string;        // internal only — never render this
  photo_key: string;
  stars: number;          // 1–5
  drink_desc: string | null;
  review: string | null;
  created_at: string;
}

// Joined shape for display (query joins cafes)
interface RatingWithCafe extends Rating {
  cafe_name: string;
  cafe_lat: number;
  cafe_lng: number;
  cafe_address: string | null;
}
```

---

## Photo Storage

- **Upload path:** `ratings/{rating_id}/photo.jpg`
- **Upload method:** `app.storage.uploadPublic(path, file, 'image/jpeg')` → `{ key, url }`
- **Display method:** `app.storage.publicUrl(key)` → public URL for `<img src>`
- Photos are public (no auth required to view). This is correct — ratings are public.

---

## Anonymity Rule

`user_id` is stored in the `ratings` table for owner-moderation purposes **only**. It must **never** be included in any SELECT query that powers the public feed, rating cards, or map popups. Treat it like a server-side field.
