# Missions Arena — Rules Deploy Note

## Where rules live

There is **no** `firestore.rules` / `firebase.json` in the
`CamerasDecoded/CamerasDecoded` repo — a repo-wide search and the full git
history (`git log --all -- '*rule*'`) found nothing. Firestore security rules
are managed **only in the Firebase console** (the last published rules set was
noted 2026-09-24). So this arena change ships as a console paste, not a PR.

## Deploy path

1. Firebase console → **Firestore Database** → **Rules** tab.
2. Copy the entire contents of `firestore-arena.rules` (the repo root) and
   paste the `match /arena…` blocks **inside** the existing
   `match /databases/{database}/documents { … }` block.
3. Leave every existing rule exactly as-is (the snippet only *adds* matches —
   nothing renames, widens, or narrows existing collections).
4. **Publish** and verify in the console's rules playground:
   - `get /arenaRounds/2026-10-05-challenge/arenaRounds-doc` → allowed (public read)
   - `create /arenaRounds/…/entries/<own-uid>` with a valid payload while the
     round is `open` → allowed
   - `update /arenaScores/<uid>` as the user → denied

## Repo placement (for the coordinator's PR)

The repo has no rules-file convention to match, so keep `firestore-arena.rules`
alongside this note in the PR as a **reference artifact** (e.g. under
`docs/` or `~/workspace/arena-build/rules/`); the deploy itself is the manual
console paste above. If the project later moves rules into the repo (Firebase
CLI `firebase init firestore`), the canonical filename would be
`firestore.rules` at the repo root.
