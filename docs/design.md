# Design Guide

## Principles

1. **Speed over features** — the submit flow must feel instant. No friction, no multi-step wizards.
2. **Photo-first** — the coffee photo is the hero element on every rating card.
3. **Anonymous by default** — never show a username, avatar, or any rater identity in the public UI.
4. **Mobile-first** — primary use case is someone sitting in a café on their phone.

---

## Layout

### App Shell
- Use `ProShell` with `renderTopbar` to inject the app's own nav bar.
- Bottom tab bar (mobile-first): **Map** | **Feed** | **＋ Rate** | (Profile via ProShell menu).
- The **＋ Rate** tab is the primary CTA — always visible.

### Map View
- Full-width iframe embed via `app.maps.embedUrl(lat, lng)` per café pin.
- Tap a pin → bottom sheet / modal with café name + aggregate star average + list of rating cards.
- Rating cards: photo thumbnail, stars, drink_desc, review, timestamp. NO username.

### Feed View
- Scrollable card list.
- Sort toggle: **Recent** | **Top Rated**.
- Each card: large coffee photo (hero), star score (★★★★☆), drink description, review line, café name + address, relative timestamp ("2 hours ago").
- NO username, NO avatar.

### Submit Flow
- Step 1: Photo — large camera/upload button fills the screen. Cannot proceed without photo.
- Step 2: Café — search input with Google Places autocomplete dropdown. Admin users see "+ Add new café" option.
- Step 3: Stars — large tap-friendly 1–5 star selector.
- Step 4: Details — free-text drink description input ("What did you order? e.g. Oat Latte, Oatly milk, extra hot") + free-text review input ("Add a note...").
- Step 5: Submit button → loading state → success confirmation.

---

## Design System (PAS CSS Variables)

```css
--paper        /* page background */
--ink          /* primary text */
--muted        /* secondary text */
--accent       /* brand colour — CTAs, active stars */
--line         /* borders */
--panel        /* card background */
--error        /* validation errors */
--success      /* success states */
```

### Components to use

| Need | Class / Component |
|---|---|
| Rating card | `.card` |
| Submit button | `.btn .btn-primary` |
| Secondary actions | `.btn .btn-secondary` |
| Ghost/text actions | `.btn .btn-ghost` |
| Text inputs | `.input` |
| Star badge | `.badge .badge-accent` |
| Empty feed state | `.empty-state` |
| Headings | `.display-font` (Fraunces serif) |
| Body | Manrope (default) |

### Stars
- Use filled/empty star SVGs coloured with `var(--accent)` for filled, `var(--muted)` for empty.
- Stars must be tap-friendly (min 44×44px touch target) on mobile.

---

## Anonymity Rules (UI)

- **Never** render `user.id`, `user.login`, or any rater identifier in:
  - Rating cards (map or feed)
  - Café detail popups
  - Any public-facing component
- The only place `user.login` may appear is the signed-in user's own profile menu (via ProShell).

---

## Dark Mode

Automatic via CSS custom properties — no extra work needed. All colour usage must go through `var(--...)` tokens, never hardcoded hex.
