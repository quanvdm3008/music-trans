// Shared AudioContext + master chain singleton for the playback engine.

/** Output boost so preview is clearly audible (soundfont samples are quiet).
 *  Reduced from 3 to avoid clipping when many notes play simultaneously. */
const MASTER_GAIN = 1.8;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
let reverbSend: GainNode | null = null;
let reverbDry: GainNode | null = null;

export function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/** A shared master chain: gain → parallel (dry + reverb) → compressor → speakers. */
export function getMaster(): AudioNode {
  const ac = getCtx();
  if (!masterGain) {
    // Reverb: 3 parallel feedback delays simulating early reflections.
    const createReverbLine = (delaySec: number, fb: number, cutoff: number) => {
      const delay_ = ac.createDelay(Math.max(0.1, delaySec + 0.05));
      delay_.delayTime.value = delaySec;
      const fbGain = ac.createGain();
      fbGain.gain.value = fb;
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = cutoff;
      delay_.connect(lp);
      lp.connect(fbGain);
      fbGain.connect(delay_);
      return delay_;
    };

    const rev1 = createReverbLine(0.031, 0.52, 4000);
    const rev2 = createReverbLine(0.047, 0.45, 3500);
    const rev3 = createReverbLine(0.073, 0.38, 2800);

    const revMerge = ac.createGain();
    revMerge.gain.value = 0.33;
    rev1.connect(revMerge);
    rev2.connect(revMerge);
    rev3.connect(revMerge);

    // Dry/wet mix: dry passes through, wet is the reverb send.
    reverbDry = ac.createGain();
    reverbDry.gain.value = 0.78; // mostly dry

    reverbSend = ac.createGain();
    reverbSend.gain.value = 0.22; // subtle wet

    masterGain = ac.createGain();
    masterGain.gain.value = MASTER_GAIN;

    // Input → gain → (dry + reverb) → merge → compressor → out
    masterGain.connect(reverbDry);
    masterGain.connect(reverbSend);
    reverbSend.connect(rev1);
    reverbSend.connect(rev2);
    reverbSend.connect(rev3);

    const merge = ac.createGain();
    merge.gain.value = 1.0;
    reverbDry.connect(merge);
    revMerge.connect(merge);

    masterCompressor = ac.createDynamicsCompressor();
    masterCompressor.threshold.value = -6;
    masterCompressor.knee.value = 12;
    masterCompressor.ratio.value = 4;
    masterCompressor.attack.value = 0.005;
    masterCompressor.release.value = 0.15;

    merge.connect(masterCompressor);
    masterCompressor.connect(ac.destination);
  }
  return masterGain;
}

/**
 * Re-bind the (cached) AudioContext to the CURRENT default output device.
 * Without this, a context created while e.g. Bluetooth headphones were active
 * keeps sending audio to that now-disconnected device — silent on the speakers.
 */
export async function bindToDefaultOutput(ac: AudioContext): Promise<void> {
  const withSink = ac as unknown as { setSinkId?: (id: string) => Promise<void> };
  if (typeof withSink.setSinkId === 'function') {
    try {
      await withSink.setSinkId('');
    } catch {
      /* not supported / not allowed — ignore */
    }
  }
}

export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      window.setTimeout(() => reject(new Error(`${label} timeout sau ${ms} ms`)), ms),
    ),
  ]);
}
