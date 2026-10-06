/* Arena entry submitter — GitHub Actions version.
 *
 * Triggered by workflow_dispatch. Reads:
 *   ENTRIES_B64           — base64 of JSON.stringify({ roundId, entries: [{ username, displayName, imgUrl }] })
 *   SERVICE_ACCOUNT_JSON  — repo secret (Firebase service account JSON)
 *
 * For each entry:
 *   1. Looks up the UID by querying users collection for username/displayName
 *   2. Checks if entry already exists (skips if so)
 *   3. Creates arenaRounds/{roundId}/entries/{uid} = { imgUrl, submittedAt, roundId, lane, swept }
 *   4. Creates _private/data = { authorUid, authorName, deleteUrl: null }
 *
 * Note: deleteUrl is null because images are hosted on GitHub (not imgbb).
 * The sweeper will skip these (no delete URL), which is fine for test entries.
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

async function main() {
  const b64 = process.env.ENTRIES_B64;
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!b64 || !sa) {
    console.error("Missing ENTRIES_B64 or SERVICE_ACCOUNT_JSON.");
    process.exit(1);
  }

  let input;
  try {
    const raw = Buffer.from(b64, "base64");
    input = JSON.parse(raw.toString("utf8"));
    if (!input || !input.roundId || !Array.isArray(input.entries)) {
      throw new Error("Invalid input format");
    }
  } catch (e) {
    console.error("ENTRIES_B64 is not valid JSON: " + (e.message || e));
    process.exit(1);
  }

  const serviceAccount = JSON.parse(sa);
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  const roundId = input.roundId;
  const results = [];

  for (const entry of input.entries) {
    const { username, displayName, imgUrl } = entry;
    if (!username || !imgUrl) {
      console.error(`Skipping invalid entry: ${JSON.stringify(entry)}`);
      results.push({ username, status: "skipped", reason: "invalid" });
      continue;
    }

    try {
      // Find UID by username in users collection
      let uid = null;
      let authorName = displayName || username;

      // Try users collection by username field
      const userQuery = await db.collection("users")
        .where("username", "==", username)
        .limit(1)
        .get();

      if (!userQuery.empty) {
        const doc = userQuery.docs[0];
        uid = doc.id;
        const data = doc.data() || {};
        authorName = data.displayName || data.name || authorName;
      } else {
        // Try by displayName
        const nameQuery = await db.collection("users")
          .where("displayName", "==", displayName)
          .limit(1)
          .get();
        if (!nameQuery.empty) {
          const doc = nameQuery.docs[0];
          uid = doc.id;
          authorName = displayName;
        }
      }

      // Fallback: check leaderboard collection
      if (!uid) {
        const lbQuery = await db.collection("leaderboard")
          .where("displayName", "==", displayName)
          .limit(1)
          .get();
        if (!lbQuery.empty) {
          uid = lbQuery.docs[0].id;
        }
      }

      if (!uid) {
        console.error(`Could not find UID for ${username} (${displayName})`);
        results.push({ username, status: "failed", reason: "uid_not_found" });
        continue;
      }

      // Check if entry already exists
      const entryRef = db.collection("arenaRounds").doc(roundId)
        .collection("entries").doc(uid);
      const existing = await entryRef.get();
      if (existing.exists) {
        console.log(`Entry already exists for ${username}, skipping`);
        results.push({ username, uid, status: "skipped", reason: "already_exists" });
        continue;
      }

      // Create entry
      await entryRef.set({
        imgUrl: imgUrl,
        submittedAt: FieldValue.serverTimestamp(),
        roundId: roundId,
        lane: "daily",
        swept: false,
      });

      // Create _private/data
      await entryRef.collection("_private").doc("data").set({
        authorUid: uid,
        authorName: authorName,
        deleteUrl: null, // GitHub-hosted, no delete URL
      });

      console.log(`Created entry for ${username} (${uid})`);
      results.push({ username, uid, status: "success" });
    } catch (e) {
      console.error(`Failed for ${username}: ${e.message}`);
      results.push({ username, status: "failed", reason: e.message });
    }
  }

  console.log("\n=== Results ===");
  console.log(JSON.stringify(results, null, 2));

  const successCount = results.filter(r => r.status === "success").length;
  console.log(`\n${successCount}/${input.entries.length} entries created`);
}

main().catch((e) => {
  console.error("Fatal: " + (e.message || e));
  process.exit(1);
});
