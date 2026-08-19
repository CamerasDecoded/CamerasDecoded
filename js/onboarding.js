// js/onboarding.js
import { auth, db } from './firebase-init.js';
import { signInWithGoogle, signInWithFacebook, signUpWithEmail } from './auth.js';
import { cdToast, triggerConfetti } from './ui-helpers.js';

// ----- Step Definitions -----
const STEPS = [
  {
    id: 'tune-in',
    title: 'Tune In',
    icon: '📡',
    subtitle: 'Enter your details or sign up with a provider.',
    fields: ['displayName', 'email', 'username'],
    render: (data) => `
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button class="btn-social" onclick="window._onboardingSocial('google')">
          <i class="fab fa-google"></i> Sign up with Google
        </button>
        <button class="btn-social" onclick="window._onboardingSocial('facebook')">
          <i class="fab fa-facebook-f"></i> Sign up with Facebook
        </button>
      </div>
      <div style="display:flex;align-items:center;gap:16px;margin:16px 0;color:var(--text-muted);font-size:11px;font-family:'Space Mono',monospace;">
        <hr style="flex:1;border:none;border-top:1px solid var(--border);" />
        <span>or with email</span>
        <hr style="flex:1;border:none;border-top:1px solid var(--border);" />
      </div>
      <div class="form-group"><label>Full Name</label><input type="text" id="displayName" placeholder="Alex Rivera" value="${data.displayName || ''}" required /></div>
      <div class="form-group"><label>Email</label><input type="email" id="email" placeholder="you@example.com" value="${data.email || ''}" required /></div>
      <div class="form-group"><label>Username</label><input type="text" id="username" placeholder="alexrivera" value="${data.username || ''}" required /></div>
    `,
    validate: (data) => {
      if (!data.displayName || !data.email || !data.username) { cdToast('Please fill in all fields.', 'error'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { cdToast('Invalid email address.', 'error'); return false; }
      return true;
    }
  },
  {
    id: 'gear-focus',
    title: 'Gear & Focus',
    icon: '🔍',
    subtitle: 'Select your camera brand(s), lenses, and creative interests (max 3).',
    fields: ['brands', 'lenses', 'interests'],
    render: (data) => `
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Camera Brands</div>
      <div class="chip-grid" data-group="brands">
        ${['Sony','Canon','Nikon','Fuji','Panasonic','Blackmagic'].map(b => `<span class="chip ${(data.brands||[]).includes(b) ? 'selected' : ''}" data-value="${b}">${b}</span>`).join('')}
      </div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:14px;">Lenses</div>
      <div class="chip-grid" data-group="lenses">
        ${['24-70mm f/2.8','85mm f/1.4','70-200mm f/2.8','35mm f/1.4','50mm f/1.8','16-35mm f/2.8','24-105mm f/4','Macro'].map(l => `<span class="chip ${(data.lenses||[]).includes(l) ? 'selected' : ''}" data-value="${l}">${l}</span>`).join('')}
      </div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:14px;">Interests <span style="color:#666;">(max 3)</span></div>
      <div class="chip-grid" data-group="interests" data-max="3">
        ${['Portraits','Events/Weddings','Landscape','Street','Sports/Action','Real Estate','Product','Wildlife','Astro','Food','Videography/Film','Documentary','Music Videos','Corporate','Content Creation'].map(i => `<span class="chip ${(data.interests||[]).includes(i) ? 'selected' : ''}" data-value="${i}">${i}</span>`).join('')}
      </div>
      <div style="margin-top:6px;font-size:12px;color:var(--text-muted);">Selected: <span id="interestCount">${(data.interests||[]).length}</span> / 3</div>
    `,
    validate: (data) => {
      if (!data.brands || data.brands.length === 0) { cdToast('Select at least one camera brand.', 'error'); return false; }
      if (!data.interests || data.interests.length === 0) { cdToast('Select at least one interest.', 'error'); return false; }
      return true;
    }
  },
  {
    id: 'experience-confidence',
    title: 'Experience & Confidence',
    icon: '📊',
    subtitle: 'Tell us about your background and current confidence level.',
    fields: ['experience', 'primaryGoal', 'ambition', 'confidence'],
    render: (data) => `
      <div class="form-group"><label>Experience</label>
        <select id="experience">
          <option value="<6" ${data.experience === '<6' ? 'selected' : ''}>Less than 6 months</option>
          <option value="6-12" ${data.experience === '6-12' ? 'selected' : ''}>6–12 months</option>
          <option value="1-2" ${data.experience === '1-2' ? 'selected' : ''}>1–2 years</option>
          <option value="3-5" ${data.experience === '3-5' ? 'selected' : ''}>3–5 years</option>
          <option value="5+" ${data.experience === '5+' ? 'selected' : ''}>5+ years</option>
        </select>
      </div>
      <div class="form-group"><label>Primary Goal</label>
        <select id="primaryGoal">
          <option value="master-manual" ${data.primaryGoal === 'master-manual' ? 'selected' : ''}>Master manual mode</option>
          <option value="start-business" ${data.primaryGoal === 'start-business' ? 'selected' : ''}>Start a photography/video business</option>
          <option value="improve-social" ${data.primaryGoal === 'improve-social' ? 'selected' : ''}>Improve social media content</option>
          <option value="family-travel" ${data.primaryGoal === 'family-travel' ? 'selected' : ''}>Capture family/travel memories</option>
          <option value="professional-event" ${data.primaryGoal === 'professional-event' ? 'selected' : ''}>Become a professional event/wedding photographer</option>
          <option value="filmmaker" ${data.primaryGoal === 'filmmaker' ? 'selected' : ''}>Become a filmmaker/videographer</option>
        </select>
      </div>
      <div class="form-group"><label>Ambition</label>
        <select id="ambition">
          <option value="hobbyist" ${data.ambition === 'hobbyist' ? 'selected' : ''}>Hobbyist – I create for fun</option>
          <option value="semi-pro" ${data.ambition === 'semi-pro' ? 'selected' : ''}>Semi‑professional – I earn some income</option>
          <option value="professional" ${data.ambition === 'professional' ? 'selected' : ''}>Professional – this is my primary income</option>
        </select>
      </div>
      <div class="form-group"><label>Confidence (1–10)</label>
        <input type="range" id="confidence" min="1" max="10" value="${data.confidence || 5}" step="1" />
        <span id="confidenceDisplay">${data.confidence || 5}</span>
      </div>
    `,
    validate: () => true
  },
  {
    id: 'challenges-learning',
    title: 'Challenges & Learning',
    icon: '💥',
    subtitle: 'What holds you back? How do you learn best?',
    fields: ['painPoints', 'contentFormat', 'deliveryChannel', 'shootFrequency', 'biggestChallenge'],
    render: (data) => `
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Pain Points <span style="color:#666;">(max 3)</span></div>
      <div class="chip-grid" data-group="painPoints" data-max="3">
        ${['Technical confusion','Creative block','Editing/post-processing','Color grading','Business/marketing','Building portfolio','Attracting clients','Lack of inspiration','Understanding camera','Audio/Sound','Lighting'].map(p => `<span class="chip ${(data.painPoints||[]).includes(p) ? 'selected' : ''}" data-value="${p}">${p}</span>`).join('')}
      </div>
      <div style="margin-top:6px;font-size:12px;color:var(--text-muted);">Selected: <span id="painCount">${(data.painPoints||[]).length}</span> / 3</div>
      
      <div class="form-group" style="margin-top:16px;"><label>Content Format</label>
        <select id="contentFormat">
          <option value="video" ${data.contentFormat === 'video' ? 'selected' : ''}>Video tutorials</option>
          <option value="written" ${data.contentFormat === 'written' ? 'selected' : ''}>Written guides</option>
          <option value="interactive" ${data.contentFormat === 'interactive' ? 'selected' : ''}>Interactive exercises</option>
          <option value="mixed" ${data.contentFormat === 'mixed' ? 'selected' : ''}>A mix of everything</option>
        </select>
      </div>
      <div class="form-group"><label>Delivery Channel</label>
        <select id="deliveryChannel">
          <option value="email" ${data.deliveryChannel === 'email' ? 'selected' : ''}>Email</option>
          <option value="push" ${data.deliveryChannel === 'push' ? 'selected' : ''}>Push notifications</option>
          <option value="sms" ${data.deliveryChannel === 'sms' ? 'selected' : ''}>SMS</option>
        </select>
      </div>
      <div class="form-group"><label>Shoot Frequency</label>
        <select id="shootFrequency">
          <option value="daily" ${data.shootFrequency === 'daily' ? 'selected' : ''}>Daily</option>
          <option value="weekly" ${data.shootFrequency === 'weekly' ? 'selected' : ''}>Weekly</option>
          <option value="monthly" ${data.shootFrequency === 'monthly' ? 'selected' : ''}>Monthly</option>
          <option value="rarely" ${data.shootFrequency === 'rarely' ? 'selected' : ''}>Rarely</option>
        </select>
      </div>
      <div class="form-group"><label>Biggest Challenge</label>
        <input type="text" id="biggestChallenge" placeholder="e.g. Low light, composition, posing..." value="${data.biggestChallenge || ''}" />
      </div>
    `,
    validate: (data) => {
      if (!data.painPoints || data.painPoints.length === 0) { cdToast('Select at least one pain point.', 'error'); return false; }
      return true;
    }
  },
  {
    id: 'vision',
    title: 'Vision',
    icon: '🔭',
    subtitle: 'Where do you see yourself in 6 months?',
    fields: ['sixMonthGoal', 'dreamProject'],
    render: (data) => `
      <div class="form-group"><label>6-Month Skill Goal</label>
        <select id="sixMonthGoal">
          <option value="exposure" ${data.sixMonthGoal === 'exposure' ? 'selected' : ''}>Exposure triangle (manual mode)</option>
          <option value="composition" ${data.sixMonthGoal === 'composition' ? 'selected' : ''}>Composition & storytelling</option>
          <option value="lighting" ${data.sixMonthGoal === 'lighting' ? 'selected' : ''}>Lighting (photo & video)</option>
          <option value="editing" ${data.sixMonthGoal === 'editing' ? 'selected' : ''}>Editing/post-production</option>
          <option value="color" ${data.sixMonthGoal === 'color' ? 'selected' : ''}>Color grading</option>
          <option value="business" ${data.sixMonthGoal === 'business' ? 'selected' : ''}>Business & client management</option>
        </select>
      </div>
      <div class="form-group"><label>Dream Project</label>
        <select id="dreamProject">
          <option value="portrait-series" ${data.dreamProject === 'portrait-series' ? 'selected' : ''}>A portrait series</option>
          <option value="short-film" ${data.dreamProject === 'short-film' ? 'selected' : ''}>A short film</option>
          <option value="documentary" ${data.dreamProject === 'documentary' ? 'selected' : ''}>A documentary</option>
          <option value="music-video" ${data.dreamProject === 'music-video' ? 'selected' : ''}>A music video</option>
          <option value="commercial" ${data.dreamProject === 'commercial' ? 'selected' : ''}>A commercial/corporate video</option>
          <option value="wedding-film" ${data.dreamProject === 'wedding-film' ? 'selected' : ''}>A wedding film</option>
          <option value="social-content" ${data.dreamProject === 'social-content' ? 'selected' : ''}>Social media content</option>
        </select>
      </div>
    `,
    validate: () => true
  },
  {
    id: 'activate',
    title: 'Activate',
    icon: '🔐',
    subtitle: 'Choose your plan, review, and activate your signal.',
    fields: ['tier', 'password'],
    render: (data) => `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:12px 0 20px;">
        <div class="pricing-card ${data.tier === 'free' ? 'selected' : ''}" data-tier="free" onclick="window._selectTier('free')">
          <div class="name">Free</div>
          <div class="price"><span class="currency">$</span>0</div>
          <div class="period">forever</div>
          <div class="features"><i class="fas fa-check"></i> Daily protocols<br><i class="fas fa-check"></i> Community access<br><i class="fas fa-check"></i> 5 Snapshot Cards</div>
        </div>
        <div class="pricing-card ${data.tier === 'pro' ? 'selected' : ''}" data-tier="pro" onclick="window._selectTier('pro')">
          <div class="badge">Best value</div>
          <div class="name">Pro</div>
          <div class="price"><span class="currency">$</span>24</div>
          <div class="period">/ month</div>
          <div class="features"><i class="fas fa-check"></i> Everything in Free<br><i class="fas fa-check"></i> SMS protocols<br><i class="fas fa-check"></i> Unlimited Snapshot Cards</div>
        </div>
      </div>
      <div class="form-group"><label>Password <span style="color:#666;">(min 6 chars)</span></label>
        <input type="password" id="password" placeholder="••••••••" value="${data.password || ''}" />
      </div>
      <div class="form-group"><label>Confirm Password</label>
        <input type="password" id="confirmPassword" placeholder="••••••••" value="${data.confirmPassword || ''}" />
        <div class="error-hint" id="passwordError" style="display:none;color:#ff4a4a;font-size:12px;margin-top:4px;">Passwords do not match or are too short.</div>
      </div>
      <div style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted);margin-bottom:6px;">
          <span>📋 Review your profile</span>
        </div>
        <div id="summaryPreview" style="background:#0A0A0A;border-radius:8px;padding:12px;font-size:12px;color:var(--text-muted);max-height:120px;overflow-y:auto;"></div>
      </div>
      <div style="margin-top:14px;display:flex;justify-content:center;">
        <button class="btn-primary" id="activateBtn" style="width:100%;">Activate Signal →</button>
      </div>
      <div id="signupError" style="color:#ff4a4a;font-size:13px;margin-top:10px;display:none;"></div>
    `,
    validate: (data) => {
      if (!data.tier) { cdToast('Please select a plan.', 'error'); return false; }
      // Password is optional if they used social sign-in, but we check if they provided it.
      if (data.password && data.password.length < 6) { cdToast('Password must be at least 6 characters.', 'error'); return false; }
      if (data.password && data.password !== data.confirmPassword) { cdToast('Passwords do not match.', 'error'); return false; }
      return true;
    }
  }
];

// ----- State Management -----
let state = {
  role: 'Operator', // default to Operator for now
  step: 0,
  data: {},
  socialUid: null, // set if they use Google/Facebook
  isSocial: false
};

// Load from sessionStorage
function loadState() {
  try {
    const saved = sessionStorage.getItem('onboarding_state');
    if (saved) state = { ...state, ...JSON.parse(saved) };
  } catch (e) {}
}
function saveState() { sessionStorage.setItem('onboarding_state', JSON.stringify(state)); }

// ----- Render Function -----
function renderStep() {
  const container = document.getElementById('stepContainer');
  if (!container) return;
  const stepDef = STEPS[state.step];
  if (!stepDef) return;

  const stepData = state.data;
  let html = `
    <div style="animation:fadeSlide 0.4s ease forwards;">
      <div class="step-header">
        <span style="font-size:24px;">${stepDef.icon}</span>
        <h2 style="font-family:'Space Mono',monospace;color:var(--green);font-size:24px;margin:0;">${stepDef.title}</h2>
      </div>
      <p style="color:var(--text-muted);margin-bottom:20px;">${stepDef.subtitle}</p>
      <div class="step-body">${stepDef.render(stepData)}</div>
      <div class="step-nav" style="display:flex;gap:12px;margin-top:24px;">
        <button class="btn-secondary" id="prevBtn" ${state.step === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>← Back</button>
        <button class="btn-primary" id="nextBtn" style="flex:1;">${state.step === STEPS.length - 1 ? 'Activate' : 'Continue →'}</button>
      </div>
    </div>
  `;
  container.innerHTML = html;

  // Attach events
  document.getElementById('prevBtn').addEventListener('click', () => { if (state.step > 0) { state.step--; saveState(); renderStep(); } });
  document.getElementById('nextBtn').addEventListener('click', handleNext);

  // Chip logic
  document.querySelectorAll('.chip-grid').forEach(grid => {
    const group = grid.dataset.group;
    const max = parseInt(grid.dataset.max) || Infinity;
    grid.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.dataset.value;
        if (chip.classList.contains('selected')) {
          chip.classList.remove('selected');
          state.data[group] = state.data[group]?.filter(v => v !== val) || [];
        } else {
          if (state.data[group]?.length >= max) { cdToast(`Max ${max} selections.`, 'error'); return; }
          chip.classList.add('selected');
          if (!state.data[group]) state.data[group] = [];
          state.data[group].push(val);
        }
        // Update counters
        if (group === 'interests') document.getElementById('interestCount').textContent = state.data.interests?.length || 0;
        if (group === 'painPoints') document.getElementById('painCount').textContent = state.data.painPoints?.length || 0;
        saveState();
      });
    });
  });

  // Confidence slider
  const confSlider = document.getElementById('confidence');
  const confDisplay = document.getElementById('confidenceDisplay');
  if (confSlider && confDisplay) {
    confSlider.addEventListener('input', () => {
      confDisplay.textContent = confSlider.value;
      state.data.confidence = parseInt(confSlider.value);
      saveState();
    });
  }

  // Pricing tier selection
  window._selectTier = (tier) => {
    state.data.tier = tier;
    document.querySelectorAll('.pricing-card').forEach(c => c.classList.toggle('selected', c.dataset.tier === tier));
    saveState();
  };

  // Social sign-up buttons
  window._onboardingSocial = async (provider) => {
    try {
      let user;
      if (provider === 'google') user = await signInWithGoogle();
      else if (provider === 'facebook') user = await signInWithFacebook();
      if (user) {
        state.socialUid = user.uid;
        state.isSocial = true;
        state.data.email = user.email || '';
        state.data.displayName = user.displayName || '';
        state.data.username = user.displayName ? user.displayName.toLowerCase().replace(/\s/g, '') : (user.email ? user.email.split('@')[0] : 'user' + Math.random().toString(36).substring(2,6));
        saveState();
        // Re-render to populate fields
        renderStep();
        cdToast(`Signed in as ${state.data.displayName || state.data.username}`);
      }
    } catch (e) { console.error(e); }
  };

  // Update form fields on input
  document.querySelectorAll('#stepContainer input, #stepContainer select').forEach(el => {
    el.addEventListener('input', () => {
      if (el.id) state.data[el.id] = el.value;
      saveState();
    });
    el.addEventListener('change', () => {
      if (el.id) state.data[el.id] = el.value;
      saveState();
    });
  });

  // Summary preview on last step
  if (state.step === STEPS.length - 1) {
    updateSummaryPreview();
    document.getElementById('activateBtn').addEventListener('click', activateSignal);
  }
}

function handleNext() {
  const stepDef = STEPS[state.step];
  // Gather data from DOM
  document.querySelectorAll('#stepContainer input, #stepContainer select').forEach(el => {
    if (el.id) state.data[el.id] = el.value;
  });
  // Collect chips
  document.querySelectorAll('.chip-grid').forEach(grid => {
    const group = grid.dataset.group;
    const selected = grid.querySelectorAll('.chip.selected');
    state.data[group] = Array.from(selected).map(c => c.dataset.value);
  });

  saveState();

  if (!stepDef.validate(state.data)) return;

  if (state.step === STEPS.length - 1) {
    // Final activation
    activateSignal();
  } else {
    state.step++;
    saveState();
    renderStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateSummaryPreview() {
  const el = document.getElementById('summaryPreview');
  if (!el) return;
  const d = state.data;
  el.innerHTML = `
    <div><strong>Name:</strong> ${d.displayName || '—'}</div>
    <div><strong>Email:</strong> ${d.email || '—'}</div>
    <div><strong>Brands:</strong> ${(d.brands || []).join(', ') || '—'}</div>
    <div><strong>Interests:</strong> ${(d.interests || []).join(', ') || '—'}</div>
    <div><strong>Plan:</strong> ${d.tier === 'pro' ? 'Pro' : 'Free'}</div>
  `;
}

// ----- ACTIVATE SIGNAL (Fixes the race condition) -----
async function activateSignal() {
  const btn = document.getElementById('activateBtn');
  const errorEl = document.getElementById('signupError');
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = 'Activating...';
  errorEl.style.display = 'none';

  try {
    const data = state.data;
    let uid = state.socialUid;
    let authUser = null;

    // If not social, create account
    if (!state.isSocial) {
      const password = data.password;
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
      if (password !== data.confirmPassword) throw new Error('Passwords do not match.');
      if (!data.email) throw new Error('Email is required.');

      const cred = await signUpWithEmail(data.email, password);
      authUser = cred;
      uid = cred.uid;
      // Update profile with display name
      await authUser.updateProfile({ displayName: data.displayName });
    } else {
      // Ensure social user is still logged in
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== uid) throw new Error('Social session expired. Please try again.');
      authUser = currentUser;
    }

    // Build final user document
    const userDoc = {
      uid: uid,
      email: data.email || authUser.email,
      displayName: data.displayName || authUser.displayName || '',
      username: data.username || (data.email ? data.email.split('@')[0] : 'user_' + uid.slice(0,6)),
      role: state.role || 'Operator',
      tier: data.tier || 'free',
      billingInterval: 'monthly',
      preferences: {
        brands: data.brands || [],
        lenses: data.lenses || [],
        interests: data.interests || []
      },
      learningJourney: {
        experience: data.experience || '',
        primaryGoal: data.primaryGoal || '',
        ambition: data.ambition || '',
        confidence: parseInt(data.confidence) || 5,
        painPoints: data.painPoints || [],
        contentFormat: data.contentFormat || '',
        deliveryChannel: data.deliveryChannel || '',
        shootFrequency: data.shootFrequency || '',
        biggestChallenge: data.biggestChallenge || '',
        sixMonthGoal: data.sixMonthGoal || '',
        dreamProject: data.dreamProject || ''
      },
      totalPoints: 0,
      level: 1,
      badgesEarned: [],
      dailyChallengeStreak: 0,
      lastChallengeDate: null,
      dailyChallengesCompleted: [],
      savedProtocols: [],
      savedCards: [],
      savedBlogs: [],
      savedPodcasts: [],
      savedCommunityPosts: [],
      referralCode: data.username || 'user_' + uid.slice(0,6),
      totalReferrals: 0,
      totalCommissionEarned: 0,
      ambassadorTier: 'signal',
      aiUsage: { total: 0, prompt: 0, snapshot: 0, ideas: 0, critique: 0 },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      tourCompleted: false
    };

    // ✅ Write to Firestore BEFORE redirecting
    await db.collection('users').doc(uid).set(userDoc);

    // Also create referral code doc
    try {
      await db.collection('referralCodes').doc(userDoc.referralCode).set({ uid: uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    } catch (e) { console.warn('Referral code creation skipped:', e); }

    // Clear session state
    sessionStorage.removeItem('onboarding_state');

    // Trigger celebration
    triggerConfetti();
    cdToast('✅ Signal activated! Redirecting to dashboard...');

    // Redirect to Operator Dashboard
    setTimeout(() => {
      window.location.href = 'operator-dashboard.html?uid=' + uid;
    }, 1500);

  } catch (err) {
    console.error('Activation error:', err);
    errorEl.textContent = '❌ ' + err.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Activate Signal →';
  }
}

// ----- INIT -----
export function initOnboarding(role = 'Operator') {
  state.role = role;
  loadState();
  // If no data exists, initialize with empty arrays/objects
  if (!state.data.brands) state.data.brands = [];
  if (!state.data.lenses) state.data.lenses = [];
  if (!state.data.interests) state.data.interests = [];
  if (!state.data.painPoints) state.data.painPoints = [];
  saveState();
  renderStep();
}

// Styles for chips and pricing cards (injected dynamically to keep HTML clean)
const styleTag = document.createElement('style');
styleTag.textContent = `
  .chip-grid { display:flex; flex-wrap:wrap; gap:8px; margin:4px 0; }
  .chip { padding:6px 16px; background:#0F0F0F; border:1px solid var(--border); border-radius:20px; font-size:13px; color:var(--text-muted); cursor:pointer; transition:0.2s; user-select:none; }
  .chip:hover { border-color:#555; }
  .chip.selected { border-color:var(--green); background:var(--green-dim); color:#fff; }
  .pricing-card { background:#0F0F0F; border:1px solid var(--border); border-radius:12px; padding:20px 16px; text-align:center; cursor:pointer; transition:0.3s; position:relative; }
  .pricing-card:hover { border-color:var(--green); }
  .pricing-card.selected { border-color:var(--green); box-shadow:0 0 30px rgba(141,235,0,0.06); }
  .pricing-card .name { font-family:'Space Mono',monospace; font-size:14px; color:var(--text-muted); }
  .pricing-card .price { font-size:28px; font-weight:700; color:#fff; }
  .pricing-card .price .currency { font-size:16px; color:var(--text-muted); }
  .pricing-card .period { font-size:12px; color:#666; }
  .pricing-card .features { font-size:12px; color:var(--text-muted); margin-top:10px; line-height:1.6; }
  .pricing-card .features i { color:var(--green); margin-right:4px; }
  .pricing-card .badge { position:absolute; top:-8px; right:-8px; background:var(--green); color:#000; font-size:10px; font-weight:700; padding:2px 10px; border-radius:20px; font-family:'Space Mono',monospace; text-transform:uppercase; }
  .btn-social { width:100%; padding:12px; background:transparent; border:1px solid rgba(255,255,255,0.08); border-radius:8px; color:#fff; font-size:14px; cursor:pointer; transition:0.3s; display:flex; align-items:center; justify-content:center; gap:10px; }
  .btn-social:hover { border-color:rgba(141,235,0,0.3); background:rgba(141,235,0,0.05); }
  .step-header { display:flex; align-items:center; gap:12px; margin-bottom:4px; }
  .error-hint { display:none; }
`;
document.head.appendChild(styleTag);