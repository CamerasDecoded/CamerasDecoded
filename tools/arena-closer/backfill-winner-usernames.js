/* Arena winner usernames backfill — GitHub Actions job
 * (.github/workflows/arena-winner-usernames-backfill.yml).
 *
 * Stamps `actorUsername` onto arena_winner feed items that were written
 * before the closer started stamping it (2026-10-25). The public landing
 * carousel shows @username, never a real name — and the landing cannot
 * resolve a username itself (the users collection is not publicly
 * readable), so the username has to live on the public winner item.
 *
 * What it does, exactly:
 *   - lists feedItems where type == "arena_winner" (limit 100),
 *   - skips crew-battle items (actorUid starts with "crew:") and items
 *     that already carry actorUsername,
 *   - for each remaining item, reads users/{actorUid} with the service
 *     account and — only when that user doc carries a non-empty
 *     `username` string — writes ONLY { actorUsername: username } onto
 *     the feed item, then reads the item back to verify the field stuck.
 *   - a winner whose user doc has no username is left alone and logged
 *     as skipped: the carousel renders that win with photo + challenge
 *     + date and no name at all. No username is ever invented, and the
 *     real name (actorName) is never written to the front door.
 *
 * Nothing else is touched: no other field on any feed item, no round,
 * no user doc, no rules change. Re-running it is a no-op for items
 * that already carry a username.
 *
 * Env:
 *   SERVICE_ACCOUNT_JSON — Firebase service-account JSON (repo secret
 *                          FIREBASE_SERVICE_ACCOUNT).
 */
"use strict";

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const log = (...a) => console.log(new Date().toISOString(), ...a);

async function main() {
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!sa) { console.error("missing SERVICE_ACCOUNT_JSON"); process.exit(1); }

  let db;
  try {
    initializeApp({ credential: cert(JSON.parse(sa)) });
    db = getFirestore();
  } catch (e) {
    console.error("firebase init failed:", e && e.message);
    process.exit(1);
  }

  let items;
  try {
    const snap = await db.collection("feedItems")
      .where("type", "==", "arena_winner").limit(100).get();
    items = snap.docs;
  } catch (e) {
    console.error("winner items read failed:", e && e.message);
    process.exit(1);
  }
  log("arena_winner items found:", items.length);

  let stamped = 0, skippedNoUsername = 0, skippedAlready = 0, skippedCrew = 0;
  for (const doc of items) {
    const data = doc.data() || {};
    if (typeof data.actorUid === "string" && data.actorUid.indexOf("crew:") === 0) {
      skippedCrew++;
      continue;
    }
    if (typeof data.actorUsername === "string" && data.actorUsername) {
      skippedAlready++;
      continue;
    }
    const uid = data.actorUid;
    if (typeof uid !== "string" || !uid) {
      log("skip", doc.id, ": no actorUid");
      skippedNoUsername++;
      continue;
    }
    let userSnap;
    try {
      userSnap = await db.collection("users").doc(uid).get();
    } catch (e) {
      console.error("user read failed for", doc.id, ":", e && e.message);
      process.exit(1);
    }
    const username = userSnap && userSnap.exists
      ? (userSnap.data() || {}).username : null;
    if (typeof username !== "string" || !username) {
      log("skip", doc.id, "targetId", data.targetId || null, ": user doc has no username");
      skippedNoUsername++;
      continue;
    }
    try {
      await doc.ref.update({ actorUsername: username });
      const check = await doc.ref.get();
      const got = (check.data() || {}).actorUsername;
      if (got !== username) throw new Error("read-back mismatch: " + got);
    } catch (e) {
      console.error("stamp failed for", doc.id, ":", e && e.message);
      process.exit(1);
    }
    log("stamped", doc.id, "targetId", data.targetId || null, "-> @" + username);
    stamped++;
  }

  log("done: stamped", stamped, "| already had username", skippedAlready,
      "| crew items", skippedCrew, "| no username on user doc", skippedNoUsername);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("fatal:", e && e.message);
    process.exit(1);
  });
}
