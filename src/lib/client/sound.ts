import type { EndSoundId } from "@/lib/settings";

/**
 * Sound effects, synthesised with the Web Audio API (no audio files).
 *
 * Browsers only allow audio after the user has interacted with the page, so
 * call `unlockAudio()` from a tap (GameApp does this on the first pointerdown
 * anywhere). After that, sounds can play in response to server updates.
 */

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function getContext(): AudioContext | null {
  if (context) return context;
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

/**
 * Call from a user gesture so later sounds are allowed to play. Safe to call
 * on every tap: it only does work while audio is still locked (phones can
 * re-suspend audio after the screen locks).
 */
export function unlockAudio(): void {
  // iPhone: play as media, so the ring/silent switch doesn't mute it.
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session && session.type !== "playback") {
    try {
      session.type = "playback";
    } catch {
      // Older Safari: ignore.
    }
  }
  const ctx = getContext();
  if (!ctx || ctx.state === "running") return;
  void ctx.resume();
  // iOS needs something actually played during the gesture.
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}

interface HornNote {
  freq: number;
  start: number;
  duration: number;
}

/** A two-note call, rising a fifth: the vote is in. */
const HORN_CALL: HornNote[] = [
  { freq: 196.0, start: 0, duration: 0.5 }, // G3
  { freq: 293.66, start: 0.55, duration: 1.5 }, // D4, held
];

/**
 * Schedule a brass-like horn call on any audio context (also used with an
 * OfflineAudioContext in tests).
 */
export function scheduleHorn(ctx: BaseAudioContext, at = ctx.currentTime): void {
  const master = ctx.createGain();
  master.gain.value = 0.32;

  // A short echo, as if the call carried across the village.
  const echo = ctx.createDelay(1);
  echo.delayTime.value = 0.23;
  const echoGain = ctx.createGain();
  echoGain.gain.value = 0.22;
  master.connect(ctx.destination);
  master.connect(echo);
  echo.connect(echoGain);
  echoGain.connect(ctx.destination);
  echoGain.connect(echo);

  for (const note of HORN_CALL) {
    const t0 = at + note.start;
    const t1 = t0 + note.duration;

    const voice = ctx.createGain();
    voice.gain.setValueAtTime(0, t0);
    voice.gain.linearRampToValueAtTime(1, t0 + 0.07);
    voice.gain.setValueAtTime(0.85, t0 + 0.2);
    voice.gain.linearRampToValueAtTime(0.75, t1 - 0.25);
    voice.gain.linearRampToValueAtTime(0, t1);

    // Brass "blat": the filter opens hard on the attack, then settles.
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.Q.value = 3;
    tone.frequency.setValueAtTime(note.freq * 2, t0);
    tone.frequency.exponentialRampToValueAtTime(note.freq * 9, t0 + 0.06);
    tone.frequency.exponentialRampToValueAtTime(note.freq * 5, t0 + 0.3);
    tone.frequency.exponentialRampToValueAtTime(note.freq * 3, t1);

    tone.connect(voice);
    voice.connect(master);

    // Gentle vibrato once the note is held.
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5.2;
    const vibratoDepth = ctx.createGain();
    vibratoDepth.gain.setValueAtTime(0, t0);
    vibratoDepth.gain.linearRampToValueAtTime(note.duration > 1 ? 2.2 : 0, t0 + 0.5);
    vibrato.connect(vibratoDepth);

    for (const [type, detune, level] of [
      ["sawtooth", -6, 0.6],
      ["sawtooth", 5, 0.5],
      ["square", 0, 0.25],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.detune.value = detune;
      // Lips "scoop" up into the pitch, as a horn player's do.
      osc.frequency.setValueAtTime(note.freq * 0.94, t0);
      osc.frequency.exponentialRampToValueAtTime(note.freq, t0 + 0.08);
      vibratoDepth.connect(osc.frequency);
      const level_ = ctx.createGain();
      level_.gain.value = level;
      osc.connect(level_);
      level_.connect(tone);
      osc.start(t0);
      osc.stop(t1 + 0.05);
    }
    vibrato.start(t0);
    vibrato.stop(t1 + 0.05);
  }
}

/** A church bell tolling three times. */
export function scheduleBell(ctx: BaseAudioContext, at = ctx.currentTime): void {
  const master = ctx.createGain();
  master.gain.value = 0.28;
  master.connect(ctx.destination);
  // Bell partials (hum, prime, tierce, quint, nominal...) relative to the strike note.
  const partials: [number, number, number][] = [
    [0.5, 0.5, 4.5],
    [1, 1, 3.2],
    [1.2, 0.45, 2.4],
    [1.5, 0.35, 2],
    [2, 0.6, 1.8],
    [2.51, 0.25, 1.2],
    [3.01, 0.18, 0.9],
  ];
  const base = 233;
  for (const strike of [0, 1.15, 2.3]) {
    const t0 = at + strike;
    for (const [ratio, level, decay] of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = base * ratio;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(level, t0 + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + decay + 0.05);
    }
  }
}

/** A deep gong that swells and shimmers. */
export function scheduleGong(ctx: BaseAudioContext, at = ctx.currentTime): void {
  const master = ctx.createGain();
  master.gain.value = 0.34;
  master.connect(ctx.destination);
  const base = 88;
  const partials: [number, number, number][] = [
    [1, 1, 3.4],
    [1.48, 0.6, 2.8],
    [1.98, 0.45, 2.4],
    [2.44, 0.35, 2],
    [2.9, 0.25, 1.6],
    [3.62, 0.18, 1.3],
  ];
  for (const [ratio, level, decay] of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(base * ratio * 1.01, at);
    osc.frequency.exponentialRampToValueAtTime(base * ratio, at + 0.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level * 0.6, at + 0.01);
    gain.gain.linearRampToValueAtTime(level, at + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + decay + 0.05);
  }
  // Metallic shimmer on the strike.
  const noise = noiseSource(ctx, 2.5);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2600;
  band.Q.value = 1.4;
  const shimmer = ctx.createGain();
  shimmer.gain.setValueAtTime(0.18, at);
  shimmer.gain.exponentialRampToValueAtTime(0.0001, at + 2.2);
  noise.connect(band);
  band.connect(shimmer);
  shimmer.connect(master);
  noise.start(at);
  noise.stop(at + 2.5);
}

/** A lone wolf's howl: rising, holding, falling away. */
export function scheduleHowl(ctx: BaseAudioContext, at = ctx.currentTime): void {
  const master = ctx.createGain();
  master.gain.value = 0.17;
  master.connect(ctx.destination);
  const t1 = at + 2.4;

  const voice = ctx.createOscillator();
  voice.type = "triangle";
  voice.frequency.setValueAtTime(330, at);
  voice.frequency.exponentialRampToValueAtTime(620, at + 0.55);
  voice.frequency.setValueAtTime(620, at + 1.4);
  voice.frequency.exponentialRampToValueAtTime(470, t1);

  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 5.5;
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0, at);
  depth.gain.linearRampToValueAtTime(9, at + 0.9);
  vibrato.connect(depth);
  depth.connect(voice.frequency);

  // Throat resonance.
  const formant = ctx.createBiquadFilter();
  formant.type = "bandpass";
  formant.frequency.value = 900;
  formant.Q.value = 0.8;

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(1, at + 0.35);
  envelope.gain.setValueAtTime(1, at + 1.5);
  envelope.gain.linearRampToValueAtTime(0, t1);

  voice.connect(formant);
  formant.connect(envelope);
  voice.connect(envelope);
  envelope.connect(master);

  // A little breath.
  const breath = noiseSource(ctx, 2.5);
  const air = ctx.createBiquadFilter();
  air.type = "highpass";
  air.frequency.value = 1800;
  const breathLevel = ctx.createGain();
  breathLevel.gain.setValueAtTime(0, at);
  breathLevel.gain.linearRampToValueAtTime(0.05, at + 0.3);
  breathLevel.gain.linearRampToValueAtTime(0, t1);
  breath.connect(air);
  air.connect(breathLevel);
  breathLevel.connect(master);

  // Echo across the valley.
  const echo = ctx.createDelay(1);
  echo.delayTime.value = 0.34;
  const echoGain = ctx.createGain();
  echoGain.gain.value = 0.28;
  master.connect(echo);
  echo.connect(echoGain);
  echoGain.connect(ctx.destination);
  echoGain.connect(echo);

  for (const node of [voice, vibrato, breath]) {
    node.start(at);
    node.stop(t1 + 0.1);
  }
}

/** War drums: a quickening roll, then one great hit. */
export function scheduleDrums(ctx: BaseAudioContext, at = ctx.currentTime): void {
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  const hits: [number, number][] = [];
  let t = 0;
  let gap = 0.26;
  for (let i = 0; i < 10; i += 1) {
    hits.push([t, 0.35 + i * 0.04]);
    t += gap;
    gap *= 0.84;
  }
  hits.push([t + 0.12, 1]);
  for (const [offset, strength] of hits) {
    const t0 = at + offset;
    const big = strength >= 1;
    const body = ctx.createOscillator();
    body.type = "sine";
    body.frequency.setValueAtTime(big ? 95 : 120, t0);
    body.frequency.exponentialRampToValueAtTime(big ? 42 : 60, t0 + (big ? 0.5 : 0.18));
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0, t0);
    bodyGain.gain.linearRampToValueAtTime(strength, t0 + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t0 + (big ? 1.4 : 0.32));
    body.connect(bodyGain);
    bodyGain.connect(master);
    body.start(t0);
    body.stop(t0 + (big ? 1.5 : 0.4));

    const skin = noiseSource(ctx, 0.3);
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = big ? 900 : 1400;
    const skinGain = ctx.createGain();
    skinGain.gain.setValueAtTime(strength * 0.35, t0);
    skinGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    skin.connect(tone);
    tone.connect(skinGain);
    skinGain.connect(master);
    skin.start(t0);
    skin.stop(t0 + 0.3);
  }
}

function noiseSource(ctx: BaseAudioContext, seconds: number): AudioBufferSourceNode {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

const SCHEDULES: Record<EndSoundId, ((ctx: BaseAudioContext, at?: number) => void) | null> = {
  horn: scheduleHorn,
  bell: scheduleBell,
  gong: scheduleGong,
  howl: scheduleHowl,
  drums: scheduleDrums,
  none: null,
};

/** Play one of the end-of-vote sounds now, if audio has been unlocked. */
export function playEndSound(id: EndSoundId): void {
  const schedule = SCHEDULES[id];
  if (!schedule) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  schedule(ctx, ctx.currentTime + 0.05);
}
