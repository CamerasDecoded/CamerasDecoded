/* ================================================================
   cd-upload.js — shared image upload for Cameras Decoded.
   Cloudinary unsigned uploads (browser-direct, no server needed).
   Replaces the per-page ImgBB uploads (migrated 2026-10-14).

   Usage:
     CDUpload.upload(fileOrBlob[, filename])
       -> Promise<{ url, publicId }>
     Rejects with an Error on failure or when not configured.

   CLOUD_NAME and UPLOAD_PRESET are public identifiers (they ship
   in client code by design); the account API secret is never here.
   ================================================================ */
(function () {
  var CLOUD_NAME = "l8tkygij";
  var UPLOAD_PRESET = "cd_unsigned";

  function configured() {
    return CLOUD_NAME.indexOf("__") !== 0 && UPLOAD_PRESET.indexOf("__") !== 0;
  }

  function upload(file, filename) {
    if (!configured()) {
      return Promise.reject(new Error("Uploads are not configured on this build."));
    }
    var form = new FormData();
    if (filename) form.append("file", file, filename);
    else form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    return fetch("https://api.cloudinary.com/v1_1/" + CLOUD_NAME + "/image/upload", {
      method: "POST",
      body: form
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json || !json.secure_url) throw new Error("Upload failed — try again.");
        return { url: json.secure_url, publicId: json.public_id || null };
      });
  }

  window.CDUpload = { upload: upload, configured: configured };
})();
