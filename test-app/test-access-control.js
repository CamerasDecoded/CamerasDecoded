// access-control.js – Role & tier based access control
(function() {
  'use strict';

  // Permission map: featureKey -> array of allowed (role, tier) combos
  // tier can be:
  //   - '*' (any tier for that role)
  //   - specific: 'free', 'pro' (for Operator)
  //   - 'signal', 'operator', 'enterprise' (for Partner)
  //   - 'basic', 'premium' (for Instructor – we'll define later)
  const FEATURES = {
    // ---- Public (accessible to everyone, even guests) ----
    'public_home': [{ role: '*', tier: '*' }],
    'public_operators': [{ role: '*', tier: '*' }],
    'public_community': [{ role: '*', tier: '*' }],
    'public_instructors': [{ role: '*', tier: '*' }],
    'public_partners': [{ role: '*', tier: '*' }],
    'public_journey': [{ role: '*', tier: '*' }],
    'public_learning_modules': [{ role: '*', tier: '*' }],
    'public_products': [{ role: '*', tier: '*' }],
    'public_protocols': [{ role: '*', tier: '*' }],
    'public_snapshot_cards': [{ role: '*', tier: '*' }],
    'public_cynetis7': [{ role: '*', tier: '*' }],
    'public_blog': [{ role: '*', tier: '*' }],
    'public_podcast': [{ role: '*', tier: '*' }],
    'public_inner_signal': [{ role: '*', tier: '*' }],

    // ---- Private (only logged in users) ----
    'private_dashboard': [
      { role: 'Operator', tier: '*' },
      { role: 'Partner', tier: '*' },
      { role: 'Instructor', tier: '*' }
    ],
    'private_profile': [
      { role: 'Operator', tier: '*' },
      { role: 'Partner', tier: '*' },
      { role: 'Instructor', tier: '*' }
    ],
    'private_settings': [
      { role: 'Operator', tier: '*' },
      { role: 'Partner', tier: '*' },
      { role: 'Instructor', tier: '*' }
    ],
    'private_billing': [
      { role: 'Operator', tier: '*' },
      { role: 'Partner', tier: '*' },
      { role: 'Instructor', tier: '*' }
    ],

    // ---- Role-specific ----
    'operator_advanced_analytics': [
      { role: 'Operator', tier: 'pro' }
    ],
    'operator_unlimited_projects': [
      { role: 'Operator', tier: 'pro' }
    ],
    'operator_priority_support': [
      { role: 'Operator', tier: 'pro' }
    ],
    'operator_upload_4k': [
      { role: 'Operator', tier: 'pro' }
    ],

    'partner_learning_access': [
      { role: 'Partner', tier: 'signal' },
      { role: 'Partner', tier: 'operator' },
      { role: 'Partner', tier: 'enterprise' }
    ],
    'partner_cynetis_access': [
      { role: 'Partner', tier: 'operator' },
      { role: 'Partner', tier: 'enterprise' }
    ],
    'partner_analytics_reporting': [
      { role: 'Partner', tier: 'enterprise' }
    ],

    'instructor_view_students': [
      { role: 'Instructor', tier: '*' }  // both basic & premium
    ],
    'instructor_create_lessons': [
      { role: 'Instructor', tier: 'premium' }  // only premium
    ]
  };

  // ---- Check if a feature is accessible ----
  window.canAccess = function(featureKey) {
    const user = window.USER;
    // If user not logged in, only allow features with role: '*'
    if (!user || !user.isLoggedIn) {
      const allowed = FEATURES[featureKey];
      if (!allowed) return false;
      // Check if any entry allows role: '*'
      return allowed.some(entry => entry.role === '*');
    }

    const role = user.role;
    // Determine tier based on role
    let tier = null;
    if (role === 'Operator') {
      tier = user.tier; // 'free' or 'pro'
    } else if (role === 'Partner') {
      tier = user.partnerTier; // 'signal', 'operator', 'enterprise'
    } else if (role === 'Instructor') {
      tier = user.instructorTier || 'basic'; // fallback
    } else {
      // fallback: if role is not recognized, deny access
      return false;
    }

    const allowed = FEATURES[featureKey];
    if (!allowed) return false;

    // Check if any entry matches the user's (role, tier)
    return allowed.some(entry => {
      if (entry.role === '*') return true; // guest public
      if (entry.role !== role) return false;
      if (entry.tier === '*') return true;
      return entry.tier === tier;
    });
  };

  // ---- Expose the FEATURES map for debugging (optional) ----
  window._FEATURES = FEATURES;

  console.log('✅ access-control.js loaded');
})();