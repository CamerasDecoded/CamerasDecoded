/* Pro requests report — GitHub Actions job (.github/workflows/pro-requests-report.yml).
 *
 * Reads the pending Pro-request queue and publishes a tiny machine-readable
 * status file to the dedicated `watch-state` branch (`pro-requests.json`).
 * The agent-side watcher diffs that file hourly and only wakes the owner
 * when a NEW pending request appears — no tokens burned on empty checks.
 *
 * Service-account pattern mirrors tools/arena-closer and tools/cynetis-post
 * exactly: FIREBASE_SERVICE_ACCOUNT repo secret -> firebase-admin.
 *
 * Env:
 *   SERVICE_ACCOUNT_JSON — Firebase service-account JSON (repo secret
 *                          FIREBASE_SERVICE_ACCOUNT).
 *   GITHUB_TOKEN         — auto-provided in Actions (permissions:
 *                          contents: write).
 *   GITHUB_REPOSITORY    — auto-provided (owner/repo).
 *
 * Output file shape (never emails, never display names):
 *   { "generatedAt": "<ISO>", "pending": [ { "uid": "...", "plan": "annual",
 *     "requestedAt": "<ISO or null>" } ] }
 * pending is sorted by requestedAt ascending (nulls last).
 *
 * Failure behavior: if the Firestore read fails, exit non-zero WITHOUT
 * touching the status file — a stale file is honest, a wrong empty one
 * would fake "no requests".
 */
"use strict";

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const STATE_BRANCH = "watch-state";
const STATE_PATH = "pro-requests.json";
const COMMIT_MESSAGE = "pro-requests report";

const log = (...a) => console.log(new Date().toISOString(), ...a);

/* ---------- pure functions (unit-testable) ---------- */

/** Shape one Firestore doc into the public record. Only uid + plan + time. */
function shapeDoc(doc) {
  const d = (doc && typeof doc.data === "function" ? doc.data() : doc) || {};
  const uid = (doc && doc.id) || d.uid || null;
  const plan = d.plan != null ? String(d.plan) : null;
  let requestedAt = null;
  const ts = d.createdAt;
  try {
    if (ts && typeof ts.toDate === "function") {
      requestedAt = ts.toDate().toISOString();
    } else if (ts instanceof Date) {
      requestedAt = ts.toISOString();
    } else if (typeof ts === "string" && ts) {
      const t = new Date(ts);
      if (!Number.isNaN(t.getTime())) requestedAt = t.toISOString();
    }
  } catch (e) { requestedAt = null; }
  return { uid, plan, requestedAt };
}

/** Sort pending records oldest-first; records with no time go last. */
function sortPending(records) {
  return records.slice().sort((a, b) => {
    if (!a.requestedAt && !b.requestedAt) return 0;
    if (!a.requestedAt) return 1;
    if (!b.requestedAt) return -1;
    return a.requestedAt < b.requestedAt ? -1 : a.requestedAt > b.requestedAt ? 1 : 0;
  });
}

/** Build the status-file body. */
function buildPayload(records) {
  return {
    generatedAt: new Date().toISOString(),
    pending: sortPending(records),
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
      "User-Agent": "pro-requests-report",
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

async function readPending(db) {
  const snap = await db
    .collection("proRequests")
    .where("status", "==", "pending")
    .get();
  const records = [];
  snap.forEach((doc) => {
    const r = shapeDoc(doc);
    if (r.uid) records.push(r);
  });
  return records;
}

async function main() {
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!sa) { console.error("missing SERVICE_ACCOUNT_JSON"); process.exit(1); }
  if (!token) { console.error("missing GITHUB_TOKEN"); process.exit(1); }
  if (!repo) { console.error("missing GITHUB_REPOSITORY"); process.exit(1); }

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

  let records;
  try {
    records = await readPending(db);
  } catch (e) {
    console.error("Firestore read failed — status file left untouched:", e && e.message);
    process.exit(1);
  }
  log("pending pro requests:", records.length);

  const payload = buildPayload(records);
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
module.exports = { shapeDoc, sortPending, buildPayload, ensureBranch, writeStateFile };
