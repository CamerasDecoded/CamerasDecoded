# Founding Decoder — setup

First 200 Pro members lock their rate for life and carry the
Founding Decoder badge. The spot is claimed automatically when you
approve a Pro request in the admin dashboard.

## What ships in code

- `pro-checkout.html` — Founding Decoder banner with a live
  spots-remaining counter, annual plan as the default hero
  ($119/yr, guide free), full Darkroom in the includes list.
- `admin-dashboard.html` — approving a Pro request runs a
  transaction on `config/founding`: claims one of the 200 spots
  (self-seeds the counter on first claim), stamps
  `users/{uid}.foundingDecoder = true` + number + timestamp.
  The toast confirms "Founding Decoder #N" or "(founding closed)".
- `profile.html` — gold "Founding Decoder" badge next to the role
  tag when `users/{uid}.foundingDecoder === true`.
- `scripts/darkroom.js` — wall nudge: when a free-tier user finishes
  all 9 free Darkroom lessons, one bell notification fires
  ("You've mastered the mechanics — Composition and beyond is Pro",
  links to `/pro-checkout.html`). Once per user
  (`userSkills/{uid}.wallNudgeSent` + localStorage).
- `scripts/darkroom-learn.js` + `field-manual.html` — "Unlock with
  Pro" now routes to `/pro-checkout.html` (was `/products.html`,
  which has no Pro plans).

## Firestore rules — add this block in the console

```js
// Founding Decoder counter — public read (spots-left display),
// admin write (claimed inside the approval transaction).
match /config/founding {
  allow read: if true;
  allow write: if isAdmin();   // ← use your existing admin check
}
```

No other rules are needed:

- `users/{uid}.foundingDecoder` is written by the existing admin
  approval path (already permitted).
- The wall nudge writes to the user's own
  `notifications/{uid}/items` inbox (same self-write pattern as the
  existing bell nudges).
- `userSkills/{uid}.wallNudgeSent` is the user's own doc
  (already writable by the owner).

## No console seeding needed

The `config/founding` doc is created by the first approval
transaction (`{ cap: 200, claimed: 1 }`). Until the first approval,
the checkout banner and admin status line degrade gracefully.
