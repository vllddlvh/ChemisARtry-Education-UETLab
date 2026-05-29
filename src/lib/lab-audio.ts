// lab-audio.ts
// Âm thanh tổng hợp (Web Audio) cho phòng thí nghiệm ướt — không cần file ngoài.
// Tạo tiếng sủi bọt (noise filtered), tiếng "tinh" thuỷ tinh khi rót, tiếng xèo
// khi đun. Tất cả render bằng oscillator/noise buffer.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  // Trình duyệt chặn audio cho tới khi có tương tác người dùng.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function setAudioEnabled(on: boolean) {
  enabled = on;
  if (master) master.gain.value = on ? 0.5 : 0;
}

export function isAudioEnabled() {
  return enabled;
}

let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = c.sampleRate * 2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

/** Tiếng "tinh" thuỷ tinh ngắn khi rót / chọn ống. */
export function playClink() {
  const c = ensureCtx();
  if (!c || !master || !enabled) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Tiếng nước rót (noise lọc thấp, ngắn). */
export function playPour() {
  const c = ensureCtx();
  if (!c || !master || !enabled) return;
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 700;
  filter.Q.value = 0.8;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  src.connect(filter).connect(gain).connect(master);
  src.start(now);
  src.stop(now + 0.65);
}

type FizzHandle = { stop: () => void };

/**
 * Tiếng sủi bọt liên tục — trả về handle để dừng.
 * intensity: 0..1 quyết định độ to / tần số lọc.
 */
export function startFizz(intensity = 0.6): FizzHandle | null {
  const c = ensureCtx();
  if (!c || !master || !enabled) return null;
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1800 + intensity * 2200;
  const gain = c.createGain();
  const vol = 0.04 + intensity * 0.12;
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.linearRampToValueAtTime(vol, c.currentTime + 0.15);
  // LFO làm tiếng sủi rung nhẹ
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 6 + intensity * 10;
  lfoGain.gain.value = vol * 0.4;
  lfo.connect(lfoGain).connect(gain.gain);
  src.connect(filter).connect(gain).connect(master);
  src.start();
  lfo.start();
  return {
    stop: () => {
      try {
        const t = c.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        src.stop(t + 0.32);
        lfo.stop(t + 0.32);
      } catch {
        /* ignore */
      }
    },
  };
}

/** Tiếng xèo khi đun nóng — noise lọc thấp êm, lặp. */
export function startSizzle(): FizzHandle | null {
  const c = ensureCtx();
  if (!c || !master || !enabled) return null;
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.4);
  src.connect(filter).connect(gain).connect(master);
  src.start();
  return {
    stop: () => {
      try {
        const t = c.currentTime;
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        src.stop(t + 0.42);
      } catch {
        /* ignore */
      }
    },
  };
}

/** Tiếng "phụt" nhẹ khi phản ứng bắt đầu (thoát khí). */
export function playPuff() {
  const c = ensureCtx();
  if (!c || !master || !enabled) return;
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(500, now);
  filter.frequency.exponentialRampToValueAtTime(2000, now + 0.25);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  src.connect(filter).connect(gain).connect(master);
  src.start(now);
  src.stop(now + 0.45);
}
