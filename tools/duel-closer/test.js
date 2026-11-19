/* Duel closer — self-test for duel-logic.js. No credentials, no network.
 * Run: node test.js
 */
"use strict";

const assert = require("assert");
const logic = require("./duel-logic");

const H = 3600 * 1000;
const NOW = Date.UTC(2026, 10, 18, 23, 0, 0); // a Wednesday, 5 PM Chicago

function duel(over) {
  return Object.assign({
    challengerUid: "uid-c",
    challengerName: "Casey",
    opponentUid: "uid-o",
    opponentName: "Omar",
    theme: "Night neon",
    createdAt: NOW - 30 * H,
    acceptBy: NOW - 6 * H,
    acceptedAt: null,
    submitBy: null,
    declinedAt: null,
    voteBy: null,
    winnerUid: null,
  }, over || {});
}
function entries(c, o) {
  return {
    challenger: c ? { submittedAt: c } : null,
    opponent: o ? { submittedAt: o } : null,
  };
}
function votes(c, o) {
  const out = [];
  for (let i = 0; i < c; i++) out.push({ pick: "challenger" });
  for (let i = 0; i < o; i++) out.push({ pick: "opponent" });
  return out;
}

let n = 0;
function check(name, fn) { fn(); n++; console.log("ok -", name); }

/* --- derivation --- */
check("pending: unaccepted, inside the window", () => {
  const st = logic.deriveDuelState(duel({ acceptBy: NOW + H }), entries(null, null), [], NOW);
  assert.strictEqual(st.key, "pending");
  assert.strictEqual(st.deadlineMs, NOW + H);
});
check("expired: unaccepted, past acceptBy", () => {
  const st = logic.deriveDuelState(duel(), entries(null, null), [], NOW);
  assert.strictEqual(st.key, "expired");
});
check("declined beats expiry", () => {
  const st = logic.deriveDuelState(duel({ declinedAt: NOW - H }), entries(null, null), [], NOW);
  assert.strictEqual(st.key, "declined");
});
check("submitting: accepted, inside the window", () => {
  const st = logic.deriveDuelState(
    duel({ acceptedAt: NOW - 2 * H, submitBy: NOW + 20 * H }),
    entries(NOW - H, null), [], NOW);
  assert.strictEqual(st.key, "submitting");
});
check("default: challenger submitted, opponent did not, window passed", () => {
  const st = logic.deriveDuelState(
    duel({ acceptedAt: NOW - 30 * H, submitBy: NOW - H }),
    entries(NOW - 20 * H, null), [], NOW);
  assert.strictEqual(st.key, "default");
  assert.strictEqual(st.winner, "challenger");
});
check("void: neither submitted, window passed", () => {
  const st = logic.deriveDuelState(
    duel({ acceptedAt: NOW - 30 * H, submitBy: NOW - H }),
    entries(null, null), [], NOW);
  assert.strictEqual(st.key, "void");
});
check("voting: voteBy set, inside the window", () => {
  const st = logic.deriveDuelState(
    duel({ acceptedAt: NOW - 30 * H, submitBy: NOW - 2 * H, voteBy: NOW + 10 * H }),
    entries(NOW - 20 * H, NOW - 18 * H), votes(2, 1), NOW);
  assert.strictEqual(st.key, "voting");
  assert.strictEqual(st.tallyC, 2);
  assert.strictEqual(st.tallyO, 1);
});
check("voting fallback: both in, voteBy missing (2nd submitter write failed)", () => {
  const st = logic.deriveDuelState(
    duel({ acceptedAt: NOW - 30 * H, submitBy: NOW - 2 * H }),
    entries(NOW - 20 * H, NOW - 18 * H), [], NOW);
  assert.strictEqual(st.key, "voting");
  assert.strictEqual(st.deadlineMs, NOW - 18 * H + 24 * H);
});
check("closed by votes: most votes wins", () => {
  const st = logic.deriveDuelState(
    duel({ acceptedAt: NOW - 50 * H, submitBy: NOW - 30 * H, voteBy: NOW - H }),
    entries(NOW - 40 * H, NOW - 38 * H), votes(1, 4), NOW);
  assert.strictEqual(st.key, "closed");
  assert.strictEqual(st.winner, "opponent");
});
check("closed by votes: tie breaks to the earliest submission", () => {
  const st = logic.deriveDuelState(
    duel({ acceptedAt: NOW - 50 * H, submitBy: NOW - 30 * H, voteBy: NOW - H }),
    entries(NOW - 40 * H, NOW - 38 * H), votes(2, 2), NOW);
  assert.strictEqual(st.key, "closed");
  assert.strictEqual(st.winner, "challenger"); // submitted first
});
check("closed by votes: 0-0 still crowns the earlier submitter", () => {
  const st = logic.deriveDuelState(
    duel({ acceptedAt: NOW - 50 * H, submitBy: NOW - 30 * H, voteBy: NOW - H }),
    entries(NOW - 40 * H, NOW - 38 * H), [], NOW);
  assert.strictEqual(st.key, "closed");
  assert.strictEqual(st.winner, "challenger");
});

/* --- settled state is authoritative --- */
check("settled: state closed + closeReason votes is never re-derived", () => {
  const st = logic.deriveDuelState(
    duel({ state: "closed", closeReason: "votes", winnerUid: "uid-o",
           acceptedAt: NOW - 50 * H, submitBy: NOW - 30 * H, voteBy: NOW - H }),
    entries(NOW - 40 * H, NOW - 38 * H), votes(5, 0), NOW);
  assert.strictEqual(st.key, "closed");
  assert.strictEqual(st.winner, "opponent"); // stored winner wins, not the recount
});
check("settled: default maps winnerUid to a side", () => {
  const st = logic.deriveDuelState(
    duel({ state: "closed", closeReason: "default", winnerUid: "uid-c" }),
    entries(null, null), [], NOW);
  assert.strictEqual(st.key, "default");
  assert.strictEqual(st.winner, "challenger");
  assert.strictEqual(st.byDefault, true);
});
check("settled: expired / declined / void map through", () => {
  for (const r of ["expired", "declined", "void"]) {
    const st = logic.deriveDuelState(
      duel({ state: "closed", closeReason: r, winnerUid: null }),
      entries(null, null), [], NOW);
    assert.strictEqual(st.key, r);
    assert.strictEqual(st.winner, null);
  }
});

/* --- tally + winner --- */
check("tally counts picks, ignores anything else", () => {
  const t = logic.tallyDuelVotes([{ pick: "challenger" }, { pick: "opponent" }, { pick: "nope" }, {}]);
  assert.deepStrictEqual(t, { challenger: 1, opponent: 1 });
});
check("pickDuelWinner: higher tally wins, tie goes to earlier submission", () => {
  assert.strictEqual(logic.pickDuelWinner(3, 1, 100, 50), "challenger");
  assert.strictEqual(logic.pickDuelWinner(1, 3, 100, 50), "opponent");
  assert.strictEqual(logic.pickDuelWinner(2, 2, 100, 50), "opponent");
  assert.strictEqual(logic.pickDuelWinner(2, 2, 50, 100), "challenger");
});

/* --- records --- */
check("recordDelta: winner +1 win, loser +1 loss", () => {
  assert.deepStrictEqual(logic.recordDelta(true), { wins: 1, losses: 0 });
  assert.deepStrictEqual(logic.recordDelta(false), { wins: 0, losses: 1 });
});

/* --- Chicago date keys --- */
check("chicagoDateKey: 23:00 UTC is 17:00 Chicago, same calendar day", () => {
  assert.strictEqual(logic.chicagoDateKey(new Date(NOW)), "2026-11-18");
});
check("chicagoDateKey: 02:00 UTC Nov 19 is still Nov 18 in Chicago", () => {
  assert.strictEqual(logic.chicagoDateKey(new Date(Date.UTC(2026, 10, 19, 2, 0, 0))), "2026-11-18");
});
check("chicagoYesterdayKey: one Chicago day back", () => {
  assert.strictEqual(logic.chicagoYesterdayKey(new Date(NOW)), "2026-11-17");
});

/* --- XP patch (mirrors reward-engine.js) --- */
check("xpPatch: new day resets xpToday, then adds the win", () => {
  const r = logic.xpPatchForWin(
    { xpToday: 80, dailyXp: 80, xpTodayDate: "2026-11-17", lastActivityDate: "2026-11-17", streakDays: 3 },
    25, "2026-11-18", "2026-11-17",
    { type: "duel", label: "Won a duel", meta: { duelId: "d1" } });
  assert.strictEqual(r.patch.xpToday, 25);
  assert.strictEqual(r.patch.dailyXp, 25);
  assert.strictEqual(r.patch.xpTodayDate, "2026-11-18");
  assert.strictEqual(r.newStreak, 4); // yesterday -> +1
  assert.strictEqual(r.patch.streakDays, 4);
  assert.strictEqual(r.patch.recentActivity[0].type, "duel");
  assert.strictEqual(r.patch.recentActivity[0].xp, 25);
  assert.strictEqual(r.isMilestone, false);
});
check("xpPatch: same day accumulates, streak holds", () => {
  const r = logic.xpPatchForWin(
    { xpToday: 40, xpTodayDate: "2026-11-18", lastActivityDate: "2026-11-18", streakDays: 7 },
    25, "2026-11-18", "2026-11-17",
    { type: "duel", label: "Won a duel" });
  assert.strictEqual(r.patch.xpToday, 65);
  assert.strictEqual(r.newStreak, 7);
  assert.strictEqual(r.isMilestone, true); // 7 is a milestone day
});
check("xpPatch: broken streak restarts at 1, goal defaults to 100", () => {
  const r = logic.xpPatchForWin(
    { xpToday: 10, xpTodayDate: "2026-11-10", lastActivityDate: "2026-11-10", streakDays: 12 },
    25, "2026-11-18", "2026-11-17",
    { type: "duel", label: "Won a duel" });
  assert.strictEqual(r.newStreak, 1);
  assert.strictEqual(r.patch.xpGoal, 100);
  assert.strictEqual(r.xpGoal, 100);
});
check("xpPatch: first-ever user gets a clean doc", () => {
  const r = logic.xpPatchForWin(null, 25, "2026-11-18", "2026-11-17",
    { type: "duel", label: "Won a duel" });
  assert.strictEqual(r.patch.xpToday, 25);
  assert.strictEqual(r.newStreak, 1);
  assert.strictEqual(r.patch.recentActivity.length, 1);
});
check("xpPatch: recentActivity caps at 20, newest first", () => {
  const old = Array.from({ length: 20 }, (_, i) => ({ type: "xp", label: "old " + i }));
  const r = logic.xpPatchForWin(
    { xpToday: 0, xpTodayDate: "2026-11-18", lastActivityDate: "2026-11-18", recentActivity: old },
    25, "2026-11-18", "2026-11-17",
    { type: "duel", label: "Won a duel" });
  assert.strictEqual(r.patch.recentActivity.length, 20);
  assert.strictEqual(r.patch.recentActivity[0].type, "duel");
  assert.strictEqual(r.patch.recentActivity[19].label, "old 18");
});

console.log(`\n${n} checks passed.`);
