/* Field Manual curriculum uploader — GitHub Actions version.
 *
 * Triggered by workflow_dispatch. Reads:
 *   CURRICULUM_VERSION — version string, e.g. "2026-09-21-visuals"
 *   CURRICULUM_B64     — base64 of gzip(JSON.stringify({ version, chapters }))
 *                      (plain base64 JSON also accepted as a fallback)
 *   CURRICULUM_MANUAL  — optional manual id (the guideContent doc to write).
 *                      Defaults to "curriculum" (Manual № 01). Field Manuals
 *                      is a library: each manual's curriculum is its own doc
 *                      in the same collection (№ 02 "The Finish" = "finish").
 *   CURRICULUM_FREE_CHAPTERS — optional override: how many opening chapters
 *                      are free for this manual. Defaults come from the
 *                      FREE_CHAPTERS map below, which mirrors
 *                      scripts/manuals.js (curriculum = 3, finish = 1).
 *   SERVICE_ACCOUNT_JSON — repo secret (Firebase service account JSON)
 *
 * guideContent SPLIT (2026-10-29): a full-curriculum upload writes TWO
 * docs, because Firestore rules gate whole documents, not chapters
 * inside one:
 *   guideContent/<manual>     = { version, json, updatedAt } holding ONLY
 *                               the free chapters (public read), and
 *   guideContent/<manual>_pro = { version, json, updatedAt } holding the
 *                               remaining chapters plus the finalExams
 *                               bank when the source carries one (readable
 *                               only by Pro/admin accounts under the rules).
 * Each json is the curriculum slice as one string (lesson blocks are
 * arrays-inside-arrays, which Firestore rejects as nested entities —
 * hence the string envelope). Both docs are verified with a read-back
 * (version + chapter count) before exiting.
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

/* Free-chapter counts per manual — mirrors scripts/manuals.js. */
const FREE_CHAPTERS = { curriculum: 3, finish: 1 };

async function writeAndVerify(db, docId, payload, expectedChapters, label) {
  const ref = db.collection("guideContent").doc(docId);
  const before = await ref.get();
  const json = JSON.stringify(payload);
  await ref.set({ version: payload.version, json, updatedAt: FieldValue.serverTimestamp() });

  const after = await ref.get();
  let ok = false, chapters = 0, backVersion = "";
  try {
    const back = JSON.parse(after.data().json);
    chapters = (back.chapters || []).length;
    backVersion = back.version || "";
    ok = after.exists && backVersion === payload.version && chapters === expectedChapters;
    /* the exam bank must never ride in the free doc */
    if (label === "free" && back.finalExams) ok = false;
  } catch (e) { ok = false; }
  console.log(
    (before.exists ? "replaced" : "created") +
    " guideContent/" + docId + " (" + label + ") — " +
    (ok ? "VERIFIED (" + chapters + " chapters, version " + backVersion + ")" : "WRITE FAILED")
  );
  return ok;
}

async function main() {
  const version = process.env.CURRICULUM_VERSION;
  const b64 = process.env.CURRICULUM_B64;
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!version || !b64 || !sa) {
    console.error("Missing CURRICULUM_VERSION, CURRICULUM_B64, or SERVICE_ACCOUNT_JSON.");
    process.exit(1);
  }

  /* Manual id = the guideContent doc this upload writes. Unset means
     Manual № 01 ("curriculum") — the original behavior, preserved.
     The slug check keeps the value a single safe doc id: no slashes,
     no dots, no path tricks, ever. */
  const manual = (process.env.CURRICULUM_MANUAL || "curriculum").trim();
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(manual)) {
    console.error("Invalid CURRICULUM_MANUAL " + JSON.stringify(manual) + " — expected a lowercase slug (letters, digits, hyphens).");
    process.exit(1);
  }

  let parsed;
  try {
    const raw = Buffer.from(b64, "base64");
    let json;
    try {
      json = require("zlib").gunzipSync(raw).toString("utf8");
    } catch (_) {
      json = raw.toString("utf8"); // uncompressed fallback
    }
    parsed = JSON.parse(json);
    if (!parsed || parsed.version !== version) throw new Error("version mismatch");
    if (!Array.isArray(parsed.chapters) || !parsed.chapters.length) throw new Error("no chapters");
  } catch (e) {
    console.error("CURRICULUM_B64 is not valid curriculum JSON: " + (e.message || e));
    process.exit(1);
  }

  /* How many opening chapters are free for this manual? The workflow
     input wins; otherwise the map above (scripts/manuals.js is the
     manifest the player reads — keep the two in step). */
  let freeCount = FREE_CHAPTERS[manual];
  if (process.env.CURRICULUM_FREE_CHAPTERS) {
    freeCount = parseInt(process.env.CURRICULUM_FREE_CHAPTERS, 10);
  }
  if (!Number.isInteger(freeCount) || freeCount < 1 || freeCount > parsed.chapters.length) {
    console.error(
      "No valid free-chapter count for manual " + JSON.stringify(manual) +
      " (got " + JSON.stringify(process.env.CURRICULUM_FREE_CHAPTERS || freeCount) +
      ", curriculum has " + parsed.chapters.length + " chapters). " +
      "Pass CURRICULUM_FREE_CHAPTERS or add the manual to FREE_CHAPTERS in upload.js."
    );
    process.exit(1);
  }

  /* Split the book (see splitCurriculum below). */
  const { freePayload, proPayload } = splitCurriculum(parsed, freeCount);
  const freeChapters = freePayload.chapters;
  const proChapters = proPayload.chapters;

  initializeApp({ credential: cert(JSON.parse(sa)) });
  const db = getFirestore();

  const freeOk = await writeAndVerify(db, manual, freePayload, freeChapters.length, "free");
  let proOk = true;
  if (proChapters.length) {
    proOk = await writeAndVerify(db, manual + "_pro", proPayload, proChapters.length, "pro");
  } else {
    console.log("guideContent/" + manual + "_pro skipped — no Pro chapters in this curriculum.");
  }
  process.exit(freeOk && proOk ? 0 : 1);
}

/* Split one full curriculum into its free and Pro payloads. Any other
   top-level keys ride in both slices (they are manual-level metadata);
   chapters are sliced by order; the finalExams bank is Pro content and
   rides ONLY in the Pro slice. */
function splitCurriculum(parsed, freeCount) {
  const rest = Object.assign({}, parsed);
  delete rest.chapters;
  delete rest.finalExams;
  const freePayload = Object.assign({}, rest, {
    version: parsed.version,
    chapters: parsed.chapters.slice(0, freeCount),
  });
  const proPayload = Object.assign({}, rest, {
    version: parsed.version,
    chapters: parsed.chapters.slice(freeCount),
  });
  if (parsed.finalExams) proPayload.finalExams = parsed.finalExams;
  return { freePayload, proPayload };
}

if (require.main === module) {
  main().catch((e) => {
    console.error("UPLOAD ERROR:", (e && e.stack) || e);
    process.exit(1);
  });
}

module.exports = { splitCurriculum, FREE_CHAPTERS };
