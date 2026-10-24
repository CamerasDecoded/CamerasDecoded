/* Arena votes report — GitHub Actions job (.github/workflows/arena-votes-report.yml).
 *
 * Reads one Arena round's vote tallies with the project's service account
 * and publishes a tiny machine-readable status file to the dedicated
 * `watch-state` branch (`arena-votes.json`). The nightly Arena watchdog
 * (11:45 PM Chicago) dispatches this workflow for tonight's round and
 * reads the file instead of the unauthenticated Firestore REST path,
 * which returns HTTP 403 on the votes subcollection.
 *
 * Why a workflow, not a direct read: the watchdog agent has no service
 * account locally; the service-account JSON lives only in the
 * FIREBASE_SERVICE_ACCOUNT repo secret. This mirrors the pro-requests
 * watch (tools/pro-requests/report.js) exactly: service account ->
 * firebase-admin -> JSON on the public watch-state branch.
 *
 * Vote math is NOT reimplemented here: tallies come from
 * tools/arena-closer/arena-logic.js (tallyWeightedVotes / pickWinner),
 * the same code the closer uses to crown. weightedTotal = 2 x voterWeight
 * summed per entry; winner = highest weightedTotal, ties to earliest
 * submittedAt. If this file and the closer ever disagree, the closer wins.
 *
 * Privacy: the published file contains entry ids and counts ONLY — no
 * voter uids, no names, no image URLs. Entry ids and counts are already
 * publicly readable through the app's own entry list.
 *
 * Dispatch-only (no schedule): the watchdog dispatches with an explicit
 * roundId at 11:45 PM Chicago and polls for the fresh file. A fixed UTC
 * schedule cannot cover both CDT and CST (the 11 PM close and the 11:45
 * watchdog shift by an hour at the Nov 1 fall-back), so a schedule would
 * publish the wrong round or incomplete totals half the year.
 *
 * Env:
 *   SERVICE_ACCOUNT_JSON — Firebase service-account JSON (repo secret
 *                          FIREBASE_SERVICE_ACCOUNT).
 *   GITHUB_TOKEN         — auto-provided in Actions (permissions:
 *                          contents: write).
 *   GITHUB_REPOSITORY    — auto-provided (owner/repo).
 *   ROUND_ID             — e.g. c-2026-10-24 (required).
 *
 * Output file shape:
 *   { "generatedAt": "<ISO>", "roundId": "c-2026-10-24",
 *     "round": { "state": "closed", "lane": "challenge",
 *                "winnerEntryId": "4qEs..." | null, "title": "..." | null },
 *     "entries": [ { "entryId": "...", "voteCount": 1,
 *                    "weightedTotal": 4 } ],
 *     "totalVotes": 1, "totalWeighted": 4,
 *     "winnerEntryId": "4qEs..." | null, "winnerWeightedTotal": 4,
 *     "winnerVoteCount": 1 }
 *
 * Failure behavior: if any Firestore read fails, exit non-zero WITHOUT
 * touching the status file — a stale file is honest, a wrong empty one
 * would fake "no votes".
 */
"use strict";

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const logic = require("../arena-closer/arena-logic.js");

const STATE_BRANCH = "watch-state";
const STATE_PATH = "arena-votes.json";
const COMMIT_MESSAGE = "arena-votes report";

const log = (...a) => console.log(new Date().toISOString(), ...a);

/* ---------- pure functions (unit-testable) ---------- */

/**
 * Build the status-file payload from a round doc and per-entry tallies.
 * @param {string} roundId
 * @param {Object} round  round doc data (state, lane, winnerEntryId, title)
 * @param {Array<{entryId:string, submittedAtMs:number}>} entries
 * @param {Object<string, Array<{voterWeight:number}>>} votesByEntryId
 */
function buildPayload(roundId, round, entries, votesByEntryId) {
  const tallies = logic.tallyWeightedVotes(entries, votesByEntryId);
  const winnerEntryId = logic.pickWinner(tallies);
  const winner = tallies.find((t) => t.entryId === winnerEntryId) || null;
  return {
    generatedAt: new Date().toISOString(),
    roundId,
    round: {
      state: round.state || null,
      lane: round.lane || null,
      winnerEntryId: round.winnerEntryId || null,
      title: round.title || null,
    },
    entries: tallies.map((t) => ({
      entryId: t.entryId,
      voteCount: t.voteCount,
      weightedTotal: t.weightedTotal,
    })),
    totalVotes: tallies.reduce((s, t) => s + t.voteCount, 0),
    totalWeighted: tallies.reduce((s, t) => s + t.weightedTotal, 0),
    winnerEntryId: winnerEntryId,
    winnerWeightedTotal: winner ? winner.weightedTotal : 0,
    winnerVoteCount: winner ? winner.voteCount : 0,
  };
}

/* ---------- GitHub Git Data API (REST contents endpoint) ---------- */

function ghFetchImpl() {
  if (typeof global.fetch === "function") return global.fetch.bind(global);
  throw new Error("no fetch implementation available");
}

async function ghJson(fetchImpl, token, method, url, body) {
  const res = await fetchImpl(url, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "arena-votes-report",
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { /* ignore */ }
  return { status: res.status, json };
}

function repoApi(repo) {
  return "https://api.github.com/repos/" + repo;
}

/**
 * Ensure the state branch exists (create from main's tip when missing).
 * Returns { created: bool }.
 */
async function ensureBranch(fetchImpl, token, repo) {
  const base = repoApi(repo);
  const got = await ghJson(fetchImpl, token, "GET", base + "/git/ref/heads/" + STATE_BRANCH);
  if (got.status === 200) return { created: false };
  if (got.status !== 404) {
    throw new Error("branch lookup failed: " + got.status);
  }
  const mainRef = await ghJson(fetchImpl, token, "GET", base + "/git/ref/heads/main");
  if (mainRef.status !== 200 || !mainRef.json || !mainRef.json.object) {
    throw new Error("could not read main ref: " + mainRef.status);
  }
  const created = await ghJson(fetchImpl, token, "POST", base + "/git/refs", {
    ref: "refs/heads/" + STATE_BRANCH,
    sha: mainRef.json.object.sha,
  });
  if (created.status !== 201) {
    throw new Error("branch create failed: " + created.status);
  }
  log("created branch", STATE_BRANCH, "from main tip");
  return { created: true };
}

/** Write the status file on the state branch (create or update). */
async function writeStateFile(fetchImpl, token, repo, contentText) {
  const base = repoApi(repo);
  const encoded = encodeURIComponent(STATE_PATH);
  const current = await ghJson(
    fetchImpl, token, "GET",
    base + "/contents/" + encoded + "?ref=" + encodeURIComponent(STATE_BRANCH)
  );
  const body = {
    message: COMMIT_MESSAGE,
    content: Buffer.from(contentText, "utf8").toString("base64"),
    branch: STATE_BRANCH,
  };
  if (current.status === 200 && current.json && current.json.sha) {
    body.sha = current.json.sha;
    log("updating existing", STATE_PATH, "on", STATE_BRANCH);
  } else if (current.status === 404) {
    log("creating", STATE_PATH, "on", STATE_BRANCH);
  } else {
    throw new Error("state file lookup failed: " + current.status);
  }
  const put = await ghJson(fetchImpl, token, "PUT", base + "/contents/" + encoded, body);
  if (put.status !== 200 && put.status !== 201) {
    throw new Error("state file write failed: " + put.status);
  }
  log("state file written:", put.status);
}

/* ---------- main ---------- */

async function readRound(db, roundId) {
  const roundRef = db.collection("arenaRounds").doc(roundId);
  const roundSnap = await roundRef.get();
  if (!roundSnap.exists) {
    throw new Error("round doc missing: " + roundId);
  }
  const round = roundSnap.data() || {};
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
      submittedAtMs: ed.submittedAt && ed.submittedAt.toMillis
        ? ed.submittedAt.toMillis() : 0,
    });
  }
  return { round, entries, votesByEntryId };
}

async function main() {
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const roundId = process.env.ROUND_ID;
  if (!sa) { console.error("missing SERVICE_ACCOUNT_JSON"); process.exit(1); }
  if (!token) { console.error("missing GITHUB_TOKEN"); process.exit(1); }
  if (!repo) { console.error("missing GITHUB_REPOSITORY"); process.exit(1); }
  if (!roundId) { console.error("missing ROUND_ID"); process.exit(1); }

  // Firestore read FIRST — any failure exits here, before the status
  // file is touched.
  let db;
  try {
    initializeApp({ credential: cert(JSON.parse(sa)) });
    db = getFirestore();
  } catch (e) {
    console.error("firebase init failed:", e && e.message);
    process.exit(1);
  }

  let data;
  try {
    data = await readRound(db, roundId);
  } catch (e) {
    console.error("Firestore read failed — status file left untouched:", e && e.message);
    process.exit(1);
  }
  log("round", roundId, "entries:", data.entries.length);

  const payload = buildPayload(roundId, data.round, data.entries, data.votesByEntryId);
  log("totalVotes:", payload.totalVotes, "totalWeighted:", payload.totalWeighted,
      "winner:", payload.winnerEntryId);
  const fetchImpl = ghFetchImpl();
  await ensureBranch(fetchImpl, token, repo);
  await writeStateFile(fetchImpl, token, repo, JSON.stringify(payload, null, 2) + "\n");
  log("done");
}

if (require.main === module) {
  main().catch((e) => {
    console.error("fatal:", e && e.message);
    process.exit(1);
  });
}

/* Exported for local unit verification only. */
module.exports = { buildPayload, ensureBranch, writeStateFile };
