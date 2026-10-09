/* Missions Arena closer — GitHub Actions scheduled job (.github/workflows/arena-close.yml).
 *
 * The SINGLE WRITER for round state, Signal Scores, the hall of fame, and
 * the 24h image sweep. No Cloud Functions (Spark tier), no client-side close
 * path. Runs twice daily at 00:05 and 18:05 UTC (cron is UTC-only on GitHub;
 * all round dates/IDs are America/Chicago per user directive).
 *
 * Env:
 *   SERVICE_ACCOUNT_JSON — Firebase service-account JSON (repo secret
 *                          FIREBASE_SERVICE_ACCOUNT), same pattern as
 *                          tools/curriculum-uploader.
 *   HOF_RETENTION_DAYS   — mission-winner image retention; default 365.
 *
 * Each run, per lane (mission, challenge):
 *   1. Advance phases: open->voting (now >= votingAt), voting->closed (now >= closesAt).
 *   2. Close rounds entering closed: weighted tally, winner (ties -> earliest
 *      submittedAt), arenaScores updates, mission hall of fame, broadcasts.
 *   3. Open next rounds: challenge daily from arenaPrompts/{yyyy-MM-dd};
 *      mission on Mondays from the oldest unused arenaBriefQueue doc.
 *   4. 24h imgbb sweep on entries whose parent round closed >24h ago.
 *
 * Firestore names per spec §6 (+ hofExpiresAt on hall-of-fame docs).
 */
"use strict";

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const logic = require("./arena-logic");

const HOF_RETENTION_DAYS = Number(process.env.HOF_RETENTION_DAYS) || 365;

const BROADCAST_HREF = "/missions.html";
const OPEN_TTL_MS = 48 * 3600 * 1000;   // 48h for open/voting broadcasts
const RESULTS_TTL_MS = 7 * 24 * 3600 * 1000; // 7d for results broadcasts

const log = (...a) => console.log(new Date().toISOString(), ...a);
const loud = (...a) => console.log(new Date().toISOString(), "!!!", ...a);

/* ---------- date helpers (America/Chicago — user directive: Chicago for all) ---------- */

const CHICAGO_TZ = "America/Chicago";

function chicagoParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHICAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return { y: +get("year"), m: +get("month"), d: +get("day") };
}

/** yyyy-MM-dd in America/Chicago (matches the client's ymdChicago). */
function ymd(date) {
  const { y, m, d } = chicagoParts(date);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Offset of America/Chicago from UTC at the given instant, in ms. */
function chicagoOffsetMs(date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  const asUtc = Date.UTC(+get("year"), +get("month") - 1, +get("day"),
    (+get("hour")) % 24, +get("minute"), +get("second"));
  return asUtc - date.getTime();
}

/** Midnight in America/Chicago on the date's Chicago calendar day, as a UTC instant. */
function chicagoMidnight(date) {
  const { y, m, d } = chicagoParts(date);
  const guessUtc = Date.UTC(y, m - 1, d, 0, 0, 0);
  return new Date(guessUtc - chicagoOffsetMs(new Date(guessUtc)));
}

/** 0=Sunday..6=Saturday in America/Chicago. */
function chicagoWeekday(date) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: CHICAGO_TZ, weekday: "short" }).format(date);
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[name];
}

/** ISO week number (1-53) for a Chicago calendar date. */
function isoWeek(date) {
  const { y, m, d } = chicagoParts(date);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil(((dt - yearStart) / 86400000 + 1) / 7);
}

function missionRoundId(date) {
  const { y } = chicagoParts(date);
  const w = String(isoWeek(date)).padStart(2, "0");
  return `m-${y}-W${w}`;
}

/** "Operator #A3F9" style alias: 4-char base36 hash of the uid. */
function operatorAlias(uid) {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return "Operator #" + h.toString(36).toUpperCase().padStart(4, "0").slice(-4);
}

/* ---------- broadcasts (shape matches admin-dashboard.html writer) ---------- */

async function broadcast(db, { title, body, ttlMs }) {
  const doc = {
    title,
    body,
    href: BROADCAST_HREF,
    audience: "all", // the arena is free for everyone
    createdAt: FieldValue.serverTimestamp(),
  };
  if (ttlMs) doc.expiresAt = Timestamp.fromDate(new Date(Date.now() + ttlMs));
  await db.collection("broadcasts").add(doc);
  log("broadcast sent:", JSON.stringify(title));
}

/* ---------- phase 1: advance phases ---------- */

async function advancePhases(db, nowMs) {
  for (const lane of ["challenge", "mission"]) {
    const col = db.collection("arenaRounds");
    // open -> voting
    const toVote = await col
      .where("lane", "==", lane)
      .where("state", "==", "open")
      .get();
    for (const d of toVote.docs) {
      const r = d.data() || {};
      const votingMs = r.votingAt && r.votingAt.toMillis ? r.votingAt.toMillis() : null;
      const closesMs = r.closesAt && r.closesAt.toMillis ? r.closesAt.toMillis() : null;
      if (votingMs == null || closesMs == null) {
        loud(`round ${d.id} missing votingAt/closesAt — skipped`);
        continue;
      }
      if (closesMs <= nowMs) continue; // handled by the close step (may jump straight to closed)
      if (votingMs <= nowMs) {
        await d.ref.update({ state: "voting" });
        log(`round ${d.id}: open -> voting`);
        if (lane === "mission") {
          await broadcast(db, {
            title: "Mission voting is open",
            body: "Blind voting is live — 48 hours to crown the frame.",
            ttlMs: OPEN_TTL_MS,
          });
        }
      }
    }
  }
}

/* ---------- phase 2: close rounds ---------- */

async function loadRoundDetail(db, roundRef) {
  const entriesSnap = await roundRef.collection("entries").get();
  const entries = [];
  const votesByEntryId = {};
  for (const e of entriesSnap.docs) {
    const ed = e.data() || {};
    const votesSnap = await e.ref.collection("votes").get();
    const votes = votesSnap.docs.map((v) => v.data() || {});
    votesByEntryId[e.id] = votes;
    entries.push({
      entryId: e.id,
      ref: e.ref,
      submittedAtMs: ed.submittedAt && ed.submittedAt.toMillis ? ed.submittedAt.toMillis() : 0,
      imgUrl: ed.imgUrl || null,
      voteObjs: votes,
    });
  }
  return { entries, votesByEntryId };
}

async function privateData(db, roundRef, entryId) {
  const snap = await roundRef.collection("entries").doc(entryId).collection("_private").doc("data").get();
  return snap.exists ? snap.data() || {} : null;
}

async function closeRound(db, roundRef, round) {
  const roundId = roundRef.id;
  const lane = round.lane;
  const { entries, votesByEntryId } = await loadRoundDetail(db, roundRef);

  // Demo/mock rounds close without crowning a winner — the entries are
  // examples, not competition.
  if (round.demo === true) {
    await roundRef.update({ state: "closed", winnerEntryId: null, winnerUid: null });
    log(`round ${roundId}: demo round closed with no winner`);
    return;
  }

  if (!entries.length) {
    await roundRef.update({ state: "closed", winnerEntryId: null, winnerUid: null });
    log(`round ${roundId}: closed with no entries (no winner, no scores, no broadcast)`);
    return;
  }

  const tallies = logic.tallyWeightedVotes(
    entries.map((e) => ({ entryId: e.entryId, submittedAtMs: e.submittedAtMs })),
    Object.fromEntries(entries.map((e) => [e.entryId, e.voteObjs]))
  );
  const winnerEntryId = logic.pickWinner(tallies);
  const winnerTally = tallies.find((t) => t.entryId === winnerEntryId);

  // author identity lives in _private (client writes it at submit time; only Admin SDK reads it)
  const winnerPrivate = await privateData(db, roundRef, winnerEntryId);
  const winnerUid = (winnerPrivate && winnerPrivate.authorUid) || winnerEntryId;
  const winnerName = (winnerPrivate && winnerPrivate.authorName) || operatorAlias(winnerEntryId);

  const closedAt = Timestamp.fromDate(new Date());
  const batch = db.batch();
  const closedAtMs = closedAt.toMillis();

  // mission hall of fame (permanent until hofExpiresAt)
  if (lane === "mission") {
    const winnerEntry = entries.find((e) => e.entryId === winnerEntryId);
    batch.set(db.collection("arenaHallOfFame").doc(roundId), {
      roundId,
      lane: "mission",
      imgUrl: (winnerEntry && winnerEntry.imgUrl) || null, // NEVER swept before hofExpiresAt
      authorUid: winnerUid,
      authorName: winnerName,
      votes: winnerTally.weightedTotal,
      closedAt,
      hofExpiresAt: Timestamp.fromDate(new Date(closedAtMs + HOF_RETENTION_DAYS * 86400000)),
    });
  }

  // scores for every participant (single writer — batched, no races)
  for (const entry of entries) {
    const tally = tallies.find((t) => t.entryId === entry.entryId);
    const delta = logic.scoreDelta({
      votesReceivedWeighted: tally.weightedTotal,
      voteCount: tally.voteCount,
      isWinner: entry.entryId === winnerEntryId,
      lane,
    });
    const scoreRef = db.collection("arenaScores").doc(entry.entryId);
    const prev = await scoreRef.get();
    const next = logic.applyScoreDelta(prev.exists ? prev.data() : null, delta);
    batch.set(scoreRef, { ...next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    // reveal: stamp the author's name onto the entry doc (Admin SDK bypasses
    // the client no-update rule). The UI reads entry.authorName after close.
    const priv = await privateData(db, roundRef, entry.entryId);
    const name = (priv && priv.authorName) || operatorAlias(entry.entryId);
    batch.set(entry.ref, { authorName: name }, { merge: true });
  }

  batch.update(roundRef, { state: "closed", winnerEntryId, winnerUid });
  await batch.commit();
  log(
    `round ${roundId} closed: winner ${winnerEntryId} (${winnerName}) ` +
    `with ${winnerTally.weightedTotal} weighted votes across ${entries.length} entries`
  );

  await broadcast(db, {
    title: "Results are in",
    body: `${winnerName} takes the round with ${winnerTally.weightedTotal} weighted vote${winnerTally.weightedTotal === 1 ? "" : "s"}.`,
    ttlMs: RESULTS_TTL_MS,
  });
}

async function closeRounds(db, nowMs) {
  const col = db.collection("arenaRounds");
  for (const lane of ["challenge", "mission"]) {
    for (const state of ["open", "voting"]) {
      const snap = await col.where("lane", "==", lane).where("state", "==", state).get();
      for (const d of snap.docs) {
        const r = d.data() || {};
        const closesMs = r.closesAt && r.closesAt.toMillis ? r.closesAt.toMillis() : null;
        if (closesMs == null) {
          loud(`round ${d.id} missing closesAt — skipped`);
          continue;
        }
        if (closesMs <= nowMs) await closeRound(db, d.ref, r);
      }
    }
  }
}

/* ---------- phase 3: open next rounds ---------- */

async function openNextRounds(db, now) {
  const today = ymd(now);

  // --- challenge: today's round from arenaPrompts/{yyyy-MM-dd} ---
  const challengeId = `c-${today}`;
  const challengeRef = db.collection("arenaRounds").doc(challengeId);
  if ((await challengeRef.get()).exists) {
    log(`challenge round ${challengeId} already exists — skip creation`);
  } else {
    const promptSnap = await db.collection("arenaPrompts").doc(today).get();
    if (!promptSnap.exists) {
      loud(
        `arenaPrompts/${today} is MISSING — today's challenge round NOT created. ` +
        `The client has a 14-prompt hardcoded fallback; the closer must not invent prompts. ` +
        `Seed the prompt and re-run (or wait for the next run) to create ${challengeId}.`
      );
    } else {
      const text = (promptSnap.data() || {}).text || "";
      const opensAt = chicagoMidnight(now);
      const votingAt = new Date(opensAt.getTime() + 18 * 3600000);
      const closesAt = new Date(opensAt.getTime() + 24 * 3600000);
      await challengeRef.set({
        lane: "challenge",
        title: text.length > 80 ? text.slice(0, 77) + "…" : text,
        brief: text,
        state: "open",
        opensAt: Timestamp.fromDate(opensAt),
        votingAt: Timestamp.fromDate(votingAt),
        closesAt: Timestamp.fromDate(closesAt),
        entryCount: 0,
        winnerEntryId: null,
        winnerUid: null,
      });
      log(`challenge round ${challengeId} created`);
      await broadcast(db, {
        title: "Today's challenge is live",
        body: text.length > 140 ? text.slice(0, 137) + "…" : text,
        ttlMs: OPEN_TTL_MS,
      });
    }
  }

  // --- mission: Mondays only, oldest unused arenaBriefQueue doc ---
  if (chicagoWeekday(now) === 1) {
    const mId = missionRoundId(now);
    const mRef = db.collection("arenaRounds").doc(mId);
    if ((await mRef.get()).exists) {
      log(`mission round ${mId} already exists — skip creation`);
    } else {
      const q = await db
        .collection("arenaBriefQueue")
        .where("used", "==", false)
        .orderBy("createdAt", "asc")
        .limit(1)
        .get();
      if (q.empty) {
        loud(
          `arenaBriefQueue has no unused brief — mission round ${mId} NOT created. ` +
          `Add a brief to the queue and re-run (or wait for the next run).`
        );
      } else {
        const qd = q.docs[0];
        const b = qd.data() || {};
        const opensAt = chicagoMidnight(now);                       // Mon 00:00 Chicago
        const votingAt = new Date(opensAt.getTime() + 5 * 86400000); // Sat 00:00 Chicago
        const closesAt = new Date(opensAt.getTime() + 7 * 86400000); // next Mon 00:00 Chicago
        await mRef.set({
          lane: "mission",
          title: b.title || "",
          brief: b.brief || "",
          state: "open",
          opensAt: Timestamp.fromDate(opensAt),
          votingAt: Timestamp.fromDate(votingAt),
          closesAt: Timestamp.fromDate(closesAt),
          entryCount: 0,
          winnerEntryId: null,
          winnerUid: null,
        });
        await qd.ref.update({ used: true, usedAt: FieldValue.serverTimestamp(), usedInRound: mId });
        log(`mission round ${mId} created from brief queue doc ${qd.id}`);
        await broadcast(db, {
          title: "New mission brief",
          body: b.title || "This week's brief is live.",
          ttlMs: OPEN_TTL_MS,
        });
      }
    }
  }
}

/* ---------- phase 4: 24h imgbb sweep ---------- */

function chunkedBatch(db) {
  let batch = db.batch();
  let n = 0;
  const batches = [batch];
  return {
    get() {
      if (n >= 500) { batch = db.batch(); batches.push(batch); n = 0; }
      n++;
      return batch;
    },
    async commitAll() {
      for (const b of batches) await b.commit();
    },
  };
}

async function sweep(db, nowMs) {
  const cutoffMs = nowMs - 24 * 3600000;
  // collectionGroup on entries; swept==false is exact, imgUrl filter in code
  // (keeps the query to one composite: equality only).
  const snap = await db.collectionGroup("entries").where("swept", "==", false).get();
  if (snap.empty) { log("sweep: no unswept entries"); return; }

  const writer = chunkedBatch(db);
  let swept = 0, skipped = 0, failed = 0;
  const hofCache = {}; // roundId -> hof doc data (or null)

  for (const e of snap.docs) {
    const ed = e.data() || {};
    if (!ed.imgUrl) { skipped++; continue; } // imgUrl==null: nothing to burn
    const roundRef = e.ref.parent.parent;
    if (!roundRef) { loud(`entry ${e.ref.path} has no parent round — skipped`); skipped++; continue; }
    const roundId = roundRef.id;

    const roundSnap = await roundRef.get();
    if (!roundSnap.exists) { loud(`round ${roundId} missing — entry ${e.id} skipped`); skipped++; continue; }
    const round = roundSnap.data() || {};
    const closesMs = round.closesAt && round.closesAt.toMillis ? round.closesAt.toMillis() : null;
    if (closesMs == null || closesMs >= cutoffMs) { skipped++; continue; } // not yet 24h past close

    // hall-of-fame winners keep their image until hofExpiresAt
    if (!(roundId in hofCache)) {
      const h = await db.collection("arenaHallOfFame").doc(roundId).get();
      hofCache[roundId] = h.exists ? h.data() : null;
    }
    const hof = hofCache[roundId];
    const hofExpMs = hof && hof.hofExpiresAt && hof.hofExpiresAt.toMillis ? hof.hofExpiresAt.toMillis() : null;
    if (hof && hofExpMs != null && nowMs < hofExpMs && e.id === round.winnerEntryId) {
      skipped++; // winner's image lives in the trophy case until retention expires
      continue;
    }

    const priv = await e.ref.collection("_private").doc("data").get();
    const deleteUrl = priv.exists ? (priv.data() || {}).deleteUrl : null;
    if (!deleteUrl) {
      loud(`entry ${roundId}/${e.id}: no _private/data.deleteUrl — leaving swept=false for retry`);
      failed++;
      continue;
    }

    let ok = false;
    try {
      const res = await fetch(deleteUrl, { method: "GET" });
      ok = res.ok;
      if (!ok) loud(`entry ${roundId}/${e.id}: imgbb delete returned ${res.status} — leaving swept=false for retry`);
    } catch (err) {
      loud(`entry ${roundId}/${e.id}: imgbb delete failed (${err && err.message}) — leaving swept=false for retry`);
    }
    if (!ok) { failed++; continue; }

    const b = writer.get();
    b.update(e.ref, { imgUrl: null, swept: true });
    b.delete(e.ref.collection("_private").doc("data"));
    const votesSnap = await e.ref.collection("votes").get();
    for (const v of votesSnap.docs) writer.get().delete(v.ref);
    swept++;
  }

  await writer.commitAll();
  log(`sweep done: ${swept} burned, ${skipped} skipped, ${failed} failed (retry next run)`);
}

/* ---------- main ---------- */

async function main() {
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!sa) {
    console.error("Missing SERVICE_ACCOUNT_JSON env var.");
    process.exit(1);
  }
  initializeApp({ credential: cert(JSON.parse(sa)) });
  const db = getFirestore();

  const now = new Date();
  const nowMs = now.getTime();
  log(`arena closer run start (HOF_RETENTION_DAYS=${HOF_RETENTION_DAYS})`);

  await advancePhases(db, nowMs);
  await closeRounds(db, nowMs);
  await openNextRounds(db, now);
  await sweep(db, nowMs);

  log("arena closer run complete");
}

main().catch((e) => {
  console.error("CLOSER ERROR:", (e && e.stack) || e);
  process.exit(1);
});
