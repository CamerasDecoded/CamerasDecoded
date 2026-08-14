// functions/aiRouter.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// Map tool IDs to their logic
const toolHandlers = {
  critique: async (payload, uid) => {
    // Call Replicate / OpenAI Vision to analyze image
    // Return { composition, exposure, color, impact }
    return { composition: 'Good use of leading lines', exposure: 'Slightly underexposed', color: 'Warm tones', impact: 'Emotional' };
  },
  path: async (payload, uid) => {
    // Fetch user progress from Firestore, generate tailored modules
    return { modules: ['Protocol 1: Aperture', 'Protocol 2: Shutter Speed', 'Protocol 3: Composition'] };
  },
  challenge: async (payload, uid) => {
    // Generate a daily challenge
    return { task: 'Capture a portrait using only window light.', tip: 'Position subject 45° to the window.' };
  },
  culling: async (payload, uid) => {
    // Analyze images, return top selections
    return { selected: payload.urls.slice(0, 3) };
  },
  style: async (payload, uid) => {
    // Generate a LUT / preset
    return { lutData: 'LUT_BASE64_STRING', description: 'Warm vintage look' };
  },
  upscale: async (payload, uid) => {
    // Call super-resolution API
    return { upscaledUrl: 'https://storage.googleapis.com/upscaled/image.jpg' };
  },
  image: async (payload, uid) => {
    // Call Stability AI
    return { imageUrl: 'https://storage.googleapis.com/generated/image.png' };
  },
  proposal: async (payload, uid) => {
    // OpenAI GPT to draft contract
    return { proposal: `Dear ${payload.client},\n\nWe are pleased to offer...` };
  },
  planner: async (payload, uid) => {
    return {
      gear: ['Camera body', '24-70mm lens', 'Flash', 'Extra batteries'],
      shots: ['Wide establishing shot', 'Medium group shot', 'Close-up details'],
      timeline: 'Arrive 1hr early, setup 30min, shoot 2hrs, pack 30min.'
    };
  },
  portfolio: async (payload, uid) => {
    // Generate a static site / HTML snippet
    return { url: `https://${uid}.camerasdecoded.com/portfolio`, htmlSnippet: `<div class="gallery">...</div>` };
  },
  brand: async (payload, uid) => {
    return {
      logo: 'Geometric camera + sun icon',
      palette: ['#2C3E50', '#E67E22', '#ECF0F1'],
      tagline: 'Capturing moments, telling stories.',
      bio: 'Professional photographer specializing in authentic storytelling.'
    };
  }
};

exports.aiRouter = functions.https.onCall(async (data, context) => {
  // 1. Auth check
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  const uid = context.auth.uid;

  // 2. Validate input
  const { toolId, payload } = data;
  if (!toolId || !payload) throw new functions.https.HttpsError('invalid-argument', 'Missing toolId or payload.');

  // 3. Check user plan (optional)
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  const userPlan = userDoc.exists ? (userDoc.data().plan || 'free') : 'free';

  // 4. Rate limit check (optional – you already have client-side, but double-down)
  // ...

  // 5. Route to handler
  const handler = toolHandlers[toolId];
  if (!handler) throw new functions.https.HttpsError('not-found', `Tool "${toolId}" not found.`);

  try {
    const result = await handler(payload, uid);
    return result;
  } catch (err) {
    console.error(`AI Router error (${toolId}):`, err);
    throw new functions.https.HttpsError('internal', err.message || 'Processing failed.');
  }
});