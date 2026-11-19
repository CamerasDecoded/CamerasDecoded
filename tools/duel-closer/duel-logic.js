/* Duel closer — pure logic (no Firestore, no network).
 *
 * Extracted so it can be unit-tested without credentials (node test.js).
 * Mirrors the client derivation in duel.html derive() and profile.html
 * ppDuelRowState() exactly — same order, same tie rule — plus the
 * server-side settlement pieces the clients never compute: the XP patch
 * (mirrors scripts/reward-engine.js award()) and the duelRecords delta.
 *
 * Locked economy (owner, 2026-11-18): the winner gets a win on their
 * record + XP. DUEL_WIN_XP = 25 matches the Arena challenge-win score
 * (+25) and is a quarter of the 100 XP daily goal. The loser gets the
 * loss on their record and no XP. Change the constant, not the call sites.
 */
"use strict";

const DAY_MS = 24 * 3600 * 1000;
const DUEL_WIN_XP = 25;
const XP_GOAL_DEFAULT = 100;
const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365];

/** Timestamp-ish (Firestore Timestamp, {seconds}, ms number, null) -> ms. */
function tsMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  if (typeof ts === "number") return ts;
  return 0;
}

/**
 * Effective duel state. Order matters; first match wins — same order as
 * duel.html derive(). `duel` is the duel doc data, `entries` is
 * {challenger: {submittedAt}|null, opponent: {...}|null}, `votes` is
 * [{pick: 'challenger'|'opponent'}]. Returns {key, winner, byDefault,
 * tallyC, tallyO, deadlineMs} where winner is 'challenger'|'opponent'|null.
 *
 * Keys: pending, declined, expired, submitting, voting, closed, default, void.
 * A closer-settled duel (state === 'closed') short-circuits on closeReason
 * + winnerUid — the settlement is authoritative, never re-derived.
 */
function deriveDuelState(duel, entries, votes, nowMs) {
  const d = duel || {};
  const c = (entries && entries.challenger) || null;
  const o = (entries && entries.opponent) || null;
  const bothIn = !!(c && o);
  const tally = tallyDuelVotes(votes || []);
  const tallyC = tally.challenger;
  const tallyO = tally.opponent;

  function sideOf(uid) {
    if (!uid) return null;
    if (uid === d.challengerUid) return "challenger";
    if (uid === d.opponentUid) return "opponent";
    return null;
  }
  function winnerByVotes() {
    return pickDuelWinner(tallyC, tallyO, tsMs(c && c.submittedAt), tsMs(o && o.submittedAt));
  }

  /* Settled by the closer — authoritative, never re-derived. */
  if (d.state === "closed") {
    const w = sideOf(d.winnerUid);
    if (d.closeReason === "votes") return { key: "closed", winner: w, byDefault: false, tallyC, tallyO };
    if (d.closeReason === "default") return { key: "default", winner: w, byDefault: true, tallyC, tallyO };
    if (d.closeReason === "expired") return { key: "expired", winner: null, tallyC, tallyO };
    if (d.closeReason === "declined") return { key: "declined", winner: null, tallyC, tallyO };
    if (d.closeReason === "void") return { key: "void", winner: null, tallyC, tallyO };
    return { key: "closed", winner: w, byDefault: false, tallyC, tallyO };
  }

  if (d.declinedAt) return { key: "declined", winner: null, tallyC, tallyO };
  if (!d.acceptedAt && nowMs > tsMs(d.acceptBy)) return { key: "expired", winner: null, tallyC, tallyO };
  if (!d.acceptedAt) return { key: "pending", winner: null, deadlineMs: tsMs(d.acceptBy), tallyC, tallyO };
  let voteByMs = tsMs(d.voteBy);
  if (!d.voteBy && bothIn) {
    voteByMs = Math.max(tsMs(c.submittedAt), tsMs(o.submittedAt)) + DAY_MS;
  }
  if (d.voteBy && nowMs > voteByMs) {
    return { key: "closed", winner: winnerByVotes(), byDefault: false, tallyC, tallyO };
  }
  if (voteByMs) return { key: "voting", winner: null, deadlineMs: voteByMs, tallyC, tallyO };
  if (nowMs > tsMs(d.submitBy)) {
    if (c && !o) return { key: "default", winner: "challenger", byDefault: true, tallyC, tallyO };
    if (o && !c) return { key: "default", winner: "opponent", byDefault: true, tallyC, tallyO };
    return { key: "void", winner: null, tallyC, tallyO };
  }
  return { key: "submitting", winner: null, deadlineMs: tsMs(d.submitBy), tallyC, tallyO };
}

/** Unweighted tally: one vote per voter, no voter weights in duels. */
function tallyDuelVotes(votes) {
  let challenger = 0, opponent = 0;
  for (const v of votes || []) {
    if (v.pick === "challenger") challenger++;
    else if (v.pick === "opponent") opponent++;
  }
  return { challenger, opponent };
}

/**
 * Winner = most votes; ties break to the earliest submittedAt — the same
 * tie rule as the Arena closer and the duel.html client derivation.
 * A 0–0 tie still crowns the earlier submitter: both sides shot, so the
 * head-to-head has a winner.
 */
function pickDuelWinner(tallyC, tallyO, submittedCms, submittedOms) {
  if (tallyC === tallyO) return submittedCms <= submittedOms ? "challenger" : "opponent";
  return tallyC > tallyO ? "challenger" : "opponent";
}

/** duelRecords/{uid} delta for one settled duel. */
function recordDelta(isWinner) {
  return { wins: isWinner ? 1 : 0, losses: isWinner ? 0 : 1 };
}

/* ---------- Chicago date keys (America/Chicago — the app's clock) ---------- */

const CHICAGO_TZ = "America/Chicago";

function chicagoParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHICAGO_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return { y: +get("year"), m: +get("month"), d: +get("day") };
}

/** yyyy-MM-dd in America/Chicago. */
function chicagoDateKey(date) {
  const { y, m, d } = chicagoParts(date);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Yesterday's yyyy-MM-dd in America/Chicago. */
function chicagoYesterdayKey(date) {
  return chicagoDateKey(new Date(date.getTime() - DAY_MS));
}

/* ---------- XP patch (mirrors scripts/reward-engine.js award()) ---------- */

const XP_KEYS = ["xpToday", "dailyXp"];
const XP_GOAL_KEYS = ["xpGoal", "dailyXpGoal"];
const STREAK_KEYS = ["dailyChallengeStreak", "streakDays", "streak"];
const LAST_ACTIVE_KEYS = ["lastActivityDate", "lastActiveDate", "lastStreakDate", "lastXpDate"];

function pick(obj, keys, fallback) {
  if (!obj) return fallback;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
}

/**
 * Compute the users/{uid} patch for a duel win, mirroring RewardEngine.award
 * exactly (same field aliases, same day-rollover and streak rules) so the
 * dashboard ring, streak, and activity feed cannot tell a closer award from
 * a client award. Day authority is the Chicago date key.
 *
 * @param {Object|null} prev  existing users/{uid} data (null = no doc yet)
 * @param {number} xp         XP to award (DUEL_WIN_XP)
 * @param {string} todayKey   chicagoDateKey(now)
 * @param {string} ydayKey    chicagoYesterdayKey(now)
 * @param {Object} activity   {type, label, icon, meta} for recentActivity
 * @returns {{patch: Object, xpIncrement: number, newStreak: number,
 *            newXpToday: number, xpGoal: number, isMilestone: boolean}}
 *   patch holds every plain field to set (merge); the caller adds
 *   `xpByDay.{todayKey}: FieldValue.increment(xpIncrement)` itself —
 *   FieldValue lives in firebase-admin, not in this pure module.
 */
function xpPatchForWin(prev, xp, todayKey, ydayKey, activity) {
  const data = prev || {};
  const xpAmt = toNum(xp, 0);
  const lastSeen = pick(data, LAST_ACTIVE_KEYS, null);
  const isNewDay = lastSeen !== todayKey || data.xpTodayDate !== todayKey;

  const baseXp = isNewDay ? 0 : toNum(pick(data, XP_KEYS, 0), 0);
  const newXp = baseXp + xpAmt;
  const xpGoal = toNum(pick(data, XP_GOAL_KEYS, XP_GOAL_DEFAULT), XP_GOAL_DEFAULT);

  const patch = { xpTodayDate: todayKey };
  XP_KEYS.forEach((k) => { patch[k] = newXp; });
  if (!XP_GOAL_KEYS.some((k) => data[k] !== undefined)) patch.xpGoal = xpGoal;

  const curStreak = toNum(pick(data, STREAK_KEYS, 0), 0);
  let newStreak;
  if (lastSeen === todayKey) newStreak = curStreak || 1;
  else if (lastSeen === ydayKey) newStreak = curStreak + 1;
  else newStreak = 1;
  STREAK_KEYS.forEach((k) => { patch[k] = newStreak; });
  LAST_ACTIVE_KEYS.forEach((k) => { patch[k] = todayKey; });

  if (activity) {
    const existingActivity = pick(data, ["recentActivity"], []);
    const list = Array.isArray(existingActivity) ? existingActivity : [];
    const entry = {
      type: activity.type || "xp",
      label: activity.label || "Activity",
      icon: activity.icon || "✨",
      xp: xpAmt,
      ts: Date.now(),
      ...(activity.meta || {}),
    };
    patch.recentActivity = [entry, ...list].slice(0, 20);
  }

  return {
    patch,
    xpIncrement: xpAmt,
    newStreak,
    newXpToday: newXp,
    xpGoal,
    isMilestone: STREAK_MILESTONES.includes(newStreak),
  };
}

module.exports = {
  DAY_MS,
  DUEL_WIN_XP,
  XP_GOAL_DEFAULT,
  STREAK_MILESTONES,
  tsMs,
  deriveDuelState,
  tallyDuelVotes,
  pickDuelWinner,
  recordDelta,
  chicagoDateKey,
  chicagoYesterdayKey,
  xpPatchForWin,
};
