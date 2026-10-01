/* Arena closer — pure logic (no Firestore, no network).
 *
 * Extracted so it can be unit-tested without credentials.
 * All numbers are the spec §5 economy, locked per the user 2026-10-01:
 *   submit +10 · vote received +2×weight · win +50 mission / +25 challenge
 *   tiers: 0 (0–99), 1 "Trusted eye" (100–499), 2 "Decisive eye" (500+)
 */
"use strict";

const POINTS_SUBMIT = 10;
const POINTS_VOTE_RECEIVED_PER_WEIGHT = 2;
const POINTS_WIN_MISSION = 50;
const POINTS_WIN_CHALLENGE = 25;

const TIER_TRUSTED_AT = 100;   // score >= 100  -> tier 1
const TIER_DECISIVE_AT = 500;  // score >= 500  -> tier 2

/** Vote-weight tier for a Signal Score. */
function tierFor(score) {
  const s = Number(score) || 0;
  if (s >= TIER_DECISIVE_AT) return 2;
  if (s >= TIER_TRUSTED_AT) return 1;
  return 0;
}

/**
 * Tally weighted votes per entry.
 * @param {Array<{entryId:string, submittedAtMs:number}>} entries
 * @param {Object<string, Array<{voterWeight:number}>>} votesByEntryId
 * @returns {Array<{entryId:string, submittedAtMs:number, weightedTotal:number, voteCount:number}>}
 */
function tallyWeightedVotes(entries, votesByEntryId) {
  return entries.map((e) => {
    const votes = votesByEntryId[e.entryId] || [];
    let weightedTotal = 0;
    for (const v of votes) weightedTotal += POINTS_VOTE_RECEIVED_PER_WEIGHT * (Number(v.voterWeight) || 0);
    return {
      entryId: e.entryId,
      submittedAtMs: e.submittedAtMs,
      weightedTotal,
      voteCount: votes.length,
    };
  });
}

/**
 * Winner = highest weighted tally; ties break to earliest submittedAt.
 * @param {Array<{entryId:string, submittedAtMs:number, weightedTotal:number}>} tallies
 * @returns {string|null} winning entryId, or null when there are no tallies
 */
function pickWinner(tallies) {
  if (!tallies || !tallies.length) return null;
  let best = tallies[0];
  for (let i = 1; i < tallies.length; i++) {
    const t = tallies[i];
    if (t.weightedTotal > best.weightedTotal) best = t;
    else if (t.weightedTotal === best.weightedTotal && t.submittedAtMs < best.submittedAtMs) best = t;
  }
  return best.entryId;
}

/**
 * Signal Score delta for one participant at close time.
 * @param {Object} opts
 * @param {number} opts.votesReceivedWeighted  sum of (2 × voterWeight) over votes received
 * @param {number} opts.voteCount              raw number of votes received
 * @param {boolean} opts.isWinner
 * @param {"mission"|"challenge"} opts.lane
 * @returns {{scoreDelta:number, submissionsDelta:number, votesReceivedDelta:number, winsDelta:number}}
 */
function scoreDelta({ votesReceivedWeighted, voteCount, isWinner, lane }) {
  let scoreDelta = POINTS_SUBMIT + (Number(votesReceivedWeighted) || 0);
  let winsDelta = 0;
  if (isWinner) {
    scoreDelta += lane === "mission" ? POINTS_WIN_MISSION : POINTS_WIN_CHALLENGE;
    winsDelta = 1;
  }
  return {
    scoreDelta,
    submissionsDelta: 1,
    votesReceivedDelta: Number(voteCount) || 0,
    winsDelta,
  };
}

/**
 * Apply a delta to an existing arenaScores doc body, recomputing tier.
 * @param {Object|null} prev  existing doc data (null = first participation)
 * @param {Object} delta       as returned by scoreDelta()
 * @returns {{score:number, submissions:number, votesReceived:number, wins:number, tier:number}}
 */
function applyScoreDelta(prev, delta) {
  const p = prev || {};
  const score = (Number(p.score) || 0) + delta.scoreDelta;
  return {
    score,
    submissions: (Number(p.submissions) || 0) + delta.submissionsDelta,
    votesReceived: (Number(p.votesReceived) || 0) + delta.votesReceivedDelta,
    wins: (Number(p.wins) || 0) + delta.winsDelta,
    tier: tierFor(score),
  };
}

module.exports = {
  POINTS_SUBMIT,
  POINTS_VOTE_RECEIVED_PER_WEIGHT,
  POINTS_WIN_MISSION,
  POINTS_WIN_CHALLENGE,
  TIER_TRUSTED_AT,
  TIER_DECISIVE_AT,
  tierFor,
  tallyWeightedVotes,
  pickWinner,
  scoreDelta,
  applyScoreDelta,
};
