# Arena closer

Scheduled closer for the Missions Arena. Runs via `.github/workflows/arena-close.yml`
(twice daily UTC). The **single writer** for round state, Signal Scores,
`arenaHallOfFame`, and the 24h image sweep. No Cloud Functions (Spark tier).

## Files

| File | Role |
|---|---|
| `closer.js` | The job: phase advance → close → open next → sweep |
| `arena-logic.js` | Pure logic (tally, winner, tier, score deltas) — unit-testable |
| `test.js` | Self-test: `node test.js` (no credentials, no network) |
| `package.json` | `firebase-admin` only |

## Runbook

One secret, same as the curriculum uploader: repo secret `FIREBASE_SERVICE_ACCOUNT`
(service-account JSON). Never committed, never printed.

Optional env: `HOF_RETENTION_DAYS` (default `365`) — how long a mission winner's
image survives the 24h sweep in the trophy case.

Manual run: Actions → "Arena closer" → Run workflow.

## What each run does (per lane: mission, challenge)

1. **Advance phases.** `open`→`voting` where `now >= votingAt`;
   `voting`→`closed` where `now >= closesAt`. Forward only. Mission `open`→`voting`
   (Saturdays) fires the "Mission voting is open" broadcast.
2. **Close.** For every round with `closesAt <= now` (including rounds that missed
   a phase — they jump straight to `closed`):
   - Weighted tally per entry (Σ `2 × voterWeight` from the `votes` subcollection).
   - Winner = highest tally; ties → earliest `submittedAt`.
   - Mission lane → `arenaHallOfFame/{roundId}` with `hofExpiresAt = closedAt + HOF_RETENTION_DAYS`.
   - `arenaScores/{uid}` per participant (created if missing): +10 submit,
     +2×weight per vote received, +50 mission win / +25 challenge win, tier recomputed
     (0: <100 · 1: 100–499 "Trusted eye" · 2: 500+ "Decisive eye").
   - `winnerEntryId` / `winnerUid` set on the round.
   - One "Results are in" broadcast. No entries → close silently, no broadcast.
3. **Open next rounds.**
   - Challenge: creates `c-YYYY-MM-DD` from `arenaPrompts/{today}`; + "Today's challenge is live" broadcast.
     If the prompt doc is missing, **creation is skipped and logged loudly** —
     the client has a 14-prompt hardcoded fallback; the closer never invents prompts.
   - Mission (Mondays): creates `m-YYYY-Www` from the oldest unused `arenaBriefQueue`
     doc (marked `used`); + "New mission brief" broadcast.
4. **24h sweep.** Entries whose parent round closed >24h ago, `swept == false`,
   `imgUrl != null`: Admin-SDK reads `_private/data.deleteUrl` (written by the
   client at submit time, create-only) → HTTP GET the imgbb `delete_url`.
   On success: `imgUrl = null`, `swept = true`, delete `_private` doc + all `votes`
   docs (batched, 500/batch). On failure: `swept` stays false — the next run retries.
   Hall-of-fame winners within `hofExpiresAt` are never burned.

## Broadcasts

Written to the existing `broadcasts` collection in the exact shape the admin
dashboard already writes (`title, body, href, audience, createdAt, [expiresAt]`
via `.add()`), `audience: 'all'`, `href: '/missions.html'`:
- "Today's challenge is live" (daily, body = prompt text truncated, expires 48h)
- "New mission brief" (Monday, body = brief title, expires 48h)
- "Mission voting is open" (Saturday, expires 48h)
- "Results are in" (round close, body = winner name + weighted total, expires 7d)

One broadcast per event — never more.

## Operational notes

- Idempotent: phase transitions and round creation are guarded by current state /
  document existence, so a re-run or a missed cron tick degrades gracefully.
- The `entries` collectionGroup query needs no composite index (equality-only filter);
  the `arenaBriefQueue` query (`used == false` + `orderBy createdAt`) needs the
  Firestore-suggested composite index — create it when the console links it in
  the first failed run's error.
- imgbb deletion is a GET against the `delete_url` captured at upload time.
