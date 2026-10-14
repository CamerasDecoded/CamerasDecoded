/* protocol-deeper.js — "Go deeper" bridge card for protocol pages.
   Learn audit (2026-10-14): protocols were dead ends; each now points at
   the system that practices or pays off what it teaches. Self-contained
   (injects its own styles), same pattern as ptr.js. */
(function () {
  "use strict";
  var DEEPER = {
    "001": { href: "/field-manual.html?lesson=ch01-welcome", label: "Start the Field Manual", sub: "The reset is step one of a whole system for calm, deliberate shooting." },
    "002": { href: "/darkroom.html#skill=framing", label: "Framing & Layers — The Darkroom", sub: "Locking the hero frame is a drillable skill." },
    "003": { href: "/field-manual.html?lesson=ch04-photography-basics", label: "Photography Basics — Field Manual", sub: "Directing without being seen starts with seeing light." },
    "004": { href: "/decoders-crew.html", label: "Meet the Decoders Crew", sub: "You belong here — these are the operators who will tell you so." },
    "005": { href: "/darkroom.html#skill=iso", label: "ISO & Noise — The Darkroom", sub: "The indoor-party setting, drilled until it is reflex." },
    "006": { href: "/darkroom.html#skill=focus", label: "Nail the Focus — The Darkroom", sub: "Make the camera focus where you mean it, every time." },
    "007": { href: "/darkroom.html#skill=metering", label: "Metering Modes — The Darkroom", sub: "Tell the camera what 'correctly exposed' looks like." },
    "008": { href: "/contract-builder.html", label: "Build the contract", sub: "Three quotes means nothing without paper that protects all three." },
    "009": { href: "/darkroom.html#skill=manual-mode", label: "Manual Mode — The Darkroom", sub: "Own the dial, one drill at a time." },
    "010": { href: "/field-manual.html?lesson=ch02-whats-in-the-box", label: "What's in the Box — Field Manual", sub: "One lens is a discipline; the right kit is the foundation under it." },
    "011": { href: "/darkroom.html#skill=white-balance", label: "White Balance — The Darkroom", sub: "Honest color, set in camera, on purpose." },
    "012": { href: "/field-manual.html?lesson=ch01-transmission", label: "The Cynetis-7 Transmission — Field Manual", sub: "The pause works because of what is behind it." },
    "013": { href: "/deliver.html", label: "Open your delivery hub", sub: "Pricing becomes real the moment a client can book and pay." },
    "014": { href: "/field-manual.html?lesson=ch02-whats-in-the-box", label: "What's in the Box — Field Manual", sub: "Spend the $500 in the order the guide lays out." },
    "015": { href: "/darkroom-lab.html", label: "Open Develop Lab", sub: "Culling is step one; the edit is where the automation pays off." },
    "016": { href: "/deliver.html", label: "Open your delivery hub", sub: "The email books the next gig — the gallery you send it with closes the loop." },
    "017": { href: "/field-manual.html?lesson=ch02-whats-in-the-box", label: "What's in the Box — Field Manual", sub: "Upgrade math starts from what your current kit actually does." },
    "018": { href: "/darkroom-lab.html", label: "Open Develop Lab", sub: "Build the stack on real edits, not screenshots of someone else's." },
    "019": { href: "/missions.html", label: "Prove it in the Arena", sub: "Five shots, real clients watching — enter today's challenge." },
    "020": { href: "/missions.html", label: "Prove it in the Arena", sub: "Venue reads become reflexes when votes are on the line." },
    "021": { href: "/darkroom.html#skill=shutter", label: "Shutter Speed & Motion — The Darkroom", sub: "Sports autofocus starts with shutter discipline." },
    "022": { href: "/darkroom.html#skill=golden-hour", label: "Golden Hour — The Darkroom", sub: "Blue hour is golden hour's second act — drill the light you can schedule." }
  };
  var m = location.pathname.match(/protocol-(\d{3})/);
  if (!m) return;
  var d = DEEPER[m[1]];
  if (!d) return;
  function inject() {
    var main = document.querySelector("main");
    if (!main || main.querySelector(".protocol-deeper")) return;
    var st = document.createElement("style");
    st.textContent =
      ".protocol-deeper{display:block;margin:28px 0 8px;padding:16px;border:1px solid rgba(141,235,0,.25);border-radius:14px;background:rgba(141,235,0,.05);text-decoration:none;color:inherit}" +
      ".protocol-deeper:active{transform:scale(.98)}" +
      ".pd-kicker{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8deb00;font-weight:700;margin-bottom:4px}" +
      ".pd-label{display:block;font-weight:800;font-size:16px}" +
      ".pd-sub{display:block;font-size:13px;opacity:.65;margin-top:2px}";
    document.head.appendChild(st);
    var a = document.createElement("a");
    a.className = "protocol-deeper";
    a.href = d.href;
    var k = document.createElement("span"); k.className = "pd-kicker"; k.textContent = "Go deeper";
    var l = document.createElement("span"); l.className = "pd-label"; l.textContent = d.label + " →";
    var s = document.createElement("span"); s.className = "pd-sub"; s.textContent = d.sub;
    a.appendChild(k); a.appendChild(l); a.appendChild(s);
    main.appendChild(a);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();
})();
