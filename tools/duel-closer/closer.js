/* Duels closer — GitHub Actions scheduled job (.github/workflows/duel-close.yml).
 *
 * The SINGLE WRITER for duel settlement, duelRecords, duel XP, duel Signal
 * posts, and cross-user duel notifications. No Cloud Functions (Spark tier),
 * no client-side close path. Runs hourly: duel windows end whenever their
 * 24h clocks run out (not at a fixed hour like Arena rounds), so an hourly
 * sweep settles each expiry, default, and crown within the hour.
 *
 * Env:
 *   SERVICE_ACCOUNT_JSON — Firebase service-account JSON (repo secret
 *                          FIREBASE_SERVICE_ACCOUNT), same pattern as
 *                          tools/arena-closer and tools/curriculum-uploader.
 *
 * Each run, for every unsettled duel (no `state` field yet):
 *   1. Notify: challenge ping to the opponent (once), accept ping to the
 *      challenger (once). Each guarded by a marker field on the duel doc.
 *   2. Voting backstop: both entries in but voteBy never set (the 2nd
 *      submitter's client write failed) — set voteBy = max(submittedAt)+24h.
 *   3. Voting open: both entries in — post each submission to the Signal
 *      (feedItems type duel_entry) and ping each duelist with a deep link
 *      to the OPPONENT's post (feed.html#<postId>), per the owner's spec.
 *   4. Settle terminal duels (state 'closed' + closeReason + winnerUid +
 *      closedAt, all in one atomic batch with the records, XP, posts, and
 *      pings — a crash mid-settle never half-crowns a duel):
 *        declined  -> no winner, no records, no XP; challenger pinged.
 *        expired   -> no answer in 24h, void; challenger pinged.
 *        default   -> one side submitted, they win (records + XP + result
 *                     post + pings); neither submitted -> void, both pinged.
 *        votes     -> voting window passed; tally, winner = most votes,
 *                     tie -> earliest submittedAt (records + XP + result
 *                     post + pings).
 *   5. XP: the winner gets DUEL_WIN_XP (25) via the same user-doc writes
 *      scripts/reward-engine.js award() makes (same aliases, same
 *      day-rollover and streak rules, Chicago date keys) — the dashboard
 *      cannot tell a closer award from a client award. The loser gets the
 *      loss on their record and no XP.
 *
 * NO image sweep for duels: the entry photos are the content — the Signal
 * posts link them permanently. Never delete duel images.
 *
 * Idempotency: every notification and post is guarded by a marker field on
 * the duel doc (challengeNotifiedAt, acceptNotifiedAt, votingPostsAt,
 * votingNotifiedAt, state), and every settle writes state 'closed', which
 * removes the duel from the unsettled set. A re-run or a missed cron tick
 * degrades gracefully; a duplicate post or ping cannot happen.
 */
"use strict";

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const logic = require("./duel-logic");

const DUEL_WIN_XP = logic.DUEL_WIN_XP;

const log = (...a) => console.log(new Date().toISOString(), ...a);
const loud = (...a) => console.log(new Date().toISOString(), "!!!", ...a);

function duelHref(duelId) { return "/duel.html?d=" + duelId; }
function postHref(postId) { return "/feed.html#" + postId; }

/* ---------- writers (all batch-scoped: atomic with the duel update) ---------- */

function notifyItem(db, batch, uid, { title, body, href }) {
  const ref = db.collection("notifications").doc(uid).collection("items").doc();
  batch.set(ref, {
    title,
    body,
    href,
    kind: "duel",
    createdAt: FieldValue.serverTimestamp(),
    read: false,
  });
  return ref.id;
}

function signalPost(db, batch, fields) {
  const ref = db.collection("feedItems").doc();
  batch.set(ref, {
    ...fields,
    createdAt: FieldValue.serverTimestamp(),
    visibility: "public",
  });
  return ref.id;
}

function updateRecord(db, batch, uid, isWinner) {
  const delta = logic.recordDelta(isWinner);
  batch.set(
    db.collection("duelRecords").doc(uid),
    {
      wins: FieldValue.increment(delta.wins),
      losses: FieldValue.increment(delta.losses),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/* XP award for the winner — mirrors RewardEngine.award (see duel-logic.js).
 * Reads the user doc first (the patch needs the current XP/streak), then
 * stages the merge-set on the batch. Returns the milestone info so the
 * caller can stage the milestone post in the same batch. */
async function awardDuelXp(db, batch, winnerUid, duel, duelId, now) {
  const userRef = db.collection("users").doc(winnerUid);
  const snap = await userRef.get().catch(() => null);
  const prev = snap && snap.exists ? snap.data() || {} : {};
  const todayKey = logic.chicagoDateKey(now);
  const ydayKey = logic.chicagoYesterdayKey(now);
  const r = logic.xpPatchForWin(prev, DUEL_WIN_XP, todayKey, ydayKey, {
    type: "duel",
    label: "Won a duel: " + (duel.theme || "Untitled duel"),
    icon: "✨",
    meta: { duelId },
  });
  const patch = { ...r.patch };
  patch["xpByDay." + todayKey] = FieldValue.increment(r.xpIncrement);
  batch.set(userRef, patch, { merge: true });
  return {
    isMilestone: r.isMilestone,
    newStreak: r.newStreak,
    actorName: prev.displayName || prev.name || prev.username || null,
    actorAvatar: prev.photoURL || null,
  };
}

/* ---------- per-duel processing ---------- */

async function loadDuelDetail(db, duelRef, duel) {
  const entries = { challenger: null, opponent: null };
  const cSnap = await duelRef.collection("entries").doc(duel.challengerUid).get().catch(() => null);
  const oSnap = await duelRef.collection("entries").doc(duel.opponentUid).get().catch(() => null);
  if (cSnap && cSnap.exists) entries.challenger = cSnap.data() || {};
  if (oSnap && oSnap.exists) entries.opponent = oSnap.data() || {};
  const votesSnap = await duelRef.collection("votes").get().catch(() => null);
  const votes = votesSnap ? votesSnap.docs.map((v) => v.data() || {}) : [];
  return { entries, votes };
}

async function processDuel(db, duelRef, duel, duelId, now, nowMs, stats) {
  const cName = duel.challengerName || "Operator";
  const oName = duel.opponentName || "Operator";
  const theme = duel.theme || "Untitled duel";
  const { entries, votes } = await loadDuelDetail(db, duelRef, duel);
  const st = logic.deriveDuelState(duel, entries, votes, nowMs);

  /* --- challenge ping (once) --- */
  if (st.key === "pending" && !duel.challengeNotifiedAt) {
    const batch = db.batch();
    notifyItem(db, batch, duel.opponentUid, {
      title: "You've been challenged",
      body: cName + " challenged you: " + theme + ". 24 hours to accept.",
      href: duelHref(duelId),
    });
    batch.update(duelRef, { challengeNotifiedAt: FieldValue.serverTimestamp() });
    await batch.commit();
    stats.notified++;
    log(`duel ${duelId}: challenge ping sent to ${duel.opponentUid}`);
  }

  /* --- accept ping (once) --- */
  if (duel.acceptedAt && !duel.acceptNotifiedAt) {
    const batch = db.batch();
    notifyItem(db, batch, duel.challengerUid, {
      title: oName + " accepted your duel",
      body: "Shoot '" + theme + "' — 24 hours to submit.",
      href: duelHref(duelId),
    });
    batch.update(duelRef, { acceptNotifiedAt: FieldValue.serverTimestamp() });
    await batch.commit();
    stats.notified++;
    log(`duel ${duelId}: accept ping sent to ${duel.challengerUid}`);
  }

  const bothIn = !!(entries.challenger && entries.opponent);

  /* --- voting backstop + voting-open posts/pings --- */
  if (bothIn && !duel.voteBy) {
    const voteByMs = Math.max(logic.tsMs(entries.challenger.submittedAt), logic.tsMs(entries.opponent.submittedAt)) + logic.DAY_MS;
    const batch = db.batch();
    batch.update(duelRef, { voteBy: Timestamp.fromDate(new Date(voteByMs)) });
    await batch.commit();
    duel.voteBy = Timestamp.fromDate(new Date(voteByMs));
    stats.backstopped++;
    log(`duel ${duelId}: voteBy backstop set (2nd submitter write missed)`);
  }
  if (bothIn && duel.voteBy && !duel.votingPostsAt && nowMs <= logic.tsMs(duel.voteBy)) {
    /* Entry posts go out only while voting is still open — a duel whose
       window already passed (backstop case) goes straight to settlement
       below, with only the result post. Posting "Vote on the duel" after
       voting closed would be a dead invitation. */
    const batch = db.batch();
    const cPostId = signalPost(db, batch, {
      type: "duel_entry",
      actorUid: duel.challengerUid,
      actorName: cName,
      actorAvatar: duel.challengerAvatar || null,
      title: theme,
      text: "Shot for \"" + theme + "\" — the duel against " + oName + ".",
      imageUrl: entries.challenger.imgUrl || null,
      targetType: "duel",
      targetId: duelId,
      actionUrl: duelHref(duelId),
      actionLabel: "Vote on the duel",
    });
    const oPostId = signalPost(db, batch, {
      type: "duel_entry",
      actorUid: duel.opponentUid,
      actorName: oName,
      actorAvatar: duel.opponentAvatar || null,
      title: theme,
      text: "Shot for \"" + theme + "\" — the duel against " + cName + ".",
      imageUrl: entries.opponent.imgUrl || null,
      targetType: "duel",
      targetId: duelId,
      actionUrl: duelHref(duelId),
      actionLabel: "Vote on the duel",
    });
    /* Each duelist's bell links to the OPPONENT's submission post. */
    notifyItem(db, batch, duel.challengerUid, {
      title: "Voting is open on your duel",
      body: oName + "'s shot is in — see it in the Signal.",
      href: postHref(oPostId),
    });
    notifyItem(db, batch, duel.opponentUid, {
      title: "Voting is open on your duel",
      body: cName + "'s shot is in — see it in the Signal.",
      href: postHref(cPostId),
    });
    batch.update(duelRef, {
      votingPostsAt: FieldValue.serverTimestamp(),
      votingNotifiedAt: FieldValue.serverTimestamp(),
      signalPostIds: { challenger: cPostId, opponent: oPostId },
    });
    await batch.commit();
    stats.posts += 2;
    stats.notified += 2;
    log(`duel ${duelId}: voting-open posts + pings sent`);
  }

  /* --- settlement --- */
  if (st.key === "declined") {
    const batch = db.batch();
    batch.update(duelRef, {
      state: "closed", closeReason: "declined", winnerUid: null,
      closedAt: FieldValue.serverTimestamp(),
    });
    notifyItem(db, batch, duel.challengerUid, {
      title: oName + " declined your duel",
      body: "No harm done — challenge someone else.",
      href: duelHref(duelId),
    });
    await batch.commit();
    stats.closed++;
    log(`duel ${duelId}: closed declined`);
    return;
  }
  if (st.key === "expired") {
    const batch = db.batch();
    batch.update(duelRef, {
      state: "closed", closeReason: "expired", winnerUid: null,
      closedAt: FieldValue.serverTimestamp(),
    });
    notifyItem(db, batch, duel.challengerUid, {
      title: "Your challenge expired",
      body: oName + " didn't answer in 24 hours.",
      href: duelHref(duelId),
    });
    await batch.commit();
    stats.closed++;
    log(`duel ${duelId}: closed expired (void)`);
    return;
  }
  if (st.key === "void") {
    const batch = db.batch();
    batch.update(duelRef, {
      state: "closed", closeReason: "void", winnerUid: null,
      closedAt: FieldValue.serverTimestamp(),
    });
    notifyItem(db, batch, duel.challengerUid, {
      title: "Duel void",
      body: "Neither side submitted '" + theme + "' in time.",
      href: duelHref(duelId),
    });
    notifyItem(db, batch, duel.opponentUid, {
      title: "Duel void",
      body: "Neither side submitted '" + theme + "' in time.",
      href: duelHref(duelId),
    });
    await batch.commit();
    stats.closed++;
    log(`duel ${duelId}: closed void (neither submitted)`);
    return;
  }
  if (st.key === "closed" || st.key === "default") {
    const wSide = st.winner;
    const winnerUid = wSide === "challenger" ? duel.challengerUid : duel.opponentUid;
    const loserUid = wSide === "challenger" ? duel.opponentUid : duel.challengerUid;
    const winnerName = wSide === "challenger" ? cName : oName;
    const loserName = wSide === "challenger" ? oName : cName;
    const isDefault = st.key === "default";
    const scoreLine = "Final " + st.tallyC + " – " + st.tallyO + ".";

    const batch = db.batch();
    const resultPostId = signalPost(db, batch, {
      type: "duel_result",
      actorUid: winnerUid,
      actorName: winnerName,
      actorAvatar: wSide === "challenger" ? (duel.challengerAvatar || null) : (duel.opponentAvatar || null),
      title: theme,
      text: isDefault
        ? "Won the duel \"" + theme + "\" by default — " + loserName + " didn't submit in time."
        : "Won the duel \"" + theme + "\" against " + loserName + " — " + scoreLine,
      imageUrl: (wSide === "challenger" ? entries.challenger : entries.opponent).imgUrl || null,
      targetType: "duel",
      targetId: duelId,
      actionUrl: duelHref(duelId),
      actionLabel: "See the duel",
    });
    batch.update(duelRef, {
      state: "closed",
      closeReason: isDefault ? "default" : "votes",
      winnerUid,
      closedAt: FieldValue.serverTimestamp(),
      "signalPostIds.result": resultPostId,
    });
    updateRecord(db, batch, winnerUid, true);
    updateRecord(db, batch, loserUid, false);
    const xp = await awardDuelXp(db, batch, winnerUid, duel, duelId, now);
    if (xp.isMilestone) {
      signalPost(db, batch, {
        type: "xp_milestone",
        actorUid: winnerUid,
        actorName: xp.actorName || winnerName,
        actorAvatar: xp.actorAvatar,
        text: (xp.actorName || winnerName) + " hit a " + xp.newStreak + "-day streak",
        milestoneKind: "streak",
        streakDays: xp.newStreak,
        targetType: "profile",
        targetId: winnerUid,
      });
      stats.posts++;
    }
    notifyItem(db, batch, winnerUid, {
      title: "You won the duel",
      body: "You beat " + loserName + " on '" + theme + "'. +" + DUEL_WIN_XP + " XP.",
      href: postHref(resultPostId),
    });
    notifyItem(db, batch, loserUid, {
      title: winnerName + " won the duel",
      body: isDefault
        ? winnerName + " takes '" + theme + "' by default."
        : scoreLine + " on '" + theme + "'.",
      href: postHref(resultPostId),
    });
    await batch.commit();
    stats.closed++;
    stats.posts++;
    stats.notified += 2;
    stats.xpAwarded += DUEL_WIN_XP;
    log(`duel ${duelId}: closed ${isDefault ? "default" : "votes"} — winner ${winnerUid} (${winnerName}), ${st.tallyC}-${st.tallyO}`);
    return;
  }

  /* pending / submitting / voting with nothing due this run: nothing to do. */
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
  log("duel closer run start");
  const stats = { scanned: 0, unsettled: 0, closed: 0, posts: 0, notified: 0, backstopped: 0, xpAwarded: 0, failed: 0 };

  const snap = await db.collection("duels").orderBy("createdAt", "desc").limit(100).get();
  stats.scanned = snap.size;
  for (const doc of snap.docs) {
    const duel = doc.data() || {};
    if (duel.state) continue; // settled — out of the unsettled set
    stats.unsettled++;
    try {
      await processDuel(db, doc.ref, duel, doc.id, now, nowMs, stats);
    } catch (e) {
      stats.failed++;
      loud(`duel ${doc.id}: FAILED (${(e && e.message) || e}) — skipped this run, will retry next hour`);
    }
  }

  log(`duel closer run complete: scanned ${stats.scanned}, unsettled ${stats.unsettled}, ` +
    `closed ${stats.closed}, posts ${stats.posts}, pings ${stats.notified}, ` +
    `backstopped ${stats.backstopped}, XP ${stats.xpAwarded}, failed ${stats.failed}`);
}

main().catch((e) => {
  console.error("DUEL CLOSER ERROR:", (e && e.stack) || e);
  process.exit(1);
});
