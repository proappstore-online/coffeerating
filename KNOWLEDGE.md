# CoffeeRating — Knowledge Base

> **Ground truth for the entire team.** The build team builds against this. Do not invent APIs or change decisions without updating this file first.

---

## 1. What is CoffeeRating?

CoffeeRating is an **anonymous, photo-first coffee rating app**. A user walks into a café, orders a coffee, takes a photo of it, picks the café from autocomplete, gives it 1–5 stars, optionally describes the drink in exact detail (bean brand, milk brand, temperature, etc.) and optionally writes a review line — then hits Submit.

The whole flow targets **under 30 seconds** from open to submitted.

Ratings are **publicly browsable** — map view (pins per café) and feed/list view (recency or top-rated) — but the **rater's identity is never shown** anywhere in the public UI.

---

## 2. Target Users

- Casual coffee drinkers and enthusiasts who visit cafés and want to log or share their experience **without social-media identity friction**.
- Anyone who wants to consult a crowd-sourced quality map before choosing a café.
- Primary demographic: 18–35, specialty-coffee aware, mobile-first.

---

## 3. Core Flows

### 3.1 Submit a Rating
1. User opens app (must be signed in to submit — GitHub or Google OAuth via PAS).
2. Tap **"Rate a Coffee"**.
3. **Capture or upload a photo** (required — cannot submit without it).
4. **Select a café** — Google Places autocomplete populates suggestions. Admin-only: add a new café not found in autocomplete.
5. **Star score 1–5** (required).
6. **Drink description** (optional free-text) — user types exactly what they ordered: e.g. "Oat Latte, Oatly milk, extra hot, Blue Bottle beans".
7. **Review line** (optional free-text, no character limit).
8. Tap **Submit** → photo uploaded to R2, rating row written to DB.

### 3.2 Browse Ratings — Map View
- Embedded map (PAS `app.maps.embedUrl`) showing a pin per café.
- Tap a pin → see ratings for that café (photos, stars, drink descriptions, timestamps).
- Rater identity never shown.

### 3.3 Browse Ratings — Feed View
- Scrollable card list, sortable by **Most Recent** or **Top Rated**.
- Each card shows: coffee photo, star score, drink description, review line, café name, timestamp.
- No rater identity shown.

### 3.4 Owner Moderation
- Only the app owner (auto-assigned `owner` role by PAS) can delete a rating.
- No moderator role in v1. No user-facing report/flag feature.

---

## 4. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Browse modes | Map + Feed (both) | Maximum discoverability |
| Location input | Google Places autocomplete | Precise, named cafés |
| Add new café | Admin-role only | Prevent spam/duplicates |
| GPS enforcement | No hard distance limit | User selects from autocomplete |
| Coffee tags | Free-text (no fixed list) | Users describe exact drink ordered |
| Review line | Free-text, no char limit | Owner's request |
| Photo | Required | Core "photo-first" identity |
| Location | Required | Core pinning feature |
| Star score | Required (1–5) | Core rating feature |
| Rater identity | Never shown publicly | Anonymity is the whole point |
| Sign-in required to post | Yes (GitHub or Google) | Prevents spam |
| Moderation | Owner-only delete | Keep v1 simple |
| SDK tier | Pro | Needs DB + Storage + Maps |

---

## 5. What We Do NOT Build (v1)

- No public user profiles or social graph.
- No followers, likes, or comments.
- No moderator role or user-facing report/flag.
- No hard GPS distance enforcement.
- No fixed coffee-type tag dropdown.
- No SMS or push notifications.
- No subscription/paywall on the user side.

---

## 6. Competitive Position

See `docs/market.md` for full analysis. Summary: every major competitor (Beanhunter, Kava, Tasting Grounds, Coffunity, Good Fika) requires social identity — public profiles, followers, or curated shop listings. **CoffeeRating's gap:** zero social graph, zero public identity, photo + stars + location in under 30 seconds.

---

## 7. SDK Tier & Platform

- **Platform:** ProAppStore (PAS) — React + TypeScript + Vite + Tailwind, deployed on Cloudflare.
- **SDK:** `@proappstore/sdk` (Pro tier). Import: `import { initPro } from '@proappstore/sdk'`.
- **Tier required:** Pro (uses `app.db`, `app.storage`, `app.maps`, `app.proxy.fetch`).

See `docs/sdk-plan.md` for exact API signatures.

---

## 8. Linked Docs

| File | Contents |
|---|---|
| `docs/data-model.md` | DB schema, migrations, field types |
| `docs/sdk-plan.md` | Exact PAS SDK calls the app uses |
| `docs/design.md` | UI layout, design system, component conventions |
| `docs/market.md` | Market size, competitors, positioning |
| `docs/quality.md` | Quality bar, testing requirements, definition of done |
