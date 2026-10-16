/* scripts/clip-asr-worker.js — on-device speech recognition for Clip Lab.
   Runs inside a dedicated module worker (created by clip-lab.html). The
   transformers.js ESM build is imported from the pinned jsdelivr CDN —
   importScripts is unavailable in module workers. Whisper tiny.en
   (quantized, ~40MB) via ONNX Runtime Web, single-threaded (GitHub Pages
   is not crossOriginIsolated, so multi-threaded wasm is off the table).
   Model files are cached by the library's default Cache Storage on the
   first download; later runs load from cache with no network.
   Protocol (postMessage):
     page -> { type:'load' }
     page -> { type:'transcribe', pcm: Float32Array (16kHz mono, transferred) }
     worker -> { type:'model-progress', loaded, total, pct }
     worker -> { type:'transcribe-progress', pct }
     worker -> { type:'ready' } | { type:'result', words:[{text,start,end}] } | { type:'error', message }
   Word times are seconds, full-clip time. */
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

var MODEL = 'Xenova/whisper-tiny.en';
var transcriber = null;

function post(o) { self.postMessage(o); }

self.onmessage = async function (e) {
  var m = (e && e.data) || {};
  try {
    if (m.type === 'load') {
      transcriber = await pipeline('automatic-speech-recognition', MODEL, {
        progress_callback: function (p) {
          var pct = (p && p.total) ? Math.round((p.loaded / p.total) * 100) : null;
          post({ type: 'model-progress', file: (p && p.file) || '', loaded: (p && p.loaded) || 0, total: (p && p.total) || 0, pct: pct });
        }
      });
      post({ type: 'ready' });
    } else if (m.type === 'transcribe') {
      if (!transcriber) throw new Error('Speech model is not loaded yet.');
      var pcm = m.pcm;
      if (!pcm || !pcm.length) throw new Error('No audio to transcribe.');
      var out = await transcriber(pcm, {
        return_timestamps: 'word',
        chunk_length_s: 30,
        stride_length_s: 5,
        callback_function: function (beats) {
          var pct = (beats && beats[1]) ? Math.round((beats[0] / beats[1]) * 100) : null;
          post({ type: 'transcribe-progress', pct: pct });
        }
      });
      var words = (out && out.chunks ? out.chunks : []).map(function (c) {
        var ts = c.timestamp || [0, 0];
        return {
          text: String(c.text || '').trim(),
          start: +Number(ts[0] || 0).toFixed(2),
          end: +Number(ts[1] || 0).toFixed(2)
        };
      }).filter(function (w) { return w.text && w.end > w.start; });
      post({ type: 'result', words: words });
    }
  } catch (err) {
    post({ type: 'error', message: (err && err.message) ? err.message : String(err) });
  }
};
