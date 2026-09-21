/* ================================================================
   CAMERAS DECODED — Gear share cards (shared)
   Generates shareable achievement art on canvas from the badge PNGs.

   - CDGearShare.card(badgeId): 1080x1350 achievement card for one
     badge -> native share sheet (image), download fallback.
   - CDGearShare.shelf(badgeIds): 1080x1350 collage of earned gear
     -> native share sheet, download fallback.
   - CDGearShare.offerShare(badgeId): on-earn bottom sheet with the
     badge art + name and a Share button. One-time per badge (badges
     earn once), dismisses cleanly, reduced-motion safe.

   Same-origin art (/media/...) keeps the canvas untainted.
   ================================================================ */
(function () {
  'use strict';

  var W = 1080, H = 1350;
  var BG = '#060606';
  var GREEN = '#8DEB00';
  var GREEN_SOFT = '#B6FF45';

  function defs() {
    try {
      return (window.CDBadges && typeof window.CDBadges.defs === 'function')
        ? window.CDBadges.defs() : {};
    } catch (e) { return {}; }
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function baseCanvas() {
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    // soft green aura behind the art
    var g = ctx.createRadialGradient(W / 2, 560, 60, W / 2, 560, 520);
    g.addColorStop(0, 'rgba(141,235,0,0.16)');
    g.addColorStop(1, 'rgba(141,235,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return { canvas: c, ctx: ctx };
  }

  function brandFooter(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.font = '600 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('CAMERAS DECODED', W / 2, H - 96);
    ctx.fillStyle = '#555';
    ctx.font = '500 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('GEAR COLLECTIBLE · SERIES 01', W / 2, H - 56);
  }

  function rarityLabel(r) {
    return (r || 'common').toUpperCase();
  }

  function rarityColor(r) {
    return r === 'legendary' ? GREEN_SOFT : (r === 'rare' ? GREEN : '#999');
  }

  // ---- Single-badge achievement card ----
  async function card(badgeId) {
    var d = defs()[badgeId];
    if (!d || !d.art) return false;
    try {
      var img = await loadImage(d.art);
      var c = baseCanvas(), ctx = c.ctx;

      ctx.textAlign = 'center';
      ctx.fillStyle = '#666';
      ctx.font = '700 34px system-ui, -apple-system, sans-serif';
      ctx.fillText('G E A R   A C Q U I R E D', W / 2, 150);

      // art
      var size = 720;
      ctx.drawImage(img, (W - size) / 2, 200, size, size);

      // name
      ctx.fillStyle = '#fff';
      ctx.font = '800 84px system-ui, -apple-system, sans-serif';
      ctx.fillText(d.name || badgeId, W / 2, 1060);

      // rarity pill
      var label = rarityLabel(d.rarity);
      ctx.font = '700 30px system-ui, -apple-system, sans-serif';
      var tw = ctx.measureText(label).width + 56;
      var col = rarityColor(d.rarity);
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      roundRect(ctx, (W - tw) / 2, 1096, tw, 62, 31);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillText(label, W / 2, 1138);

      ctx.fillStyle = '#777';
      ctx.font = '500 30px system-ui, -apple-system, sans-serif';
      ctx.fillText(d.desc || '', W / 2, 1200);

      brandFooter(ctx);
      return shareCanvas(c.canvas, (d.name || 'gear') + '-cameras-decoded.png',
        'I earned the ' + (d.name || 'gear') + ' collectible on Cameras Decoded');
    } catch (e) { return false; }
  }

  // ---- Shelf collage: every earned gear badge ----
  async function shelf(badgeIds) {
    badgeIds = (badgeIds || []).filter(function (id) { return defs()[id] && defs()[id].art; });
    if (!badgeIds.length) return false;
    try {
      var c = baseCanvas(), ctx = c.ctx;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = '800 72px system-ui, -apple-system, sans-serif';
      ctx.fillText('MY GEAR SHELF', W / 2, 150);
      ctx.fillStyle = '#666';
      ctx.font = '600 30px system-ui, -apple-system, sans-serif';
      ctx.fillText(badgeIds.length + ' COLLECTIBLE' + (badgeIds.length === 1 ? '' : 'S') + ' EARNED', W / 2, 200);

      var imgs = await Promise.all(badgeIds.slice(0, 10).map(function (id) {
        return loadImage(defs()[id].art).catch(function () { return null; });
      }));
      var n = imgs.length;
      var cols = n <= 2 ? n : (n <= 4 ? 2 : (n <= 6 ? 3 : 3));
      var rows = Math.ceil(n / cols);
      var cell = Math.min(300, 900 / cols);
      var gw = cols * cell, gh = rows * cell;
      var ox = (W - gw) / 2, oy = 300 + Math.max(0, (760 - gh) / 2);
      imgs.forEach(function (img, i) {
        if (!img) return;
        var colI = i % cols, rowI = Math.floor(i / cols);
        var pad = 14, s = cell - pad * 2;
        ctx.drawImage(img, ox + colI * cell + pad, oy + rowI * cell + pad, s, s);
      });

      brandFooter(ctx);
      return shareCanvas(c.canvas, 'my-gear-shelf-cameras-decoded.png',
        'My Cameras Decoded gear shelf — ' + badgeIds.length + ' collectibles earned');
    } catch (e) { return false; }
  }

  function shareCanvas(canvas, filename, text) {
    return new Promise(function (resolve) {
      try {
        canvas.toBlob(function (blob) {
          if (!blob) { resolve(false); return; }
          try {
            var file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              navigator.share({ files: [file], title: 'Cameras Decoded', text: text })
                .then(function () { resolve(true); })
                .catch(function () { resolve(false); });
              return;
            }
          } catch (e) { /* fall through to download */ }
          // download fallback
          try {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
              document.body.removeChild(a);
              URL.revokeObjectURL(a.href);
            }, 4000);
            resolve(true);
          } catch (e2) { resolve(false); }
        }, 'image/png');
      } catch (e) { resolve(false); }
    });
  }

  // ---- On-earn bottom sheet ----
  function offerShare(badgeId) {
    try {
      var d = defs()[badgeId];
      if (!d) return;
      if (document.getElementById('cd-gear-offer')) return; // one at a time
      var reduceMotion = false;
      try {
        reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) {}

      var wrap = document.createElement('div');
      wrap.id = 'cd-gear-offer';
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-label', 'Gear acquired');
      wrap.style.cssText = 'position:fixed;inset:0;z-index:99990;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.6);' +
        (reduceMotion ? '' : 'animation:cdGearFade .25s ease;');

      var artHtml = d.art
        ? '<img src="' + d.art + '" alt="" style="width:96px;height:96px;object-fit:contain;">'
        : '<div style="font-size:52px;line-height:96px;">' + (d.emoji || '📷') + '</div>';

      wrap.innerHTML =
        '<div style="width:100%;max-width:520px;background:#0c0c0c;border:1px solid #1e1e1e;border-bottom:none;border-radius:20px 20px 0 0;padding:24px 24px calc(24px + env(safe-area-inset-bottom));text-align:center;' +
        (reduceMotion ? '' : 'animation:cdGearUp .3s ease;') + '">' +
          '<div style="font-size:11px;letter-spacing:3px;color:' + GREEN + ';font-weight:700;margin-bottom:12px;">GEAR ACQUIRED</div>' +
          '<div style="margin-bottom:12px;">' + artHtml + '</div>' +
          '<div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;">' + escapeHtml(d.name || badgeId) + '</div>' +
          '<div style="font-size:13px;color:#888;margin-bottom:20px;">' + escapeHtml(d.desc || '') + '</div>' +
          '<div style="display:flex;gap:10px;">' +
            '<button type="button" id="cdGearShareBtn" style="flex:1;padding:14px;border:none;border-radius:12px;background:' + GREEN + ';color:#000;font-weight:800;font-size:15px;">Share</button>' +
            '<button type="button" id="cdGearDismissBtn" style="flex:1;padding:14px;border:1px solid #2a2a2a;border-radius:12px;background:transparent;color:#bbb;font-weight:700;font-size:15px;">Not now</button>' +
          '</div>' +
        '</div>' +
        '<style>@keyframes cdGearFade{from{opacity:0}}@keyframes cdGearUp{from{transform:translateY(40px);opacity:0}}</style>';

      function close() { try { wrap.remove(); } catch (e) {} }
      wrap.addEventListener('click', function (ev) { if (ev.target === wrap) close(); });
      wrap.querySelector('#cdGearDismissBtn').addEventListener('click', close);
      wrap.querySelector('#cdGearShareBtn').addEventListener('click', function () {
        close();
        card(badgeId);
      });
      document.body.appendChild(wrap);
    } catch (e) { /* never break the host page */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.CDGearShare = { card: card, shelf: shelf, offerShare: offerShare };
})();
