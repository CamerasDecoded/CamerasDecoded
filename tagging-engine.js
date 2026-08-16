// tagging-engine.js
(function() {
  // --- Ensure Firestore is accessible ---
  if (typeof window.db === 'undefined') {
    console.warn('tagging-engine: window.db not found. Ensure firebase-init.js loads first.');
    return;
  }

  // -------------------------------------------------------------
  // 1. Generate user tags from their profile + activity
  // -------------------------------------------------------------
  window.getUserTags = function(userData) {
    const tags = [];
    const lj = userData.learningJourney || {};

    // --- From onboarding (learningJourney) ---
    if (lj.experience) tags.push('experience:' + lj.experience);
    if (lj.primaryGoal) tags.push('goal:' + lj.primaryGoal);
    if (lj.ambition) tags.push('ambition:' + lj.ambition);
    if (lj.sixMonthGoal) tags.push('goal:' + lj.sixMonthGoal);
    if (lj.painPoints && Array.isArray(lj.painPoints)) {
      lj.painPoints.forEach(p => tags.push('pain:' + p));
    }

    // --- From AI usage (aiUsage) ---
    const usage = userData.aiUsage || {};
    if (usage.prompt > 5) tags.push('interest:prompts');
    if (usage.snapshot > 3) tags.push('interest:snapshot');
    if (usage.critique > 0) tags.push('interest:critique');
    if (usage.image > 0) tags.push('interest:image-generation');
    if (usage.ideas > 0) tags.push('interest:content-ideas');

    // --- From saved content ---
    if (userData.savedCards && userData.savedCards.length > 0) tags.push('has:snapshot-cards');
    if (userData.savedProtocols && userData.savedProtocols.length > 0) tags.push('has:protocols');
    if (userData.savedBlogs && userData.savedBlogs.length > 0) tags.push('has:blogs');
    if (userData.savedPodcasts && userData.savedPodcasts.length > 0) tags.push('has:podcasts');

    // --- Default if empty ---
    if (tags.length === 0) tags.push('experience:beginner', 'goal:master-manual');

    return tags;
  };

  // -------------------------------------------------------------
  // 2. Calculate relevance score between content tags and user tags
  // -------------------------------------------------------------
  window.calculateRelevance = function(contentTags, userTags) {
    if (!contentTags || !Array.isArray(contentTags)) return 0;
    if (!userTags || !Array.isArray(userTags)) return 0;

    let score = 0;

    // Direct match: +10
    contentTags.forEach(ct => {
      if (userTags.includes(ct)) score += 10;
    });

    // Partial matches: pain, interest, goal
    userTags.forEach(ut => {
      if (ut.startsWith('pain:')) {
        const topic = ut.replace('pain:', '');
        contentTags.forEach(ct => {
          if (ct.includes(topic)) score += 5;
        });
      }
      if (ut.startsWith('interest:')) {
        const topic = ut.replace('interest:', '');
        contentTags.forEach(ct => {
          if (ct.includes(topic)) score += 7;
        });
      }
      if (ut.startsWith('goal:')) {
        const goal = ut.replace('goal:', '');
        contentTags.forEach(ct => {
          if (ct.includes(goal)) score += 8;
        });
      }
    });

    // Skill level alignment
    const userSkill = userTags.find(t => t.startsWith('experience:'));
    const contentSkill = contentTags.find(t => t.startsWith('skill:'));
    if (userSkill && contentSkill) {
      const uLevel = userSkill.split(':')[1];
      const cLevel = contentSkill.split(':')[1];
      if (uLevel === cLevel) score += 5;
      else if ((uLevel === 'beginner' && cLevel === 'intermediate') ||
               (uLevel === 'intermediate' && cLevel === 'advanced')) {
        score += 3;
      }
    }

    return score;
  };

  // -------------------------------------------------------------
  // 3. Fetch and score content from any Firestore collection
  // -------------------------------------------------------------
  window.getRecommendedContent = async function(collectionName, userTags, limit = 10, extraFilters = {}) {
    if (!window.db) {
      console.error('Firestore not initialized (window.db missing)');
      return [];
    }

    try {
      // Build query – limit to 50 to avoid excessive reads, filter by active if present
      let query = window.db.collection(collectionName).limit(50);
      if (extraFilters.active !== undefined) {
        query = query.where('active', '==', extraFilters.active);
      }

      const snapshot = await query.get();
      const items = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const tags = data.tags || [];
        const score = window.calculateRelevance(tags, userTags);
        items.push({ id: doc.id, ...data, score });
      });

      // Sort descending by score
      items.sort((a, b) => (b.score || 0) - (a.score || 0));
      return items.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recommendations from', collectionName, error);
      return [];
    }
  };

})();