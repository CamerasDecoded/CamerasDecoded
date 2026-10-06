/* ==========================================================================
   CAMERA LAB v2 — Cameras Decoded game module
   --------------------------------------------------------------------------
   Real-time mirrorless camera simulator: WebGL exposure pipeline (EV math),
   ISO grain, motion blur, white balance, 5 CC0 scenes with per-scene
   baselines, premium scene picker, photo grading (S/A/B/C/D), XP with
   difficulty scaling, SHOT LOG ledger (localStorage + Firestore-ready),
   skill-weakness detection, real RGB histogram from GPU readback.

   Ported from the standalone prototype. Adaptations for the arcade contract:
     - All UI mounts inside the `stage` element; CSS namespaced under
       `.cl2-root` (zero collisions with site CSS or camera-lab v1).
     - Scene images load from /media/camera-lab-v2/ (not embedded).
     - Games never touch Firebase: ledger entries queue in `pendingLedger`
       and are exposed via getSnapshot().detail for the shell (play.html)
       to write to xpLedger/{uid}/entries/.
     - Scoring: getSnapshot() returns the player's BEST photo score (0-100)
       this session. The shell computes XP via round(slot.xp * score/100).
     - destroy() tears down: cancels rAF, drops GL context refs, removes DOM.
   ========================================================================== */
(function () {
  'use strict';

  var CSS = `

  .cl2-root{
    --green:#8deb00;
    --green-dim:rgba(141,235,0,.06);
    --green-glow:rgba(141,235,0,.15);
    --green-soft:rgba(141,235,0,.08);
    --dark:#08080a;
    --card-bg:rgba(12,12,14,.92);
    --border:rgba(255,255,255,.06);
    --text:#ffffff; --text-sec:rgba(255,255,255,.6); --muted:rgba(255,255,255,.35);
    --neon:#8deb00; --neon-dim:rgba(141,235,0,.28);
    --neon-glow:rgba(141,235,0,.15);
    --glass:rgba(12,12,14,.92); --amber:#ffd34d; --red:#ff5d5d;
    --serif:Georgia,"Times New Roman",serif;
    --mono:'Space Mono',monospace; --sans:'Montserrat',sans-serif;
  }.cl2-root * {margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}.cl2-root html, .cl2-root body {height:100%;overflow:hidden}.cl2-root body {
    background:var(--dark);
    background-image:
      radial-gradient(ellipse at 30% 20%,rgba(141,235,0,.04) 0%,transparent 60%),
      radial-gradient(ellipse at 70% 80%,rgba(141,235,0,.02) 0%,transparent 50%),
      radial-gradient(rgba(255,255,255,.015) 1px,transparent 1px);
    background-size:100% 100%,100% 100%,24px 24px;
    color:var(--text);
    font-family:var(--sans);
    height:100dvh;overflow:hidden;
    display:flex;justify-content:center;
  }.cl2-root.phone {width:100%;max-width:393px;height:100dvh;max-height:100dvh;position:relative;
    background:transparent;
    display:flex;flex-direction:column;overflow:hidden}.cl2-root .titlebar {display:none;}.cl2-root .title-fallback {font-size:16px;font-weight:800;letter-spacing:.28em;color:var(--text);
    font-family:var(--mono)}.cl2-root .title-fallback em {font-style:normal;color:var(--neon)}.cl2-root .mode-pill {font-size:9px;font-weight:700;letter-spacing:.24em;color:var(--neon);border:1px solid var(--neon-dim);
    border-radius:999px;padding:6px 14px;background:var(--green-soft);
    box-shadow:0 0 14px rgba(141,235,0,.1),inset 0 0 10px rgba(141,235,0,.04);font-family:var(--mono)}.cl2-root .status {display:flex;align-items:center;justify-content:space-between;padding:10px 20px 4px;
    font-size:10px;font-weight:600;color:var(--muted);letter-spacing:.14em;font-family:var(--mono)}.cl2-root .status .l {display:flex;gap:22px;align-items:center}.cl2-root .flash-lbl {color:var(--text);font-weight:600}.cl2-root #wbLbl {color:var(--text);font-weight:600;font-variant-numeric:tabular-nums}.cl2-root .set-btn {width:40px;height:40px;border:1px solid rgba(255,255,255,.22);border-radius:50%;
    display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;letter-spacing:.1em;color:var(--text);
    background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02));
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 4px 14px rgba(0,0,0,.4);
    cursor:pointer;user-select:none}.cl2-root .set-btn:active {transform:scale(.92)}.cl2-root .caps {display:flex;gap:20px;justify-content:center;padding:8px 10px;font-size:10px;font-weight:600;
    color:var(--muted);letter-spacing:.1em;border-bottom:1px solid rgba(141,235,0,.06);
    font-family:var(--mono)}.cl2-root .caps b {color:var(--text);font-weight:700}.cl2-root .caps .on {color:var(--neon);text-shadow:0 0 10px rgba(141,235,0,.5)}.cl2-root /* ---------- viewfinder ---------- */
  .vf {position:relative;flex:1 1 auto;min-height:0;margin:10px 14px 0;border-radius:var(--radius);overflow:hidden;
    background:radial-gradient(120% 100% at 50% 40%,#0c0c0e 0%,#08080a 100%);
    border:1px solid var(--border);
    box-shadow:0 10px 36px rgba(0,0,0,.55),inset 0 0 60px rgba(0,0,0,.45)}.cl2-root #gl {position:absolute;inset:0;width:100%;height:100%;display:block}.cl2-root .vf-shade {content:"";position:absolute;inset:0;pointer-events:none;
    background:
      radial-gradient(118% 92% at 50% 46%,transparent 56%,rgba(0,0,0,.46) 100%),
      linear-gradient(180deg,rgba(5,5,9,.44),transparent 24%,transparent 70%,rgba(5,5,9,.58))}.cl2-root .grid {position:absolute;inset:0;pointer-events:none;opacity:.5}.cl2-root .grid::before, .cl2-root .grid::after {content:"";position:absolute;background:rgba(255,255,255,.1)}.cl2-root .grid::before {left:33.3%;width:1px;top:0;bottom:0;box-shadow:118px 0 0 rgba(255,255,255,.1)}.cl2-root .grid::after {top:33.3%;height:1px;left:0;right:0;box-shadow:0 118px 0 rgba(255,255,255,.1)}.cl2-root .brackets {position:absolute;left:50%;top:46%;width:120px;height:120px;transform:translate(-50%,-50%)}.cl2-root .brackets i {position:absolute;width:22px;height:22px;border:2px solid var(--neon);
    filter:drop-shadow(0 0 5px rgba(141,235,0,.75))}.cl2-root .brackets i:nth-child(1) {left:0;top:0;border-right:0;border-bottom:0}.cl2-root .brackets i:nth-child(2) {right:0;top:0;border-left:0;border-bottom:0}.cl2-root .brackets i:nth-child(3) {left:0;bottom:0;border-right:0;border-top:0}.cl2-root .brackets i:nth-child(4) {right:0;bottom:0;border-left:0;border-top:0}.cl2-root .af-dot {position:absolute;left:50%;top:46%;width:6px;height:6px;margin:-3px;border-radius:50%;
    background:var(--neon);box-shadow:0 0 10px var(--neon),0 0 20px rgba(141,235,0,.5)}.cl2-root .ev {position:absolute;left:10px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;
    align-items:center;gap:3px;font-size:9px;font-weight:600;letter-spacing:.06em;color:var(--muted);
    height:150px;justify-content:center;position:absolute;
    background:rgba(12,12,14,.92);border:1px solid rgba(255,255,255,.08);border-radius:10px;
    padding:8px 5px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}.cl2-root .ev .tick {width:14px;height:1px;background:rgba(255,255,255,.28)}.cl2-root .ev .tick.zero {width:22px;background:var(--neon);box-shadow:0 0 6px rgba(141,235,0,.8)}.cl2-root .ev .needle {position:absolute;left:-8px;width:0;height:0;border-right:7px solid var(--amber);
    border-top:4px solid transparent;border-bottom:4px solid transparent;transition:top .18s ease-out;
    filter:drop-shadow(0 0 3px rgba(255,211,77,.7))}.cl2-root .ev-num {position:absolute;left:10px;bottom:34px;font-size:11px;font-weight:700;letter-spacing:.08em;
    font-variant-numeric:tabular-nums;
    background:rgba(12,12,14,.92);border:1px solid rgba(255,255,255,.12);padding:5px 11px;border-radius:999px;
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    box-shadow:0 4px 14px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.08)}.cl2-root .ev-num.ok {color:var(--neon);border-color:rgba(141,235,0,.3);text-shadow:0 0 10px rgba(141,235,0,.5)}.cl2-root .ev-num.warn {color:var(--amber);border-color:rgba(255,211,77,.3)}.cl2-root .ev-num.bad {color:var(--red);border-color:rgba(255,93,93,.35)}.cl2-root .scene-tag {position:absolute;left:12px;bottom:10px;font-size:9px;font-weight:700;letter-spacing:.2em;
    color:#fff;background:rgba(12,12,14,.92);border:1px solid rgba(141,235,0,.2);
    padding:6px 12px;border-radius:999px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    box-shadow:0 4px 14px rgba(0,0,0,.45);cursor:pointer;user-select:none}.cl2-root .scene-tag:active {border-color:rgba(141,235,0,.5)}.cl2-root .scene-tag b {color:var(--neon);font-weight:700}.cl2-root .shake {position:absolute;right:10px;bottom:10px;font-size:10px;font-weight:800;letter-spacing:.14em;
    color:#141005;background:linear-gradient(180deg,#ffd968,#f5b92e);padding:6px 11px;border-radius:8px;display:none;
    box-shadow:0 4px 14px rgba(0,0,0,.45),0 0 16px rgba(255,211,77,.35)}.cl2-root .shake.show {display:block;animation:blink 1s steps(2) infinite}
  @keyframes blink{.cl2-root 50% {opacity:.55}}.cl2-root .hist {position:absolute;right:10px;top:10px;width:88px;height:56px;border:1px solid rgba(255,255,255,.12);
    border-radius:8px;background:rgba(12,12,14,.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    box-shadow:0 4px 14px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}.cl2-root .hist svg {display:block;width:100%;height:100%}.cl2-root .clip-m {position:absolute;top:0;width:0;height:0;display:none}.cl2-root .clip-l {left:0;border-top:12px solid rgba(255,80,80,.9);border-right:12px solid transparent}.cl2-root .clip-r {right:0;border-top:12px solid rgba(255,80,80,.9);border-left:12px solid transparent}.cl2-root .clip-m.show {display:block}.cl2-root .rail {position:absolute;right:10px;top:50%;transform:translateY(-50%);
    display:flex;flex-direction:column;gap:14px;align-items:center}.cl2-root .rbtn {width:44px;height:44px;border-radius:50%;
    background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.03));
    border:1px solid rgba(255,255,255,.18);color:#fff;font-size:20px;font-weight:600;
    display:flex;align-items:center;justify-content:center;
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 4px 14px rgba(0,0,0,.45);
    cursor:pointer;user-select:none}.cl2-root .rbtn:active {transform:scale(.92)}.cl2-root /* ---------- dial strip ---------- */
  .dials {display:flex;justify-content:space-between;align-items:stretch;gap:10px;
    padding:12px 14px;margin:10px 12px 0;
    background:var(--card-bg);
    border:1px solid var(--border);border-radius:var(--radius);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 6px 20px rgba(0,0,0,.35)}.cl2-root .dial {flex:1;text-align:center;padding:10px 6px 8px;border-radius:12px;cursor:grab;user-select:none;
    -webkit-user-select:none;touch-action:none;border:1px solid transparent;
    transition:border-color .18s,box-shadow .18s,background .18s}.cl2-root .dial:active {cursor:grabbing}.cl2-root .dial .k {font-size:9px;letter-spacing:.18em;color:var(--muted);font-weight:700;font-family:var(--mono)}.cl2-root .dial .v {font-size:17px;margin-top:4px;color:var(--text);font-variant-numeric:tabular-nums;
    font-weight:700;letter-spacing:.02em;font-family:var(--mono)}.cl2-root .dial .u {font-size:9px;color:var(--muted);letter-spacing:.08em;margin-top:2px}.cl2-root .dial.active {border-color:rgba(141,235,0,.38);
    background:var(--green-dim);
    box-shadow:0 0 20px rgba(141,235,0,.06),inset 0 1px 0 rgba(141,235,0,.22)}.cl2-root .dial.active .k {color:var(--neon)}.cl2-root .dial.active .v {color:#fff;text-shadow:0 0 14px rgba(141,235,0,.65)}.cl2-root .ticks {position:relative;height:36px;margin:6px 40px 0;touch-action:none;cursor:ew-resize}.cl2-root .ticks .track {position:absolute;left:0;right:0;bottom:6px;height:14px;
    background:
      repeating-linear-gradient(90deg,rgba(255,255,255,.32) 0 1px,transparent 1px 56px),
      repeating-linear-gradient(90deg,rgba(255,255,255,.16) 0 1px,transparent 1px 14px)}.cl2-root .ticks .mark {position:absolute;bottom:0;width:2px;height:20px;background:var(--neon);left:50%;
    box-shadow:0 0 12px rgba(141,235,0,.95);border-radius:1px}.cl2-root .ticks .nav {position:absolute;top:-3px;font-size:13px;color:var(--muted);cursor:pointer;user-select:none;
    width:34px;height:34px;display:flex;align-items:center;justify-content:center;
    border-radius:50%;border:1px solid rgba(255,255,255,.1);
    background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.02));
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.1)}.cl2-root .ticks .nav.l {left:-32px}.cl2-root .ticks .nav.r {right:-32px}.cl2-root .ticks .nav:active {color:var(--neon);border-color:rgba(141,235,0,.4)}.cl2-root .ticks .nav .tri-l, .cl2-root .ticks .nav .tri-r {display:block;width:0;height:0;
    border-top:6px solid transparent;border-bottom:6px solid transparent}.cl2-root .ticks .nav .tri-l {border-right:9px solid var(--muted);margin-right:2px}.cl2-root .ticks .nav .tri-r {border-left:9px solid var(--muted);margin-left:2px}.cl2-root .ticks .nav:active .tri-l {border-right-color:var(--neon)}.cl2-root .ticks .nav:active .tri-r {border-left-color:var(--neon)}.cl2-root .tick-val {position:absolute;left:50%;transform:translateX(-50%);top:-5px;font-size:9px;font-weight:700;
    color:var(--muted);letter-spacing:.24em;white-space:nowrap}.cl2-root /* ---------- shutter row ---------- */
  .shutter-row {display:flex;align-items:center;justify-content:space-between;
    padding:10px 28px calc(env(safe-area-inset-bottom,0px) + 12px)}.cl2-root .mode-m {font-size:20px;font-weight:800;color:var(--amber);letter-spacing:.05em;margin-right:6px;
    text-shadow:0 0 12px rgba(255,211,77,.4)}.cl2-root .shutter-wrap {position:relative;width:76px;height:76px;flex:0 0 auto}.cl2-root .shutter {position:relative;z-index:1;width:100%;height:100%;border-radius:50%;border:1px solid rgba(255,255,255,.14);cursor:pointer;
    background:radial-gradient(circle at 34% 28%,#ff8d7a 0%,#f03434 38%,#c11616 72%,#8f0e0e 100%);
    box-shadow:inset 0 2px 8px rgba(255,255,255,.4),inset 0 -10px 18px rgba(0,0,0,.5),0 8px 24px rgba(0,0,0,.55);
    color:#fff}.cl2-root .shutter:active {transform:scale(.94)}.cl2-root .side-btns {display:flex;gap:14px;align-items:center;margin-right:6px}.cl2-root .thumb {width:48px;height:48px;border-radius:12px;border:1px solid rgba(255,255,255,.14);
    background:#08080a center/cover no-repeat;overflow:hidden;cursor:pointer;
    box-shadow:0 4px 14px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.08)}.cl2-root .thumb.empty {background:#08080a}.cl2-root .zoom {width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.2);
    background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.02));
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 4px 14px rgba(0,0,0,.45);
    display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;
    font-variant-numeric:tabular-nums;cursor:pointer;user-select:none}.cl2-root .zoom:active {transform:scale(.92)}.cl2-root .flash {position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:5}.cl2-root .flash.go {animation:flashA .28s ease-out}
  @keyframes flashA{.cl2-root 0% {opacity:.95}.cl2-root 100% {opacity:0}}.cl2-root /* ---------- scene picker modal ---------- */
  .scn-veil {position:absolute;inset:0;background:rgba(4,4,8,.72);opacity:0;pointer-events:none;
    transition:opacity .25s ease;z-index:30;
    backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}.cl2-root .scn-veil.show {opacity:1;pointer-events:auto}.cl2-root .scn-modal {position:absolute;left:28px;right:28px;top:50%;z-index:31;max-height:76%;
    transform:translateY(-50%) scale(.96);
    background:linear-gradient(180deg,rgba(14,14,17,.97),rgba(8,8,10,.98));
    border:1px solid rgba(141,235,0,.14);border-radius:18px;
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    box-shadow:0 24px 64px rgba(0,0,0,.7),0 0 40px rgba(141,235,0,.05);
    opacity:0;visibility:hidden;pointer-events:none;
    display:flex;flex-direction:column;overflow:hidden;
    transition:opacity .25s ease,transform .25s cubic-bezier(.32,.72,.35,1),visibility 0s .3s}.cl2-root .scn-modal.show {opacity:1;visibility:visible;pointer-events:auto;
    transform:translateY(-50%) scale(1);
    transition:opacity .25s ease,transform .25s cubic-bezier(.32,.72,.35,1)}.cl2-root .scn-head {display:flex;align-items:center;justify-content:space-between;
    padding:16px 16px 12px;flex:0 0 auto}.cl2-root .scn-title {font-family:var(--serif);font-style:italic;font-size:15px;letter-spacing:.12em;
    color:var(--neon);font-weight:400;text-shadow:0 0 14px rgba(141,235,0,.35)}.cl2-root .scn-close {width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.12);
    background:rgba(255,255,255,.05);position:relative;cursor:pointer;flex:0 0 auto;
    transition:border-color .15s,background .15s}.cl2-root .scn-close:active {border-color:rgba(141,235,0,.4);background:rgba(141,235,0,.08)}.cl2-root .scn-close i {position:absolute;left:50%;top:50%;width:12px;height:1.5px;background:#fff;
    transform:translate(-50%,-50%) rotate(45deg)}.cl2-root .scn-close i::after {content:"";position:absolute;inset:0;background:#fff;transform:rotate(90deg)}.cl2-root .scn-list {overflow-y:auto;padding:0 12px 14px;display:flex;flex-direction:column;gap:8px;
    -webkit-overflow-scrolling:touch}.cl2-root .scn-card {display:flex;gap:12px;align-items:center;padding:10px;border-radius:12px;
    border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);
    cursor:pointer;user-select:none;flex:0 0 auto;
    transition:border-color .15s,background .15s,transform .1s}.cl2-root .scn-card:active {transform:scale(.985)}.cl2-root .scn-card.active {border-color:rgba(141,235,0,.45);background:rgba(141,235,0,.06);
    box-shadow:0 0 18px rgba(141,235,0,.08)}.cl2-root .scn-card img {width:68px;height:46px;object-fit:cover;border-radius:8px;flex:0 0 auto;
    border:1px solid rgba(255,255,255,.08)}.cl2-root .scn-card .tx {min-width:0;flex:1}.cl2-root .scn-card .nm {font-size:11px;font-weight:700;letter-spacing:.14em;color:#fff}.cl2-root .scn-card .nm .no {font-family:var(--mono);font-size:10px;color:var(--neon);margin-right:6px}.cl2-root .scn-card .ds {font-size:11px;color:rgba(255,255,255,.5);margin-top:3px;line-height:1.4}.cl2-root /* ---------- settings sheet ---------- */
  .sheet-veil {position:absolute;inset:0;background:rgba(4,4,8,.6);opacity:0;pointer-events:none;
    transition:opacity .22s ease;z-index:20;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}.cl2-root .sheet-veil.show {opacity:1;pointer-events:auto}.cl2-root .sheet {position:absolute;left:0;right:0;bottom:0;z-index:21;
    background:linear-gradient(180deg,rgba(12,12,14,.95),rgba(8,8,10,.97));
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    border-top:1px solid rgba(141,235,0,.18);border-radius:20px 20px 0 0;
    box-shadow:0 -16px 48px rgba(0,0,0,.65),0 0 32px rgba(141,235,0,.04);
    padding:10px 18px calc(env(safe-area-inset-bottom,0px) + 18px);
    transform:translateY(105%);visibility:hidden;
    transition:transform .28s cubic-bezier(.32,.72,.35,1),visibility 0s .3s}.cl2-root .sheet.show {transform:translateY(0);visibility:visible;transition:transform .28s cubic-bezier(.32,.72,.35,1)}.cl2-root .sheet-handle {width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,.22);margin:2px auto 10px}.cl2-root .sheet-title {font-family:var(--serif);font-style:italic;font-size:16px;letter-spacing:.12em;
    color:var(--neon);font-weight:400;margin-bottom:6px;text-shadow:0 0 14px rgba(141,235,0,.35)}.cl2-root .trow {display:flex;align-items:center;justify-content:space-between;padding:13px 2px;
    border-bottom:1px solid rgba(255,255,255,.07);font-size:14px;font-weight:500;cursor:pointer;user-select:none}.cl2-root .tsw {width:46px;height:27px;border-radius:14px;background:rgba(255,255,255,.14);position:relative;
    transition:background .18s,box-shadow .18s;flex:0 0 auto;
    box-shadow:inset 0 1px 3px rgba(0,0,0,.4)}.cl2-root .tsw::after {content:"";position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;
    background:#fff;transition:left .18s;box-shadow:0 2px 6px rgba(0,0,0,.4)}.cl2-root .tsw.on {background:var(--neon);box-shadow:0 0 14px rgba(141,235,0,.55),inset 0 1px 2px rgba(0,0,0,.2)}.cl2-root .tsw.on::after {left:22px}.cl2-root .sheet-close {margin-top:14px;width:100%;padding:13px;border-radius:12px;border:1px solid var(--neon-dim);
    background:rgba(141,235,0,.08);color:var(--neon);font-size:13px;font-weight:700;
    letter-spacing:.18em;cursor:pointer;box-shadow:0 0 16px rgba(141,235,0,.1)}.cl2-root /* ---------- capture lightbox ---------- */
  .lightbox {position:absolute;inset:0;z-index:30;background:rgba(5,5,9,.94);display:none;
    align-items:center;justify-content:center;flex-direction:column;gap:12px;cursor:pointer;
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}.cl2-root .lightbox.show {display:flex}.cl2-root .lightbox img {max-width:92%;max-height:52%;border-radius:12px;border:1px solid rgba(141,235,0,.2);
    box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 40px rgba(141,235,0,.06)}.cl2-root .lightbox span {font-size:10px;font-weight:600;letter-spacing:.24em;color:var(--muted)}.cl2-root /* ---------- grade card (in capture lightbox) ---------- */
  .grade-card {display:none;width:86%;max-width:340px;border-radius:16px;padding:14px 16px;
    background:linear-gradient(180deg,rgba(14,14,17,.96),rgba(8,8,10,.97));
    border:1px solid rgba(141,235,0,.16);
    box-shadow:0 16px 40px rgba(0,0,0,.6),0 0 24px rgba(141,235,0,.05);
    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);text-align:left}.cl2-root .grade-card.show {display:block}.cl2-root .grade-top {display:flex;align-items:center;gap:14px}.cl2-root .grade-letter {font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:44px;line-height:1;
    width:64px;height:64px;display:flex;align-items:center;justify-content:center;border-radius:14px;
    border:1px solid rgba(141,235,0,.25);background:rgba(141,235,0,.06);color:var(--neon);
    text-shadow:0 0 18px rgba(141,235,0,.45)}.cl2-root .grade-letter.gB {color:#fff;text-shadow:none;border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.05)}.cl2-root .grade-letter.gC {color:var(--amber);text-shadow:0 0 18px rgba(255,190,60,.4);border-color:rgba(255,190,60,.3);background:rgba(255,190,60,.06)}.cl2-root .grade-letter.gD {color:#ff6b6b;text-shadow:none;border-color:rgba(255,107,107,.3);background:rgba(255,107,107,.06)}.cl2-root .grade-meta {flex:1}.cl2-root .grade-score {font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:#fff}.cl2-root .grade-xp {font-family:'Space Mono',monospace;font-size:12px;font-weight:700;color:var(--neon);letter-spacing:.14em;margin-top:3px}.cl2-root .grade-fb {margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.07)}.cl2-root .grade-fb div {font-size:11.5px;line-height:1.55;color:rgba(255,255,255,.72);margin-top:5px}.cl2-root .grade-fb div:first-child {margin-top:0}.cl2-root .grade-fb b {color:#fff;font-weight:600}.cl2-root /* ---------- ledger modal ---------- */
  .lgr-veil {position:absolute;inset:0;background:rgba(4,4,8,.72);opacity:0;pointer-events:none;
    transition:opacity .25s ease;z-index:40;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}.cl2-root .lgr-veil.show {opacity:1;pointer-events:auto}.cl2-root .lgr-modal {position:absolute;left:24px;right:24px;top:50%;z-index:41;max-height:78%;
    transform:translateY(-50%) scale(.96);
    background:linear-gradient(180deg,rgba(14,14,17,.97),rgba(8,8,10,.98));
    border:1px solid rgba(141,235,0,.14);border-radius:18px;
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    box-shadow:0 24px 64px rgba(0,0,0,.7),0 0 40px rgba(141,235,0,.05);
    opacity:0;visibility:hidden;pointer-events:none;
    display:flex;flex-direction:column;overflow:hidden;
    transition:opacity .25s ease,transform .25s cubic-bezier(.32,.72,.35,1),visibility 0s .3s}.cl2-root .lgr-modal.show {opacity:1;visibility:visible;pointer-events:auto;transform:translateY(-50%) scale(1);
    transition:opacity .25s ease,transform .25s cubic-bezier(.32,.72,.35,1)}.cl2-root .lgr-head {display:flex;align-items:center;justify-content:space-between;padding:16px 18px 12px}.cl2-root .lgr-title {font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;color:var(--neon);letter-spacing:.06em}.cl2-root .lgr-close {width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.14);
    background:rgba(255,255,255,.04);position:relative;cursor:pointer}.cl2-root .lgr-close i, .cl2-root .lgr-close i:after {position:absolute;left:9px;right:9px;top:15px;height:1.5px;background:rgba(255,255,255,.7)}.cl2-root .lgr-close i:after {content:'';left:0;right:0;top:0;transform:rotate(90deg)}.cl2-root .lgr-close i {transform:rotate(45deg)}.cl2-root .lgr-totals {display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 18px 12px}.cl2-root .lgr-stat {background:rgba(141,235,0,.05);border:1px solid rgba(141,235,0,.12);border-radius:10px;
    padding:8px 4px;text-align:center}.cl2-root .lgr-stat .k {font-size:8px;font-weight:700;letter-spacing:.2em;color:var(--muted)}.cl2-root .lgr-stat .v {font-family:'Space Mono',monospace;font-size:15px;font-weight:700;color:#fff;margin-top:3px}.cl2-root .lgr-stat .v em {font-style:normal;color:var(--neon)}.cl2-root .lgr-best {display:flex;gap:6px;padding:0 18px 12px;flex-wrap:wrap}.cl2-root .lgr-best span {font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);
    border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:4px 8px}.cl2-root .lgr-best b {color:var(--neon);font-weight:700}.cl2-root .lgr-list {overflow-y:auto;overflow-x:auto;padding:0 14px 16px;-webkit-overflow-scrolling:touch}.cl2-root .lgr-empty {text-align:center;color:var(--muted);font-size:12px;letter-spacing:.08em;padding:24px 0}.cl2-root .lgr-row {border:1px solid rgba(255,255,255,.08);border-radius:12px;margin-top:8px;overflow:hidden;
    background:rgba(255,255,255,.02);cursor:pointer}.cl2-root .lgr-row .r1 {display:flex;align-items:center;gap:10px;padding:10px 12px}.cl2-root .lgr-date {font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);width:64px;flex:none}.cl2-root .lgr-scene {flex:1;min-width:0}.cl2-root .lgr-scene .n {font-size:11px;font-weight:700;letter-spacing:.1em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cl2-root .lgr-scene .n b {color:var(--neon)}.cl2-root .lgr-xp {font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:var(--neon);flex:none}.cl2-root .lgr-g {width:34px;height:34px;flex:none;border-radius:9px;display:flex;align-items:center;justify-content:center;
    font-family:Georgia,serif;font-style:italic;font-size:18px;border:1px solid rgba(141,235,0,.3);
    color:var(--neon);background:rgba(141,235,0,.07)}.cl2-root .lgr-g.gB {color:#fff;border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.05)}.cl2-root .lgr-g.gC {color:var(--amber);border-color:rgba(255,190,60,.3);background:rgba(255,190,60,.06)}.cl2-root .lgr-g.gD {color:#ff6b6b;border-color:rgba(255,107,107,.3);background:rgba(255,107,107,.06)}.cl2-root .lgr-row .r2 {display:none;padding:0 12px 12px}.cl2-root .lgr-row.open .r2 {display:block}.cl2-root .lgr-set {font-family:'Space Mono',monospace;font-size:10.5px;color:rgba(255,255,255,.65);line-height:1.7}.cl2-root .lgr-set b {color:#fff}.cl2-root .lgr-brk {margin-top:8px}.cl2-root .lgr-brk .b {display:flex;align-items:center;gap:8px;margin-top:5px}.cl2-root .lgr-brk .bl {font-size:9px;font-weight:700;letter-spacing:.14em;color:var(--muted);width:74px;flex:none}.cl2-root .lgr-brk .bt {flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden}.cl2-root .lgr-brk .bf {height:100%;border-radius:3px;background:var(--neon);box-shadow:0 0 8px rgba(141,235,0,.5)}.cl2-root .lgr-brk .bv {font-family:'Space Mono',monospace;font-size:10px;color:#fff;width:26px;text-align:right;flex:none}.cl2-root /* ---------- ledger table ---------- */
  .lgr-table {width:100%;border-collapse:collapse;font-family:'Space Mono',monospace;font-size:10px;margin-top:8px}.cl2-root .lgr-table th {text-align:left;font-size:8.5px;letter-spacing:.14em;color:var(--muted);font-weight:700;
    padding:8px 6px;border-bottom:1px solid rgba(141,235,0,.2);white-space:nowrap}.cl2-root .lgr-table td {padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.8);
    vertical-align:middle;white-space:nowrap}.cl2-root .lgr-table .lgr-tr {cursor:pointer}.cl2-root .lgr-table .lgr-tr:hover td {background:rgba(141,235,0,.04)}.cl2-root .lgr-table td.xp {color:var(--neon);font-weight:700}.cl2-root .lgr-g.sm {width:28px;height:28px;font-size:15px;border-radius:7px}.cl2-root .lgr-weak {margin-top:12px;padding:10px 12px;border:1px solid rgba(255,190,60,.3);border-radius:10px;
    background:rgba(255,190,60,.05);font-family:'Space Mono',monospace;font-size:10.5px;color:#ffd77a;letter-spacing:.04em}.cl2-root .lgr-export {margin:0 18px 10px;padding:9px;border-radius:10px;border:1px solid rgba(141,235,0,.3);
    background:rgba(141,235,0,.07);color:var(--neon);font-size:11px;font-weight:700;letter-spacing:.2em;cursor:pointer}.cl2-root /* ---------- shot log button in settings sheet ---------- */
  .sheet-logbtn {margin-top:8px;width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);
    background:transparent;color:var(--muted);font-size:12px;font-weight:700;letter-spacing:.22em;cursor:pointer}.cl2-root .gl-err {position:absolute;inset:0;display:none;align-items:center;justify-content:center;
    color:var(--amber);font-size:13px;text-align:center;padding:20px}.cl2-root /* ---------- first-tap XP notice toast ---------- */
  .xp-toast {position:absolute;left:24px;right:24px;top:calc(env(safe-area-inset-top,0px) + 68px);
    z-index:20;pointer-events:none;cursor:pointer;
    background:linear-gradient(180deg,rgba(14,14,17,.96),rgba(8,8,10,.97));
    border:1px solid rgba(141,235,0,.22);border-radius:14px;
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    box-shadow:0 16px 48px rgba(0,0,0,.6),0 0 28px rgba(141,235,0,.07),
      inset 0 1px 0 rgba(255,255,255,.08);
    padding:13px 16px;text-align:center;
    opacity:0;visibility:hidden;transform:translateY(-10px) scale(.98);
    transition:opacity .3s ease,transform .3s cubic-bezier(.32,.72,.35,1),visibility 0s .35s}.cl2-root .xp-toast.show {opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0) scale(1);
    transition:opacity .3s ease,transform .3s cubic-bezier(.32,.72,.35,1)}.cl2-root .xp-toast .t {font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:11px;
    letter-spacing:.24em;color:var(--neon);margin-bottom:6px}.cl2-root .xp-toast .m {font-family:'Space Mono',monospace;font-size:11.5px;line-height:1.65;
    color:rgba(255,255,255,.85);letter-spacing:.02em}.cl2-root .xp-toast .m b {color:#fff}

.cl2-root{--ease-out:cubic-bezier(.16,1,.3,1);--ease-in-out:cubic-bezier(.65,0,.35,1);--ease-pop:cubic-bezier(.34,1.3,.64,1)}.cl2-root /* ---------- animation concepts (preview-approved 2026-10-06) ---------- */
.cl2-root .shutter-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--green);
    opacity:0;pointer-events:none;z-index:0}.cl2-root .shutter-ring.go{animation:cl2-ring 600ms var(--ease-out)}
@keyframes cl2-ring{0%{opacity:.9;transform:scale(.9)}100%{opacity:0;transform:scale(2.2)}}
.cl2-root .shutter.cl2-pressing{animation:cl2-press 200ms var(--ease-out)}
@keyframes cl2-press{0%{transform:scale(1)}40%{transform:scale(.82)}100%{transform:scale(1)}}
.cl2-root .thumb.cl2-pop{animation:cl2-pop 300ms var(--ease-pop)}
.cl2-root .dial .v.cl2-pop{animation:cl2-pop 300ms var(--ease-pop)}
@keyframes cl2-pop{0%{transform:scale(1)}35%{transform:scale(1.18)}100%{transform:scale(1)}}
.cl2-root .grade-letter.cl2-stamp{animation:cl2-stamp 500ms var(--ease-pop)}
@keyframes cl2-stamp{0%{opacity:0;transform:scale(1.4)}60%{opacity:1;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}
.cl2-root #gl{transition:opacity 350ms var(--ease-in-out)}
.cl2-root #gl.cl2-fading{opacity:.15}
.cl2-root .cl2-wipe{position:absolute;top:0;bottom:0;width:34%;left:-40%;pointer-events:none;z-index:4;
    background:linear-gradient(90deg,transparent,rgba(141,235,0,.35),transparent)}
.cl2-root .cl2-wipe.go{animation:cl2-wipe 480ms var(--ease-in-out)}
@keyframes cl2-wipe{0%{left:-40%}100%{left:110%}}
@media (prefers-reduced-motion: reduce){.cl2-root *,.cl2-root *::before,.cl2-root *::after{
    animation-duration:.01ms !important;animation-iteration-count:1 !important;
    transition-duration:.01ms !important}}

`;

  var HTML = `

<div class="phone cl2-root" id="cl2root">

  <div class="titlebar">
    <div class="title-fallback">CAMERA <em>LAB</em></div>
    <div class="mode-pill">FREE PLAY</div>
  </div>

  <div class="status">
    <div class="l"><span class="flash-lbl">FLASH · OFF</span><span id="wbLbl">WB 5600K</span></div>
    <div class="set-btn" id="setBtn">SET</div>
  </div>

  <div class="caps">
    <span><b>HDR</b></span><span>30 fps</span><span>1080p</span>
    <span class="on"><b>EXP</b></span><span>RAW</span><span><b>87%</b></span>
  </div>

  <div class="vf" id="vf">
    <canvas id="gl"></canvas>
    <div class="vf-shade"></div>
    <div class="grid" id="gridEl"></div>
    <div class="brackets"><i></i><i></i><i></i><i></i></div>
    <div class="af-dot"></div>
    <div class="ev" id="evScale">
      <span>+2</span><div class="tick"></div><span>+1</span><div class="tick"></div>
      <div class="tick zero"></div><span>0</span>
      <div class="tick"></div><span>−1</span><div class="tick"></div><span>−2</span>
      <div class="needle" id="evNeedle" style="top:50%"></div>
    </div>
    <div class="ev-num ok" id="evNum">EV ±0.0</div>
    <div class="hist" id="histEl" aria-hidden="true">
      <svg id="histSvg" viewBox="0 0 86 54" preserveAspectRatio="none">
        <path id="histR" fill="rgba(255,90,90,.5)" d=""/>
        <path id="histG" fill="rgba(141,235,0,.5)" d=""/>
        <path id="histB" fill="rgba(90,170,255,.5)" d=""/>
      </svg>
      <div class="clip-m clip-l" id="clipL"></div>
      <div class="clip-m clip-r" id="clipR"></div>
    </div>
    <div class="rail">
      <div class="rbtn" id="railPlus">+</div>
      <div class="rbtn" id="railMinus">−</div>
    </div>
    <div class="scene-tag">SCENE <b>01</b> · CITY NOON</div>
    <div class="shake" id="shakeWarn">SHAKE</div>
    <div class="flash" id="flash"></div>
    <div class="cl2-wipe" id="cl2wipe"></div>
    <div class="gl-err" id="glErr">WebGL unavailable on this device.</div>
  </div>

  <div class="dials" id="dials">
    <div class="dial active" data-k="SS"><div class="k">SHUTTER</div><div class="v">1/250</div><div class="u">sec</div></div>
    <div class="dial" data-k="ISO"><div class="k">ISO</div><div class="v">100</div><div class="u">gain</div></div>
    <div class="dial" data-k="AP"><div class="k">APERTURE</div><div class="v">f/8</div><div class="u">iris</div></div>
    <div class="dial" data-k="WB"><div class="k">WB</div><div class="v">5600K</div><div class="u">temp</div></div>
  </div>
  <div class="ticks">
    <span class="nav l" id="tickPrev"><i class="tri-l"></i></span>
    <div class="tick-val" id="tickVal">SHUTTER</div>
    <div class="track"></div>
    <div class="mark"></div>
    <span class="nav r" id="tickNext"><i class="tri-r"></i></span>
  </div>

  <div class="shutter-row">
    <div class="mode-m">M</div>
    <div class="shutter-wrap"><div class="shutter-ring" id="shutterRing"></div><button class="shutter" id="shutterBtn" aria-label="Capture"></button></div>
    <div class="side-btns">
      <div class="thumb empty" id="thumb"></div>
      <div class="zoom" id="zoomBtn">1&times;</div>
    </div>
  </div>

  <div class="sheet-veil" id="sheetVeil"></div>
  <div class="sheet" id="setSheet" role="dialog" aria-label="Viewfinder settings">
    <div class="sheet-handle"></div>
    <div class="sheet-title">VIEWFINDER</div>
    <div class="trow" data-t="grid"><span>Thirds grid</span><span class="tsw on" data-t="grid"></span></div>
    <div class="trow" data-t="hist"><span>Histogram</span><span class="tsw on" data-t="hist"></span></div>
    <div class="trow" data-t="ev"><span>Exposure scale</span><span class="tsw on" data-t="ev"></span></div>
    <div class="trow" data-t="shake"><span>Shake warning</span><span class="tsw on" data-t="shake"></span></div>
    <button class="sheet-close" id="sheetClose">DONE</button>
    <button class="sheet-logbtn" id="logBtn">SHOT LOG</button>
  </div>
  <div class="scn-veil" id="scnVeil"></div>
  <div class="scn-modal" id="scnModal" role="dialog" aria-label="Select scene">
    <div class="scn-head">
      <div class="scn-title">SELECT SCENE</div>
      <button class="scn-close" id="scnClose" aria-label="Close"><i></i></button>
    </div>
    <div class="scn-list" id="scnList"></div>
  </div>
  <div class="lgr-veil" id="lgrVeil"></div>
  <div class="lgr-modal" id="lgrModal" role="dialog" aria-label="Shot log">
    <div class="lgr-head"><div class="lgr-title">Shot Log</div>
      <button class="lgr-close" id="lgrClose" aria-label="Close"><i></i></button></div>
    <button class="lgr-export" id="lgrExport">EXPORT CSV</button>
    <div class="lgr-totals">
      <div class="lgr-stat"><div class="k">TOTAL XP</div><div class="v"><em id="lgrTotXp">0</em></div></div>
      <div class="lgr-stat"><div class="k">SHOTS</div><div class="v" id="lgrTotShots">0</div></div>
      <div class="lgr-stat"><div class="k">AVG GRADE</div><div class="v" id="lgrAvg">--</div></div>
      <div class="lgr-stat"><div class="k">BEST</div><div class="v" id="lgrBest">--</div></div>
    </div>
    <div class="lgr-best" id="lgrBestPer"></div>
    <div class="lgr-list" id="lgrList"></div>
  </div>
  <div class="lightbox" id="lightbox"><img id="lightboxImg" alt="Captured frame"><div class="grade-card" id="gradeCard"><div class="grade-top"><div class="grade-letter" id="gradeLetter">A</div><div class="grade-meta"><div class="grade-score" id="gradeScore">0 / 100</div><div class="grade-xp" id="gradeXp">+0 XP</div></div></div><div class="grade-fb" id="gradeFb"></div></div><span>TAP TO CLOSE</span></div>
  <div class="xp-toast" id="xpToast" role="status" aria-live="polite">
    <div class="t">DAILY XP</div>
    <div class="m">Your first graded shot on each scene banks XP for the day.<br>Make it count — after that, you're shooting for the craft.</div>
  </div>
</div>


`;

  // ---- module state ----
  var root = null;      // .cl2-root element (scope for all DOM queries)
  var stageEl = null;
  var apiRef = null;

  // Scoped element getter (prototype uses GE() throughout)
  function GE(id) { return root ? root.querySelector('#' + id) : null; }

  /* ================= animation helpers (preview-approved 2026-10-06) ================= */
var _reduceMotion = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var _dialPrev = {};   // last rendered dial values (drives tick pop)
function cl2Restart(el, cls){
  if(!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;   // reflow so the animation replays
  el.classList.add(cls);
}
function cl2CountUp(el, to, dur){
  if(!el) return;
  if(_reduceMotion){ el.textContent=String(to); return; }
  var start=null, d=dur||900;
  function fr(now){
    if(start===null) start=now;
    var t=Math.min((now-start)/d,1);
    el.textContent=String(Math.round(to*(1-Math.pow(1-t,3))));  // easeOutCubic
    if(t<1) requestAnimationFrame(fr);
  }
  requestAnimationFrame(fr);
}

// Ledger entries not yet synced to Firestore (shell drains via getSnapshot)
  var pendingLedger = [];

  // Badge ids earned this session, not yet awarded (shell drains via getSnapshot
  // and calls CDBadges.award; games never touch Firebase directly)
  var pendingBadges = [];

  // Session scoring
  var bestScore = 0;
  var shotsTaken = 0;

/* ---- module-scoped state (set by shell) ---- */
var _simStopped=true;
var _rafId=0;
var _onResize=null;

function bootSim(){

'use strict';
/* ================= dial model ================= */
const DIALS = {
  SS:  { label:'SHUTTER',  unit:'sec',
         vals:['1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15'],
         t:[1/4000,1/2000,1/1000,1/500,1/250,1/125,1/60,1/30,1/15], idx:4 },
  ISO: { label:'ISO',      unit:'gain',
         vals:['100','200','400','800','1600','3200','6400'],
         v:[100,200,400,800,1600,3200,6400], idx:0 },
  AP:  { label:'APERTURE', unit:'iris',
         vals:['f/1.4','f/2','f/2.8','f/4','f/5.6','f/8','f/11','f/16'],
         n:[1.4,2,2.8,4,5.6,8,11,16], idx:5 },
  WB:  { label:'WB',       unit:'temp',
         vals:['2500K','3200K','4400K','5600K','6500K','7500K','10000K'],
         k:[2500,3200,4400,5600,6500,7500,10000], idx:3 },
};
/* Per-scene correct exposure (updated on scene switch) */
let evCorrect = 0; // set at boot from SCENES[0]
let activeDial = 'SS';

function kelvinToRGB(k){
  const t = k/100; let r,g,b;
  r = t<=66 ? 255 : 329.698727446*Math.pow(t-60,-0.1332047592);
  g = t<=66 ? 99.4708025861*Math.log(t)-161.1195681661
            : 288.1221695283*Math.pow(t-60,-0.0755148492);
  b = t>=66 ? 255 : (t<=19 ? 0 : 138.5177312231*Math.log(t-10)-305.0447927307);
  const c=v=>Math.min(255,Math.max(0,v))/255;
  return [c(r),c(g),c(b)];
}
const WB_NEUTRAL = kelvinToRGB(5600);

/* ================= scenes ================= */
const SCENES = [
  { num:'01', name:'CITY NOON',
    desc:'Balanced daylight. Nail the exposure triangle.',
    img:'/media/camera-lab-v2/scene-01.jpg?v=20261006a',
    base:{SS:4,ISO:0,AP:5,WB:3} },
  { num:'02', name:'BACKLIT',
    desc:'Bright window, dark subject. Expose for the shadows.',
    img:'/media/camera-lab-v2/scene-02.jpg?v=20261006a',
    base:{SS:5,ISO:1,AP:4,WB:3} },
  { num:'03', name:'LOW LIGHT',
    desc:'Moody interior. How far will you push the ISO?',
    img:'/media/camera-lab-v2/scene-03.jpg?v=20261006a',
    base:{SS:6,ISO:3,AP:2,WB:2} },
  { num:'04', name:'NIGHT STREET',
    desc:'City after dark. Slow shutter, steady hands.',
    img:'/media/camera-lab-v2/scene-04.jpg?v=20261006a',
    base:{SS:8,ISO:4,AP:3,WB:2} },
  { num:'05', name:'MOTION',
    desc:'Panning practice. Drop to 1/30 and follow the rider.',
    img:'/media/camera-lab-v2/scene-05.jpg?v=20261006a',
    base:{SS:7,ISO:1,AP:5,WB:3} },
];
let curScene = 0;
function sceneEV(s){
  const t=DIALS.SS.t[s.base.SS], N=DIALS.AP.n[s.base.AP], iso=DIALS.ISO.v[s.base.ISO];
  return Math.log2(N*N/t)-Math.log2(iso/100);
}
/* ================= WebGL pipeline ================= */
const canvas = GE('gl');
const vf = GE('vf');
let gl=null, prog=null, tex=null, imgW=0, imgH=0;
const U = {};

const VSRC = `
attribute vec2 aPos;
varying vec2 vUV;
uniform vec4 uCover;
void main(){
  vec2 uv = aPos*0.5+0.5;
  vUV = uv*uCover.xy+uCover.zw;
  gl_Position = vec4(aPos,0.0,1.0);
}`;

const FSRC = `
precision highp float;
varying vec2 vUV;
uniform sampler2D uTex;
uniform float uExposure;
uniform vec3 uWBRgb;
uniform float uMotion;
uniform float uDof;
uniform float uGrain;
uniform float uTime;
uniform vec2 uTexel;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
void main(){
  vec3 col = vec3(0.0);
  float wsum = 0.0;
  float vdist = abs(vUV.y-0.42)*2.0;
  float dofR = uDof*smoothstep(0.2,1.0,vdist)*7.0;
  float motR = uMotion*9.0;
  for(int i=-4;i<=4;i++){
    float fi = float(i)/4.0;
    float w = 1.0-abs(fi)*0.72;
    vec2 off = vec2(fi*motR*uTexel.x, fi*dofR*uTexel.y);
    col += texture2D(uTex, vUV+off).rgb*w;
    wsum += w;
  }
  col /= wsum;
  col *= uWBRgb;
  col *= pow(2.0,uExposure);
  vec3 over = max(col-1.0,0.0);
  col = col-over*0.55;
  vec2 gp = vUV/uTexel;
  float g = hash(gp+vec2(fract(uTime*13.7)*271.0,fract(uTime*7.3)*157.0))-0.5;
  float lum = dot(col,vec3(0.299,0.587,0.114));
  col += g*uGrain*(0.07+0.16*(1.0-lum));
  gl_FragColor = vec4(clamp(col,0.0,1.0),1.0);
}`;

function compileShader(type,src){
  const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
    console.error('shader:',gl.getShaderInfoLog(s)); return null;
  }
  return s;
}

function initGL(){
  gl = canvas.getContext('webgl',{antialias:false,depth:false,stencil:false,
    preserveDrawingBuffer:true,powerPreference:'high-performance'});
  if(!gl){ GE('glErr').style.display='flex'; return false; }
  const vs=compileShader(gl.VERTEX_SHADER,VSRC), fs=compileShader(gl.FRAGMENT_SHADER,FSRC);
  if(!vs||!fs) return false;
  prog=gl.createProgram();
  gl.attachShader(prog,vs); gl.attachShader(prog,fs); gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){
    console.error('link:',gl.getProgramInfoLog(prog)); return false;
  }
  gl.useProgram(prog);
  const buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(prog,'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  ['uCover','uTex','uExposure','uWBRgb','uMotion','uDof','uGrain','uTime','uTexel']
    .forEach(n=>U[n]=gl.getUniformLocation(prog,n));
  gl.uniform1i(U.uTex,0);
  initHistFBO();
  return true;
}

function sizeCanvas(){
  const r=vf.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(2,Math.round(r.width*dpr)), h=Math.max(2,Math.round(r.height*dpr));
  if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
  gl.viewport(0,0,w,h);
  // cover-fit base region
  const imgA=imgW/imgH, cvA=w/h;
  let vw,vh;
  if(imgA>cvA){ vw=cvA/imgA; vh=1; } else { vw=1; vh=imgA/cvA; }
  coverBase={vw:vw,vh:vh,ox:(1-vw)/2,oy:(1-vh)/2};
  gl.uniform2f(U.uTexel,1/w,1/h);
  updateCover();
}

/* digital zoom: crop a centered sub-region of the cover area */
const ZOOMS=[1,2,3];
let zoomIdx=0, coverBase=null;
function updateCover(){
  if(!gl||!coverBase||!U.uCover) return;
  const z=ZOOMS[zoomIdx];
  const w=coverBase.vw/z, h=coverBase.vh/z;
  const cx=coverBase.ox+coverBase.vw/2, cy=coverBase.oy+coverBase.vh/2;
  gl.uniform4f(U.uCover,w,h,cx-w/2,cy-h/2);
}

function loadTexture(src,cb){
  const img=new Image();
  img.onload=()=>{
    imgW=img.naturalWidth; imgH=img.naturalHeight;
    tex=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    cb();
  };
  img.onerror=()=>{ GE('glErr').style.display='flex';
    GE('glErr').textContent='Scene image failed to load.'; };
  img.src=src;
}

/* ================= pipeline state -> uniforms + UI ================= */
const evNeedle=GE('evNeedle');
const evNum=GE('evNum');
const wbLbl=GE('wbLbl');
const shakeWarn=GE('shakeWarn');
const tickVal=GE('tickVal');
const dialEls={};
root.querySelectorAll('#dials .dial').forEach(d=>dialEls[d.dataset.k]=d);

let lastOffset=0;
let showShake=true;   // SET sheet toggle

function applyPipeline(){
  const t=DIALS.SS.t[DIALS.SS.idx];
  const N=DIALS.AP.n[DIALS.AP.idx];
  const iso=DIALS.ISO.v[DIALS.ISO.idx];
  const k=DIALS.WB.k[DIALS.WB.idx];

  const evSetting=Math.log2(N*N/t)-Math.log2(iso/100);
  const offset=Math.max(-8,Math.min(8,evCorrect-evSetting));
  lastOffset=offset;

  const rgb=kelvinToRGB(k);
  const wb=[rgb[0]/WB_NEUTRAL[0],rgb[1]/WB_NEUTRAL[1],rgb[2]/WB_NEUTRAL[2]];

  const motion=t>1/60 ? Math.log2(t*60) : 0;                 // stops slower than 1/60
  const dof=1-(DIALS.AP.idx/(DIALS.AP.vals.length-1));       // f/1.4 -> 1, f/16 -> 0
  const grain=Math.log2(iso/100)/6;                          // 100 -> 0, 6400 -> 1

  if(gl){
    gl.uniform1f(U.uExposure,offset);
    gl.uniform3f(U.uWBRgb,wb[0],wb[1],wb[2]);
    gl.uniform1f(U.uMotion,motion);
    gl.uniform1f(U.uDof,dof);
    gl.uniform1f(U.uGrain,Math.max(0,Math.min(1,grain)));
  }

  // dial readouts (+ tick pop when a value changes)
  for(const key in DIALS){
    const vEl=dialEls[key].querySelector('.v');
    const nv=DIALS[key].vals[DIALS[key].idx];
    if(vEl.textContent!==nv){
      vEl.textContent=nv;
      if(_dialPrev[key]!==undefined) cl2Restart(vEl,'cl2-pop');
      _dialPrev[key]=nv;
    }
  }
  wbLbl.textContent='WB '+k+'K';
  tickVal.textContent=DIALS[activeDial].label;

  // EV meter
  const c=Math.max(-3,Math.min(3,offset));
  evNeedle.style.top=(50-(c/3)*44)+'%';
  const sign=offset>0.049?'+':(offset<-0.049?'\u2212':'\u00B1');
  const mag=Math.abs(offset).toFixed(1);
  evNum.textContent='EV '+sign+mag;
  evNum.className='ev-num '+(Math.abs(offset)<0.34?'ok':(Math.abs(offset)<1.5?'warn':'bad'));

  // shake warning
  shakeWarn.classList.toggle('show',motion>0.01 && showShake);
  scheduleHistogram();
}

function stepActive(dir){
  const d=DIALS[activeDial];
  d.idx=Math.max(0,Math.min(d.vals.length-1,d.idx+dir));
  applyPipeline();
}

function setActive(key){
  activeDial=key;
  for(const k in dialEls) dialEls[k].classList.toggle('active',k===key);
  applyPipeline();
}

/* ================= real histogram (read back from processed pixels) ================= */
const HIST_W=128, HIST_H=72, HIST_BINS=64;
let histFBO=null, histPx=null, histTimer=null, lastHist=null;
const histPathR=GE('histR');
const histPathG=GE('histG');
const histPathB=GE('histB');
const clipLEl=GE('clipL');
const clipREl=GE('clipR');
const histElBox=GE('histEl');

function initHistFBO(){
  const t=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,HIST_W,HIST_H,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  histFBO=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,histFBO);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  histPx=new Uint8Array(HIST_W*HIST_H*4);
}

function histPath(bins,max){
  let d='M0,54';
  for(let i=0;i<HIST_BINS;i++){
    d+=' L'+((i+0.5)/HIST_BINS*86).toFixed(1)+','+(54-(bins[i]/max)*52).toFixed(1);
  }
  return d+' L86,54 Z';
}
function histMean(bins,n){
  let s=0;
  for(let i=0;i<bins.length;i++) s+=bins[i]*(i+0.5)/bins.length;
  return +(s/n*255).toFixed(1);
}

function updateHistogram(){
  if(!gl||!tex||!histFBO) return;
  if(histElBox.style.display==='none') return;
  // re-render the exact current pipeline state into a tiny offscreen target
  const vp=gl.getParameter(gl.VIEWPORT);
  gl.bindFramebuffer(gl.FRAMEBUFFER,histFBO);
  gl.viewport(0,0,HIST_W,HIST_H);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.readPixels(0,0,HIST_W,HIST_H,gl.RGBA,gl.UNSIGNED_BYTE,histPx);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.viewport(vp[0],vp[1],vp[2],vp[3]);

  const bins=[new Float64Array(HIST_BINS),new Float64Array(HIST_BINS),new Float64Array(HIST_BINS)];
  let clipLo=0, clipHi=0;
  const n=HIST_W*HIST_H;
  for(let i=0;i<n;i++){
    const o=i*4;
    const r=histPx[o], g=histPx[o+1], b=histPx[o+2];
    bins[0][r>>2]++; bins[1][g>>2]++; bins[2][b>>2]++;
    if(r===0&&g===0&&b===0) clipLo++;
    if(r===255||g===255||b===255) clipHi++;
  }
  let max=1;
  for(let c=0;c<3;c++) for(let i=0;i<HIST_BINS;i++) if(bins[c][i]>max) max=bins[c][i];
  histPathR.setAttribute('d',histPath(bins[0],max));
  histPathG.setAttribute('d',histPath(bins[1],max));
  histPathB.setAttribute('d',histPath(bins[2],max));
  clipLEl.classList.toggle('show',clipLo/n>0.003);
  clipREl.classList.toggle('show',clipHi/n>0.003);
  lastHist={meanR:histMean(bins[0],n),meanG:histMean(bins[1],n),meanB:histMean(bins[2],n),
    clipLo:+(clipLo/n*100).toFixed(2),clipHi:+(clipHi/n*100).toFixed(2)};
}

function scheduleHistogram(){
  if(histTimer) return;   // trailing-edge debounce: max 10 updates/sec
  histTimer=setTimeout(()=>{ histTimer=null; updateHistogram(); },100);
}

/* ================= render loop ================= */
function frame(now){
  if(_simStopped) return;
  if(gl&&tex){
    gl.uniform1f(U.uTime,now/1000);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  _rafId=requestAnimationFrame(frame);
}

/* ================= capture ================= */
const flashEl=GE('flash');
const thumbEl=GE('thumb');
GE('shutterBtn').addEventListener('click',()=>{
  // Gate: first shutter tap of the day shows the XP notice toast and consumes
  // the tap — no photo is taken. The user taps again to capture.
  if(maybeShowXpNotice()) return;
  hideXpNotice();  // second tap dismisses any lingering toast; capture proceeds
  if(gl&&tex){
    gl.uniform1f(U.uTime,performance.now()/1000);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    try{
      const url=canvas.toDataURL('image/jpeg',0.82);
      thumbEl.style.backgroundImage='url('+url+')';
      thumbEl.classList.remove('empty');
      window.__lastCapture=url;
      window.__lastShot={url:url, scene:curScene,
        ss:DIALS.SS.idx, iso:DIALS.ISO.idx, ap:DIALS.AP.idx, wb:DIALS.WB.idx,
        offset:lastOffset, graded:false};
      try{
        const _g=gradeShot(window.__lastShot);
        const _xr=settleXp(window.__lastShot,_g);
        window.__lastShot._entry=writeLedger(window.__lastShot,_g,_xr);
        window.__lastShot._g=_g; window.__lastShot._xr=_xr; window.__lastShot.graded=true;
      }catch(e){ console.error('grade failed',e); }
    }catch(e){ console.error('capture failed',e); }
  }
  // shutter press: button punch + green ring burst + flash, then thumb pop
  cl2Restart(GE('shutterBtn'),'cl2-pressing');
  cl2Restart(GE('shutterRing'),'go');
  flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go');
  setTimeout(function(){ cl2Restart(thumbEl,'cl2-pop'); },160);
});

/* ================= first-tap XP notice =================
   Shows once per day on the very first shutter tap. Acts as a gate:
   that tap is consumed by the toast — the user must tap again to capture. */
const xpToastEl=GE('xpToast');
let xpToastTimer=null;
function hideXpNotice(){
  if(!xpToastEl) return;
  xpToastEl.classList.remove('show');
  if(xpToastTimer){ clearTimeout(xpToastTimer); xpToastTimer=null; }
}
/* Returns true when the toast was just shown (caller should consume the tap). */
let _xpNoticeShownMem=false;  // in-memory fallback if localStorage is unavailable
function maybeShowXpNotice(){
  try{
    if(_xpNoticeShownMem) return false;
    if(lsGet('clab_xpnotice','')===todayStr()){ _xpNoticeShownMem=true; return false; }
    lsSet('clab_xpnotice',todayStr());
    _xpNoticeShownMem=true;
  }catch(e){ if(_xpNoticeShownMem) return false; }
  if(!xpToastEl) return false;
  xpToastEl.classList.add('show');
  if(xpToastTimer) clearTimeout(xpToastTimer);
  xpToastTimer=setTimeout(hideXpNotice,4000);
  return true;
}
if(xpToastEl) xpToastEl.addEventListener('click',hideXpNotice);

/* ================= controls ================= */
GE('dials').addEventListener('click',e=>{
  const d=e.target.closest('.dial'); if(!d) return;
  setActive(d.dataset.k);
});
GE('tickPrev').addEventListener('click',()=>stepActive(-1));
GE('tickNext').addEventListener('click',()=>stepActive(1));
GE('railPlus').addEventListener('click',()=>stepActive(1));
GE('railMinus').addEventListener('click',()=>stepActive(-1));

/* ================= dial drag-scroll (touch, momentum, snap) ================= */
const PX_PER_STOP=46;          // px of drag per value stop
let activeDrag=null;

function updateStripOffset(frac){
  const tr=root.querySelector('.ticks .track');
  if(tr) tr.style.backgroundPositionX=((-frac*24)%24)+'px';
}

function attachDialDrag(el,axis,getKey){
  el.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'&&!e.isPrimary) return;
    const key=getKey(e);
    if(!key) return;
    if(activeDrag&&activeDrag.raf) cancelAnimationFrame(activeDrag.raf);
    setActive(key);
    const c=axis==='y'?e.clientY:e.clientX;
    activeDrag={key:key,axis:axis,pid:e.pointerId,start:c,last:c,
      lastT:performance.now(),fvel:0,frac:DIALS[key].idx,moved:false,raf:null};
    try{ el.setPointerCapture(e.pointerId); }catch(_){}
    e.preventDefault();
  });
  el.addEventListener('pointermove',e=>{
    const dr=activeDrag;
    if(!dr||e.pointerId!==dr.pid) return;
    const c=dr.axis==='y'?e.clientY:e.clientX;
    const total=c-dr.start;
    if(Math.abs(total)>8) dr.moved=true;
    if(!dr.moved) return;
    const now=performance.now(), dt=Math.max(1,now-dr.lastT);
    const df=-(c-dr.last)/PX_PER_STOP;   // up / left = increase
    dr.fvel=0.75*dr.fvel+0.25*(df/dt);
    dr.frac+=df;
    dr.last=c; dr.lastT=now;
    const d=DIALS[dr.key], max=d.vals.length-1;
    dr.frac=Math.max(0,Math.min(max,dr.frac));
    const idx=Math.round(dr.frac);
    if(idx!==d.idx){ d.idx=idx; applyPipeline(); }
    updateStripOffset(dr.frac);
  });
  function endDrag(e){
    const dr=activeDrag;
    if(!dr||e.pointerId!==dr.pid) return;
    activeDrag=null;
    const d=DIALS[dr.key], max=d.vals.length-1;
    if(!dr.moved){ updateStripOffset(d.idx); return; }
    let f=dr.frac, v=dr.fvel;   // v in stops per ms
    (function tick(){
      v*=0.94;
      f+=v*16.7;
      if(f<0){f=0;v=0;} if(f>max){f=max;v=0;}
      const idx=Math.round(f);
      if(idx!==d.idx){ d.idx=idx; applyPipeline(); }
      updateStripOffset(f);
      if(Math.abs(v)>0.0015){ dr.raf=requestAnimationFrame(tick); }
      else{
        d.idx=Math.round(f); applyPipeline();
        updateStripOffset(d.idx); dr.raf=null;
      }
    })();
  }
  el.addEventListener('pointerup',endDrag);
  el.addEventListener('pointercancel',endDrag);
}

// dials: vertical drag scrubs values
attachDialDrag(GE('dials'),'y',e=>{
  const d=e.target.closest('.dial');
  return d?d.dataset.k:null;
});
// tick strip: horizontal drag scrubs the active dial (not the arrows)
attachDialDrag(root.querySelector('.ticks'),'x',e=>{
  if(e.target.closest('.nav')) return null;
  return activeDial;
});

/* ================= newly wired controls (no dead buttons) ================= */
// SET -> viewfinder settings sheet
const setSheet=GE('setSheet');
const sheetVeil=GE('sheetVeil');
GE('setBtn').addEventListener('click',()=>{
  setSheet.classList.add('show'); sheetVeil.classList.add('show');
});
function closeSheet(){ setSheet.classList.remove('show'); sheetVeil.classList.remove('show'); }
GE('sheetClose').addEventListener('click',closeSheet);
sheetVeil.addEventListener('click',closeSheet);

const TOGGLE_TARGETS={grid:'gridEl',hist:'histEl',ev:'evScale'};
function flipToggle(sw){
  sw.classList.toggle('on');
  const on=sw.classList.contains('on');
  const t=sw.dataset.t;
  if(t==='shake'){ showShake=on; }
  else{
    const el=GE(TOGGLE_TARGETS[t]);
    if(el) el.style.display=on?'':'none';
  }
  applyPipeline();
}
root.querySelectorAll('#setSheet .trow').forEach(row=>{
  row.addEventListener('click',()=>flipToggle(row.querySelector('.tsw')));
});

// zoom 1x -> 2x -> 3x -> 1x (real digital zoom via cover-crop)
const zoomBtn=GE('zoomBtn');
zoomBtn.addEventListener('click',()=>{
  zoomIdx=(zoomIdx+1)%ZOOMS.length;
  zoomBtn.textContent=ZOOMS[zoomIdx]+'\u00D7';
  updateCover();
  scheduleHistogram();
});

// thumbnail -> full capture lightbox
const lightbox=GE('lightbox');
const lightboxImg=GE('lightboxImg');
thumbEl.addEventListener('click',()=>{
  if(!window.__lastCapture) return;   // nothing captured yet
  lightboxImg.src=window.__lastCapture;
  renderGrade();
  lightbox.classList.add('show');
});
lightbox.addEventListener('click',()=>lightbox.classList.remove('show'));

_onResize=()=>{ if(gl&&tex) sizeCanvas(); };
window.addEventListener('resize',_onResize);

/* ================= scene picker ================= */
const scnModal=GE('scnModal');
const scnVeil=GE('scnVeil');
const scnList=GE('scnList');
const sceneTagEl=root.querySelector('.scene-tag');

function buildSceneCards(){
  scnList.innerHTML='';
  SCENES.forEach((s,i)=>{
    const card=document.createElement('div');
    card.className='scn-card'+(i===curScene?' active':'');
    card.dataset.i=i;
    const im=document.createElement('img'); im.src=s.img; im.alt=s.name;
    const tx=document.createElement('div'); tx.className='tx';
    const nm=document.createElement('div'); nm.className='nm';
    const no=document.createElement('span'); no.className='no'; no.textContent=s.num;
    nm.appendChild(no); nm.appendChild(document.createTextNode(s.name));
    const ds=document.createElement('div'); ds.className='ds'; ds.textContent=s.desc;
    tx.appendChild(nm); tx.appendChild(ds);
    card.appendChild(im); card.appendChild(tx);
    card.addEventListener('click',()=>setScene(i));
    scnList.appendChild(card);
  });
}
function openScenePicker(){
  buildSceneCards();
  scnModal.classList.add('show'); scnVeil.classList.add('show');
}
function closeScenePicker(){
  scnModal.classList.remove('show'); scnVeil.classList.remove('show');
}
function setScene(i){
  if(i===curScene){ closeScenePicker(); return; }
  // scene transition: green wipe band + canvas crossfade
  const glc=GE('gl');
  if(glc) glc.classList.add('cl2-fading');
  cl2Restart(GE('cl2wipe'),'go');
  curScene=i;
  const s=SCENES[i];
  DIALS.SS.idx=s.base.SS; DIALS.ISO.idx=s.base.ISO;
  DIALS.AP.idx=s.base.AP; DIALS.WB.idx=s.base.WB;
  evCorrect=sceneEV(s);
  setActive('SS');
  sceneTagEl.innerHTML='SCENE <b>'+s.num+'</b> \u00b7 '+s.name;
  loadTexture(s.img,()=>{ sizeCanvas(); applyPipeline();
    if(glc) glc.classList.remove('cl2-fading'); });
  closeScenePicker();
}
sceneTagEl.addEventListener('click',openScenePicker);
GE('scnClose').addEventListener('click',closeScenePicker);
scnVeil.addEventListener('click',closeScenePicker);

/* ================= grading + XP + ledger =================
   Firestore target (unified site-wide ledger): users/{uid}/ledger/{eventId}
   as type 'arcade.shot.graded' (spec: SITE_LEDGER_SPEC.md). The play.html
   shell maps pendingLedger entries to the canonical envelope.
   Same entry shape below; on Firestore write use serverTimestamp for ts.
   localStorage keys: clab_ledger (entries), clab_banked (anti-farm),
   clab_best (personal bests), clab_milestones (first-S per scene). */
const XP_BASE={S:30,A:25,B:20,C:10,D:5};
const SCENE_DIFF={'01':1.0,'02':1.2,'03':1.4,'04':1.6,'05':1.3};
const GVAL={S:4,A:3,B:2,C:1,D:0};

function gradeShot(snap){
  const sc=SCENES[snap.scene], b=sc.base;
  const fb=[];
  // 1. exposure accuracy (50) — real EV offset from the pipeline
  const expoPts=Math.max(0,Math.round(50-25*Math.abs(snap.offset)));
  // 2. ISO discipline (20) — min ISO that exposes correctly at this ss+ap
  const t=DIALS.SS.t[snap.ss], N=DIALS.AP.n[snap.ap];
  const evC=sceneEV(sc);
  const isoReq=100*Math.pow(2,(Math.log2(N*N/t)-evC));
  let minIdx=DIALS.ISO.v.length-1;
  for(let i=0;i<DIALS.ISO.v.length;i++){ if(DIALS.ISO.v[i]>=isoReq){ minIdx=i; break; } }
  const isoPts=snap.iso<=minIdx?20:Math.max(0,20-6*(snap.iso-minIdx));
  // 3. shutter discipline (15)
  let shutterPts;
  const motionScene=(snap.scene===4); // 05 MOTION wants the blur
  if(motionScene){
    const d=Math.abs(snap.ss-7); // target 1/30
    shutterPts=d<=1?15:Math.max(0,15-5*(d-1));
  }else{
    shutterPts=snap.ss<=6?15:Math.max(0,15-7*(snap.ss-6));
  }
  // 4. white balance (15) — steps off the scene's correct temp
  const wbSteps=Math.abs(snap.wb-b.WB);
  const wbPts=Math.max(0,Math.round(15-3.75*wbSteps));

  const score=expoPts+isoPts+shutterPts+wbPts;
  const grade=score>=95?'S':score>=85?'A':score>=70?'B':score>=55?'C':'D';

  // feedback (max 3, specific)
  if(Math.abs(snap.offset)>=0.5){
    const x=Math.abs(snap.offset).toFixed(1);
    fb.push(snap.offset>0
      ? '<b>'+x+' stops over.</b> Speed up the shutter or drop the ISO.'
      : '<b>'+x+' stops under.</b> Slow the shutter or raise the ISO.');
  }
  if(isoPts<20){
    fb.push('<b>ISO '+DIALS.ISO.v[snap.iso]+' is higher than needed.</b> ISO '+DIALS.ISO.v[minIdx]+
      ' exposes correctly at '+DIALS.SS.vals[snap.ss]+', '+DIALS.AP.vals[snap.ap]+' — less grain.');
  }
  if(motionScene && snap.ss<6){
    fb.push('<b>Too fast to pan.</b> Drop toward 1/30 to streak the background.');
  }else if(!motionScene && snap.ss>6){
    fb.push('<b>'+DIALS.SS.vals[snap.ss]+' handheld will shake.</b> Brace the camera or speed up the shutter.');
  }
  if(wbSteps>=2){
    const dir=DIALS.WB.k[snap.wb]>DIALS.WB.k[b.WB]?'cool':'warm';
    fb.push('<b>White balance is '+dir+'.</b> This scene wants '+DIALS.WB.vals[b.WB]+'.');
  }
  const problems=fb.slice(0,3);
  if(grade==='S') problems.push('Dead-on. The triangle is balanced.');

  return {score:score, grade:grade, breakdown:{exposure:expoPts,iso:isoPts,shutter:shutterPts,wb:wbPts},
    feedback:problems.length?problems:['Clean shot. Minor refinements only.']};
}

function todayStr(){ return new Date().toISOString().slice(0,10); }
function lsGet(k,f){ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?f:v; }catch(e){ return f; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

function settleXp(shot,g){
  // returns {xp, banked, newBest, milestone, perfect}
  const sc=SCENES[shot.scene], diff=SCENE_DIFF[sc.num]||1;
  let xp=Math.round(XP_BASE[g.grade]*diff), perfect=false, milestone=null;
  // perfect triangle: ss+iso+ap all exactly at scene baseline
  if(shot.ss===sc.base.SS && shot.iso===sc.base.ISO && shot.ap===sc.base.AP){
    perfect=true; xp+=Math.round(10*diff);
  }
  // first-S milestone (one-time per scene)
  const ms=lsGet('clab_milestones',{});
  if(g.grade==='S' && !ms[sc.num]){ ms[sc.num]=Date.now(); lsSet('clab_milestones',ms); milestone='firstS'; xp+=15; }
  // personal best
  const best=lsGet('clab_best',{});
  const prev=best[sc.num];
  let newBest=false;
  if(!prev || g.score>prev.score){ best[sc.num]={score:g.score,grade:g.grade}; lsSet('clab_best',best); newBest=true; }
  // anti-farm: first graded photo per scene per day banks XP
  const banked=lsGet('clab_banked',{});
  const today=todayStr();
  let bankedOk=true;
  if(banked[sc.num]===today){ bankedOk=false; xp=0; }
  else { banked[sc.num]=today; lsSet('clab_banked',banked); }
  return {xp:xp, banked:bankedOk, newBest:newBest, milestone:milestone, perfect:perfect, diff:diff};
}

function writeLedger(shot,g,xr){
  const sc=SCENES[shot.scene];
  const freshBadges=checkBadges(g); // badge progress AFTER settleXp (clab_best current)
  const entry={
    id:'clab-'+Date.now()+'-'+Math.floor(Math.random()*1e6).toString(36),
    ts:Date.now(), game:'camera-lab-v2',
    sceneId:sc.num, sceneName:sc.name,
    settings:{shutter:DIALS.SS.vals[shot.ss], iso:DIALS.ISO.vals[shot.iso],
      aperture:DIALS.AP.vals[shot.ap], wb:DIALS.WB.vals[shot.wb]},
    evOffset:+shot.offset.toFixed(2),
    grade:g.grade, score:g.score,
    xp:xr.xp, banked:xr.banked,
    perfectTriangle:xr.perfect, newBest:xr.newBest, milestone:xr.milestone,
    difficulty:SCENE_DIFF[sc.num]||1,
    badges:freshBadges, // badge ids earned by this shot (also queued in pendingBadges)
    breakdown:{exposure:g.breakdown.exposure, iso:g.breakdown.iso,
      shutter:g.breakdown.shutter, wb:g.breakdown.wb}
  };
  const L=lsGet('clab_ledger',[]);
  L.unshift(entry);
  lsSet('clab_ledger',L.slice(0,200));
  try{ pendingLedger.push(entry); }catch(e){}
  try{ shotsTaken++; if(entry.score>bestScore) bestScore=entry.score; }catch(e){}
  return entry;
}

/* ================= badge progress + awards =================
   4-badge set (spec: workspace/your_files/camera-lab-v2/badge-spec.md):
     clab-master          legendary  S on all 5 scenes
     clab-sharpshooter-1  common     25 photos graded B or better
     clab-sharpshooter-2  rare       100 photos graded B or better
     clab-sharpshooter-3  legendary  300 photos graded B or better
   Counters live in localStorage key clab_badges (lifetime, never reset —
   the clab_ledger caps at 200, so the ledger can't drive the 100/300 tiers).
   Newly earned ids queue in pendingBadges for the shell (play.html) to
   award via CDBadges.award — games never touch Firebase directly.
   Idempotent: awarded{} map + server-side check in CDBadges.award.
   Badges are recognition only — no XP attached (spec).
   ===== badge-progress:testable ===== */
var BADGE_MASTER='clab-master';
var BADGE_SS=[['clab-sharpshooter-1',25],['clab-sharpshooter-2',100],['clab-sharpshooter-3',300]];
var BADGE_SCENES=['01','02','03','04','05'];

function badgeState(){ return lsGet('clab_badges',{bOrBetter:0,awarded:{}}); }
function saveBadgeState(s){ lsSet('clab_badges',s); }
function queueBadge(id){
  var st=badgeState();
  if(st.awarded[id]) return false;              // already earned: silent
  st.awarded[id]=Date.now(); saveBadgeState(st);
  if(pendingBadges.indexOf(id)===-1) pendingBadges.push(id);
  return true;
}
// Called from writeLedger AFTER settleXp, so clab_best already includes this shot.
// Returns the list of badge ids earned by this shot.
function checkBadges(g){
  var st=badgeState(), dirty=false, fresh=[];
  if(GVAL[g.grade]>=GVAL.B){ st.bOrBetter=(st.bOrBetter||0)+1; dirty=true; }
  if(dirty) saveBadgeState(st);
  var i, id;
  for(i=0;i<BADGE_SS.length;i++){
    id=BADGE_SS[i][0];
    if(st.bOrBetter>=BADGE_SS[i][1] && !st.awarded[id] && queueBadge(id)) fresh.push(id);
  }
  var best=lsGet('clab_best',{});
  var allS=BADGE_SCENES.every(function(n){ return best[n] && best[n].grade==='S'; });
  if(allS && !st.awarded[BADGE_MASTER] && queueBadge(BADGE_MASTER)) fresh.push(BADGE_MASTER);
  return fresh;
}
/* ===== /badge-progress:testable ===== */

/* ---------- grade card render (in lightbox) ---------- */
const gradeCard=GE('gradeCard');
function renderGrade(){
  const shot=window.__lastShot;
  if(!shot){ gradeCard.classList.remove('show'); return; }
  const g=shot._g||gradeShot(shot);
  const xr=shot._xr||{xp:0,banked:true,newBest:false,milestone:null,perfect:false};
  const gl=GE('gradeLetter');
  gl.textContent=g.grade;
  gl.className='grade-letter'+(g.grade==='B'?' gB':g.grade==='C'?' gC':g.grade==='D'?' gD':'');
  cl2Restart(gl,'cl2-stamp');   // grade reveal punch
  // score + XP count-ups (value-driven; instant under reduced motion)
  GE('gradeScore').innerHTML='<span id="cl2scoreNum">0</span> / 100';
  cl2CountUp(GE('cl2scoreNum'),g.score);
  let xpSuffix='';
  if(!xr.banked) xpSuffix+=' · ALREADY BANKED';
  if(xr.perfect) xpSuffix+=' · PERFECT TRIANGLE';
  if(xr.newBest) xpSuffix+=' · NEW BEST';
  if(xr.milestone==='firstS') xpSuffix+=' · FIRST S +15';
  GE('gradeXp').innerHTML='+<span id="cl2xpNum">0</span> XP'+xpSuffix;
  cl2CountUp(GE('cl2xpNum'),xr.xp);
  const fb=GE('gradeFb');
  fb.innerHTML='';
  g.feedback.forEach(function(f){ const d=document.createElement('div'); d.innerHTML=f; fb.appendChild(d); });
  gradeCard.classList.add('show');
}

/* ---------- ledger modal (dense instructor table) ---------- */
const lgrModal=GE('lgrModal'), lgrVeil=GE('lgrVeil'),
      lgrList=GE('lgrList');
function fmtDate(ts){ const d=new Date(ts);
  return String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getDate()).padStart(2,'0')+' '+
         String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function gClass(g){ return g==='B'?'gB':g==='C'?'gC':g==='D'?'gD':''; }
function weaknessNote(L){
  if(L.length<5) return null;
  const cats={exposure:'Exposure',iso:'ISO discipline',shutter:'Shutter discipline',wb:'White balance'};
  const max={exposure:50,iso:20,shutter:15,wb:15};
  let lo=101,hi=-1,loK='',hiK='';
  for(const k in cats){ let s=0; L.forEach(function(e){ s+=e.breakdown[k]; });
    const pct=s/L.length/max[k]*100;
    if(pct<lo){ lo=pct; loK=k; } if(pct>hi){ hi=pct; hiK=k; } }
  if(hi-lo>=15) return cats[loK]+' needs work ('+lo.toFixed(0)+'% avg vs '+cats[hiK]+' '+hi.toFixed(0)+'%).';
  return 'Balanced across all four skills.';
}
function renderLedger(){
  const L=lsGet('clab_ledger',[]);
  let totXp=0, gSum=0;
  L.forEach(function(e){ totXp+=e.xp; gSum+=GVAL[e.grade]; });
  GE('lgrTotXp').textContent=totXp;
  GE('lgrTotShots').textContent=L.length;
  GE('lgrAvg').textContent=L.length?(['D','C','B','A','S'][Math.round(gSum/L.length)]):'--';
  let bs=null; L.forEach(function(e){ if(!bs||e.score>bs.score) bs=e; });
  GE('lgrBest').textContent=bs?(bs.grade+' · '+bs.score):'--';
  // best per scene
  const per={};
  L.forEach(function(e){ if(!per[e.sceneId]||e.score>per[e.sceneId].score) per[e.sceneId]=e; });
  const bp=GE('lgrBestPer'); bp.innerHTML='';
  SCENES.forEach(function(s){ const e=per[s.num];
    const sp=document.createElement('span');
    sp.innerHTML=e?('SCENE '+s.num+' <b>'+e.grade+'</b>'):('SCENE '+s.num+' --');
    bp.appendChild(sp); });
  // weakness
  const w=weaknessNote(L);
  // table
  lgrList.innerHTML='';
  if(!L.length){ lgrList.innerHTML='<div class="lgr-empty">NO SHOTS LOGGED YET</div>'; return; }
  const tbl=document.createElement('table'); tbl.className='lgr-table';
  const thead=document.createElement('thead');
  thead.innerHTML='<tr><th>DATE</th><th>SCENE</th><th>SET / ISO / AP / WB</th><th>EV</th><th>GRADE</th><th>XP</th></tr>';
  tbl.appendChild(thead);
  const tb=document.createElement('tbody');
  L.forEach(function(e){
    const tr=document.createElement('tr'); tr.className='lgr-tr';
    const ev=(e.evOffset>0?'+':'')+e.evOffset.toFixed(1);
    tr.innerHTML='<td>'+fmtDate(e.ts)+'</td><td>'+e.sceneId+' '+e.sceneName+'</td>'+
      '<td>'+e.settings.shutter+' / '+e.settings.iso+' / '+e.settings.aperture+' / '+e.settings.wb+'</td>'+
      '<td>'+ev+'</td>'+
      '<td><span class="lgr-g sm '+gClass(e.grade)+'">'+e.grade+'</span></td>'+
      '<td class="xp">'+(e.banked?('+'+e.xp):'0 ·banked')+'</td>';
    const det=document.createElement('tr'); det.className='lgr-det'; det.style.display='none';
    const b=e.breakdown;
    det.innerHTML='<td colspan="6"><div class="lgr-brk">'+
      '<div class="b"><span class="bl">EXPOSURE</span><span class="bt"><span class="bf" style="width:'+(b.exposure/50*100)+'%"></span></span><span class="bv">'+b.exposure+'/50</span></div>'+
      '<div class="b"><span class="bl">ISO</span><span class="bt"><span class="bf" style="width:'+(b.iso/20*100)+'%"></span></span><span class="bv">'+b.iso+'/20</span></div>'+
      '<div class="b"><span class="bl">SHUTTER</span><span class="bt"><span class="bf" style="width:'+(b.shutter/15*100)+'%"></span></span><span class="bv">'+b.shutter+'/15</span></div>'+
      '<div class="b"><span class="bl">WB</span><span class="bt"><span class="bf" style="width:'+(b.wb/15*100)+'%"></span></span><span class="bv">'+b.wb+'/15</span></div>'+
      (e.perfectTriangle?'<div class="b"><span class="bl">BONUS</span><span style="font-size:10px;color:var(--neon)">PERFECT TRIANGLE</span></div>':'')+
      (e.milestone==='firstS'?'<div class="b"><span class="bl">BONUS</span><span style="font-size:10px;color:var(--neon)">FIRST S ON SCENE</span></div>':'')+
      '</div></td>';
    tr.addEventListener('click',function(){ det.style.display=det.style.display==='none'?'table-row':'none'; });
    tb.appendChild(tr); tb.appendChild(det);
  });
  tbl.appendChild(tb); lgrList.appendChild(tbl);
  if(w){ const wn=document.createElement('div'); wn.className='lgr-weak'; wn.textContent='SKILL NOTE: '+w; lgrList.appendChild(wn); }
}
function openLedger(){ renderLedger(); lgrModal.classList.add('show'); lgrVeil.classList.add('show'); }
function closeLedger(){ lgrModal.classList.remove('show'); lgrVeil.classList.remove('show'); }
GE('logBtn').addEventListener('click',function(){
  GE('setSheet').classList.remove('show');
  GE('sheetVeil').classList.remove('show');
  openLedger();
});
GE('lgrClose').addEventListener('click',closeLedger);
GE('lgrExport').addEventListener('click',exportCsv);
lgrVeil.addEventListener('click',closeLedger);
function exportCsv(){
  const L=lsGet('clab_ledger',[]);
  const rows=[['timestamp','game','scene_id','scene_name','shutter','iso','aperture','wb','ev_offset','grade','score','xp','banked','perfect_triangle','new_best','milestone','difficulty','exposure_pts','iso_pts','shutter_pts','wb_pts']];
  L.forEach(function(e){ rows.push([new Date(e.ts).toISOString(),e.game,e.sceneId,e.sceneName,
    e.settings.shutter,e.settings.iso,e.settings.aperture,e.settings.wb,e.evOffset,e.grade,e.score,e.xp,
    e.banked,e.perfectTriangle,e.newBest,e.milestone||'',e.difficulty,
    e.breakdown.exposure,e.breakdown.iso,e.breakdown.shutter,e.breakdown.wb]); });
  const csv=rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='camera-lab-ledger.csv'; a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); },2000);
}

/* debug / test hooks */
window.__clab={
  set:(dial,idx)=>{ DIALS[dial].idx=Math.max(0,Math.min(DIALS[dial].vals.length-1,idx)); setActive(dial); },
  step:(dir)=>stepActive(dir),
  state:()=>({active:activeDial,
    ss:DIALS.SS.vals[DIALS.SS.idx], iso:DIALS.ISO.vals[DIALS.ISO.idx],
    ap:DIALS.AP.vals[DIALS.AP.idx], wb:DIALS.WB.vals[DIALS.WB.idx],
    evOffset:+lastOffset.toFixed(2)}),
  ready:()=>!!(gl&&tex),
  capture:()=>{ GE('shutterBtn').click(); return !!window.__lastCapture; },
  zoom:()=>ZOOMS[zoomIdx],
  sheetOpen:()=>GE('setSheet').classList.contains('show'),
  sceneOpen:()=>GE('scnModal').classList.contains('show'),
  scene:()=>curScene,
  setScene:(i)=>setScene(i),
  hist:()=>lastHist,
  histNow:()=>{ updateHistogram(); return lastHist; },
  grade:()=>{ const s=window.__lastShot; return s?gradeShot(s):null; },
  ledger:()=>lsGet('clab_ledger',[]),
  badges:()=>badgeState(),
  checkBadges:(g)=>checkBadges(g), // QA hook: drive badge checks with a {grade} object
  clearLedger:()=>{ localStorage.removeItem('clab_ledger'); localStorage.removeItem('clab_banked'); localStorage.removeItem('clab_best'); localStorage.removeItem('clab_milestones'); },
  openLedger:()=>openLedger()
};

/* ================= boot ================= */
function _doBoot(){
  _simStopped=false;
  if(initGL()){
    evCorrect = sceneEV(SCENES[0]);
    loadTexture(SCENES[0].img,()=>{
      sizeCanvas();
      applyPipeline();
      _rafId=requestAnimationFrame(frame);
    });
  }
}

  _doBoot();
}


  // ============ cdgames.js contract ============
  function init(stage, config, api) {
    stageEl = stage;
    apiRef = api || {};
    bestScore = 0;
    shotsTaken = 0;
    pendingLedger = [];
    pendingBadges = [];

    // Inject CSS once
    if (!document.getElementById('cl2-css')) {
      var st = document.createElement('style');
      st.id = 'cl2-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    // Mount HTML
    stage.innerHTML = HTML;
    root = stage.querySelector('#cl2root');

    // Boot the simulator
    try { bootSim(); } catch (e) { console.error('cl2 boot failed', e); }
  }

  function destroy() {
    try { _simStopped = true; } catch (e) {}
    try { if (_rafId) cancelAnimationFrame(_rafId); } catch (e) {}
    try { if (_onResize) window.removeEventListener('resize', _onResize); } catch (e) {}
    _rafId = 0; _onResize = null;
    // Drop GL refs (context is lost with canvas removal)
    try {
      var c = root ? root.querySelector('#gl') : null;
      if (c) {
        var gl = c.getContext('webgl');
        if (gl) { var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
      }
    } catch (e) {}
    if (stageEl) stageEl.innerHTML = '';
    root = null; stageEl = null; apiRef = null;
    pendingLedger = [];
    pendingBadges = [];
  }

  function pause() {
    try { _simStopped = true; } catch (e) {}
    try { if (_rafId) cancelAnimationFrame(_rafId); } catch (e) {}
    _rafId = 0;
  }

  function resume() {
    try {
      if (root && typeof frame === 'function') {
        _simStopped = false;
        _rafId = requestAnimationFrame(frame);
      }
    } catch (e) {}
  }

  function getSnapshot() {
    var detail = {
      shotsTaken: shotsTaken,
      bestScore: Math.round(bestScore),
      pendingLedger: pendingLedger.slice(),
      pendingBadges: pendingBadges.slice()
    };
    return { score: Math.round(bestScore), detail: detail };
  }

  window.CDGames.register('camera-lab-v2', {
    version: 'v1',
    title: 'Camera Lab',
    init: init,
    destroy: destroy,
    pause: pause,
    resume: resume,
    getSnapshot: getSnapshot
  });
})();
