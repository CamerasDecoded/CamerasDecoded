/* ==========================================================================
   cd-looks.js — Cameras Decoded "Looks" engine
   One-tap film/camera looks (Film 35, Direct Flash, Golden Hour, Halation,
   Noir). Ported from the owner-judged looks-demo prototype (2026-10-16):
   every recipe, constant and pass is the approved v2 retune, byte-for-byte
   in behavior. Grading = 33^3 3D LUT built from the recipe math + spatial
   passes (exposure, vignette, filmic soft shoulder, halation, grain).

   Public API (window.CDLooks):
     CDLooks.IDS            — ['original','film35','flash','golden','halation','noir']
     CDLooks.meta(id)       — { name, desc }  (desc = the one-line "what this does")
     CDLooks.grade(img, id) — NEW ImageData: img (ImageData) fully graded at 100%
                              (img itself is never mutated)
     CDLooks.blend(a, b, t) — NEW ImageData: a*(1-t) + b*t
   No DOM dependencies except document.createElement('canvas') for the
   halation bloom (override via CDLooks.canvasFactory for tests).
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- math helpers ---------- */
  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  /* gentle S-curve around 0.5; amt 0..1 */
  function sCurve(v, amt) { const d = v - 0.5; return v + amt * d * (1 - Math.pow(2 * Math.abs(d), 2)) * 0.5; }
  /* temperature: k>0 warms (R up, B down) */
  function temp(c, k) { return [c[0] * (1 + 0.30 * k), c[1], c[2] * (1 - 0.26 * k)]; }
  /* saturation around luma */
  function sat(c, s) { const l = lum(c[0], c[1], c[2]); return [l + (c[0] - l) * s, l + (c[1] - l) * s, l + (c[2] - l) * s]; }

  /* ---------- 3D LUT ---------- */
  const LUT_N = 33;
  function buildLUT(gradeFn) {
    const n = LUT_N, cube = new Float32Array(n * n * n * 3);
    let p = 0;
    for (let b = 0; b < n; b++) for (let g = 0; g < n; g++) for (let r = 0; r < n; r++) {
      const o = gradeFn(r / (n - 1), g / (n - 1), b / (n - 1));
      cube[p++] = clamp(o[0], 0, 1); cube[p++] = clamp(o[1], 0, 1); cube[p++] = clamp(o[2], 0, 1);
    }
    return cube;
  }
  function applyLUT(cube, src, dst, w, h) {
    const n = LUT_N, n1 = n - 1, plane = n * n, d = src.data, o = dst.data;
    for (let i = 0; i < w * h; i++) {
      const r = clamp(d[i * 4] / 255, 0, 1), g = clamp(d[i * 4 + 1] / 255, 0, 1), b = clamp(d[i * 4 + 2] / 255, 0, 1);
      const x = r * n1, y = g * n1, z = b * n1;
      const x0 = Math.min(x | 0, n - 2), y0 = Math.min(y | 0, n - 2), z0 = Math.min(z | 0, n - 2);
      const fx = x - x0, fy = y - y0, fz = z - z0;
      const c000 = (z0 * plane + y0 * n + x0) * 3, c100 = c000 + 3, c010 = c000 + n * 3, c110 = c010 + 3;
      const c001 = c000 + plane * 3, c101 = c001 + 3, c011 = c001 + n * 3, c111 = c011 + 3;
      const w000 = (1 - fx) * (1 - fy) * (1 - fz), w100 = fx * (1 - fy) * (1 - fz),
            w010 = (1 - fx) * fy * (1 - fz),      w110 = fx * fy * (1 - fz),
            w001 = (1 - fx) * (1 - fy) * fz,      w101 = fx * (1 - fy) * fz,
            w011 = (1 - fx) * fy * fz,            w111 = fx * fy * fz;
      o[i * 4]     = (cube[c000] * w000 + cube[c100] * w100 + cube[c010] * w010 + cube[c110] * w110 +
                      cube[c001] * w001 + cube[c101] * w101 + cube[c011] * w011 + cube[c111] * w111) * 255;
      o[i * 4 + 1] = (cube[c000 + 1] * w000 + cube[c100 + 1] * w100 + cube[c010 + 1] * w010 + cube[c110 + 1] * w110 +
                      cube[c001 + 1] * w001 + cube[c101 + 1] * w101 + cube[c011 + 1] * w011 + cube[c111 + 1] * w111) * 255;
      o[i * 4 + 2] = (cube[c000 + 2] * w000 + cube[c100 + 2] * w100 + cube[c010 + 2] * w010 + cube[c110 + 2] * w110 +
                      cube[c001 + 2] * w001 + cube[c101 + 2] * w101 + cube[c011 + 2] * w011 + cube[c111 + 2] * w111) * 255;
      o[i * 4 + 3] = 255;
    }
  }

  /* ---------- effect layers ---------- */
  function addGrain(img, w, h, amp, seed) {
    const rnd = mulberry32(seed), d = img.data;
    for (let i = 0; i < w * h; i++) {
      const l = lum(d[i * 4] / 255, d[i * 4 + 1] / 255, d[i * 4 + 2] / 255);
      const n = (rnd() * 2 - 1) * amp * 255 * (1 - 0.65 * l); /* luma-weighted: denser in shadows */
      d[i * 4] += n; d[i * 4 + 1] += n; d[i * 4 + 2] += n;
    }
  }
  function addVignette(img, w, h, amt) {
    const d = img.data;
    for (let i = 0; i < w * h; i++) {
      const x = i % w, y = (i / w) | 0, nx = x / w - 0.5, ny = y / h - 0.5, r2 = (nx * nx + ny * ny) * 2;
      const v = 1 - amt * sstep(0.35, 1.0, r2), o = i * 4;
      d[o] *= v; d[o + 1] *= v; d[o + 2] *= v;
    }
  }
  function addExposure(img, w, h, stopsCenter, stopsEdge) {
    const d = img.data;
    for (let i = 0; i < w * h; i++) {
      const x = i % w, y = (i / w) | 0, nx = x / w - 0.5, ny = y / h - 0.5;
      const r = Math.sqrt((nx * nx + ny * ny) * 2);
      const stops = stopsCenter + (stopsEdge - stopsCenter) * sstep(0.0, 1.0, r);
      const g = Math.pow(2, stops), o = i * 4;
      d[o] *= g; d[o + 1] *= g; d[o + 2] *= g;
    }
  }
  /* filmic rolloff: no hard 255 clip on skin highlights */
  function softShoulder(img, w, h) {
    const d = img.data, n = w * h * 4;
    for (let i = 0; i < n; i += 4) for (let c = 0; c < 3; c++) {
      let v = d[i + c] / 255;
      if (v > 0.85) v = 0.85 + (v - 0.85) / (1 + 3 * (v - 0.85));
      d[i + c] = v * 255;
    }
  }
  function boxBlur(img, w, h, radius) {
    const src = new Float32Array(img.data), dst = new Float32Array(img.data.length);
    const d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, cnt = 0;
      for (let k = -radius; k <= radius; k++) { const xx = clamp(x + k, 0, w - 1), o = (y * w + xx) * 4; r += src[o]; g += src[o + 1]; b += src[o + 2]; cnt++; }
      const o = (y * w + x) * 4; dst[o] = r / cnt; dst[o + 1] = g / cnt; dst[o + 2] = b / cnt; dst[o + 3] = 255;
    }
    const out = new Float32Array(img.data.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, cnt = 0;
      for (let k = -radius; k <= radius; k++) { const yy = clamp(y + k, 0, h - 1), o = (yy * w + x) * 4; r += dst[o]; g += dst[o + 1]; b += dst[o + 2]; cnt++; }
      const o = (y * w + x) * 4; out[o] = r / cnt; out[o + 1] = g / cnt; out[o + 2] = b / cnt; out[o + 3] = 255;
    }
    for (let i = 0; i < out.length; i++) d[i] = out[i];
  }

  let canvasFactory = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };

  /* Halation: highlight extract (soft-knee luma threshold) at half res -> blur
     -> red-orange tint. Returns {img (ImageData, tinted), w, h}. */
  function makeHalation(srcImg, w, h, threshold, knee, blurR, tint) {
    const sd = srcImg.data;
    const hw = Math.ceil(w / 2), hh = Math.ceil(h / 2);
    const small = canvasFactory(hw, hh);
    const sctx = small.getContext('2d');
    const ex = sctx.createImageData(hw, hh), ed = ex.data;
    for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) {
      const sx = Math.min(w - 1, (x * 2) | 0), sy = Math.min(h - 1, (y * 2) | 0), si = (sy * w + sx) * 4;
      const l = lum(sd[si] / 255, sd[si + 1] / 255, sd[si + 2] / 255);
      const m = sstep(threshold, threshold + knee, l);
      const o = (y * hw + x) * 4;
      ed[o] = sd[si] * m; ed[o + 1] = sd[si + 1] * m; ed[o + 2] = sd[si + 2] * m; ed[o + 3] = 255 * m;
    }
    sctx.putImageData(ex, 0, 0);
    const blurred = sctx.getImageData(0, 0, hw, hh);
    boxBlur(blurred, hw, hh, blurR);
    const td = blurred.data;
    for (let i = 0; i < hw * hh; i++) {
      const o = i * 4, l = (td[o] + td[o + 1] + td[o + 2]) / (3 * 255);
      td[o] = tint[0] * l * 255; td[o + 1] = tint[1] * l * 255; td[o + 2] = tint[2] * l * 255; td[o + 3] = 255;
    }
    return { img: blurred, w: hw, h: hh };
  }
  /* Screen-blend the bloom over img (bilinear upsample, per-pixel alpha). */
  function screenBloom(img, w, h, bloom, bw, bh, alpha) {
    const d = img.data, bd = bloom.data;
    for (let y = 0; y < h; y++) {
      const by = y * (bh - 1) / Math.max(h - 1, 1);
      const y0 = Math.min(by | 0, bh - 1), y1 = Math.min(y0 + 1, bh - 1), fy = by - y0;
      for (let x = 0; x < w; x++) {
        const bx = x * (bw - 1) / Math.max(w - 1, 1);
        const x0 = Math.min(bx | 0, bw - 1), x1 = Math.min(x0 + 1, bw - 1), fx = bx - x0;
        const o = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const s00 = bd[(y0 * bw + x0) * 4 + c], s10 = bd[(y0 * bw + x1) * 4 + c],
                s01 = bd[(y1 * bw + x0) * 4 + c], s11 = bd[(y1 * bw + x1) * 4 + c];
          const bval = (s00 * (1 - fx) + s10 * fx) * (1 - fy) + (s01 * (1 - fx) + s11 * fx) * fy;
          const sn = d[o + c] / 255, bn = bval / 255;
          const scr = 255 * (1 - (1 - sn) * (1 - bn));
          d[o + c] = d[o + c] + (scr - d[o + c]) * alpha;
        }
      }
    }
  }
  function halationPass(img, w, h, k, threshold, knee, blurR, tint, alpha) {
    const bloom = makeHalation(img, w, h, threshold, knee, Math.max(3, Math.round(blurR * k)), tint);
    screenBloom(img, w, h, bloom.img, bloom.w, bloom.h, alpha);
  }
  function warmRolloff(img, w, h, amt) {
    const d = img.data;
    for (let i = 0; i < w * h; i++) {
      const o = i * 4, l = lum(d[o] / 255, d[o + 1] / 255, d[o + 2] / 255), t = sstep(0.8, 1.0, l) * amt;
      if (t > 0) { d[o] += (255 - d[o]) * t * 0.10; d[o + 1] += (238 - d[o + 1]) * t * 0.05; d[o + 2] *= (1 - t * 0.10); }
    }
  }

  /* ---------- look recipes (v2 retune — the approved values) ---------- */
  const LOOKS = [
    { id: 'original', name: 'Original',
      desc: 'Untouched — your edit exactly as it is.',
      lut: null, post: null },
    { id: 'film35', name: 'Film 35',
      desc: 'Classic 35mm color film — faded blacks, warm highlights, cool shadows.',
      lut: buildLUT((r, g, b) => {
        r = r * 0.93 + 0.058; g = g * 0.93 + 0.058; b = b * 0.93 + 0.062;      /* faded black point */
        r = sCurve(r, 0.30); g = sCurve(g, 0.30); b = sCurve(b, 0.30);         /* stronger S */
        let c = temp([r, g, b], 0.10);                                         /* warmer */
        let l = lum(c[0], c[1], c[2]);
        c = [l + (c[0] - l) * 0.85, l + (c[1] - l) * 0.85, l + (c[2] - l) * 0.85]; /* more muted */
        c[1] = c[1] * 0.94 + l * 0.06;                                         /* tame greens harder */
        l = lum(c[0], c[1], c[2]);
        const shW = Math.pow(1 - l, 2), hiW = Math.pow(l, 2.2);                 /* split tone */
        c[0] += hiW * 0.065 - shW * 0.018; c[1] += hiW * 0.022 - shW * 0.006; c[2] += shW * 0.052 - hiW * 0.045;
        return c; }),
      post: (img, w, h) => addGrain(img, w, h, 0.050, 11) },
    { id: 'flash', name: 'Direct Flash',
      desc: 'Compact-camera flash — hot center pop, cooler contrast, vignette.',
      lut: buildLUT((r, g, b) => {
        r = sCurve(r, 0.56); g = sCurve(g, 0.56); b = sCurve(b, 0.56);          /* harder contrast */
        let c = temp([r, g, b], -0.09);                                        /* cooler */
        return sat(c, 0.78); }),
      post: (img, w, h) => {
        addExposure(img, w, h, 0.40, -0.17);   /* stronger center pop, deeper edge falloff */
        softShoulder(img, w, h);               /* skin highlights: no hard 255 clip */
        addVignette(img, w, h, 0.28);
        addGrain(img, w, h, 0.044, 22); } },
    { id: 'golden', name: 'Golden Hour',
      desc: 'Low warm sun — golden lift in the shadows, light that glows.',
      lut: buildLUT((r, g, b) => {
        r = sCurve(r, 0.20); g = sCurve(g, 0.20); b = sCurve(b, 0.20);
        let c = temp([r, g, b], 0.32);                                         /* stronger warm WB shift */
        c = sat(c, 1.13);
        const l = lum(c[0], c[1], c[2]), shW = Math.pow(1 - l, 2);              /* warm lifted shadows */
        c[0] += shW * 0.120; c[1] += shW * 0.046; c[2] -= shW * 0.028;
        return c; }),
      post: (img, w, h, k) => {
        warmRolloff(img, w, h, 1.4);
        halationPass(img, w, h, k, 0.60, 0.14, 14, [1.0, 0.40, 0.16], 0.68);
        addGrain(img, w, h, 0.038, 33);
        softShoulder(img, w, h); } },          /* guard: no hard 255 clip on skin at 100 */
    { id: 'halation', name: 'Halation',
      desc: 'Dreamy diffusion — bright areas bloom with a warm fringe.',
      lut: buildLUT((r, g, b) => {
        r = sCurve(r, 0.18); g = sCurve(g, 0.18); b = sCurve(b, 0.18);
        return sat(temp([r, g, b], 0.07), 1.04); }),
      post: (img, w, h, k) => {
        halationPass(img, w, h, k, 0.56, 0.13, 16, [1.0, 0.36, 0.13], 0.95);
        addGrain(img, w, h, 0.030, 44); } },
    { id: 'noir', name: 'Noir',
      desc: 'True black and white — deep blacks, stark light, film grain.',
      lut: buildLUT((r, g, b) => {
        const l = 0.30 * r + 0.59 * g + 0.11 * b;                               /* luminance B&W */
        let v = sCurve(l, 0.66);
        v = 0.015 + v * 0.975;                                                 /* deep blacks, full whites */
        return [v, v, v]; }),
      post: (img, w, h) => addGrain(img, w, h, 0.070, 55) },
  ];

  const IDS = LOOKS.map(l => l.id);

  /* Blur scale follows working size (prototype: k=1 at 854px long edge, 0.18 at thumbs). */
  function blurScale(w, h) { return clamp(Math.min(w, h) / 854, 0.15, 1.5); }

  /* ============ skin stage: frequency separation, chromaticity mask ==========
     Professional retouch math — no ML, no face warping, no diffusion. The
     frame is split into a low-frequency color layer (computed at reduced
     resolution, the standard fast path) and a full-resolution high-frequency
     texture residual. ONLY the low layer is evened (edge-aware bilateral, so
     jaw/hair boundaries hold), and only inside a soft-feathered,
     slightly-eroded skin-chromaticity mask. Pores and texture survive intact.
     skinSeparation(img) -> sep (cached per edit); retouch(img, sep, t) ->
     NEW ImageData. Input images are never mutated. */
  const SKIN_S = 256;   /* separation working size, long edge */

  function f32rgb(img) {
    const d = img.data, n = img.width * img.height, out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { out[i * 3] = d[i * 4] / 255; out[i * 3 + 1] = d[i * 4 + 1] / 255; out[i * 3 + 2] = d[i * 4 + 2] / 255; }
    return out;
  }
  /* separable box blur on interleaved-float RGB */
  function boxBlurF(px, w, h, radius, passes) {
    let src = px, dst = new Float32Array(px.length);
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, cnt = 0;
        for (let k = -radius; k <= radius; k++) { const xx = clamp(x + k, 0, w - 1), o = (y * w + xx) * 3; r += src[o]; g += src[o + 1]; b += src[o + 2]; cnt++; }
        const o = (y * w + x) * 3; dst[o] = r / cnt; dst[o + 1] = g / cnt; dst[o + 2] = b / cnt;
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, cnt = 0;
        for (let k = -radius; k <= radius; k++) { const yy = clamp(y + k, 0, h - 1), o = (yy * w + x) * 3; r += dst[o]; g += dst[o + 1]; b += dst[o + 2]; cnt++; }
        const o = (y * w + x) * 3; src[o] = r / cnt; src[o + 1] = g / cnt; src[o + 2] = b / cnt;
      }
    }
    return src;
  }
  /* edge-aware smoothing of the color layer: evens tone, keeps boundaries */
  function bilateralF(px, w, h, radius, sigS, sigR) {
    const src = px, out = new Float32Array(px.length);
    const s2 = 2 * sigS * sigS, r2 = 2 * sigR * sigR;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o0 = (y * w + x) * 3, cr = src[o0], cg = src[o0 + 1], cb = src[o0 + 2];
      let wr = 0, wg = 0, wb = 0, ws = 0;
      for (let dy = -radius; dy <= radius; dy++) { const yy = clamp(y + dy, 0, h - 1);
        for (let dx = -radius; dx <= radius; dx++) { const xx = clamp(x + dx, 0, w - 1);
          const o = (yy * w + xx) * 3;
          const dr = src[o] - cr, dg = src[o + 1] - cg, db = src[o + 2] - cb;
          const wgt = Math.exp(-(dx * dx + dy * dy) / s2 - (dr * dr + dg * dg + db * db) / r2);
          wr += src[o] * wgt; wg += src[o + 1] * wgt; wb += src[o + 2] * wgt; ws += wgt;
        }
      }
      out[o0] = wr / ws; out[o0 + 1] = wg / ws; out[o0 + 2] = wb / ws;
    }
    return out;
  }
  /* Skin chromaticity: widened YCbCr ellipse (tone-inclusive), soft edges,
     with soft luminance + chroma sanity guards. */
  const SK_CX = 109.38, SK_CY = 152.02, SK_TH = 2.53, SK_A = 25.39 * 1.35, SK_B = 14.03 * 1.35;
  function skinMaskF(px, w, h) {
    const m = new Float32Array(w * h);
    const ct = Math.cos(SK_TH), st = Math.sin(SK_TH);
    for (let i = 0; i < w * h; i++) {
      const r = px[i * 3] * 255, g = px[i * 3 + 1] * 255, b = px[i * 3 + 2] * 255;
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const dx = Cb - SK_CX, dy = Cr - SK_CY;
      const ex = (ct * dx + st * dy) / SK_A, ey = (-st * dx + ct * dy) / SK_B;
      const d = ex * ex + ey * ey;
      let s = 1 - sstep(0.55, 1.0, d);
      s *= sstep(14, 26, Y) * (1 - sstep(232, 246, Y));
      const chroma = Math.abs(Cb - 128) + Math.abs(Cr - 128);
      s *= sstep(6, 14, chroma);
      m[i] = s;
    }
    return m;
  }
  /* slight erosion (min filter) keeps the mask off hair/jaw boundaries */
  function minFilter1(m, w, h) {
    const out = new Float32Array(m.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let mn = 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const v = m[clamp(y + dy, 0, h - 1) * w + clamp(x + dx, 0, w - 1)];
        if (v < mn) mn = v;
      }
      out[y * w + x] = mn;
    }
    return out;
  }
  function blur1(m, w, h, radius) {
    let src = m, dst = new Float32Array(m.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, cnt = 0;
      for (let k = -radius; k <= radius; k++) { s += src[y * w + clamp(x + k, 0, w - 1)]; cnt++; }
      dst[y * w + x] = s / cnt;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, cnt = 0;
      for (let k = -radius; k <= radius; k++) { s += dst[clamp(y + k, 0, h - 1) * w + x]; cnt++; }
      src[y * w + x] = s / cnt;
    }
    return src;
  }
  function sampleC(p, sw, sh, ch, x, y) {
    const fx = clamp(x, 0, sw - 1.001), fy = clamp(y, 0, sh - 1.001);
    const x0 = Math.min(fx | 0, sw - 2), y0 = Math.min(fy | 0, sh - 2);
    const tx = fx - x0, ty = fy - y0;
    const i00 = (y0 * sw + x0) * 3 + ch, i10 = i00 + 3, i01 = i00 + sw * 3, i11 = i01 + 3;
    return (p[i00] * (1 - tx) + p[i10] * tx) * (1 - ty) + (p[i01] * (1 - tx) + p[i11] * tx) * ty;
  }
  function sample1(p, sw, sh, x, y) {
    const fx = clamp(x, 0, sw - 1.001), fy = clamp(y, 0, sh - 1.001);
    const x0 = Math.min(fx | 0, sw - 2), y0 = Math.min(fy | 0, sh - 2);
    const tx = fx - x0, ty = fy - y0;
    const i00 = y0 * sw + x0, i10 = i00 + 1, i01 = i00 + sw, i11 = i01 + 1;
    return (p[i00] * (1 - tx) + p[i10] * tx) * (1 - ty) + (p[i01] * (1 - tx) + p[i11] * tx) * ty;
  }

  window.CDLooks = {
    IDS: IDS,
    meta: function (id) {
      const l = LOOKS.find(x => x.id === id);
      return l ? { name: l.name, desc: l.desc } : null;
    },
    canvasFactory: function (fn) { if (fn) canvasFactory = fn; },
    /* Grade: returns a NEW ImageData at 100% strength; input untouched. */
    grade: function (img, id) {
      const L = LOOKS.find(x => x.id === id);
      if (!L) throw new Error('CDLooks: unknown look ' + id);
      const w = img.width, h = img.height;
      const out = new ImageData(new Uint8ClampedArray(img.data), w, h);
      if (L.lut) applyLUT(L.lut, out, out, w, h);
      if (L.post) L.post(out, w, h, blurScale(w, h));
      return out;
    },
    /* Blend two frames: NEW ImageData = a*(1-t) + b*t. */
    blend: function (a, b, t) {
      const w = a.width, h = a.height;
      const out = new ImageData(w, h), od = out.data, ad = a.data, bd = b.data;
      for (let i = 0; i < od.length; i += 4) {
        od[i]     = ad[i]     + (bd[i]     - ad[i])     * t;
        od[i + 1] = ad[i + 1] + (bd[i + 1] - ad[i + 1]) * t;
        od[i + 2] = ad[i + 2] + (bd[i + 2] - ad[i + 2]) * t;
        od[i + 3] = 255;
      }
      return out;
    },
    /* Skin separation: split img into low (color) / smooth (evened color) /
       mask (feathered skin) at reduced res. Cache per edit; recompute only
       when the base frame changes. */
    skinSeparation: function (img) {
      const W = img.width, H = img.height;
      const k = SKIN_S / Math.max(W, H);
      const sw = Math.max(8, Math.round(W * k)), sh = Math.max(8, Math.round(H * k));
      const full = canvasFactory(W, H);
      full.getContext('2d').putImageData(img, 0, 0);
      const sc = canvasFactory(sw, sh), sx = sc.getContext('2d');
      sx.drawImage(full, 0, 0, sw, sh);
      const f = f32rgb(sx.getImageData(0, 0, sw, sh));
      const low = boxBlurF(f, sw, sh, 3, 2);            /* color layer */
      const smooth = bilateralF(low, sw, sh, 5, 4.0, 0.09); /* evened color, edges kept */
      let mask = skinMaskF(f, sw, sh);
      mask = blur1(minFilter1(mask, sw, sh), sw, sh, 2); /* erode off boundaries, feather */
      return { fw: W, fh: H, sw: sw, sh: sh, low: low, smooth: smooth, mask: mask };
    },
    /* Retouch: NEW ImageData = img + mask*t*(smooth - low). Texture is the
       untouched residual — pores survive by construction. t = 0..1. */
    retouch: function (img, sep, t) {
      const W = img.width, H = img.height;
      const sw = sep.sw, sh = sep.sh, low = sep.low, smooth = sep.smooth, mask = sep.mask;
      const out = new ImageData(W, H), od = out.data, bd = img.data;
      const sx = (sw - 1) / Math.max(W - 1, 1), sy = (sh - 1) / Math.max(H - 1, 1);
      for (let y = 0; y < H; y++) {
        const py = y * sy;
        for (let x = 0; x < W; x++) {
          const px = x * sx;
          const m = sample1(mask, sw, sh, px, py) * t;
          const o = (y * W + x) * 4;
          if (m <= 0.003) {
            od[o] = bd[o]; od[o + 1] = bd[o + 1]; od[o + 2] = bd[o + 2]; od[o + 3] = 255;
            continue;
          }
          for (let c = 0; c < 3; c++) {
            const l = sampleC(low, sw, sh, c, px, py), s = sampleC(smooth, sw, sh, c, px, py);
            od[o + c] = clamp(Math.round(bd[o + c] + m * (s - l) * 255), 0, 255);
          }
          od[o + 3] = 255;
        }
      }
      return out;
    },
  };
})();
