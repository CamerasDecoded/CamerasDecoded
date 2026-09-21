/* Field Manual curriculum uploader — GitHub Actions version.
 *
 * Triggered by workflow_dispatch. Reads:
 *   CURRICULUM_VERSION — version string, e.g. "2026-09-21-visuals"
 *   CURRICULUM_B64     — base64 of JSON.stringify({ version, chapters })
 *   SERVICE_ACCOUNT_JSON — repo secret (Firebase service account JSON)
 *
 * Writes guideContent/curriculum = { version, json, updatedAt }, where
 * json is the whole curriculum as one string (lesson blocks are
 * arrays-inside-arrays, which Firestore rejects as nested entities —
 * hence the string envelope). Verifies with a read-back before exiting.
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

async function main() {
  const version = process.env.CURRICULUM_VERSION;
  const b64 = process.env.CURRICULUM_B64;
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!version || !b64 || !sa) {
    console.error("Missing CURRICULUM_VERSION, CURRICULUM_B64, or SERVICE_ACCOUNT_JSON.");
    process.exit(1);
  }

  let json;
  try {
    json = Buffer.from(b64, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    if (!parsed || parsed.version !== version) throw new Error("version mismatch");
    if (!Array.isArray(parsed.chapters) || !parsed.chapters.length) throw new Error("no chapters");
  } catch (e) {
    console.error("CURRICULUM_B64 is not valid curriculum JSON: " + (e.message || e));
    process.exit(1);
  }

  initializeApp({ credential: cert(JSON.parse(sa)) });
  const db = getFirestore();
  const ref = db.collection("guideContent").doc("curriculum");
  const before = await ref.get();
  await ref.set({ version, json, updatedAt: FieldValue.serverTimestamp() });

  const after = await ref.get();
  let ok = false, chapters = 0, backVersion = "";
  try {
    const back = JSON.parse(after.data().json);
    chapters = (back.chapters || []).length;
    backVersion = back.version || "";
    ok = after.exists && backVersion === version && chapters > 0;
  } catch (e) { ok = false; }
  console.log(
    (before.exists ? "replaced" : "created") +
    " guideContent/curriculum — " +
    (ok ? "VERIFIED (" + chapters + " chapters, version " + backVersion + ")" : "WRITE FAILED")
  );
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("UPLOAD ERROR:", (e && e.stack) || e);
  process.exit(1);
});
