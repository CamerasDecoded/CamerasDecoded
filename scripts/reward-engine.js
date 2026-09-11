// /scripts/reward-engine.js
// Central reward loop: XP, streak, badges, activity feed.
// Reusable across guide-chapter.html, operator-dashboard.js, and any future
// completion surface. Tolerates the live schema's field aliases.
(function () {
  if (typeof window.db === 'undefined') {
    console.warn('reward-engine: window.db missing. Load firebase-init.js first.');
    return;
  }

  function pick(obj, keys, fallback = undefined) {
    if (!obj) return fallback;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return fallback;
  }

  function toNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function todayKey()   { return dateKey(new Date()); }
  function yesterdayKey(){ const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); }

  // --- Field-alias groups (from the handoff §7) ---
  const XP_KEYS          = ['xpToday', 'dailyXp'];
  const XP_GOAL_KEYS     = ['xpGoal', 'dailyXpGoal'];
  const STREAK_KEYS      = ['dailyChallengeStreak', 'streakDays', 'streak'];
  const LAST_ACTIVE_KEYS = ['lastActivityDate', 'lastActiveDate', 'lastStreakDate', 'lastXpDate'];
  const BADGE_KEYS       = ['badges', 'unlockedBadges', 'achievements'];
  const ACTIVITY_KEYS    = ['recentActivity'];

  async function award({ uid, xp = 0, activity = null, candidateBadges = [] }) {
    if (!uid) throw new Error('reward-engine: uid required');

    const ref  = window.db.collection('users').doc(uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};

    const today    = todayKey();
    const yday     = yesterdayKey();
    const lastSeen = pick(data, LAST_ACTIVE_KEYS, null);
    const isNewDay = lastSeen !== today;

    // --- XP (resets when the day rolls over) ---
    const baseXp   = isNewDay ? 0 : toNum(pick(data, XP_KEYS, 0), 0);
    const newXp    = baseXp + toNum(xp, 0);
    const xpGoal   = toNum(pick(data, XP_GOAL_KEYS, 100), 100);
    const xpPatch  = {};
    XP_KEYS.forEach(k => { xpPatch[k] = newXp; });
    if (!XP_GOAL_KEYS.some(k => data[k] !== undefined)) xpPatch.xpGoal = xpGoal;

    // --- Streak ---
    const curStreak = toNum(pick(data, STREAK_KEYS, 0), 0);
    let newStreak;
    if (lastSeen === today)      newStreak = curStreak || 1;
    else if (lastSeen === yday)  newStreak = curStreak + 1;
    else                         newStreak = 1;
    const streakPatch = {};
    STREAK_KEYS.forEach(k => { streakPatch[k] = newStreak; });
    LAST_ACTIVE_KEYS.forEach(k => { streakPatch[k] = today; });

    // --- Badges (union, deduped) ---
    const existing = BADGE_KEYS.reduce(
      (acc, k) => acc || (Array.isArray(data[k]) ? data[k] : null),
      null
    ) || [];
    const badgeSet = new Set(existing);
    const newlyUnlocked = [];
    (candidateBadges || []).forEach(id => {
      if (id && !badgeSet.has(id)) { badgeSet.add(id); newlyUnlocked.push(id); }
    });
    const badgePatch = {};
    BADGE_KEYS.forEach(k => { badgePatch[k] = Array.from(badgeSet); });

    // --- Activity feed (capped) ---
    let activityPatch = {};
    if (activity) {
      const list  = Array.isArray(pick(data, ACTIVITY_KEYS, [])) ? pick(data, ACTIVITY_KEYS) : [];
      const entry = {
        type:  activity.type  || 'xp',
        label: activity.label || 'Activity',
        icon:  activity.icon  || '✨',
        xp:    toNum(xp, 0),
        ts:    Date.now(),
        ...(activity.meta || {})
      };
      activityPatch.recentActivity = [entry, ...list].slice(0, 20);
    }

    await ref.set(
      { ...xpPatch, ...streakPatch, ...badgePatch, ...activityPatch },
      { merge: true }
    );

    return {
      xpEarned: toNum(xp, 0),
      xpToday:  newXp,
      xpGoal,
      streak:   newStreak,
      newlyUnlockedBadges: newlyUnlocked
    };
  }

  window.RewardEngine = { award };
})();