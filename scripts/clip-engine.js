/* ================================================================
   clip-engine.js — Clip Lab on-device finishing engine (fast path).
   ?v=20261015f

   Decode with WebCodecs (hardware), composite on a 2D canvas
   (WebGPU is headroom for v2 filters — v1 composites in 2D, which
   keeps frames in GPU-backed canvas surfaces and is the standard
   v1 shape), hardware H.264 encode, AAC packet-copy audio (decode->re-encode
   fallback when the muxer rejects the source frames), and
   mux to MP4 with mediabunny (EncodedVideo/AudioPacketSource —
   it writes correct avcC/esds descriptors from the encoder output,
   which mp4box.js's generator API cannot do from byte arrays).

   Demux (track discovery + sample extraction) is mp4box.js,
   vendored locally as scripts/mp4box.js.
   ================================================================ */
(function () {
  'use strict';

  var MB = null; /* mediabunny namespace, set via setMuxer() */

  function setMuxer(mb) { MB = mb; }

  function testCap() {
    try {
      var m = /[?&]testcap=(\d+)/.exec(window.location.search || '');
      return m ? parseInt(m[1], 10) : 0;
    } catch (e) { return 0; }
  }

  /* ---------- capability gate ---------- */

  async function checkSupport() {
    var out = { decoder: false, encoder: false, h264Decode: false, h264Encode: false, ok: false };
    try {
      out.decoder = typeof VideoDecoder !== 'undefined';
      out.encoder = typeof VideoEncoder !== 'undefined';
      if (out.decoder) {
        var d = await VideoDecoder.isConfigSupported({ codec: 'avc1.640028', codedWidth: 1280, codedHeight: 720 });
        out.h264Decode = !!(d && d.supported);
      }
      if (out.encoder) {
        var e = await VideoEncoder.isConfigSupported({ codec: 'avc1.640028', width: 1280, height: 720, bitrate: 2000000, framerate: 30 });
        out.h264Encode = !!(e && e.supported);
      }
    } catch (err) { /* unsupported shape */ }
    out.ok = out.h264Decode && out.h264Encode;
    return out;
  }

  /* ---------- demux (mp4box) ---------- */

  function readAvcC(entry) {
    var box = entry && entry.avcC;
    if (!box || !box.SPS || !box.SPS.length || !box.PPS || !box.PPS.length) return null;
    var out = [];
    var sps = box.SPS[0].nalu;
    out.push(1, sps[1], sps[2], sps[3], 0xFF, 0xE0 | (box.SPS.length & 31));
    box.SPS.forEach(function (s) {
      var n = s.nalu;
      out.push((n.length >> 8) & 255, n.length & 255);
      for (var i = 0; i < n.length; i++) out.push(n[i]);
    });
    out.push(box.PPS.length & 255);
    box.PPS.forEach(function (s) {
      var n = s.nalu;
      out.push((n.length >> 8) & 255, n.length & 255);
      for (var i = 0; i < n.length; i++) out.push(n[i]);
    });
    return new Uint8Array(out);
  }

  /* Serialize an HEVC hvcC box into a WebCodecs decoder description
     (HEVCDecoderConfigurationRecord, ISO 14496-15 8.3.3.1.2).
     Field names mirror this repo's vendored mp4box.js parse:
     nalu_arrays[i] is an Array of {data: Uint8Array} with named props
     completeness and nalu_type on the array itself. */
  function readHvcC(entry) {
    var box = entry && entry.hvcC;
    if (!box || !box.nalu_arrays || !box.nalu_arrays.length) return null;
    var out = [];
    function u8(x) { out.push(x & 255); }
    function u16(x) { out.push((x >> 8) & 255, x & 255); }
    function u32(x) { out.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255); }
    u8(box.configurationVersion || 1);
    u8(((box.general_profile_space || 0) << 6) | ((box.general_tier_flag || 0) << 5) | ((box.general_profile_idc || 0) & 31));
    u32(box.general_profile_compatibility || 0);
    var ci = box.general_constraint_indicator;
    for (var i = 0; i < 6; i++) u8(ci && ci.length === 6 ? ci[i] : 0);
    u8(box.general_level_idc || 0);
    var mss = box.min_spatial_segmentation_idc || 0;
    u8(0xF0 | ((mss >> 8) & 15)); u8(mss & 255);
    u8(0xFC | ((box.parallelismType || 0) & 3));
    u8(0xFC | ((box.chroma_format_idc || 1) & 3));
    u8(0xF8 | ((box.bit_depth_luma_minus8 || 0) & 7));
    u8(0xF8 | ((box.bit_depth_chroma_minus8 || 0) & 7));
    u16(box.avgFrameRate || 0);
    u8((((box.constantFrameRate || 0) & 3) << 6) | (((box.numTemporalLayers || 1) & 7) << 3) |
      (((box.temporalIdNested || 0) & 1) << 2) | ((box.lengthSizeMinusOne || 3) & 3));
    var arrays = box.nalu_arrays;
    u8(arrays.length);
    arrays.forEach(function (a) {
      var nalus = [];
      for (var j = 0; j < a.length; j++) {
        var d = (a[j] && a[j].data) ? a[j].data : a[j];
        if (d && d.length) nalus.push(d);
      }
      u8(((a.completeness ? 1 : 0) << 7) | ((a.nalu_type || 0) & 63));
      u16(nalus.length);
      nalus.forEach(function (n) {
        u16(n.length);
        for (var k = 0; k < n.length; k++) u8(n[k]);
      });
    });
    return new Uint8Array(out);
  }

  function ascBytes(sampleRate, channels) {
    var rates = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
    var idx = rates.indexOf(sampleRate);
    if (idx < 0) idx = 4;
    return new Uint8Array([0x10 | (idx >> 1), ((idx & 1) << 7) | ((channels & 15) << 3)]);
  }

  function findTrak(mp4file, trackId) {
    var traks = (mp4file.moov && mp4file.moov.traks) || [];
    for (var i = 0; i < traks.length; i++) {
      if (traks[i].tkhd && traks[i].tkhd.track_id === trackId) return traks[i];
    }
    return null;
  }

  /* Display-rotation from the video track's tkhd matrix (16.16 fixed point,
     raw int32 as parsed by this repo's vendored mp4box.js). iPhone .mov
     files store coded pixels landscape and rotate via the matrix; the
     decoder hands back the coded frames, so the exporter must rotate.
     Returns { rotation: 0|90|180|270, displayWidth, displayHeight } where
     the display dims are the coded dims swapped for 90/270. tkhd's own
     width/height are NOT trusted as display dims (ffmpeg leaves them coded
     even on rotated files) — the matrix is the signal. */
  function readRotation(trak, cw, ch) {
    var rot = 0;
    try {
      var m = trak && trak.tkhd && trak.tkhd.matrix;
      if (m && m.length === 9) {
        var a = Math.round(m[0] / 65536), b = Math.round(m[1] / 65536),
            c = Math.round(m[3] / 65536), d = Math.round(m[4] / 65536);
        /* QuickTime rotation conventions; ffprobe prints "rotation=90" for the
           [0,-1,0; 1,0,0] matrix, so 90 labels that one. */
        if (a === 1 && b === 0 && c === 0 && d === 1) rot = 0;
        else if (a === 0 && b === -1 && c === 1 && d === 0) rot = 90;
        else if (a === -1 && b === 0 && c === 0 && d === -1) rot = 180;
        else if (a === 0 && b === 1 && c === -1 && d === 0) rot = 270;
      }
    } catch (e) { rot = 0; }
    var dw = cw, dh = ch;
    if (rot === 90 || rot === 270) { dw = ch; dh = cw; }
    return { rotation: rot, displayWidth: dw, displayHeight: dh };
  }

  function demuxFile(file) {
    return file.arrayBuffer().then(function (buf) {
      return new Promise(function (resolve, reject) {
        var mp4 = MP4Box.createFile();
        var vTrack = null, aTrack = null;
        var vSamples = [], aSamples = [];
        var done = false;

        mp4.onError = function (e) { if (!done) { done = true; reject(new Error('Could not read this clip (' + (e || 'parse error') + ').')); } };
        mp4.onReady = function (info) {
          try {
            var vts = info.videoTracks || [], ats = info.audioTracks || [];
            if (!vts.length) { done = true; reject(new Error('No video track found in this clip.')); return; }
            vTrack = vts[0];
            if (ats.length) aTrack = ats[0];
            mp4.setExtractionOptions(vTrack.id, null, {});
            if (aTrack) mp4.setExtractionOptions(aTrack.id, null, {});
            mp4.onSamples = function (id, user, samples) {
              if (id === vTrack.id) samples.forEach(function (s) { vSamples.push(s); });
              else if (aTrack && id === aTrack.id) samples.forEach(function (s) { aSamples.push(s); });
              var wantV = vTrack.nb_samples || 0, wantA = aTrack ? (aTrack.nb_samples || 0) : 0;
              if (vSamples.length >= wantV && aSamples.length >= wantA) {
                mp4.stop(); mp4.flush();
                if (!done) { done = true; resolve(buildInfo()); }
              }
            };
            mp4.start();
          } catch (err) { if (!done) { done = true; reject(err); } }
        };

        function buildInfo() {
          var trak = findTrak(mp4, vTrack.id);
          var entry = trak && trak.mdia && trak.mdia.minf.stbl.stsd.entries[0];
          /* decoder config: H.264 avcC or HEVC hvcC — one generalized config */
          var cfgBytes = readAvcC(entry || {}) || readHvcC(entry || {});
          var vt = vTrack.timescale || 90000;
          var cw = (entry && entry.width) || (vTrack.video && vTrack.video.width) || vTrack.track_width || 0;
          var ch = (entry && entry.height) || (vTrack.video && vTrack.video.height) || vTrack.track_height || 0;
          var disp = readRotation(trak, cw, ch);
          /* Whether the sample cts values look like real presentation times
             (non-negative, one distinct value per sample). A degenerate cts
             series (e.g. all-zeros) is rejected here; the feed path also
             falls back to dts per-sample for any sample whose own cts is
             missing. The decoder feed stamps DECODE (dts) times — see the
             feed-discipline note in exportClip's feedMore() for why. */
          var ctsSane = vSamples.length > 0;
          var seenCts = {};
          for (var ci = 0; ci < vSamples.length; ci++) {
            var cc = vSamples[ci].cts;
            if (!(cc >= 0) || seenCts[cc]) { ctsSane = false; break; }
            seenCts[cc] = 1;
          }
          var info = {
            duration: (vTrack.movie_duration || vTrack.duration || 0) / (info_timescale()),
            width: cw,
            height: ch,
            rotation: disp.rotation,
            displayWidth: disp.displayWidth,
            displayHeight: disp.displayHeight,
            fps: 30,
            videoCodec: vTrack.codec,
            videoTimescale: vt,
            configBytes: cfgBytes,
            ctsSane: ctsSane,
            samples: vSamples.map(function (s) {
              return { data: s.data, dts: s.dts, cts: s.cts, duration: s.duration, isSync: !!s.is_sync };
            }),
            audio: null
          };
          if (vTrack.nb_samples && info.duration > 0) {
            info.fps = Math.round((vTrack.nb_samples / info.duration) * 10) / 10 || 30;
          }
          if (aTrack) {
            var at = aTrack.timescale || 44100;
            /* real audio config: the mp4a sample entry's esds carries the file's
               own AudioSpecificConfig — far more reliable than synthesizing one */
            var realAsc = null;
            try {
              var aTrak = findTrak(mp4, aTrack.id);
              var aEntry = aTrak && aTrak.mdia && aTrak.mdia.minf.stbl.stsd.entries[0];
              var esd = aEntry && aEntry.esds && aEntry.esds.esd;
              var dcd = esd && esd.findDescriptor && esd.findDescriptor(4);
              var dsi = dcd && dcd.findDescriptor && dcd.findDescriptor(5);
              if (dsi && dsi.data && dsi.data.length) realAsc = new Uint8Array(dsi.data);
            } catch (e) { realAsc = null; }
            info.audio = {
              sampleRate: aTrack.audio ? (aTrack.audio.sample_rate || 44100) : 44100,
              channels: aTrack.audio ? (aTrack.audio.channel_count || 2) : 2,
              timescale: at,
              codec: aTrack.codec || 'mp4a.40.2',
              asc: realAsc,
              samples: aSamples.map(function (s) {
                return { data: s.data, dts: s.dts, duration: s.duration };
              })
            };
          }
          return info;

          function info_timescale() {
            try { return (mp4.moov.mvhd.timescale) || 1; } catch (e) { return 1; }
          }
        }

        buf.fileStart = 0;
        mp4.appendBuffer(buf);
        mp4.flush();
        setTimeout(function () {
          if (!done) { done = true; reject(new Error('Timed out reading this clip.')); }
        }, 20000);
      });
    });
  }

  /* ---------- composition ---------- */

  function targetDims(info, format) {
    var cap = testCap();
    if (format === 'vertical') {
      var s = cap || 1080;
      return { w: s, h: Math.round(s * 16 / 9 / 2) * 2 }; /* portrait 9:16, even dims for H.264 */
    }
    if (format === 'square') {
      var q = cap || 1080;
      return { w: q, h: q };
    }
    /* 'original' works in DISPLAY space (rotation-aware); coded dims stay
       the decoder's business only */
    var sw = info.displayWidth || info.width || 1280, sh = info.displayHeight || info.height || 720;
    var maxEdge = cap || 1920;
    var scale = Math.min(1, maxEdge / Math.max(sw, sh));
    return { w: Math.round(sw * scale / 2) * 2, h: Math.round(sh * scale / 2) * 2 };
  }

  function drawFrame(ctx, frame, dims, info, tRel, title, captions, capStyle) {
    var W = dims.w, H = dims.h;
    /* the decoded frame is in coded orientation; rotate it into the display
       orientation the <video> stage shows natively (canvas positive angle is
       clockwise, QuickTime rotations are counter-clockwise) */
    var rot = info.rotation || 0;
    var cw = frame.codedWidth, ch = frame.codedHeight;
    var vw = (rot === 90 || rot === 270) ? ch : cw;
    var vh = (rot === 90 || rot === 270) ? cw : ch;
    /* cover scale computed in DISPLAY space; inside the rotated context the
       bitmap must be drawn at its CODED dims scaled by that same scale —
       using the display-sized rect here crosses the axes and stretches
       every shape (corners stay correct, proportions do not) */
    var scale = Math.max(W / vw, H / vh);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    if (rot) ctx.rotate(-rot * Math.PI / 180);
    ctx.drawImage(frame, -cw * scale / 2, -ch * scale / 2, cw * scale, ch * scale);
    ctx.restore();
    /* title and captions are authored in display space already — untouched */

    if (title && tRel < 2.0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var fs = Math.round(W * 0.075);
      ctx.font = '700 ' + fs + 'px Montserrat, sans-serif';
      var lines = wrapText(ctx, title, W * 0.86);
      var lh = fs * 1.25;
      var y0 = H / 2 - (lines.length - 1) * lh / 2;
      lines.forEach(function (ln, i) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        var tw = ctx.measureText(ln).width;
        ctx.fillRect(W / 2 - tw / 2 - 14, y0 + i * lh - fs * 0.62, tw + 28, fs * 1.24);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ln, W / 2, y0 + i * lh);
      });
      ctx.restore();
    }

    var cap = null;
    for (var i = 0; i < captions.length; i++) {
      if (tRel >= captions[i].start && tRel < captions[i].end) { cap = captions[i]; break; }
    }
    if (cap) {
      var cstyle = capStyle || 'classic';
      if (cstyle === 'karaoke') drawCaptionKaraoke(ctx, cap, tRel, W, H);
      else if (cstyle === 'clean') drawCaptionClean(ctx, cap, W, H);
      else if (cstyle === 'block') drawCaptionBlock(ctx, cap, W, H);
      else drawCaptionClassic(ctx, cap, W, H);
    }
  }

  /* word timings for export burn-in; mirrors the page's wordSlots helper */
  function capWordSlots(cap) {
    if (cap.words && cap.words.length) return cap.words;
    var parts = String(cap.text || '').split(/\s+/).filter(Boolean);
    var n = parts.length;
    if (!n) return [];
    var dur = Math.max(0.05, cap.end - cap.start) / n;
    return parts.map(function (w, i) {
      return { text: w, start: cap.start + i * dur, end: cap.start + (i + 1) * dur };
    });
  }

  /* classic: the original pill, pixel-unchanged */
  function drawCaptionClassic(ctx, cap, W, H) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var cfs = Math.round(W * 0.052);
    ctx.font = '700 ' + cfs + 'px Montserrat, sans-serif';
    var clines = wrapText(ctx, cap.text, W * 0.9);
    var clh = cfs * 1.3;
    var blockH = clines.length * clh + cfs * 0.7;
    var by = H * 0.97 - blockH;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, by, W, blockH);
    ctx.fillStyle = '#ffffff';
    clines.forEach(function (ln, i2) { ctx.fillText(ln, W / 2, by + cfs * 0.35 + clh * (i2 + 0.5)); });
    ctx.restore();
  }

  /* karaoke: classic-style pill hugging the words, active word in brand green */
  function drawCaptionKaraoke(ctx, cap, tRel, W, H) {
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    var cfs = Math.round(W * 0.052);
    var words = capWordSlots(cap);
    function totalW() {
      var t = 0;
      words.forEach(function (w) { t += ctx.measureText(w.text).width; });
      t += ctx.measureText(' ').width * Math.max(0, words.length - 1);
      return t;
    }
    ctx.font = '700 ' + cfs + 'px Montserrat, sans-serif';
    while (totalW() > W * 0.9 && cfs > 10) { cfs -= 1; ctx.font = '700 ' + cfs + 'px Montserrat, sans-serif'; }
    var spaceW = ctx.measureText(' ').width;
    var clh = cfs * 1.3;
    var blockH = clh + cfs * 0.7;
    var by = H * 0.97 - blockH;
    var padX = Math.round(cfs * 0.9);
    var bw = totalW() + padX * 2, bx = (W - bw) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, bw, blockH, Math.round(cfs * 0.35)); ctx.fill(); }
    else ctx.fillRect(bx, by, bw, blockH);
    var ai = -1;
    words.forEach(function (w, i) { if (tRel >= w.start && tRel < w.end) ai = i; });
    var x = bx + padX, cy = by + blockH / 2;
    words.forEach(function (w, i) {
      ctx.fillStyle = (i === ai) ? '#8deb00' : '#ffffff';
      ctx.fillText(w.text, x, cy);
      x += ctx.measureText(w.text).width + spaceW;
    });
    ctx.restore();
  }

  /* clean: no pill, heavy white text with a soft dark shadow */
  function drawCaptionClean(ctx, cap, W, H) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var cfs = Math.round(W * 0.052);
    ctx.font = '800 ' + cfs + 'px Montserrat, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = Math.round(cfs * 0.5);
    ctx.shadowOffsetY = 2;
    var clines = wrapText(ctx, cap.text, W * 0.9);
    var clh = cfs * 1.3;
    var by = H * 0.97 - clines.length * clh;
    ctx.fillStyle = '#ffffff';
    clines.forEach(function (ln, i) { ctx.fillText(ln, W / 2, by + clh * (i + 0.5)); });
    ctx.restore();
  }

  /* block: solid brand-green bar hugging the text, black heavy uppercase */
  function drawCaptionBlock(ctx, cap, W, H) {
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    var cfs = Math.round(W * 0.052);
    ctx.font = '800 ' + cfs + 'px Montserrat, sans-serif';
    var text = String(cap.text || '').toUpperCase();
    while (text.length > 4 && ctx.measureText(text).width > W * 0.8) text = text.slice(0, -2) + '…';
    var tw = ctx.measureText(text).width;
    var padX = Math.round(cfs * 1.0), padY = Math.round(cfs * 0.55);
    var barH = cfs + padY * 2, barW = tw + padX * 2;
    var bx = (W - barW) / 2, by = H * 0.97 - barH;
    ctx.fillStyle = '#8deb00';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#0a0c08';
    ctx.fillText(text, bx + padX, by + barH / 2);
    ctx.restore();
  }

  function wrapText(ctx, text, maxW) {
    var words = String(text || '').split(/\s+/).filter(Boolean);
    var lines = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    });
    if (line) lines.push(line);
    return lines.slice(0, 2);
  }

  /* ---------- export ---------- */

  async function exportClip(opts) {
    if (!MB) throw new Error('The exporter is still loading — try again in a moment.');
    var info = opts.info;
    var trimStartUs = Math.round(opts.trimStart * 1e6);
    var trimEndUs = Math.round(opts.trimEnd * 1e6);
    if (!(trimEndUs > trimStartUs)) throw new Error('The trim range is empty.');
    var dims = targetDims(info, opts.format);
    var captions = (opts.captions || []).filter(function (c) { return c.text && c.end > c.start; });
    var title = (opts.title || '').trim();
    var totalFrames = Math.max(1, Math.round((opts.trimEnd - opts.trimStart) * (info.fps || 30)));
    var progress = opts.onProgress || function () {};

    /* muxer */
    var output = new MB.Output({
      format: new MB.Mp4OutputFormat({ fastStart: 'fragmented' }),
      target: new MB.BufferTarget()
    });
    var vSrc = new MB.EncodedVideoPacketSource('avc');
    var vTrack = output.addVideoTrack(vSrc, { width: dims.w, height: dims.h });

    /* Audio viability is decided up front: tracks must exist before output.start().
       Packet-copy is the primary path — the clip's own AAC frames are carried
       through untouched (no device audio decoder needed; the file's real
       AudioSpecificConfig rides the first packet). The decode->re-encode path
       stays as fallback. The "without sound" note fires only if both fail. */
    var audioMode = null, audioNote = null, au = null, aDecoderCfg = null, aSrc = null;
    if (info.audio && info.audio.samples.length) {
      au = info.audio;
      var ascReal = (au.asc && au.asc.length) ? au.asc : ascBytes(au.sampleRate, au.channels);
      aDecoderCfg = {
        codec: au.codec || 'mp4a.40.2',
        sampleRate: au.sampleRate,
        numberOfChannels: au.channels,
        description: ascReal
      };
      try {
        aSrc = new MB.EncodedAudioPacketSource('aac');
        output.addAudioTrack(aSrc);
        audioMode = 'copy';
      } catch (e) { aSrc = null; }
      if (!audioMode) {
        /* muxer rejected the packet-copy track: probe whether this device can
           decode+re-encode with the real config instead */
        try {
          var probe = new AudioDecoder({ output: function () {}, error: function () {} });
          probe.configure(aDecoderCfg);
          probe.close();
          aSrc = new MB.EncodedAudioPacketSource('aac');
          output.addAudioTrack(aSrc);
          audioMode = 'decode';
        } catch (e2) { aSrc = null; }
      }
      if (!audioMode) audioNote = 'Exported without sound — this device could not process the clip audio.';
    }
    await output.start();

    /* decode — only the trimmed window, streaming frames straight to encode */
    var codec = info.videoCodec || 'avc1.640028';
    if (!info.configBytes) throw new Error('This clip uses a video format Clip Lab cannot decode yet.');
    var frameQueue = [];
    var decodeDone = false, decodeErr = null;
    var decoder = new VideoDecoder({
      output: function (f) { frameQueue.push(f); },
      error: function (e) { decodeErr = e; }
    });
    /* NOTE: no hardwareAcceleration hint. 'prefer-hardware' makes Chromium
       fail ASYNC (after a successful configure) on machines with no
       hardware decoder instead of falling back; the default lets the
       platform pick hardware where it exists (iPhones) and software
       elsewhere. */
    decoder.configure({
      codec: codec,
      description: info.configBytes,
      codedWidth: info.width,
      codedHeight: info.height
    });

    var vt = info.videoTimescale || 90000;
    var samples = info.samples;
    var startIdx = 0;
    for (var si = 0; si < samples.length; si++) {
      var sus = Math.round(samples[si].dts * 1e6 / vt);
      if (sus + Math.round(samples[si].duration * 1e6 / vt) >= trimStartUs) { startIdx = si; break; }
      startIdx = si;
    }
    /* walk back to the nearest keyframe so decode starts clean */
    while (startIdx > 0 && !samples[startIdx].isSync) startIdx--;
    var consumed = startIdx;

    /* encoder */
    var pixels = dims.w * dims.h;
    var bitrate = Math.max(2000000, Math.round(8000000 * pixels / (1920 * 1080)));
    var fps = Math.max(1, Math.round(info.fps || 30));
    var encCfg = { codec: 'avc1.640028', width: dims.w, height: dims.h, bitrate: bitrate, framerate: fps, latencyMode: 'quality' };
    var firstVideoMeta = true;
    var encoder = new VideoEncoder({
      output: function (chunk, meta) {
        var pkt = MB.EncodedPacket.fromEncodedChunk(chunk);
        var m;
        if (firstVideoMeta) {
          firstVideoMeta = false;
          m = (meta && meta.decoderConfig) ? { decoderConfig: meta.decoderConfig } : undefined;
        }
        vSrc.add(pkt, m);
      },
      error: function (e) { decodeErr = e; }
    });
    try { encoder.configure(encCfg); }
    catch (e) { encCfg.latencyMode = 'realtime'; encoder.configure(encCfg); }

    var canvas = document.createElement('canvas');
    canvas.width = dims.w; canvas.height = dims.h;
    var ctx = canvas.getContext('2d', { alpha: false });
    var baseUs = null, encoded = 0, lastKf = -1e12, lastOutTs = -1;

    /* Decode-order (dts) chunk stamp -> presentation (cts) time, both in
       rounded microseconds. The decoder feed (feedMore, below) stamps
       chunks with DTS: dts is monotonic in file order by construction, and
       Safari's VideoDecoder rejects non-monotonic chunk stamps outright
       ("Decoder failure") — iPhone screen recordings with a varying
       composition offset at the head of the stream produce exactly that
       when stamped with cts (PR #647 learned this the hard way; Chromium
       tolerates it, which is why the harness stayed green). The decoder
       still emits frames in presentation order; each output frame's
       timestamp equals its chunk's dts stamp, so pumpFrame translates it
       through this map to the TRUE presentation time. That keeps #647's
       pacing gains — strictly increasing output stamps, duplicate/backward
       frame skip, keyframe cadence, flush-tail drain — keyed on the
       correct clock. */
    var dtsToPts = {};

    /* Safari's decoder failure surfaces as a bare DOMException with a thin
       message; the page's error box shows err.message, so rethrow with the
       original detail attached instead of the bare object. */
    function throwDecoderError() {
      var m = (decodeErr && decodeErr.message) || String(decodeErr);
      throw new Error('Decoder failure: ' + m);
    }

    /* composite one decoded frame (video + title + captions) and encode it */
    function pumpFrame(frame) {
      var fts = frame.timestamp;
      /* fts is the chunk's DTS stamp; translate to the true presentation
         time for the trim test, the title/caption timing, and pacing. A
         frame missing from the map (shouldn't happen) keeps its stamp. */
      var ptsUs = dtsToPts[fts];
      if (ptsUs === undefined) ptsUs = fts;
      if (ptsUs < trimStartUs || ptsUs >= trimEndUs) { frame.close(); return; }
      if (baseUs === null) baseUs = ptsUs;
      var tRel = (ptsUs - trimStartUs) / 1e6;
      /* pacing: output stamps must be strictly increasing — a duplicate or
         backward stamp makes muxers/players drop or hold frames (judder).
         True duplicates are skipped; the 1ms floor is invisible and only
         guards pathological zero-step stamps. */
      var rawTs = ptsUs - baseUs;
      if (encoded > 0 && rawTs <= lastOutTs) { frame.close(); return; }
      var outTs = (encoded === 0) ? 0 : Math.max(rawTs, lastOutTs + 1000);
      lastOutTs = outTs;
      drawFrame(ctx, frame, dims, info, tRel, title, captions, opts.captionStyle);
      frame.close();
      /* encode the COMPOSITED canvas (video + title + captions), not the raw frame */
      var nf = new VideoFrame(canvas, { timestamp: outTs, duration: Math.round(1e6 / fps) });
      var kf = (encoded === 0) || (outTs - lastKf >= 2e6);
      if (kf) lastKf = outTs;
      encoder.encode(nf, { keyFrame: kf });
      nf.close();
      encoded++;
      progress(Math.min(0.98, encoded / totalFrames));
    }

    function feedMore() {
      while (consumed < samples.length && decoder.decodeQueueSize < 8) {
        var s = samples[consumed++];
        /* Chunk stamps are DTS-derived microseconds — monotonic in file
           order, which is what Safari's decoder requires (see the
           dtsToPts note above). Presentation time is recovered per-frame
           in pumpFrame via the map. */
        var ts = Math.round(s.dts * 1e6 / vt);
        var ctsOk = (typeof s.cts === 'number') && (s.cts >= 0);
        dtsToPts[ts] = Math.round(((info.ctsSane && ctsOk) ? s.cts : s.dts) * 1e6 / vt);
        if (ts >= trimEndUs + 2e6) break;
        decoder.decode(new EncodedVideoChunk({
          type: s.isSync ? 'key' : 'delta',
          timestamp: ts,
          duration: Math.max(1, Math.round(s.duration * 1e6 / vt)),
          data: s.data
        }));
      }
    }
    feedMore();

    while (true) {
      if (decodeErr) throwDecoderError();
      if (frameQueue.length === 0) {
        if (decodeDone) break;
        feedMore();
        if (decoder.decodeQueueSize === 0 && frameQueue.length === 0) { decodeDone = true; break; }
        await new Promise(function (r) { setTimeout(r, 4); });
        continue;
      }
      pumpFrame(frameQueue.shift());
      feedMore();
      while (encoder.encodeQueueSize > 6) await new Promise(function (r) { setTimeout(r, 4); });
      if (decodeErr) throwDecoderError();
    }

    await decoder.flush();
    if (decodeErr) throwDecoderError();
    /* the decoder releases its B-frame reorder tail at flush — those frames
       land in frameQueue after the loop above has exited, so drain them here
       or the export silently loses its last 1-3 frames */
    while (frameQueue.length) {
      pumpFrame(frameQueue.shift());
      while (encoder.encodeQueueSize > 6) await new Promise(function (r) { setTimeout(r, 4); });
    }

    await encoder.flush();

    /* Build AAC packet-copy packets from the source samples overlapping the
       trim window. Timestamps are rebased so the kept window starts at 0,
       mirroring the video rebase. Construction happens first so a throw can
       still switch to the decode path before any audio reaches the muxer. */
    function buildAudioCopyPackets() {
      var at = au.timescale || 44100;
      var pkts = [];
      au.samples.forEach(function (s) {
        var ts = Math.round(s.dts * 1e6 / at);
        var dur = Math.max(1, Math.round(s.duration * 1e6 / at));
        if (ts + dur < trimStartUs || ts >= trimEndUs) return;
        var chunk = new EncodedAudioChunk({
          type: 'key',
          timestamp: Math.max(0, ts - trimStartUs),
          duration: dur,
          data: s.data
        });
        pkts.push(MB.EncodedPacket.fromEncodedChunk(chunk));
      });
      return pkts;
    }

    /* audio: packet-copy first; decode the trimmed window + re-encode AAC fallback */
    if (audioMode) {
      if (audioMode === 'copy') {
        try {
          var pkts = buildAudioCopyPackets();
          var firstPkt = true;
          pkts.forEach(function (p) {
            if (firstPkt) { firstPkt = false; aSrc.add(p, { decoderConfig: aDecoderCfg }); }
            else aSrc.add(p);
          });
        } catch (e) { audioMode = 'decode'; }
      }
      if (audioMode === 'decode') {
      try {
        var at = au.timescale || 44100;
        var aQueue = [];
        var aDone = false, aErr = null;
        var aDec = new AudioDecoder({
          output: function (ad) { aQueue.push(ad); },
          error: function (e) { aErr = e; }
        });
        aDec.configure(aDecoderCfg);
        au.samples.forEach(function (s) {
          var ts = Math.round(s.dts * 1e6 / at);
          if (ts + Math.round(s.duration * 1e6 / at) < trimStartUs || ts >= trimEndUs) return;
          aDec.decode(new EncodedAudioChunk({
            type: 'key',
            timestamp: ts,
            duration: Math.max(1, Math.round(s.duration * 1e6 / at)),
            data: s.data
          }));
        });
        aDec.flush().then(function () { aDone = true; }).catch(function (e) { aErr = e; });

        var firstAudioMeta = true;
        var aEnc = new AudioEncoder({
          output: function (chunk, meta) {
            var pkt = MB.EncodedPacket.fromEncodedChunk(chunk);
            var m;
            if (firstAudioMeta) {
              firstAudioMeta = false;
              m = (meta && meta.decoderConfig) ? { decoderConfig: meta.decoderConfig } : undefined;
            }
            aSrc.add(pkt, m);
          },
          error: function (e) { aErr = e; }
        });
        aEnc.configure({ codec: 'mp4a.40.2', sampleRate: au.sampleRate, numberOfChannels: au.channels, bitrate: 128000 });

        while (!aDone || aQueue.length) {
          if (aErr) throw aErr;
          var ad = aQueue.shift();
          if (!ad) { await new Promise(function (r) { setTimeout(r, 4); }); continue; }
          if (ad.timestamp < trimStartUs || ad.timestamp >= trimEndUs) { ad.close(); continue; }
          var nFrames = ad.numberOfFrames, nCh = ad.numberOfChannels;
          var pcm = new Float32Array(nFrames * nCh);
          ad.copyTo(pcm, { format: 'f32' });
          var shifted = new AudioData({
            format: 'f32', sampleRate: ad.sampleRate,
            numberOfFrames: nFrames, numberOfChannels: nCh,
            timestamp: ad.timestamp - trimStartUs, data: pcm.buffer
          });
          ad.close();
          aEnc.encode(shifted);
          shifted.close();
        }
        await aEnc.flush();
      } catch (e) {
        audioNote = 'Exported without sound — this device could not process the clip audio.';
      }
      }
    }

    await output.finalize();
    var buffer = output.target.buffer;
    if (!buffer || buffer.byteLength < 1024) throw new Error('The export came out empty — try a shorter trim.');
    progress(1);
    return { blob: new Blob([buffer], { type: 'video/mp4' }), audioNote: audioNote };
  }

  window.ClipEngine = {
    checkSupport: checkSupport,
    demuxFile: demuxFile,
    exportClip: exportClip,
    targetDims: targetDims,
    setMuxer: setMuxer,
    testCap: testCap
  };
})();
