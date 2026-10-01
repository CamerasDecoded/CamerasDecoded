# Missions Arena — Firestore Data Model Reference

Source: `~/workspace/your_files/missions-arena-spec/SPEC.md` §6 (2026-10-01),
plus the §9-mandated `hofExpiresAt` addition on hall-of-fame docs (Worker A task).
Do NOT invent collection names — this document is the complete list.

Round IDs are deterministic and human-readable (see SPEC §2).
**All times are Firestore `timestamp` (UTC).**

---

## `arenaRounds/{roundId}` — one doc per round, per lane

| Field | Type | Notes |
|---|---|---|
| `lane` | string | `"mission"` or `"challenge"` |
| `title` | string | mission brief title / challenge prompt title |
| `brief` | string | full brief text |
| `state` | string | `"open"` → `"voting"` → `"closed"` (closer workflow advances) |
| `opensAt` | timestamp | when submissions open |
| `votingAt` | timestamp | when voting opens |
| `closesAt` | timestamp | when the round closes |
| `entryCount` | number | count of entries |
| `winnerEntryId` | string \| null | set at close (closer workflow) |
| `winnerUid` | string \| null | set at close (closer workflow) |

**Cadence (SPEC §2):** challenge lane = one round per day; mission lane = one
round per week (Mondays). Winner = highest weighted-vote tally, ties break to
earliest `submittedAt`.

---

## `arenaRounds/{roundId}/entries/{uid}` — one doc per user per round

Doc ID **is** the author's uid → one submission per user per round, structurally.
Create-only from clients; a second submit fails closed.

| Field | Type | Notes |
|---|---|---|
| `imgUrl` | string \| null | imgbb URL (`https://i.ibb.co/…`); nulled by the 24h sweep (`null` after) |
| `submittedAt` | timestamp | server-timestamp at submit |
| `roundId` | string | parent round id (echo for queries) |
| `lane` | string | `"mission"` or `"challenge"` |
| `swept` | boolean | `true` once the 24h sweep has run on this entry |

Public doc carries **no author fields** — submissions are blind until close.
During `open`/`voting` the client renders "Operator #XXXX" (short hash of uid).
After the sweep, non-winner docs persist with `imgUrl: null` (rankings + audit
trail survive; client renders an "expired" tile). Only the images burn.

---

## `arenaRounds/{roundId}/entries/{uid}/_private/data` — author identity

Client reads **denied** by rules (closer workflow / Admin SDK only; rule-time
`get()` still works for the no-self-vote check).

| Field | Type | Notes |
|---|---|---|
| `authorUid` | string | the submitting user's uid |
| `authorName` | string | display name (revealed at close) |
| `deleteUrl` | string | imgbb `delete_url` captured at upload; ONLY the 24h sweep reads this |

Deleted by the sweep (along with all votes docs) once `imgUrl` is nulled.

---

## `arenaRounds/{roundId}/entries/{uid}/votes/{voterUid}` — one vote per user per entry

Doc ID **is** the voter's uid → one vote per user per entry, structurally.
Create-only; upvote-only (no downvotes).

| Field | Type | Notes |
|---|---|---|
| `voterUid` | string | the voter's uid |
| `voterWeight` | 1 \| 2 \| 3 | tier weight snapshotted at vote time |
| `createdAt` | timestamp | vote time |

Read visibility: a voter may read **their own** vote docs any time; **all**
votes become readable once the round is `closed`. During `open`/`voting`,
vote counts are invisible (blind). No self-votes (rule-time `_private` check).

---

## `arenaScores/{uid}` — Signal Score ledger (closer writes only)

One doc per user. **Score only ever grows** — no decay, no penalties.

| Field | Type | Notes |
|---|---|---|
| `score` | number | visible Signal Score |
| `submissions` | number | lifetime entries submitted |
| `votesReceived` | number | lifetime votes received |
| `wins` | number | lifetime round wins |
| `tier` | 0 \| 1 \| 2 | vote-weight tier (weight = tier+1); takes effect **next** round |
| `updatedAt` | timestamp | last closer write |

Formula (SPEC §5): submit +10 · each vote received +2×voter weight · mission win
+50 · challenge win +25. All mutations in the closer workflow; clients never write.

---

## `arenaHallOfFame/{roundId}` — mission-lane winners only, permanent record

Mission-lane only. The trophy case stays curated and tiny — challenge winners
get Score, not permanence. Written at close by the closer workflow.

| Field | Type | Notes |
|---|---|---|
| `roundId` | string | the winning round |
| `lane` | string | always `"mission"` |
| `imgUrl` | string | winning image — **never** nulled by the 24h sweep |
| `authorUid` | string | winner's uid |
| `authorName` | string | winner's display name |
| `votes` | number | weighted vote total |
| `closedAt` | timestamp | when the round closed |
| `hofExpiresAt` | timestamp | = `closedAt` + HOF_RETENTION_DAYS (365). Winner images are kept 12 months, not forever — the sweep (Worker C) burns the HOF image only after this time passes |

---

## `arenaPrompts/{yyyy-MM-dd}` — daily challenge prompts

Seeded weekly by the agent; clients read-only.

| Field | Type | Notes |
|---|---|---|
| `lane` | string | always `"challenge"` |
| `text` | string | the day's prompt text |
| `createdAt` | timestamp | when seeded |

**Fallback:** if today's doc is missing, the client renders from a hardcoded
14-prompt list so the lane never goes dark (SPEC §8).

---

## `arenaBriefQueue/{autoId}` — mission briefs

Written weekly by the agent; **client reads denied** (agent/closer only).

| Field | Type | Notes |
|---|---|---|
| `title` | string | brief title |
| `brief` | string | full brief text |
| `used` | boolean | `true` once popped into a round |
| `createdAt` | timestamp | when queued |

On Mondays the closer pops the oldest unused doc into the new mission round.

---

## Related collections (not arena-owned; arena writes into them)

- `broadcasts` — closer writes "results are in" / "challenge is live" docs
  (`href: '/missions.html'`), per SPEC §8.
- `game_sessions` / `leaderboard` — arena XP payouts route through existing
  channels (SPEC §6 XP tie-in; exact mechanism is Worker B's scope).
