# SDK Plan — Exact API Signatures

All from `@proappstore/sdk`. The build team must use these exact calls — do not invent variants.

---

## Initialisation

```ts
import { initPro, useProAuth, ProShell } from '@proappstore/sdk';

const app = initPro({ appId: 'coffeerating' });
```

---

## Auth

```ts
// Sign in (GitHub default, Google supported)
app.auth.signIn();           // GitHub
app.auth.signIn('google');   // Google
// NO 'apple' — fails tsc

app.auth.signOut();
app.auth.user  // { id: string; login: string; avatarUrl: string | null; dateOfBirth: string | null }
               // NO .name, NO .email — use user.login for display

// React hook
const { user, loading } = useProAuth(app);
```

---

## Database

```ts
// Query (always pass <T> to avoid unknown rows)
const { rows } = await app.db.query<Rating>(
  'SELECT * FROM ratings WHERE cafe_id = ? ORDER BY created_at DESC',
  [cafeId]
);

// Insert
const result = await app.db.execute(
  'INSERT INTO ratings (id, cafe_id, user_id, photo_key, stars, drink_desc, review, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  [id, cafeId, userId, photoKey, stars, drinkDesc, review, new Date().toISOString()]
);
// result.meta.last_row_id (snake_case), result.meta.changes — NO .rows on execute

// Delete (owner only)
await app.db.execute('DELETE FROM ratings WHERE id = ?', [ratingId]);

// Batch (transactional)
await app.db.batch([
  { sql: 'INSERT INTO cafes ...', params: [...] },
  { sql: 'INSERT INTO ratings ...', params: [...] }
]);

// Migrations (run once at app init)
await app.db.migrate([
  { name: '0001_create_cafes', sql: '...' },
  { name: '0002_create_ratings', sql: '...' }
  // ONLY name + sql — no id/version/up/down
]);
```

---

## Storage (Photos)

```ts
// Upload (public — ratings feed is public)
const { key, url } = await app.storage.uploadPublic(
  `ratings/${ratingId}/photo.jpg`,
  file,           // File | Blob
  'image/jpeg'
);

// Get URL for <img src>
const photoUrl = app.storage.publicUrl(photoKey);

// Delete (owner moderation)
await app.storage.delete(photoKey);

// List (admin view only)
const files = await app.storage.list();
// files[i].key  (NOT .name)  (no .url — use publicUrl)
// files[i].size
// files[i].uploaded
```

---

## Maps

```ts
// Geocode a search string
const results = await app.maps.geocode('Stumptown Coffee NYC');
// results[0] = { lat, lng, displayName, address, type, importance }
// Use .lat / .lng — NOT .latitude / .longitude

// Reverse geocode from GPS coords
const place = await app.maps.reverseGeocode(lat, lng);
// → { lat, lng, displayName, address }

// Embed map in iframe (map browse view)
const iframeSrc = app.maps.embedUrl(lat, lng);

// Static map image
const imgSrc = app.maps.staticUrl(lat, lng);
```

---

## Google Places Autocomplete

The native `app.maps` does not provide Places autocomplete. Use `app.proxy.fetch` to call the Google Places API — the API key is stored in the PAS vault (never in client code).

```ts
// Autocomplete request (store key as 'GOOGLE_PLACES_KEY' in PAS vault)
const res = await app.proxy.fetch(
  `maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=:GOOGLE_PLACES_KEY`
);
const data = await res.json();
// data.predictions[i] = { place_id, description, structured_formatting: { main_text, secondary_text } }

// Place Details (to get lat/lng for a selected prediction)
const detail = await app.proxy.fetch(
  `maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=:GOOGLE_PLACES_KEY`
);
const detailData = await detail.json();
// detailData.result.geometry.location = { lat, lng }
// detailData.result.name
// detailData.result.formatted_address
```

> The `:GOOGLE_PLACES_KEY` prefix tells PAS to inject the secret from the vault at request time — the key never reaches client code.

---

## Roles

```ts
// Check if current user is admin (for add-new-café gate)
const isAdmin = await app.roles.check('admin');

// Assign admin role (owner only)
await app.roles.assign(userId, 'admin');

// Revoke
await app.roles.revoke(userId, 'admin');

// Check current user's roles
const myRoles = await app.roles.myRoles(); // string[]

// List all role assignments (owner only)
const allRoles = await app.roles.listAll();
```

> `owner` role is auto-assigned to the app creator. Owner can delete any rating.

---

## ProShell / Navigation

CoffeeRating has its own primary navigation (Map / Feed / Submit tabs). Use `renderTopbar` to avoid stacking two navbars:

```tsx
<ProShell
  app={app}
  appName="CoffeeRating"
  renderTopbar={({ profileMenu, textSizeToggle }) => (
    <YourNav>
      {textSizeToggle}
      {profileMenu}
    </YourNav>
  )}
>
  {children}
</ProShell>
```

Or use `hideTopbar hideFooter` and compose SDK primitives directly.
