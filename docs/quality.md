# Quality Bar & Definition of Done

## Core Quality Rules

1. **TypeScript must compile with zero errors** (`tsc --noEmit`). No `any` casts without a comment explaining why.
2. **No SDK API invented** — every `app.*` call must exist in the PAS SDK docs or installed `.d.ts`.
3. **No `user.name` or `user.email`** — the PAS user object has neither. Use `user.login`.
4. **No `user_id` in public queries** — ratings queries that power the feed or map must never SELECT or expose `user_id`.
5. **Photo required gate** — the Submit button must be disabled (not just visually hidden) until a photo is selected.
6. **Location required gate** — cannot proceed past café selection step without a valid `cafe_id`.

---

## Definition of Done (per feature)

- [ ] TypeScript compiles clean.
- [ ] Feature works on mobile viewport (375px width minimum).
- [ ] Dark mode renders correctly (no hardcoded colours).
- [ ] Rater identity is not exposed in any rendered output.
- [ ] Loading states shown for all async operations (photo upload, DB query, Places autocomplete).
- [ ] Error states handled (upload failure, network error, Places API down).
- [ ] Empty states handled (no ratings for a café yet, empty feed).

---

## Submit Flow Quality Checklist

- [ ] Cannot submit without photo (button disabled, clear error message).
- [ ] Cannot submit without café selected (button disabled).
- [ ] Cannot submit with stars = 0 (button disabled).
- [ ] Photo upload shows progress indicator.
- [ ] On success: confirmation message shown, form reset, user can submit another.
- [ ] On failure: error message shown, photo not lost (user can retry).

---

## Performance

- Photo should be compressed client-side before upload (target < 500KB per photo).
- Feed initial load: < 2 seconds on 4G.
- Map embed: use `loading="lazy"` on the iframe.
- Paginate feed queries (limit 20 per page).

---

## Security / Privacy

- `user_id` stored in DB for moderation only — never returned to client in public queries.
- Admin role check (`app.roles.check('admin')`) must be server-enforced (via PAS roles), not just client-side.
- Google Places API key stored in PAS vault only — never in client bundle or source code.
- Photo storage keys follow pattern `ratings/{uuid}/photo.jpg` — non-guessable UUIDs.

---

## Browser / Device Support

- Modern browsers only (Chrome, Safari, Firefox — last 2 major versions).
- iOS Safari camera access via `<input type="file" accept="image/*" capture="environment">`.
- Android Chrome camera access — same.
- PWA-ready (manifest.json exists) but offline mode is not a v1 requirement.
