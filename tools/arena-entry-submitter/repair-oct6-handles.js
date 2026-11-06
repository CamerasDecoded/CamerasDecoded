/* One-off repair — round c-2026-10-06's four handle-less Arena entries.
 *
 * Background: the 24h image sweep (tools/arena-closer) burns an entry's
 * photo after its round closes, using the delete handle stored at entry
 * creation in entries/{uid}/_private/data — a Cloudinary `publicId` or an
 * imgbb `deleteUrl`. These four entries were created by this submitter
 * tool with repo-hosted images (raw.githubusercontent.com) and NO handle,
 * so the sweep logs "no _private/data.deleteUrl or publicId" and retries
 * them on every run, forever.
 *
 * What this does, for exactly these four entries and nothing else:
 *   1. Cross-checks the Cloudinary publicId derivation (below) against
 *      healthy entries whose handle IS stored: derive from imgUrl and
 *      require an exact match before trusting the method. Aborts before
 *      any write if the check finds no stored-handle entry or any
 *      mismatch.
 *   2. Per target entry: if a handle already exists, leaves it alone.
 *      Else, if the imgUrl is Cloudinary-hosted, writes the derived
 *      publicId into _private/data. Otherwise the handle never existed
 *      and cannot be reconstructed, so the ENTRY is marked terminal in
 *      the sweep's own convention — sweepFailed: true + sweepError —
 *      and the retry loop stops honestly. No handle is ever fabricated.
 *   3. Reads every target back and verifies the intended end state;
 *      exits non-zero if anything differs.
 *
 * Note: a recovered Cloudinary handle still cannot delete until the
 * repo's CLOUDINARY_API_SECRET matches the Cloudinary account (the
 * separate sweep-secret fault). This repair puts handles/marks in
 * place; it deletes nothing.
 *
 * Triggered by workflow_dispatch (submit-arena-entries.yml with the
 * mode input set to "repair-oct6-handles"). Reads SERVICE_ACCOUNT_JSON
 * (repo secret FIREBASE_SERVICE_ACCOUNT), the same pattern as the
 * closer and the submitter.
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const ROUND_ID = "c-2026-10-06";
const ENTRY_IDS = [
  "6s4DHcYKCyafeRqzpATsCTTVALo1",
  "8PvoFubumCOzEY9C82Ef09JyORv2",
  "NMW7cOTsmUNrdh9hE7oHwVStwop2",
  "NwPK7HcwbNMEN0Ild9BRadIYKx42",
];
const SWEEP_ERROR =
  "no delete handle recorded at entry creation and none can be reconstructed " +
  "— image is repo-hosted (raw.githubusercontent.com), not Cloudinary/imgbb";

/* Cloudinary delivery URL -> public_id: the path after /image/upload/,
 * minus an optional leading version segment (v<digits>/) and the file
 * extension. Folder segments are part of the public_id and are kept. */
function deriveCloudinaryPublicId(url) {
  const m = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(.+)$/.exec(url || "");
  if (!m) return null;
  const noVersion = m[1].replace(/^v\d+\//, "");
  const noExt = noVersion.replace(/\.[A-Za-z0-9]+$/, "");
  return noExt || null;
}

async function crossCheckDerivation(db) {
  const snap = await db.collectionGroup("entries").limit(300).get();
  let checked = 0;
  let matched = 0;
  for (const doc of snap.docs) {
    if (checked >= 25) break;
    const d = doc.data() || {};
    if (!d.imgUrl || !/^https:\/\/res\.cloudinary\.com\//.test(d.imgUrl)) continue;
    const priv = await doc.ref.collection("_private").doc("data").get();
    const stored = priv.exists ? (priv.data() || {}).publicId : null;
    if (!stored) continue;
    checked++;
    const derived = deriveCloudinaryPublicId(d.imgUrl);
    if (derived === stored) {
      matched++;
    } else {
      console.log(`CROSS-CHECK MISMATCH at ${doc.ref.path}: stored=${stored} derived=${derived}`);
    }
  }
  console.log(`cross-check: ${matched}/${checked} stored publicIds reproduced exactly from their imgUrls`);
  if (checked === 0 || matched !== checked) {
    console.error("cross-check failed — derivation not trusted; aborting before any write");
    process.exit(1);
  }
}

async function main() {
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!sa) {
    console.error("Missing SERVICE_ACCOUNT_JSON.");
    process.exit(1);
  }
  initializeApp({ credential: cert(JSON.parse(sa)) });
  const db = getFirestore();

  await crossCheckDerivation(db);

  const roundRef = db.collection("arenaRounds").doc(ROUND_ID);
  let failures = 0;

  for (const id of ENTRY_IDS) {
    const entryRef = roundRef.collection("entries").doc(id);
    const snap = await entryRef.get();
    if (!snap.exists) {
      console.error(`${id}: entry doc missing — cannot repair`);
      failures++;
      continue;
    }
    const ed = snap.data() || {};
    if (ed.roundId !== ROUND_ID) {
      console.error(`${id}: roundId guard tripped (${ed.roundId}) — refusing to touch`);
      failures++;
      continue;
    }
    const privRef = entryRef.collection("_private").doc("data");
    const privSnap = await privRef.get();
    const pd = privSnap.exists ? (privSnap.data() || {}) : {};
    console.log(
      `${id}: BEFORE imgUrl=${ed.imgUrl} swept=${ed.swept} sweepFailed=${ed.sweepFailed || false} ` +
      `_private exists=${privSnap.exists} keys=[${Object.keys(pd).join(",")}] ` +
      `deleteUrl=${pd.deleteUrl === undefined ? "<absent>" : JSON.stringify(pd.deleteUrl)} ` +
      `publicId=${pd.publicId === undefined ? "<absent>" : JSON.stringify(pd.publicId)}`
    );

    let action;
    if (pd.publicId || pd.deleteUrl) {
      action = "already-handled (no write)";
    } else if (/^https:\/\/res\.cloudinary\.com\//.test(ed.imgUrl || "")) {
      const derived = deriveCloudinaryPublicId(ed.imgUrl);
      if (!derived) {
        console.error(`${id}: Cloudinary URL but derivation returned null — refusing to guess`);
        failures++;
        continue;
      }
      await privRef.set({ publicId: derived }, { merge: true });
      action = `handle-written (publicId=${derived})`;
    } else {
      await entryRef.update({ sweepFailed: true, sweepError: SWEEP_ERROR });
      action = "marked-terminal (sweepFailed)";
    }

    // Read back and verify the intended end state; nothing else disturbed.
    const after = (await entryRef.get()).data() || {};
    const privAfterSnap = await privRef.get();
    const pdAfter = privAfterSnap.exists ? (privAfterSnap.data() || {}) : {};
    let ok = after.imgUrl === ed.imgUrl && after.swept === ed.swept;
    if (action.startsWith("marked-terminal")) {
      ok = ok && after.sweepFailed === true && after.sweepError === SWEEP_ERROR;
    } else if (action.startsWith("handle-written")) {
      ok = ok && !!pdAfter.publicId;
    }
    console.log(
      `${id}: AFTER action=${action} verify=${ok ? "OK" : "FAILED"} ` +
      `sweepFailed=${after.sweepFailed || false} publicId=${pdAfter.publicId || "<absent>"}`
    );
    if (!ok) failures++;
  }

  if (failures) {
    console.error(`repair finished with ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("repair complete: all four entries verified");
}

main().catch((e) => {
  console.error("Fatal: " + (e.message || e));
  process.exit(1);
});
