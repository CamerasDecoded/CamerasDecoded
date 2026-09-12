/* ============================================================================
   darkroom.js — Cameras Decoded "Darkroom" page controller.
   Renders the skill tree from skill-trees-data.js against the signed-in
   user's Firestore progress (userSkills/{uid}).

   DEEP LINKS (the routing contract — drills/quizzes/lessons link back here):
     darkroom.html#skill=<skillId>    → opens that skill's detail sheet
     darkroom.html#branch=<branchId>  → scrolls to that branch
     darkroom.html?track=<treeId>     → opens a specific track (future tracks)

   TODO (integrator): confirm ROUTES below match the real lesson/drill URLs.
   ============================================================================ */

const ROUTES = {
  login:  '/login.html',
  // Interim destinations until dedicated lesson/drill pages exist.
  // Swap these two strings when /lesson.html and /quick-drill.html are built.
  lesson: '/quiz-full.html',
  drill:  '/dailyprotocol.html',
};

let ACTIVE_TREE = 'photo-foundations';
let PROGRESS = {};          // { [skillId]: { xp } } — from Firestore
let skillMap = {};
let firstRenderDone = false;

/* ---------- small helpers ---------- */
function pipsHTML(lvl){
  return '<span class="pips" aria-hidden="true">' +
    [1,2,3,4,5].map(i=>'<i class="'+(i<=lvl?'on':'')+'"></i>').join('') + '</span>';
}
const toastEl = () => document.getElementById('toast');
let toastT = null;
function showToast(msg){
  const toast = toastEl();
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(()=>toast.classList.remove('show'), 2300);
}

/* ---------- boot: track param → auth → progress subscription ---------- */
function applyTrackParam(){
  const t = new URLSearchParams(location.search).get('track');
  if (t && TREE_ORDER.includes(t)) ACTIVE_TREE = t;
}

function boot(){
  applyTrackParam();
  renderSwitcherShell(); // render track pills immediately (no progress needed)

  if (!window.firebase || !firebase.auth || !firebase.firestore){
    showFatal('Could not reach our servers. Check your connection and reload.');
    return;
  }
  firebase.auth().onAuthStateChanged(user => {
    if (!user){ showAuthWall(); return; }
    hideAuthWall();
    subscribeProgress(user.uid);
  });
}

function subscribeProgress(uid){
  const db = firebase.firestore();
  db.collection('userSkills').doc(uid).onSnapshot(snap => {
    const data = snap.data() || {};
    const next = {};
    Object.entries(data.skills || {}).forEach(([id, v]) => {
      if (v && typeof v.xp === 'number') next[id] = { xp: v.xp };
    });
    PROGRESS = next;
    renderAll();
    if (!firstRenderDone){ firstRenderDone = true; applyHash(); }
  }, () => {
    // Firestore read failed (offline/rules) — render the tree unlocked-only
    // rather than a dead page; progress syncs when the read succeeds.
    showToast('Progress is offline right now — showing the path.');
    renderAll();
    if (!firstRenderDone){ firstRenderDone = true; applyHash(); }
  });
}

/* ---------- auth wall / fatal ---------- */
function showAuthWall(){
  document.getElementById('authWall').hidden = false;
  document.getElementById('darkroomMain').hidden = true;
}
function hideAuthWall(){
  document.getElementById('authWall').hidden = true;
  document.getElementById('darkroomMain').hidden = false;
}
function showFatal(msg){
  const el = document.getElementById('fatal');
  el.textContent = msg; el.hidden = false;
  document.getElementById('darkroomMain').hidden = true;
}

/* ---------- deep links ---------- */
function applyHash(){
  const h = location.hash || '';
  let m = h.match(/skill=([a-z0-9-]+)/i);
  if (m && skillMap[m[1]]){ openSheet(m[1]); return; }
  m = h.match(/branch=([a-z0-9-]+)/i);
  if (m){
    const el = document.getElementById('branch-' + m[1]);
    if (el) setTimeout(() => el.scrollIntoView({ behavior:'smooth', block:'start' }), 60);
  }
}
window.addEventListener('hashchange', applyHash);

/* ---------- track switcher ---------- */
function renderSwitcherShell(){
  renderSwitcher();
}
function renderSwitcher(){
  const el = document.getElementById('switcher');
  let html = TREE_ORDER.map(id => {
    const t = SKILL_TREES[id];
    const active = id === ACTIVE_TREE ? ' aria-pressed="true"' : ' aria-pressed="false"';
    return '<button class="tree-pill" data-tree="'+id+'"'+active+'>' +
      '<span class="tp-ic">'+(ICONS[t.icon]||ICONS.camera)+'</span>' +
      '<span>'+t.name+'<br><small>'+t.audience.toUpperCase()+'</small></span></button>';
  }).join('');
  html += COMING_SOON.map(c =>
    '<button class="tree-pill soon" disabled aria-disabled="true">' +
    '<span class="tp-ic">'+ICONS.lock+'</span>' +
    '<span>'+c.name+'<br><small>'+c.note.toUpperCase()+'</small></span>' +
    '<span class="soon-tag">SOON</span></button>').join('');
  el.innerHTML = html;
  el.querySelectorAll('[data-tree]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tree === ACTIVE_TREE) return;
      ACTIVE_TREE = btn.dataset.tree;
      const url = new URL(location.href);
      url.searchParams.set('track', ACTIVE_TREE);
      history.replaceState(null, '', url);
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  el.querySelectorAll('.tree-pill.soon').forEach(btn => {
    btn.addEventListener('click', () => showToast('That track is on the roadmap — soon.'));
  });
}

/* ---------- main render ---------- */
function renderAll(){
  const tree = SKILL_TREES[ACTIVE_TREE];
  skillMap = indexTree(tree);
  renderSwitcher();

  let totalXp = 0, mastered = 0, unlocked = 0;
  const branchData = tree.branches.map(branch => {
    const states = branch.skills.map(s => ({ skill: s, ...deriveState(s, PROGRESS) }));
    states.forEach(({xp, state}) => { totalXp += xp; if (state==='mastered') mastered++; if (state!=='locked') unlocked++; });
    return { branch, states };
  });
  const totalSkills = Object.keys(skillMap).length;

  document.getElementById('xpPill').textContent = totalXp.toLocaleString();
  document.getElementById('statXp').textContent = totalXp.toLocaleString();
  document.getElementById('statMastered').textContent = mastered;
  document.getElementById('statUnlocked').textContent = unlocked + ' / ' + totalSkills;
  document.querySelectorAll('[data-ic]').forEach(el => { el.innerHTML = ICONS[el.dataset.ic] || ''; });

  /* up-next: first available skill, else lowest-level in-progress */
  let upNext = null;
  outer: for (const {states} of branchData) for (const st of states){
    if (st.state === 'available'){ upNext = st; break outer; }
  }
  if (!upNext){
    let best = null;
    for (const {states} of branchData) for (const st of states){
      if (st.state === 'in-progress' && (!best || st.lvl < best.lvl)) best = st;
    }
    upNext = best;
  }
  const upEl = document.getElementById('upnext');
  if (upNext){
    const { skill, xp, lvl } = upNext;
    const nt = nextThreshold(xp);
    upEl.innerHTML =
      '<div><p class="eyebrow" style="margin:0 0 12px">Up next</p>' +
      '<div class="upnext-top"><div class="upnext-ic">'+(ICONS[skill.icon]||ICONS.camera)+'</div>' +
      '<div><h2>'+skill.name+'</h2><p>'+skill.desc+'</p></div></div></div>' +
      '<div class="upnext-meta">'+pipsHTML(lvl)+'<span>'+(nt ? (nt.xp-xp)+' XP to level '+nt.level : 'Max level')+'</span></div>' +
      '<div><button class="btn btn-primary" id="upNextBtn" style="min-width:200px">Continue skill</button></div>';
    document.getElementById('upNextBtn').addEventListener('click', () => openSheet(skill.id));
  } else {
    upEl.innerHTML = '<div><p class="eyebrow" style="margin:0 0 8px">Up next</p><h2 style="margin:0">Tree complete — legendary.</h2></div>';
  }

  /* branches */
  const treeEl = document.getElementById('tree');
  treeEl.innerHTML = '';
  branchData.forEach(({ branch, states }) => {
    const done = states.filter(x => x.lvl >= UNLOCK_AT).length;
    const sec = document.createElement('section');
    sec.className = 'branch';
    sec.id = 'branch-' + branch.id;   // deep-link target: #branch=<id>
    sec.innerHTML =
      '<div class="branch-banner">' +
        '<div class="banner-ph"><code>'+branch.banner+'</code><em>DROP A WIDE IMAGE OR GIF HERE · 21:8</em></div>' +
        '<img src="'+branch.banner+'" alt="" loading="lazy" onerror="this.remove()">' +
        '<div class="banner-shade"></div>' +
        '<span class="banner-count">'+done+' / '+branch.skills.length+' functional</span>' +
        '<div class="banner-meta"><span class="branch-dot" style="background:'+branch.color+';color:'+branch.color+'"></span>' +
        '<div><h2>'+branch.name+'</h2><p>'+branch.tagline+'</p></div></div>' +
      '</div>' +
      '<div class="branch-track"><i style="width:'+Math.round(done/branch.skills.length*100)+'%;background:'+branch.color+'"></i></div>' +
      '<div class="path"></div>';
    const pathEl = sec.querySelector('.path');
    states.forEach(({ skill, state, xp, lvl }) => {
      const row = document.createElement('div');
      row.className = 'node-row'; row.dataset.state = state;
      let ring = '';
      if (state === 'in-progress'){
        const nt = nextThreshold(xp);
        const prevXp = lvl === 0 ? 0 : LEVELS[lvl-1].xp;
        const frac = nt ? Math.min(1,(xp-prevXp)/(nt.xp-prevXp)) : 1;
        const C = 2*Math.PI*35;
        ring = '<svg class="ring" viewBox="0 0 76 76"><circle class="bg" cx="38" cy="38" r="35"/>' +
               '<circle class="fg" cx="38" cy="38" r="35" stroke-dasharray="'+(frac*C).toFixed(1)+' '+C.toFixed(1)+'"/></svg>';
      }
      const icon = state === 'locked' ? ICONS.lock : (ICONS[skill.icon] || ICONS.camera);
      const crown = state === 'mastered' ? '<span class="crown">'+ICONS.crown+'</span>' : '';
      row.innerHTML =
        '<button class="node" data-state="'+state+'" data-skill="'+skill.id+'" aria-label="'+skill.name+' — '+state+', level '+lvl+'">' +
          ring + icon + crown +
        '</button>' +
        '<div class="node-label"><b>'+skill.name+'</b><span>'+xp+' XP · LV '+lvl+'</span>'+pipsHTML(lvl)+'</div>';
      pathEl.appendChild(row);
    });
    treeEl.appendChild(sec);
  });
}

/* ---------- detail sheet ---------- */
const scrim = () => document.getElementById('scrim');
let lastFocus = null;
function openSheet(skillId){
  const s = skillMap[skillId];
  if (!s) return;
  const { state, xp, lvl } = deriveState(s, PROGRESS);
  lastFocus = document.activeElement;
  document.getElementById('sheetIcon').innerHTML = ICONS[s.icon] || ICONS.camera;
  document.getElementById('sheetTitle').textContent = s.name;
  document.getElementById('sheetDesc').textContent = s.desc;
  document.getElementById('sheetPips').innerHTML = [1,2,3,4,5].map(i=>'<i class="'+(i<=lvl?'on':'')+'"></i>').join('');
  const nt = nextThreshold(xp);
  document.getElementById('sheetLvl').textContent =
    state === 'mastered' ? 'MASTERED' : nt ? ('LEVEL '+lvl+' → '+(nt.xp-xp)+' XP TO LEVEL '+nt.level) : ('LEVEL '+lvl);
  const prevXp = lvl === 0 ? 0 : LEVELS[lvl-1].xp;
  const frac = nt ? Math.min(1,(xp-prevXp)/(nt.xp-prevXp)) : 1;
  document.getElementById('sheetXpFill').style.width = (frac*100).toFixed(0)+'%';
  const reqNames = s.requires.map(id => skillMap[id].name);
  document.getElementById('sheetReq').innerHTML = s.requires.length
    ? 'Requires: <b>'+reqNames.join('</b>, <b>')+'</b> (each at level '+UNLOCK_AT+'+)'
    : 'Starting skill — no prerequisites. Worth <b>'+s.xp+' XP</b> across '+s.lessons+' lessons.';
  const locked = state === 'locked';
  const btnLesson = document.getElementById('btnLesson');
  const btnDrill = document.getElementById('btnDrill');
  btnLesson.disabled = locked;
  btnDrill.disabled = locked;
  // TODO (integrator): confirm these routes accept ?skill=<id>&track=<treeId>
  // and award XP to that skillId on completion (see INTEGRATION.md).
  btnLesson.onclick = () => { location.href = ROUTES.lesson + '?skill=' + encodeURIComponent(s.id) + '&track=' + ACTIVE_TREE; };
  btnDrill.onclick  = () => { location.href = ROUTES.drill  + '?skill=' + encodeURIComponent(s.id) + '&track=' + ACTIVE_TREE; };
  const sc = scrim();
  sc.classList.add('open');
  sc.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  setTimeout(()=>document.getElementById('sheetClose').focus(), 40);
}
function closeSheet(){
  const sc = scrim();
  sc.classList.remove('open');
  sc.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  if (lastFocus && lastFocus.focus) try{ lastFocus.focus(); }catch(e){}
  // Clear a #skill= deep link when the sheet closes so back-button feels right.
  if (/skill=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tree').addEventListener('click', e => {
    const btn = e.target.closest('.node');
    if (!btn) return;
    const s = skillMap[btn.dataset.skill];
    if (btn.dataset.state === 'locked'){
      showToast('Locked — reach level '+UNLOCK_AT+' in: '+s.requires.map(id=>skillMap[id].name).join(', '));
      return;
    }
    openSheet(s.id);
  });
  document.getElementById('sheetClose').addEventListener('click', closeSheet);
  scrim().addEventListener('click', e => { if (e.target === scrim()) closeSheet(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && scrim().classList.contains('open')) closeSheet(); });
  boot();
});
