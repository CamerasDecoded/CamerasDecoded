/* ============================================================================
   skill-trees-data.js — Cameras Decoded "Darkroom" data + progression logic.
   Pure data/logic, no DOM. Shared by darkroom.js (page) and any future
   surface that needs skill state (dashboard widgets, drill results, etc.).

   Extracted from skill-tree-demo.html (2026-09-12). In production, PROGRESS
   comes from Firestore userSkills/{uid} — see darkroom.js and INTEGRATION.md.
   ============================================================================ */

const LEVELS = [
  { level: 1, xp: 20  },   // started
  { level: 2, xp: 60  },   // functional — unlocks downstream skills
  { level: 3, xp: 140 },   // solid
  { level: 4, xp: 260 },   // advanced
  { level: 5, xp: 400 },   // mastered
];
const UNLOCK_AT = 2; // a skill unlocks its dependents once it reaches this level

const SKILL_TREES = {
  'photo-foundations': {
    id: 'photo-foundations',
    name: 'Photography Foundations',
    audience: 'Photographers',
    icon: 'camera',
    tagline: 'From your first sharp shot to full manual control.',
    branches: [
      {
        id: 'foundations', name: 'Foundations', color: '#8deb00',
        tagline: 'Your camera, the exposure triangle, and tack-sharp basics.',
        banner: 'banners/foundations.gif',
        skills: [
          { id:'camera-basics', name:'Know Your Camera', icon:'camera',
            desc:'Body, lens, dials — and your first sharp shot.', xp:50, lessons:3, requires:[] },
          { id:'exposure-triangle', name:'The Exposure Triangle', icon:'triangle',
            desc:'Aperture, shutter, ISO: the three-way trade behind every photo.', xp:50, lessons:3, requires:['camera-basics'] },
          { id:'metering', name:'Metering Modes', icon:'gauge',
            desc:'Tell the camera what "correctly exposed" looks like.', xp:75, lessons:3, requires:['exposure-triangle'] },
          { id:'focus', name:'Nail the Focus', icon:'crosshair',
            desc:'Autofocus modes and razor-sharp subjects, every time.', xp:75, lessons:3, requires:['camera-basics'] },
        ]
      },
      {
        id: 'light', name: 'Light & Exposure', color: '#ffd60a',
        tagline: 'Bend light to your will — the technical heart of photography.',
        banner: 'banners/light-exposure.gif',
        skills: [
          { id:'aperture', name:'Aperture & Depth of Field', icon:'aperture',
            desc:'f-stops, bokeh, and isolating your subject.', xp:100, lessons:4, requires:['exposure-triangle'] },
          { id:'shutter', name:'Shutter Speed & Motion', icon:'timer',
            desc:'Freeze it or blur it — motion, on purpose.', xp:100, lessons:4, requires:['exposure-triangle'] },
          { id:'iso', name:'ISO & Noise', icon:'signal',
            desc:'Brighten the shadows without the mush.', xp:100, lessons:3, requires:['exposure-triangle'] },
          { id:'exp-comp', name:'Exposure Compensation', icon:'sliders',
            desc:'Override the meter in a single dial.', xp:100, lessons:3, requires:['metering'] },
          { id:'manual-mode', name:'Manual Mode', icon:'dial',
            desc:'Full control. The decoder’s rite of passage.', xp:150, lessons:5, requires:['aperture','shutter','iso'] },
        ]
      },
      {
        id: 'composition', name: 'Composition', color: '#b28dff',
        tagline: 'Where to put things in the frame — and why.',
        banner: 'banners/composition.gif',
        skills: [
          { id:'thirds', name:'Rule of Thirds', icon:'grid',
            desc:'Place subjects where eyes want to go.', xp:75, lessons:3, requires:['camera-basics'] },
          { id:'leading-lines', name:'Leading Lines', icon:'lines',
            desc:'Pull the viewer through the frame.', xp:75, lessons:3, requires:['thirds'] },
          { id:'framing', name:'Framing & Layers', icon:'layers',
            desc:'Foreground, middle, background: real depth.', xp:100, lessons:3, requires:['thirds'] },
          { id:'seeing-light', name:'Seeing Light', icon:'sun',
            desc:'Direction, quality, and golden shadows.', xp:100, lessons:4, requires:['thirds'] },
          { id:'neg-space', name:'Negative Space', icon:'square',
            desc:'Less subject, more story.', xp:100, lessons:3, requires:['framing'] },
        ]
      },
      {
        id: 'color', name: 'Color', color: '#ff5d8f',
        tagline: 'White balance to color harmony — make color intentional.',
        banner: 'banners/color.gif',
        skills: [
          { id:'white-balance', name:'White Balance', icon:'drop',
            desc:'Kill the orange cast for good.', xp:100, lessons:3, requires:['exposure-triangle'] },
          { id:'color-temp', name:'Color Temperature', icon:'thermo',
            desc:'Kelvin intuition, from candlelight to open shade.', xp:75, lessons:3, requires:['white-balance'] },
          { id:'color-harmony', name:'Color Harmony', icon:'palette',
            desc:'Complementary palettes that make images pop.', xp:100, lessons:4, requires:['white-balance','thirds'] },
        ]
      },
      {
        id: 'field', name: 'Field Mastery', color: '#00e5a0',
        tagline: 'Real-world genres. This is where it all comes together.',
        banner: 'banners/field-mastery.gif',
        skills: [
          { id:'golden-hour', name:'Golden Hour', icon:'sunset',
            desc:'Plan it, expose it, nail it.', xp:125, lessons:4, requires:['manual-mode','seeing-light'] },
          { id:'portraits', name:'Portraits', icon:'user',
            desc:'Flattering light and razor-thin focus on people.', xp:125, lessons:4, requires:['aperture','framing'] },
          { id:'long-exposure', name:'Long Exposure', icon:'waves',
            desc:'Silky water, light trails, ND filters.', xp:150, lessons:4, requires:['manual-mode'] },
          { id:'night', name:'Night Photography', icon:'moon',
            desc:'Stars, streets, and high-ISO confidence.', xp:150, lessons:4, requires:['manual-mode','iso'] },
          { id:'street', name:'Street Photography', icon:'eye',
            desc:'Decisive moments and zone focus.', xp:125, lessons:4, requires:['shutter','framing'] },
          { id:'editing', name:'Edit Like a Decoder', icon:'wand',
            desc:'From RAW to ready: the finishing 10%.', xp:125, lessons:4, requires:['white-balance','color-temp'] },
        ]
      },
    ]
  }
  /* Future tracks plug in here, e.g.:
  'real-estate-photo': { id:'real-estate-photo', name:'Real Estate', audience:'Photographers', icon:'home', branches:[...] },
  'sports-video':      { id:'sports-video',      name:'Sports',       audience:'Videographers', icon:'zap',  branches:[...] },
  */
};
const TREE_ORDER = ['photo-foundations'];
const COMING_SOON = [
  { name: 'Real Estate', note: 'Photo + Video' },
  { name: 'Studio',      note: 'Photo + Video' },
  { name: 'Sports',      note: 'Photo + Video' },
];

/* ---------- icons (inline SVG, no assets) ---------- */
function svg(inner){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+inner+'</svg>'; }
const ICONS = {
  camera: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2.5h5L16 7"/>'),
  triangle: svg('<path d="M12 4 3 20h18L12 4z"/><path d="M12 10v4"/>'),
  gauge: svg('<path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14l4-4"/>'),
  crosshair: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
  aperture: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v9l7.8-4.5M21 12h-9l7.8 4.5M12 21v-9l-7.8 4.5M3 12h9l-7.8-4.5"/>'),
  timer: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>'),
  signal: svg('<path d="M4 20v-4M9 20v-8M14 20V8M19 20V4"/>'),
  sliders: svg('<path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>'),
  dial: svg('<circle cx="12" cy="12" r="9"/><path d="M12 12l4-4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  grid: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
  lines: svg('<path d="M4 20 20 4"/><path d="M4 16 16 4M4 12 12 4"/>'),
  layers: svg('<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  square: svg('<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M3 3h18v18H3z" stroke-dasharray="3 3"/>'),
  drop: svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  thermo: svg('<path d="M10 4a2 2 0 0 1 4 0v9.3a4 4 0 1 1-4 0V4z"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/>'),
  palette: svg('<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="14" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="14" r="1.2" fill="currentColor"/>'),
  sunset: svg('<path d="M4 18h16"/><circle cx="12" cy="14" r="4"/><path d="M12 6v2M5.6 8.6l1.4 1.4M18.4 8.6 17 10M2 22h20"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>'),
  waves: svg('<path d="M2 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M2 14c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
  eye: svg('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>'),
  wand: svg('<path d="M6 21 21 6l-3-3L3 18l3 3z"/><path d="M14 5l1-2M18 7l2-1M16 3l.5-1.5"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  crown: svg('<path d="M3 8l4 4 5-6 5 6 4-4-1.5 10h-15L3 8z" fill="currentColor" stroke="none"/>'),
  zap: svg('<path d="M13 2 5 14h7l-1 8 8-12h-7l1-8z"/>'),
  unlock: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>'),
};

/* ---------- progression math (pure; progress = { [skillId]: { xp } }) ---------- */
function levelFor(xp){ let lvl = 0; for (const t of LEVELS) if (xp >= t.xp) lvl = t.level; return lvl; }
function nextThreshold(xp){ for (const t of LEVELS) if (xp < t.xp) return t; return null; }
function xpOf(progress, skillId){ return (progress[skillId] && progress[skillId].xp) || 0; }

function deriveState(skill, progress){
  const xp = xpOf(progress, skill.id);
  const lvl = levelFor(xp);
  if (lvl >= 5) return { state:'mastered', xp, lvl };
  const locked = skill.requires.some(id => levelFor(xpOf(progress, id)) < UNLOCK_AT);
  if (locked) return { state:'locked', xp, lvl };
  if (xp > 0) return { state:'in-progress', xp, lvl };
  return { state:'available', xp, lvl };
}

/* Flatten one tree into { id: skill-with-branch } for lookups. */
function indexTree(tree){
  const map = {};
  tree.branches.forEach(b => b.skills.forEach(s => { map[s.id] = { ...s, branch: b }; }));
  return map;
}