/* Field Manual curriculum patcher — GitHub Actions version.
 *
 * Targeted edit inside the stored curriculum JSON at
 * guideContent/curriculum, without a full re-upload.
 *
 * Triggered by workflow_dispatch (patch-curriculum.yml). Reads:
 *   PATCH_PATH           — dot path inside the curriculum JSON, e.g.
 *                          "finalExams.camera-confidence.title"
 *   PATCH_VALUE          — new string value
 *   SERVICE_ACCOUNT_JSON — repo secret (Firebase service account JSON)
 *
 * Rules: the path must already exist (no accidental key creation),
 * the value must be a string, and the curriculum shape (version +
 * chapters) must survive the patch. The version is left UNTOUCHED so
 * clients keep their cached bank identity (exam attempt reviews stay
 * valid across copy-only patches).
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

function getPath(doc, path) {
  let node = doc;
  for (const k of path.split(".")) {
    if (node == null || typeof node !== "object" || !(k in node)) return { found: false };
    node = node[k];
  }
  return { found: true, value: node };
}

function setPath(doc, path, value) {
  const keys = path.split(".");
  let node = doc;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (node == null || typeof node !== "object" || !(k in node)) return false;
    node = node[k];
  }
  const last = keys[keys.length - 1];
  if (node == null || typeof node !== "object" || !(last in node)) return false;
  node[last] = value;
  return true;
}

async function main() {
  const path = process.env.PATCH_PATH;
  const value = process.env.PATCH_VALUE;
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!path || value == null || !sa) {
    console.error("Missing PATCH_PATH, PATCH_VALUE, or SERVICE_ACCOUNT_JSON.");
    process.exit(1);
  }

  initializeApp({ credential: cert(JSON.parse(sa)) });
  const db = getFirestore();
  const ref = db.collection("guideContent").doc("curriculum");
  const snap = await ref.get();
  if (!snap.exists) {
    console.error("guideContent/curriculum does not exist.");
    process.exit(1);
  }
  let doc;
  try {
    doc = JSON.parse(snap.data().json);
  } catch (e) {
    console.error("Stored json field is not valid JSON.");
    process.exit(1);
  }

  const before = getPath(doc, path);
  if (!before.found) {
    console.error("Path not found (refusing to create keys): " + path);
    process.exit(1);
  }
  if (!setPath(doc, path, value)) {
    console.error("Could not set path: " + path);
    process.exit(1);
  }

  if (!Array.isArray(doc.chapters) || !doc.chapters.length) {
    console.error("Patched doc has no chapters — refusing to write.");
    process.exit(1);
  }
  if (!doc.version) {
    console.error("Patched doc has no version — refusing to write.");
    process.exit(1);
  }

  const json = JSON.stringify(doc);
  await ref.set({ version: doc.version, json, updatedAt: FieldValue.serverTimestamp() });

  const back = await ref.get();
  let ok = false;
  try {
    const bdoc = JSON.parse(back.data().json);
    const check = getPath(bdoc, path);
    ok = back.exists && check.found && check.value === value && back.data().version === doc.version;
  } catch (e) {
    ok = false;
  }
  console.log(
    (ok ? "PATCHED + VERIFIED" : "PATCH WRITE FAILED") +
    " — " + path + ": " + JSON.stringify(before.value) + " -> " + JSON.stringify(value) +
    " (version " + doc.version + " unchanged)"
  );
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("PATCH ERROR:", (e && e.stack) || e);
  process.exit(1);
});
