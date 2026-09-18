// Unit tests for scripts/notifications.js — mocked window/Firestore.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'scripts/notifications.js'), 'utf8');
let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  ok -', name); }
  else { fail++; console.log('  FAIL -', name); }
}
function dayKey(d) {
  d = d || new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
const H = 36e5, NOW = Date.now();

function makeCtx(opts) {
  opts = opts || {};
  const store = Object.assign({}, opts.ls || {});
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  const ts = ms => ({ toMillis: () => ms });
  const snapOf = docs => ({
    size: docs.length,
    docs: docs.map(d => ({ ref: { id: d.id }, data: () => d.data })),
    forEach(fn) { docs.forEach(d => fn({ id: d.id, ref: { id: d.id }, data: () => d.data })); }
  });
  const queryFor = docs => ({
    orderBy() { return this; },
    limit() { return this; },
    onSnapshot(cb) { cb(snapOf(docs)); return () => {}; },
    async get() { return snapOf(docs); }
  });
  const batchLog = [];
  const added = [];
  const db = {
    collection(name) {
      if (name === 'users') return {
        doc: () => ({ async get() { return { exists: true, data: () => ({ dailyStreak: opts.streak || { last: null, count: 0 } }) }; } })
      };
      if (name === 'broadcasts') return queryFor(opts.broadcasts || []);
      if (name === 'notifications') return {
        doc: () => ({
          collection: () => ({
            orderBy() { return queryFor(opts.inbox || []); },
            async add(data) { added.push(data); return { id: 'new-doc' }; },
            doc: id => ({ id })
          })
        })
      };
      throw new Error('unexpected collection ' + name);
    },
    batch() {
      return {
        update(ref, data) { batchLog.push({ op: 'update', id: ref.id, data }); },
        delete(ref) { batchLog.push({ op: 'delete', id: ref.id }); },
        async commit() { batchLog.push({ op: 'commit' }); }
      };
    }
  };
  const fed = [];
  const headerObj = (() => {
    let personalNotifs = [], personalUnread = 0;
    return {
      setNotifications(items, unread) {
        personalNotifs = (Array.isArray(items) ? items : []).slice(0, 6);
        personalUnread = Number(unread) || 0;
        fed.push({ items: personalNotifs, unread: personalUnread });
      },
      getPersonalNotifs() { return { items: personalNotifs.slice(), unread: personalUnread }; },
      __isMock: true
    };
  })();
  const window = {
    db,
    USER: opts.user === undefined ? { isLoggedIn: true, uid: 'u1', tier: 'free' } : opts.user,
    Header: headerObj,
    addEventListener() {},
    CDNotifs: undefined
  };
  const sandbox = {
    window, localStorage,
    firebase: { firestore: { FieldValue: { serverTimestamp: () => ts(Date.now()) } } },
    setTimeout, clearTimeout, JSON, Math, Date, Object, Array, String, Number, parseInt, Promise
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: 'notifications.js' });
  return { window, localStorage, fed, batchLog, added, store, ts };
}
const lastFed = ctx => ctx.fed[ctx.fed.length - 1];
const titles = fed => (fed ? fed.items.map(i => i.text) : []);

async function run() {
  console.log('== streak at risk ==');
  {
    const y = dayKey(new Date(NOW - 864e5));
    const ctx = makeCtx({ streak: { last: y, count: 6 } });
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    const f = lastFed(ctx);
    ok(titles(f).includes('Streak on the line'), 'streak-risk item present');
    ok(f.items.find(i => i.text === 'Streak on the line').body.includes('6-day'), 'body has count');
    ok(f.unread >= 1, 'unread counted');
  }
  console.log('== no streak warning when already active today ==');
  {
    const ctx = makeCtx({ streak: { last: dayKey(), count: 6 } });
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    ok(!titles(lastFed(ctx)).includes('Streak on the line'), 'no risk item when today is touched');
  }
  console.log('== resume nudge ==');
  {
    const ls = {
      cd_last_activity: JSON.stringify({ label: 'Aperture Basics', href: '/field-manual.html', at: NOW - 30 * H })
    };
    const ctx = makeCtx({ ls });
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    const f = lastFed(ctx);
    ok(titles(f).includes('Pick it back up'), 'resume item present');
    ok(f.items.find(i => i.text === 'Pick it back up').body === 'Aperture Basics', 'resume label used');
    ok(ctx.store.cd_resume_nudged === dayKey(), 'nudge stamped for today');
    // second boot same day: no duplicate nudge, stamp unchanged
    const ctx2 = makeCtx({ ls: Object.assign({}, ctx.store) });
    ctx2.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    ok(!titles(lastFed(ctx2)).includes('Pick it back up'), 'no repeat nudge same day');
  }
  console.log('== resume too fresh / too old ==');
  {
    const fresh = makeCtx({ ls: { cd_last_activity: JSON.stringify({ label: 'X', href: '/a', at: NOW - 2 * H }) } });
    fresh.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    ok(!titles(lastFed(fresh)).includes('Pick it back up'), 'no nudge under 20h');
    const old = makeCtx({ ls: { cd_last_activity: JSON.stringify({ label: 'X', href: '/a', at: NOW - 10 * 24 * H }) } });
    old.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    ok(!titles(lastFed(old)).includes('Pick it back up'), 'no nudge after 7d');
  }
  console.log('== broadcasts ==');
  {
    const bc = (id, created, exp, audience) => ({ id, data: { title: 'T-' + id, body: 'b', createdAt: { toMillis: () => created }, expiresAt: { toMillis: () => exp }, audience } });
    const ctx = makeCtx({
      ls: { cd_seen_broadcasts: String(NOW - 2 * H) },
      broadcasts: [
        bc('live', NOW - H, NOW + 24 * H, 'all'),
        bc('expired', NOW - H, NOW - H, 'all'),
        bc('seen', NOW - 3 * H, NOW + 24 * H, 'all'),
        bc('pro', NOW - H, NOW + 24 * H, 'pro')
      ]
    });
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    const t = titles(lastFed(ctx));
    ok(t.includes('T-live'), 'live broadcast shown');
    ok(!t.includes('T-expired'), 'expired filtered');
    ok(!t.includes('T-seen'), 'already-seen filtered');
    ok(!t.includes('T-pro'), 'wrong audience filtered');
  }
  console.log('== inbox merge + unread ==');
  {
    const ib = (id, read, ms) => ({ id, data: { title: 'I-' + id, body: '', createdAt: { toMillis: () => ms }, read } });
    const ctx = makeCtx({ inbox: [ib('a', false, NOW - 1000), ib('b', true, NOW - 2000)] });
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    const f = lastFed(ctx);
    ok(f.unread === 1, 'one unread counted, got ' + f.unread);
    ok(f.items[0].text === 'I-a', 'unread inbox first');
  }
  console.log('== markSeen ==');
  {
    const ib = (id, read) => ({ id, data: { title: 'I-' + id, createdAt: { toMillis: () => NOW }, read } });
    const ctx = makeCtx({
      ls: { cd_seen_broadcasts: String(NOW - 2 * H) },
      broadcasts: [{ id: 'b1', data: { title: 'B', createdAt: { toMillis: () => NOW - H }, expiresAt: { toMillis: () => NOW + H } } }],
      inbox: [ib('a', false), ib('b', true)]
    });
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    ok(titles(lastFed(ctx)).includes('B'), 'broadcast visible before markSeen');
    await ctx.window.CDNotifs.markSeen();
    ok(Number(ctx.store.cd_seen_broadcasts) >= NOW - 5000, 'broadcasts stamped seen');
    ok(ctx.batchLog.some(e => e.op === 'update' && e.id === 'a' && e.data.read === true), 'unread inbox marked read');
    ok(!ctx.batchLog.some(e => e.op === 'update' && e.id === 'b'), 'already-read untouched');
    ok(!titles(lastFed(ctx)).includes('B'), 'broadcast cleared after markSeen');
  }
  console.log('== notify write ==');
  {
    const ctx = makeCtx({});
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    await ctx.window.CDNotifs.notify({ title: 'Badge unlocked', body: 'First Light', href: '/missions.html', kind: 'badge' });
    ok(ctx.added.length === 1, 'one doc written');
    ok(ctx.added[0].read === false && ctx.added[0].kind === 'badge', 'shape correct');
  }
  console.log('== pushSmart / clearSmart / dedupe / cap ==');
  {
    const ctx = makeCtx({});
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    ctx.window.CDNotifs.pushSmart({ id: 'drill-live', title: 'Drill', href: '/missions.html' });
    ctx.window.CDNotifs.pushSmart({ id: 'drill-live', title: 'Drill', href: '/missions.html' });
    await new Promise(r => setTimeout(r, 20));
    let t = titles(lastFed(ctx));
    ok(t.filter(x => x === 'Drill').length === 1, 'pushSmart dedupes');
    ctx.window.CDNotifs.clearSmart('drill-live');
    await new Promise(r => setTimeout(r, 20));
    ok(!titles(lastFed(ctx)).includes('Drill'), 'clearSmart removes');
    for (let i = 0; i < 5; i++) ctx.window.CDNotifs.pushSmart({ id: 's' + i, title: 'S' + i });
    await new Promise(r => setTimeout(r, 20));
    t = titles(lastFed(ctx)).filter(x => x.startsWith('S'));
    ok(t.length === 3, 'smart capped at 3, got ' + t.length);
  }
  console.log('== logged out / no header ==');
  {
    const ctx = makeCtx({ user: { isLoggedIn: false, uid: null } });
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    ok(ctx.fed.length === 0, 'no feed when logged out');
    ok(ctx.added.length === 0, 'notify no-ops without uid (guarded)');
  }

  console.log('== dashboard merge ==');
  {
    // A: dashboard fed the bell BEFORE the engine booted (pending-payload path).
    const ctx = makeCtx({});
    ctx.window.Header.setNotifications([{ text: 'Dash item', body: 'd' }], 2);
    ctx.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    ctx.window.CDNotifs.pushSmart({ id: 'x1', title: 'Engine item' });
    await new Promise(r => setTimeout(r, 20));
    const f = lastFed(ctx);
    const t = titles(f);
    ok(t.includes('Dash item') && t.includes('Engine item'), 'pre-boot dashboard items merged, not clobbered');
    ok(t[0] === 'Dash item', 'dashboard items keep priority');
    ok(f.unread >= 2, 'dashboard unread preserved, got ' + f.unread);

    // B: dashboard calls setNotifications AFTER the engine wrapped it.
    const ctx2 = makeCtx({});
    ctx2.window.CDNotifs.init();
    await new Promise(r => setTimeout(r, 50));
    ctx2.window.Header.setNotifications([{ text: 'Dash late' }], 1);
    await new Promise(r => setTimeout(r, 20));
    const t2 = titles(lastFed(ctx2));
    ok(t2.includes('Dash late'), 'late dashboard call captured via wrapper');
    ok(ctx2.window.Header.__cdNotifWrapped === true, 'wrapper installed');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error(e); process.exit(1); });
