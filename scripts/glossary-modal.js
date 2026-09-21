/* Cameras Decoded — tap-to-define glossary.
   window.CDGlossary.linkify(container): wraps industry terms in <button>
   elements; tapping one opens a definition modal. Self-contained CSS,
   reduced-motion safe, no dependencies beyond scripts/glossary.js.
   Shared: Field Manual, industry terms page, learning game, course. */
(function(){
  "use strict";

  var INJECTED = false;

  function css(){
    if(INJECTED) return;
    INJECTED = true;
    var s = document.createElement("style");
    s.id = "cd-glossary-css";
    s.textContent =
      ".glossary-term{font:inherit;color:inherit;background:linear-gradient(transparent 62%,rgba(141,235,0,.28) 62%);border:0;border-bottom:1px dotted rgba(141,235,0,.7);padding:0 1px;cursor:pointer;border-radius:2px}" +
      ".glossary-term:focus-visible{outline:2px solid #8deb00;outline-offset:2px}" +
      ".cdg-veil{position:fixed;inset:0;z-index:9990;background:rgba(4,8,5,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .22s ease}" +
      ".cdg-veil.show{opacity:1}" +
      ".cdg-card{width:100%;max-width:520px;max-height:72vh;overflow:auto;background:#0b120c;border:1px solid rgba(141,235,0,.28);border-bottom:0;border-radius:18px 18px 0 0;padding:22px 22px calc(26px + env(safe-area-inset-bottom));transform:translateY(24px);transition:transform .26s cubic-bezier(.2,.9,.25,1.1);box-shadow:0 -18px 60px rgba(0,0,0,.55)}" +
      ".cdg-veil.show .cdg-card{transform:translateY(0)}" +
      ".cdg-kicker{font:700 10.5px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.22em;text-transform:uppercase;color:#8deb00;margin:0 0 8px}" +
      ".cdg-term{margin:0 0 4px;font-size:22px;font-weight:800;color:#f2f7f0;letter-spacing:-.01em}" +
      ".cdg-short{margin:0 0 12px;color:#9fb3a0;font-size:14px}" +
      ".cdg-long{margin:0 0 18px;color:#d9e4d7;font-size:15px;line-height:1.65}" +
      ".cdg-close{display:block;width:100%;border:0;border-radius:12px;padding:13px;font:700 14px/1 ui-monospace,Menlo,monospace;letter-spacing:.08em;background:#8deb00;color:#0a0f0a;cursor:pointer}" +
      ".cdg-close:active{transform:scale(.98)}" +
      "@media (prefers-reduced-motion:reduce){.cdg-veil,.cdg-card{transition:none}}";
    document.head.appendChild(s);
  }

  function terms(){
    var d = window.CDGlossaryData;
    if(!d || !d.terms || !d.terms.length) return [];
    /* longest first so "shutter speed" wins over "shutter" */
    return d.terms.slice().sort(function(a, b){ return b.term.length - a.term.length; });
  }

  function findTerm(name){
    var t = terms();
    for(var i = 0; i < t.length; i++){
      if(t[i].term.toLowerCase() === String(name).toLowerCase()) return t[i];
    }
    return null;
  }

  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Wrap the FIRST occurrence of each known term in each text node.
     Skips links, buttons, and already-linked terms. */
  function linkify(container){
    if(!container || !container.querySelectorAll) return 0;
    var list = terms();
    if(!list.length) return 0;
    var count = 0;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node){
        var p = node.parentElement;
        if(!p) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName;
        if(tag === "A" || tag === "BUTTON" || tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
        if(p.closest && p.closest(".glossary-term,.cdg-veil")) return NodeFilter.FILTER_REJECT;
        if(!node.nodeValue || !/[a-zA-Z]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var text = node.nodeValue;
      var frag = null;
      list.forEach(function(t){
        if(frag) return;
        var idx = text.toLowerCase().indexOf(t.term.toLowerCase());
        if(idx === -1) return;
        /* word-boundary check on both ends */
        var before = idx > 0 ? text[idx - 1] : " ";
        var after = idx + t.term.length < text.length ? text[idx + t.term.length] : " ";
        if(/[a-zA-Z0-9]/.test(before) || /[a-zA-Z0-9]/.test(after)) return;
        frag = document.createDocumentFragment();
        if(idx > 0) frag.appendChild(document.createTextNode(text.slice(0, idx)));
        var b = document.createElement("button");
        b.type = "button";
        b.className = "glossary-term";
        b.setAttribute("data-term", t.term);
        b.textContent = text.slice(idx, idx + t.term.length);
        frag.appendChild(b);
        if(idx + t.term.length < text.length) frag.appendChild(document.createTextNode(text.slice(idx + t.term.length)));
      });
      if(frag){
        node.parentNode.replaceChild(frag, node);
        count++;
      }
    });
    return count;
  }

  function open(name){
    var t = findTerm(name);
    if(!t) return;
    css();
    close(true);
    var veil = document.createElement("div");
    veil.className = "cdg-veil";
    veil.setAttribute("role", "dialog");
    veil.setAttribute("aria-modal", "true");
    veil.setAttribute("aria-label", t.term + " — definition");
    veil.innerHTML =
      '<div class="cdg-card">' +
        '<p class="cdg-kicker">Field Manual · Term</p>' +
        '<h2 class="cdg-term">' + esc(t.term) + '</h2>' +
        '<p class="cdg-short">' + esc(t.short) + '</p>' +
        '<p class="cdg-long">' + esc(t.long) + '</p>' +
        '<button class="cdg-close" type="button">Got it</button>' +
      '</div>';
    document.body.appendChild(veil);
    function done(){ close(); }
    veil.addEventListener("click", function(e){
      if(e.target === veil || e.target.closest(".cdg-close")) done();
    });
    document.addEventListener("keydown", escHandler);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ veil.classList.add("show"); }); });
    var btn = veil.querySelector(".cdg-close");
    if(btn) btn.focus();
    veil._escHandler = escHandler;
    function escHandler(e){ if(e.key === "Escape") done(); }
  }

  function close(instant){
    var old = document.querySelector(".cdg-veil");
    if(!old) return;
    if(old._escHandler) document.removeEventListener("keydown", old._escHandler);
    old.remove();
  }

  /* Delegated tap handling: one listener covers all present + future terms. */
  var wired = false;
  function wire(){
    if(wired) return;
    wired = true;
    document.addEventListener("click", function(e){
      var b = e.target && e.target.closest ? e.target.closest(".glossary-term") : null;
      if(b && b.getAttribute("data-term")) open(b.getAttribute("data-term"));
    });
  }

  window.CDGlossary = { linkify: linkify, open: open, close: close, wire: wire };
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", wire);
  }else{
    wire();
  }
})();
