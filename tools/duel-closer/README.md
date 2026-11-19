# Duel closer

Scheduled closer for operator-vs-operator Duels. Runs via
`.github/workflows/duel-close.yml` (hourly UTC). The **single writer** for
duel settlement, `duelRecords`, duel XP, duel Signal posts, and cross-user
duel notifications. No Cloud Functions (Spark tier).

## Files

| File | Role |
|---|---|
| `closer.js` | The job: notify → backstop → voting-open posts → settle |
| `duel-logic.js` | Pure logic (state derivation, tally, winner, XP patch, records) — unit-testable |
| `test.js` | Self-test: `node test.js` (no credentials, no network) |
| `package.json` | `firebase-admin` only |

## Runbook

One secret, same as the arena closer and the curriculum uploader: repo secret
`FIREBASE_SERVICE_ACCOUNT` (service-account JSON). Never committed, never printed.

Manual run: Actions → "Duel closer" → Run workflow.

## What each run does

For every unsettled duel (no `state` field yet, newest 100 scanned):

1. **Challenge ping** (once, guarded by `challengeNotifiedAt`): the opponent
   gets a bell notification — "You've been challenged" — linking to the duel.
2. **Accept ping** (once, guarded by `acceptNotifiedAt`): the challenger learns
   the opponent accepted.
3. **Voting backstop**: both entries in but `voteBy` never set (the 2nd
   submitter's client write failed) — the closer sets
   `voteBy = max(submittedAt) + 24h`.
4. **Voting open** (once, guarded by `votingPostsAt`): each submission is
   posted to the Signal (`feedItems`, type `duel_entry`, with the photo and a
   "Vote on the duel" button), and each duelist's bell links to the
   **opponent's** post (`feed.html#<postId>`) — comment, flash, and share work
   on it like any Signal post. Entry posts go out only while voting is still
   open; a duel whose window already passed goes straight to settlement.
5. **Settle** terminal duels — `state: 'closed'` + `closeReason` + `winnerUid`
   + `closedAt`, in one atomic batch with the records, XP, result post, and
   pings, so a crash mid-settle never half-crowns a duel:
   - `declined` — opponent said no. No winner, no records, no XP. Challenger pinged.
   - `expired` — no answer in 24h. Void. Challenger pinged.
   - `default` — one side submitted, they win. Neither submitted — void, both pinged.
   - `votes` — voting window passed. Winner = most votes; tie → earliest
     submittedAt (the same tie rule as the Arena closer). A 0–0 tie still
     crowns the earlier submitter: both sides shot, so the head-to-head has
     a winner.
   - Winner path: `duelRecords/{uid}` +1 win / +1 loss, winner +25 XP
     (`DUEL_WIN_XP` in `duel-logic.js`), a `duel_result` Signal post with the
     winner's photo and the final score, and result pings to both duelists
     linking to that post. The XP write mirrors
     `scripts/reward-engine.js` `award()` exactly (same field aliases, same
     day-rollover and streak rules, Chicago date keys), including the
     streak-milestone post when the win lands on a milestone day.

## Notifications

Written to `notifications/{uid}/items` in the shape the bell already reads
(`title, body, href, kind: 'duel', createdAt, read: false`). At most four
pings per duel, each a real event: challenged, accepted, voting open, result
(declined / expired / void close with a single ping each where they apply).

## Operational notes

- Idempotent: every notification and post is guarded by a marker field on the
  duel doc, and every settle writes `state: 'closed'`, which removes the duel
  from the unsettled set. A re-run or a missed cron tick degrades gracefully.
- One bad duel never kills the run: per-duel errors are logged loudly and the
  duel retries next hour.
- **No image sweep for duels.** Entry photos are the content — the Signal
  posts link them permanently. Never delete duel images.
- The closer never invents duels, themes, or votes. It only settles what the
  clients created.
