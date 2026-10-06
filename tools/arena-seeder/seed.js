/* Arena seed data uploader — GitHub Actions version.
 *
 * Triggered by workflow_dispatch. Reads:
 *   SEED_B64              — base64 of JSON.stringify({ prompts: [...], briefs: [...] })
 *   SERVICE_ACCOUNT_JSON  — repo secret (Firebase service account JSON)
 *
 * Writes:
 *   arenaPrompts/{date} = { lane, text, createdAt } for each prompt
 *   arenaBriefQueue/{autoId} = { title, brief, used, createdAt } for each brief
 *
 * Verifies with read-back before exiting.
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

async function main() {
  const b64 = process.env.SEED_B64;
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!b64 || !sa) {
    console.error("Missing SEED_B64 or SERVICE_ACCOUNT_JSON.");
    process.exit(1);
  }

  let seed;
  try {
    const raw = Buffer.from(b64, "base64");
    seed = JSON.parse(raw.toString("utf8"));
    if (!seed || !Array.isArray(seed.prompts)) throw new Error("no prompts array");
  } catch (e) {
    console.error("SEED_B64 is not valid seed JSON: " + (e.message || e));
    process.exit(1);
  }

  const serviceAccount = JSON.parse(sa);
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  // Write prompt docs
  for (const p of seed.prompts) {
    if (!p.id || !p.text) {
      console.error("Skipping invalid prompt: " + JSON.stringify(p));
      continue;
    }
    await db.collection("arenaPrompts").doc(p.id).set({
      lane: p.lane || "challenge",
      text: p.text,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log("Wrote arenaPrompts/" + p.id);
  }

  // Write brief docs
  for (const b of seed.briefs || []) {
    if (!b.title || !b.brief) {
      console.error("Skipping invalid brief: " + JSON.stringify(b));
      continue;
    }
    const ref = await db.collection("arenaBriefQueue").add({
      title: b.title,
      brief: b.brief,
      used: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log("Wrote arenaBriefQueue/" + ref.id);
  }

  // Verify
  const promptSnap = await db.collection("arenaPrompts").get();
  console.log("arenaPrompts count: " + promptSnap.size);
  
  const briefSnap = await db.collection("arenaBriefQueue").where("used", "==", false).get();
  console.log("arenaBriefQueue unused count: " + briefSnap.size);

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error("Seed failed: " + (e.message || e));
  process.exit(1);
});
