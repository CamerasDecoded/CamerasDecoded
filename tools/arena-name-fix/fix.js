/* Arena entry author-name repair — GitHub Actions version.
 *
 * Triggered by workflow_dispatch. Reads:
 *   FIX_B64               — base64 of JSON.stringify({ roundId: "c-YYYY-MM-DD" })
 *   SERVICE_ACCOUNT_JSON  — repo secret (Firebase service account JSON)
 *
 * Why this exists (2026-10-20): user-state.js builds window.USER.name from the
 * account doc's legacy `name` field (signup era), while Settings saved name
 * changes to `displayName` only. Entries submitted in that window carry the
 * stale name in two places:
 *   1. arenaRounds/{roundId}/entries/{uid}/_private/data.authorName
 *      (create-only for clients — no client-side repair path exists)
 *   2. the feedItems announce doc (type 'arena_entry', targetId = roundId):
 *      actorName + text
 *
 * The repair derives the correct name from the account itself
 * (users/{authorUid}.displayName, falling back to .name) — no name is ever
 * passed in — and re-stamps both places. Verifies with read-back.
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

async function main() {
  const b64 = process.env.FIX_B64;
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!b64 || !sa) {
    console.error("Missing FIX_B64 or SERVICE_ACCOUNT_JSON.");
    process.exit(1);
  }

  let fix;
  try {
    fix = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    if (!fix || !fix.roundId) throw new Error("no roundId");
  } catch (e) {
    console.error("FIX_B64 is not valid fix JSON: " + (e.message || e));
    process.exit(1);
  }

  const serviceAccount = JSON.parse(sa);
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  const roundRef = db.collection("arenaRounds").doc(fix.roundId);
  const roundSnap = await roundRef.get();
  if (!roundSnap.exists) {
    console.error("Round not found: " + fix.roundId);
    process.exit(1);
  }

  const entriesSnap = await roundRef.collection("entries").get();
  console.log("Entries in " + fix.roundId + ": " + entriesSnap.size);
  let repaired = 0;

  for (const entryDoc of entriesSnap.docs) {
    const privRef = entryDoc.ref.collection("_private").doc("data");
    const privSnap = await privRef.get();
    if (!privSnap.exists) {
      console.log("  entry " + entryDoc.id + ": no _private/data, skipped");
      continue;
    }
    const priv = privSnap.data();
    const authorUid = priv.authorUid || entryDoc.id;

    const userSnap = await db.collection("users").doc(authorUid).get();
    if (!userSnap.exists) {
      console.log("  entry " + entryDoc.id + ": author account not found, skipped");
      continue;
    }
    const correctName = userSnap.data().displayName || userSnap.data().name;
    if (!correctName) {
      console.log("  entry " + entryDoc.id + ": account has no name, skipped");
      continue;
    }
    if (priv.authorName === correctName) {
      console.log("  entry " + entryDoc.id + ": authorName already current");
      continue;
    }

    await privRef.update({ authorName: correctName });
    console.log("  entry " + entryDoc.id + ": authorName '" + priv.authorName + "' -> '" + correctName + "'");

    const feedSnap = await db.collection("feedItems")
      .where("actorUid", "==", authorUid)
      .where("type", "==", "arena_entry")
      .where("targetId", "==", fix.roundId)
      .get();
    for (const feedDoc of feedSnap.docs) {
      await feedDoc.ref.update({
        actorName: correctName,
        text: correctName + " entered today\u2019s Arena"
      });
      console.log("    feed announce " + feedDoc.id + " re-stamped");
    }
    repaired++;
  }

  // Read-back verification
  let verified = 0;
  const entries2 = await roundRef.collection("entries").get();
  for (const entryDoc of entries2.docs) {
    const privSnap = await entryDoc.ref.collection("_private").doc("data").get();
    if (!privSnap.exists) continue;
    const u = await db.collection("users").doc(privSnap.data().authorUid || entryDoc.id).get();
    const want = u.exists ? (u.data().displayName || u.data().name) : null;
    if (want && privSnap.data().authorName === want) verified++;
  }
  console.log("Repaired: " + repaired + " | verified current: " + verified + "/" + entries2.size);
  if (verified !== entries2.size) {
    console.error("Verification mismatch — not every entry carries its account's current name.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
