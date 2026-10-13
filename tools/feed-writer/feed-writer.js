/**
 * Feed writer — publishes content items to the feedItems collection.
 * Used by the blog pipeline, protocol publisher, and admin tools.
 *
 * Usage:
 *   node feed-writer.js --type blog_post --title "..." --text "..." \
 *     --imageUrl "..." --actionUrl "..." --actionLabel "Read"
 *
 * Requires FIREBASE_SERVICE_ACCOUNT env (JSON) or --sa-key path.
 * Same service-account pattern as tools/arena-closer.
 */
const admin = require("firebase-admin");
const fs = require("fs");

function arg(name) {
  const i = process.argv.indexOf("--" + name);
  return i !== -1 ? process.argv[i + 1] : null;
}

async function main() {
  const type = arg("type");
  const title = arg("title");
  if (!type || !title) {
    console.error("Usage: node feed-writer.js --type <type> --title <title> [--text ...] [--imageUrl ...] [--actionUrl ...] [--actionLabel ...] [--actorName ...]");
    process.exit(1);
  }

  let sa;
  const saPath = arg("sa-key") || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (saPath) {
    sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    console.error("No service account: set FIREBASE_SERVICE_ACCOUNT or --sa-key");
    process.exit(1);
  }

  admin.initializeApp({ credential: admin.credential.cert(sa) });
  const db = admin.firestore();

  const doc = {
    type,
    actorUid: arg("actorUid") || "cameras-decoded",
    actorName: arg("actorName") || "Cameras Decoded",
    title: title,
    text: arg("text") || "",
    imageUrl: arg("imageUrl") || null,
    targetType: arg("targetType") || type,
    targetId: arg("targetId") || "",
    actionUrl: arg("actionUrl") || null,
    actionLabel: arg("actionLabel") || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    visibility: "public",
  };
  // Strip nulls (Firestore rejects undefined, nulls are fine but noisy)
  Object.keys(doc).forEach((k) => { if (doc[k] === null) delete doc[k]; });

  // Upsert: if an item with same type+targetId exists, update it (avoids duplicates)
  const targetId = arg("targetId") || "";
  let ref;
  if (targetId) {
    const snap = await db.collection("feedItems")
      .where("type", "==", type).where("targetId", "==", targetId).limit(1).get();
    if (!snap.empty) {
      ref = snap.docs[0].ref;
      // Preserve the original publish time on update, so refreshing a post
      // never bumps it to the top of the feed.
      delete doc.createdAt;
      await ref.update(doc);
      console.log("Updated feed item:", ref.id, `(${type})`, title);
      return;
    }
  }
  ref = await db.collection("feedItems").add(doc);
  console.log("Wrote feed item:", ref.id, `(${type})`, title);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
