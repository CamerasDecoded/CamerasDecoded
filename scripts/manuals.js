/* Field Manuals — the library manifest.
 *
 * Field Manuals is a collection of standalone manuals across topics and
 * categories. Each manual is its own book: own title, doctrine, curriculum,
 * gating. This manifest is the shelf's single source of truth for what
 * exists; the curriculum CONTENT never lives here — it ships privately via
 * Firestore guideContent/<doc> through the curriculum uploader
 * (upload-curriculum.yml, input "manual" = the doc id below).
 *
 * Fields:
 *   id           stable manual id (progress + XP are namespaced by it)
 *   num          shelf volume number
 *   title        cover title
 *   doctrine     one-line doctrine printed on the cover
 *   category     shelf section label
 *   accent       color temperature key — the shelf maps it to real tokens
 *   doc          Firestore guideContent doc holding this manual's curriculum
 *   freeChapters chapters open to free members (the rest sit behind Pro)
 *   status       "live" (readable) | "building" (on the shelf, content lands)
 *   reader       field-manual.html route that opens this manual
 *
 * Consumed by the Field Manuals shelf + player (field-manual.html).
 * № 01 ("field-manual") is the original Field Manual: its progress lives in
 * the legacy top-level guideProgress fields and its content doc stays
 * "curriculum" — both preserved exactly; every later manual namespaces by id.
 */
(function () {
  var MANUALS = [
    {
      id: "field-manual",
      num: 1,
      title: "Field Manual",
      doctrine: "Decode the machine — how your camera behaves, and why.",
      category: "Capture",
      accent: "green",
      doc: "curriculum",
      freeChapters: 3,
      status: "live",
      reader: "/field-manual.html?manual=field-manual"
    },
    {
      id: "finish",
      num: 2,
      title: "The Finish",
      doctrine: "The grade is a decision — finish every frame on purpose.",
      category: "The Finish",
      accent: "amber",
      doc: "finish",
      freeChapters: 1,
      status: "live",
      reader: "/field-manual.html?manual=finish"
    }
  ];

  var BY_ID = {};
  for (var i = 0; i < MANUALS.length; i++) BY_ID[MANUALS[i].id] = MANUALS[i];

  window.CD_MANUALS = MANUALS;
  window.CD_MANUALS_BY_ID = BY_ID;
  window.CD_MANUAL_DEFAULT = MANUALS[0];
})();
