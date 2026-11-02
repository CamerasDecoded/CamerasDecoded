// Ask CD — Step 3 plain search engine. No AI: word matching against the index.
// Used by the prototype page and testable in Node (module.exports at the bottom).
(function () {
  var STOP = {a:1,an:1,the:1,my:1,i:1,me:1,to:1,of:1,for:1,on:1,in:1,is:1,it:1,do:1,does:1,can:1,should:1,what:1,why:1,how:1,when:1,am:1,are:1,was:1,were:1,be:1,with:1,from:1,at:1,by:1,and:1,or:1,if:1,so:1,up:1,out:1,get:1,got:1,keep:1,keeps:1,you:1,your:1,this:1,that:1,than:1,then:1,just:1,about:1,into:1,over:1,after:1,before:1,not:1,no:1,yes:1,will:1,would:1,there:1,their:1,they:1,them:1,he:1,she:1,we:1,our:1,its:1,as:1,an:1,have:1,has:1,had:1,make:1,makes:1,made:1,go:1,going:1,one:1,two:1,all:1,any:1,more:1,most:1,very:1,really:1,look:1,looks:1,looking:1,come:1,comes:1,out:1,much:1,many:1};
  var SYN = {af:["autofocus"], blurry:["blur","soft"], pics:["photos"], pic:["photo"], wb:["white","balance"], ev:["exposure"], soft:["blur"], yellow:["orange","white","balance"], orange:["yellow","white","balance"], grey:["gray"], greyed:["gray"], charge:["price","pricing"], charging:["price","pricing"], cost:["price","pricing"], money:["business","pricing","earn"], earn:["business","pricing"], sell:["business","clients"], book:["clients","business"], clients:["business"], wedding:["weddings"], weddings:["wedding"]};

  function norm(s) { return (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); }
  function tokens(s) {
    var raw = norm(s).split(" ").filter(function (w) { return w && !STOP[w]; });
    var out = [];
    raw.forEach(function (w) { out.push(w); if (SYN[w]) out = out.concat(SYN[w]); });
    return out;
  }
  function tokenSet(s) { var o = {}; tokens(s).forEach(function (w) { o[w] = 1; }); return o; }

  function scoreItem(item, qTokens, qNorm) {
    var score = 0;
    var qSet = tokenSet(item.questions.join(" "));
    var tSet = tokenSet(item.title);
    var aSet = tokenSet(item.shortAnswer);
    var topics = (item.topics || []).map(norm);
    qTokens.forEach(function (w) {
      if (qSet[w]) score += 3;
      if (tSet[w]) score += 2;
      if (aSet[w]) score += 1;
      topics.forEach(function (t) { if (t === w) score += 6; else if (t.split(" ").indexOf(w) >= 0) score += 3; });
    });
    // phrase bonuses
    topics.forEach(function (t) { if (t.length > 3 && qNorm.indexOf(t) >= 0) score += 8; });
    item.questions.forEach(function (q) { if (norm(q).indexOf(qNorm) >= 0 && qNorm.length > 8) score += 14; });
    // camera match
    var cam = norm((item.brand || "") + " " + (item.model || ""));
    if (cam) { cam.split(" ").forEach(function (w) { if (w && qNorm.split(" ").indexOf(w) >= 0) score += 7; }); }
    return score;
  }

  function squash(s) { return norm(s).replace(/ /g, ""); }
  // Full camera match: same brand AND same model (squash-compared, so
  // "a7 IV" == "A7IV"). A camera with no model on either side never
  // counts as a full match — brand-only is handled separately.
  function camFullMatch(item, cam) {
    if (!cam || !item.brand || !item.model || !cam.brand || !cam.model) return false;
    return norm(item.brand) === norm(cam.brand) && squash(item.model) === squash(cam.model);
  }
  function camBrandMatch(item, cam) {
    if (!cam || !item.brand || !cam.brand) return false;
    return norm(item.brand) === norm(cam.brand);
  }

  // opts.camera = the effective camera for this question, already resolved
  // by the caller (a camera named in the question beats the saved primary):
  // { brand, model|null } or null when no camera is in play.
  // Guard: model-specific LESSONS (Camera Select) are demoted to a second
  // tier unless they fully match the effective camera — a generic question
  // must never be answered as if some default model were in the user's
  // hands. Matching lessons and matching articles get a boost instead.
  function search(items, query, limit, opts) {
    var qNorm = norm(query);
    var qTokens = tokens(query);
    if (!qTokens.length) return { hits: [], top: null };
    var cam = (opts && opts.camera) || null;
    var scored = items.filter(function (i) { return i.type !== "signal-source"; }).map(function (i) {
      var score = scoreItem(i, qTokens, qNorm);
      var tier = 0;
      if (camFullMatch(i, cam)) score += 12;
      else if (camBrandMatch(i, cam)) score += 3;
      if (i.type === "lesson" && i.model && !camFullMatch(i, cam)) tier = 1;
      return { item: i, score: score, tier: tier };
    }).filter(function (r) { return r.score >= 6; }).sort(function (a, b) {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return b.score - a.score;
    });
    return { hits: scored.slice(0, limit || 9), top: scored.length ? scored[0] : null };
  }

  var api = { search: search, tokens: tokens, norm: norm };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.AskCDSearch = api;
})();
