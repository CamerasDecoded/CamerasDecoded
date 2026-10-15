/* Cynetis-7 daily Signal post — GitHub Actions version.
 *
 * Once a day, Cynetis-7 posts to the Signal as itself: a field tip or a
 * shoot prompt from transmissions.json, rotated deterministically by the
 * Chicago calendar date (same pick all day, advances at Chicago midnight,
 * wraps every 28 days). It is labeled as what it is — actor "Cynetis-7",
 * type cynetis_post, rendered with a Transmission chip.
 *
 * Writes feedItems/cynetis-<yyyy-MM-dd> (Chicago date) — a deterministic
 * doc id, so reruns and double-fires skip instead of duplicating.
 *
 * Env:
 *   SERVICE_ACCOUNT_JSON — repo secret (Firebase service account JSON)
 *   CYNETIS_DATE         — optional yyyy-MM-dd override (testing)
 * Flags:
 *   --dry-run — print the doc that would be written; no Firebase touched.
 */
const fs = require("fs");
const path = require("path");

function chicagoToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function pickFor(dateStr, pool) {
  const parts = dateStr.split("-").map(Number);
  const days = Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  return pool[days % pool.length];
}

async function main() {
  const pool = JSON.parse(
    fs.readFileSync(path.join(__dirname, "transmissions.json"), "utf8")
  );
  const dateStr = process.env.CYNETIS_DATE || chicagoToday();
  const doc = {
    type: "cynetis_post",
    actorUid: "cynetis-7",
    actorName: "Cynetis-7",
    actorAvatar: "https://camerasdecoded.com/cynetis-avatar.png",
    text: pickFor(dateStr, pool),
    targetType: "profile",
    targetId: "cynetis-7",
    visibility: "public",
  };
  const id = "cynetis-" + dateStr;

  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify({ id: id, doc: doc }, null, 2));
    return;
  }

  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!sa) {
    console.error("Missing SERVICE_ACCOUNT_JSON.");
    process.exit(1);
  }
  const { initializeApp, cert } = require("firebase-admin/app");
  const { getFirestore, FieldValue } = require("firebase-admin/firestore");
  initializeApp({ credential: cert(JSON.parse(sa)) });
  const db = getFirestore();

  const ref = db.collection("feedItems").doc(id);
  const existing = await ref.get();
  if (existing.exists) {
    console.log("Already posted for " + dateStr + " — skipping.");
    return;
  }
  await ref.set(Object.assign({}, doc, { createdAt: FieldValue.serverTimestamp() }));
  const back = await ref.get();
  if (!back.exists) {
    console.error("Write did not read back for " + id);
    process.exit(1);
  }
  console.log("Posted " + id + ": " + back.data().text);
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
