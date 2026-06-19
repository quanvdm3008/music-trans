// Shared AudioContext + master chain singleton for the playback engine.

/** Output boost so preview is clearly audible (soundfont samples are quiet).
 *  Reduced from 3 to avoid clipping when many notes play simultaneously. */
const MASTER_GAIN = 1.8;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;

export function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/** A shared master chain: gain → compressor → speakers. */
export function getMaster(): AudioNode {
  const ac = getCtx();
  if (!masterGain) {
    // Compressor soft-limits peaks, prevents clipping on dense chords.
    masterCompressor = ac.createDynamicsCompressor();
    masterCompressor.threshold.value = -6;
    masterCompressor.knee.value = 12;
    masterCompressor.ratio.value = 4;
    masterCompressor.attack.value = 0.005;
    masterCompressor.release.value = 0.15;

    masterGain = ac.createGain();
    masterGain.gain.value = MASTER_GAIN;

    masterGain.connect(masterCompressor);
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
