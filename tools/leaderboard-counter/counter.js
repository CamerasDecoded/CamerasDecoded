/* Leaderboard counter — GitHub Actions scheduled job (.github/workflows/leaderboard-counter.yml).
 *
 * Counts documents in the `leaderboard` collection and writes the total to
 * `stats/leaderboard` as { totalUsers, updatedAt }. The leaderboard page reads
 * this cached value for percentile calculation instead of counting all docs
 * client-side (which costs N reads per page load at scale).
 *
 * Env:
 *   SERVICE_ACCOUNT_JSON — Firebase service-account JSON (repo secret
 *                          FIREBASE_SERVICE_ACCOUNT), same pattern as
 *                          tools/arena-closer and tools/curriculum-uploader.
 *
 * Runs daily. Uses select() with no fields for the cheapest possible count
 * (document IDs only, no field data transferred).
 */
const admin = require('firebase-admin');

async function main() {
  const saJson = process.env.SERVICE_ACCOUNT_JSON;
  if (!saJson) throw new Error('SERVICE_ACCOUNT_JSON env var is required');

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(saJson)),
  });
  const db = admin.firestore();

  // Count via ID-only select — cheapest read pattern.
  const snap = await db.collection('leaderboard').select().get();
  const total = snap.size;

  await db.collection('stats').doc('leaderboard').set({
    totalUsers: total,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`leaderboard totalUsers=${total} written to stats/leaderboard`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
