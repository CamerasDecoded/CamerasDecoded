/* Ask CD — Step 4 AI layer.
   Flow: Step 3 search picks the entries -> this module hands the question
   and ONLY those entries to Gemini via Firebase AI Logic -> the reply is
   verified (every number in it must exist in the source entries) ->
   anything that fails returns { ok:false } and the caller shows the
   Step 3 verified stack instead. The AI can never be a dead end.

   Browser usage:  CDAskAI.ask(question, entries) -> Promise<{ok, text?, reason?}>
   Node usage:     require(...).askWith(question, entries, stubModelCall) for tests.
*/
(function (root) {
  "use strict";

  var SYSTEM_INSTRUCTION = [
    "You are Cynetis-7, the instructor inside Cameras Decoded. You answer one camera question at a time, for the person holding the camera.",
    "",
    "YOUR VOICE: Direct. Plain words. Short declarative sentences; fragments are allowed for impact. Second person — it is always the user's camera. State the mechanism behind every answer in one plain sentence. At most one aphorism per answer. Never say \"great question.\" Never use hype words, filler openers, emojis, or apologies. Never flatter. If you do not know, say so — that is in character; guessing is not.",
    "",
    "YOUR ONLY SOURCES: You will be given a small set of Cameras Decoded entries (id, title, answer, details). Build your answer ONLY from those entries. Every setting, number, menu path, price, and product fact in your answer must appear in the entries you were given. Do not add facts from your own training, even ones you believe are true. If the entries do not answer the question, reply with exactly: NO_ANSWER",
    "",
    "YOUR SHAPE: (1) The answer itself in the first sentence. (2) Why it works, one or two sentences. (3) The exact setting, value, or menu path, stated bare. (4) One closing line naming which entry goes deeper, by its title. Maximum 90 words. Plain paragraphs, no lists, no headings."
  ].join("\n");

  // Google retires model names for new users without notice: on
  // 2026-11-01 gemini-2.5-flash began returning 404 "no longer available
  // to new users" on this project, silently killing every AI answer.
  // The call walks this list when a model reports itself unavailable.
  var MODELS = ["gemini-3.8-flash", "gemini-2.5-flash"];
  var MODEL = MODELS[0];
  var GENERATION = { temperature: 0.2, maxOutputTokens: 220 };

  function buildPrompt(question, entries) {
    var parts = ["QUESTION: " + question, "", "CAMERAS DECODED ENTRIES (your only sources):"];
    entries.forEach(function (e, i) {
      parts.push("");
      parts.push("[" + (i + 1) + "] " + e.id + " — " + e.title);
      parts.push("Answer: " + (e.shortAnswer || ""));
      if (e.checkNote) parts.push("Note: " + e.checkNote);
    });
    return parts.join("\n");
  }

  /* --- number extraction + verification -------------------------------
     Every numeric value in the AI answer must be present in the source
     text. Fractions (1/250) compare by value; decimals, integers,
     percentages and prices compare by value with small tolerance. */
  function extractNumbers(text) {
    var out = [];
    var s = String(text || "");
    var re = /(\d+\/\d+|\d+\.\d+|\d+)/g, m;
    while ((m = re.exec(s)) !== null) {
      var tok = m[1], val;
      if (tok.indexOf("/") > -1) {
        var p = tok.split("/"); val = parseFloat(p[0]) / parseFloat(p[1]);
        out.push({ raw: tok, val: val, frac: true });
      } else {
        out.push({ raw: tok, val: parseFloat(tok), frac: false });
      }
    }
    return out;
  }

  function verifyNumbers(answerText, sourceText) {
    var src = extractNumbers(sourceText);
    var ans = extractNumbers(answerText);
    var bad = [];
    ans.forEach(function (a) {
      var ok = src.some(function (x) {
        if (a.frac || x.frac) return Math.abs(a.val - x.val) < 1e-9;
        return Math.abs(a.val - x.val) < 1e-9;
      });
      if (!ok) bad.push(a.raw);
    });
    return { ok: bad.length === 0, bad: bad };
  }

  function sourceTextOf(entries) {
    return entries.map(function (e) {
      return [e.title, e.shortAnswer || "", e.checkNote || ""].join(" ");
    }).join("\n");
  }

  /* Core: modelCall is any async fn(prompt) -> text. Injectable for tests. */
  function askWith(question, entries, modelCall) {
    if (!entries || !entries.length) return Promise.resolve({ ok: false, reason: "no-sources" });
    var prompt = buildPrompt(question, entries);
    return Promise.resolve()
      .then(function () { return modelCall(prompt); })
      .then(function (raw) {
        var text = String(raw || "").trim();
        if (!text) return { ok: false, reason: "empty" };
        if (text === "NO_ANSWER" || text.indexOf("NO_ANSWER") === 0) return { ok: false, reason: "no-answer" };
        var words = text.split(/\s+/).length;
        if (words > 120) return { ok: false, reason: "too-long", words: words };
        var v = verifyNumbers(text, sourceTextOf(entries));
        if (!v.ok) return { ok: false, reason: "unverified-numbers", bad: v.bad };
        return { ok: true, text: text };
      })
      .catch(function (err) {
        return { ok: false, reason: "model-error", error: String(err && err.message || err) };
      });
  }

  /* Browser: real model call through Firebase AI Logic (modular SDK loaded
     from the Firebase CDN; CD's pages otherwise use the compat SDK — the AI
     SDK keeps its own app instance, initialized from the same config). */
  var backendPromise = null;
  function loadBackend() {
    if (backendPromise) return backendPromise;
    var p = (async function () {
      var cfg = root.CD_FIREBASE_CONFIG;
      if (!cfg) throw new Error("firebase config not exposed (window.CD_FIREBASE_CONFIG)");
      var appMod = await import("https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js");
      var aiMod = await import("https://www.gstatic.com/firebasejs/12.3.0/firebase-ai.js");
      var app = appMod.initializeApp(cfg, "ask-cd-ai");
      var key = root.CD_APPCHECK_SITE_KEY;
      if (key) {
        var acMod = await import("https://www.gstatic.com/firebasejs/12.3.0/firebase-app-check.js");
        acMod.initializeAppCheck(app, {
          provider: new acMod.ReCaptchaEnterpriseProvider(key),
          isTokenAutoRefreshEnabled: true
        });
      }
      var ai = aiMod.getAI(app, { backend: new aiMod.GoogleAIBackend() });
      return { aiMod: aiMod, ai: ai };
    })();
    backendPromise = p;
    // Never cache a failed load: one bad first attempt (offline SDK fetch,
    // a refused App Check token) must not poison every later question on
    // this page. A rejection clears the cache so the next ask retries.
    p.catch(function () { if (backendPromise === p) backendPromise = null; });
    return p;
  }

  function modelUnavailable(err) {
    var m = String((err && err.message) || err || "");
    return /404|no longer available|not found|not supported/i.test(m);
  }

  function realModelCall(prompt) {
    var idx = 0;
    function attempt() {
      var name = MODELS[idx];
      return loadBackend().then(function (b) {
        var model = b.aiMod.getGenerativeModel(b.ai, {
          model: name,
          systemInstruction: SYSTEM_INSTRUCTION,
          generationConfig: GENERATION
        });
        return model.generateContent(prompt);
      }).then(function (res) {
        return res.response.text();
      }).catch(function (err) {
        if (idx < MODELS.length - 1 && modelUnavailable(err)) { idx++; return attempt(); }
        throw err;
      });
    }
    return attempt();
  }

  function ask(question, entries) { return askWith(question, entries, realModelCall); }

  var api = {
    SYSTEM_INSTRUCTION: SYSTEM_INSTRUCTION,
    MODEL: MODEL,
    MODELS: MODELS,
    GENERATION: GENERATION,
    buildPrompt: buildPrompt,
    extractNumbers: extractNumbers,
    verifyNumbers: verifyNumbers,
    askWith: askWith,
    ask: ask
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.CDAskAI = api;
})(typeof window !== "undefined" ? window : globalThis);
