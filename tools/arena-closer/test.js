/* Self-test for the closer's pure logic (arena-logic.js).
 * Run: node test.js  (no credentials, no network)
 * Proves per spec §5: weighted tally, tie-break to earliest submittedAt,
 * points (+10 submit / +2×weight per vote / +50 mission win / +25 challenge win),
 * and tier thresholds (0: <100, 1: 100–499, 2: 500+).
 */
"use strict";
const assert = require("node:assert/strict");
const L = require("./arena-logic");

// ---- economy constants per spec ----
assert.equal(L.POINTS_SUBMIT, 10);
assert.equal(L.POINTS_VOTE_RECEIVED_PER_WEIGHT, 2);
assert.equal(L.POINTS_WIN_MISSION, 50);
assert.equal(L.POINTS_WIN_CHALLENGE, 25);
assert.equal(L.TIER_TRUSTED_AT, 100);
assert.equal(L.TIER_DECISIVE_AT, 500);
console.log("constants: submit=10, vote-per-weight=2, win mission=50 / challenge=25, tiers at 100/500 — OK");

// ---- weighted tally ----
const entries = [
  { entryId: "u1", submittedAtMs: 1000 },
  { entryId: "u2", submittedAtMs: 2000 },
  { entryId: "u3", submittedAtMs: 3000 },
];
const votes = {
  u1: [{ voterWeight: 1 }, { voterWeight: 2 }],        // 2*1 + 2*2 = 6
  u2: [{ voterWeight: 3 }, { voterWeight: 3 }, { voterWeight: 1 }], // 6+6+2 = 14
  u3: [],                                              // 0
};
const tallies = L.tallyWeightedVotes(entries, votes);
assert.deepEqual(tallies.find(t => t.entryId === "u1").weightedTotal, 6);
assert.deepEqual(tallies.find(t => t.entryId === "u2").weightedTotal, 14);
assert.deepEqual(tallies.find(t => t.entryId === "u3").weightedTotal, 0);
assert.deepEqual(tallies.find(t => t.entryId === "u2").voteCount, 3);
console.log("tally: weighted votes summed as 2×weight — OK (u1=6, u2=14, u3=0)");

// ---- winner: highest tally wins ----
assert.equal(L.pickWinner(tallies), "u2");
console.log("winner: highest weighted tally wins — OK");

// ---- tie-break: earliest submittedAt ----
const tieEntries = [
  { entryId: "late", submittedAtMs: 5000 },
  { entryId: "early", submittedAtMs: 1000 },
];
const tieVotes = { late: [{ voterWeight: 2 }], early: [{ voterWeight: 2 }] }; // both 4
const tieTallies = L.tallyWeightedVotes(tieEntries, tieVotes);
assert.equal(L.pickWinner(tieTallies), "early");
console.log("tie-break: equal tallies -> earliest submittedAt wins — OK");

// ---- no entries -> null ----
assert.equal(L.pickWinner([]), null);
console.log("no entries -> no winner (null) — OK");

// ---- tier thresholds ----
const tiers = [[0, 0], [99, 0], [100, 1], [499, 1], [500, 2], [1200, 2]];
for (const [score, want] of tiers) assert.equal(L.tierFor(score), want, `tierFor(${score})`);
console.log("tiers: 0–99 -> 0, 100–499 -> 1, 500+ -> 2 — OK");

// ---- score delta: submission + votes received ----
let d = L.scoreDelta({ votesReceivedWeighted: 14, voteCount: 3, isWinner: false, lane: "challenge" });
assert.deepEqual(d, { scoreDelta: 24, submissionsDelta: 1, votesReceivedDelta: 3, winsDelta: 0 });
console.log("delta (challenge, 3 votes, no win): 10 + 14 = 24 — OK");

// ---- score delta: mission win ----
d = L.scoreDelta({ votesReceivedWeighted: 6, voteCount: 2, isWinner: true, lane: "mission" });
assert.deepEqual(d, { scoreDelta: 66, submissionsDelta: 1, votesReceivedDelta: 2, winsDelta: 1 });
console.log("delta (mission win, 2 votes): 10 + 6 + 50 = 66, wins+1 — OK");

// ---- score delta: challenge win ----
d = L.scoreDelta({ votesReceivedWeighted: 0, voteCount: 0, isWinner: true, lane: "challenge" });
assert.equal(d.scoreDelta, 35);
console.log("delta (challenge win, no votes): 10 + 25 = 35 — OK");

// ---- applyScoreDelta: new doc, tier recompute on growth ----
let s = L.applyScoreDelta(null, L.scoreDelta({ votesReceivedWeighted: 0, voteCount: 0, isWinner: true, lane: "mission" }));
assert.deepEqual(s, { score: 60, submissions: 1, votesReceived: 0, wins: 1, tier: 0 });
console.log("new score doc: 60, tier 0 — OK");

s = L.applyScoreDelta({ score: 80, submissions: 2, votesReceived: 9, wins: 0 },
  L.scoreDelta({ votesReceivedWeighted: 14, voteCount: 3, isWinner: true, lane: "challenge" }));
// 80 + 10 + 14 + 25 = 129 -> tier 1
assert.deepEqual(s, { score: 129, submissions: 3, votesReceived: 12, wins: 1, tier: 1 });
console.log("existing doc 80 -> 129 crosses 100 -> tier 1 (Trusted eye) — OK");

s = L.applyScoreDelta({ score: 480, submissions: 9, votesReceived: 40, wins: 1 },
  L.scoreDelta({ votesReceivedWeighted: 0, voteCount: 0, isWinner: false, lane: "mission" }));
// 480 + 10 = 490 -> tier 1 still
assert.equal(s.tier, 1);
s = L.applyScoreDelta({ score: 490, submissions: 9, votesReceived: 40, wins: 1 },
  L.scoreDelta({ votesReceivedWeighted: 20, voteCount: 4, isWinner: true, lane: "mission" }));
// 490 + 10 + 20 + 50 = 570 -> tier 2
assert.deepEqual([s.score, s.tier], [570, 2]);
console.log("490 -> 570 crosses 500 -> tier 2 (Decisive eye) — OK");

console.log("\nALL SELF-TESTS PASSED");
