// veil-flipbook.js – boot-veil rotation variant 3: photographer flip-book.
// Loaded ONLY on operator-dashboard.html, synchronously in <head> right after
// master-loader.js (which has already built #cdBootVeil by this point).
//
// What it does: with ~1/3 probability (vs the two veil videos), once per day,
// and never under prefers-reduced-motion, it swaps the veil's <video> for a
// fast-paced flip-book of real photographers in the field. The sequence only
// animates AFTER the tap-to-enter tap (or immediately when no tap gate is
// shown); it never covers the veil's tap target, never holds the veil, and
// always yields the moment the dashboard releases it (CDLoading.done()).
(function () {
  'use strict';

  var V = '20261001a'; // cache-bust tag; bump when the photo set changes
  var FRAMES = [
    '/media/sting/fb-01.jpg?v=' + V, // sports sideline, long lens
    '/media/sting/fb-02.jpg?v=' + V, // wedding, DSLR close-up
    '/media/sting/fb-03.jpg?v=' + V, // street, two shooters
    '/media/sting/fb-04.jpg?v=' + V, // studio, directing the model
    '/media/sting/fb-05.jpg?v=' + V, // concert stage lights
    '/media/sting/fb-06.jpg?v=' + V, // studio portrait, female photographer
    '/media/sting/fb-07.jpg?v=' + V, // outdoors, Nikon close-up
    '/media/sting/fb-08.jpg?v=' + V, // street, Sao Paulo
    '/media/sting/fb-09.jpg?v=' + V, // indoor event, long lens
    '/media/sting/fb-10.jpg?v=' + V  // outdoor ceremony, white suit
  ];
  var FRAME_MS = 170;   // ~1.7s per full pass; loops until the veil releases
  var DAY_PREFIX = 'cd_flipbook_sting_';

  function dayKey() {
    var d = new Date();
    return DAY_PREFIX + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function shownToday() {
    try { return localStorage.getItem(dayKey()) === '1'; } catch (e) { return false; }
  }

  function claimToday() {
    try { localStorage.setItem(dayKey(), '1'); } catch (e) { /* private mode */ }
  }

  function injectCSS() {
    if (document.getElementById('cdFlipbookCSS')) return;
    var s = document.createElement('style');
    s.id = 'cdFlipbookCSS';
    s.textContent = [
      '.cd-fb-stack{position:absolute;inset:0;overflow:hidden;background:#070708}',
      '.cd-fb-frame{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.05);transition:opacity 90ms linear,transform 480ms ease-out}',
      '.cd-fb-frame.on{opacity:1;transform:scale(1)}',
      '@media (prefers-reduced-motion:reduce){.cd-fb-frame{transition:none}}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  // ---- eligibility: 3-way rotation, once per day, motion-safe ----
  if (reducedMotion()) return;
  if (shownToday()) return;
  if (Math.random() >= 1 / 3) return; // the two videos split the other ~2/3

  var veil = document.getElementById('cdBootVeil');
  if (!veil) return;
  var video = veil.querySelector('video');
  if (!video) return; // veil fell back to the pulsing dot; leave it alone

  claimToday();
  injectCSS();

  // ---- swap the video for the frame stack (label + scrim stay put) ----
  var stack = document.createElement('div');
  stack.className = 'cd-fb-stack';
  stack.setAttribute('aria-hidden', 'true');
  var frames = FRAMES.map(function (src, i) {
    var img = document.createElement('img');
    img.className = 'cd-fb-frame' + (i === 0 ? ' on' : '');
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    stack.appendChild(img);
    return img;
  });
  video.replaceWith(stack);

  // Preload every frame up front so the sequence never janks mid-play.
  FRAMES.forEach(function (src) {
    var p = new Image();
    p.decoding = 'async';
    p.src = src;
  });

  // ---- animation: fast shutter-rhythm crossfades, stops when the veil goes ----
  var idx = 0;
  var timer = null;
  var started = false;

  function veilGone() {
    return !document.getElementById('cdBootVeil') || veil.classList.contains('cd-bv-hide');
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function advance() {
    if (veilGone()) { stop(); return; }
    frames[idx].classList.remove('on');
    idx = (idx + 1) % frames.length;
    frames[idx].classList.add('on');
  }

  function start() {
    if (started || veilGone()) return;
    started = true;
    timer = setInterval(advance, FRAME_MS);
    setTimeout(stop, 9000); // absolute backstop; the veil's own 8s cap fires first
  }

  // Start immediately — the two video variants already animate behind the
  // "Tap to tune in" gate, so the flip-book does the same. The tap target is
  // the veil itself and is untouched: the tap still dismisses the veil
  // exactly as before, and the sequence simply stops when the veil releases.
  start();
})();
