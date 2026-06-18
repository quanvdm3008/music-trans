// Shared AudioContext + master gain singleton for the playback engine.

/** Output boost so preview is clearly audible (soundfont samples are quiet). */
const MASTER_GAIN = 3;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

export function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/** A shared master gain node feeding the speakers. */
export function getMaster(): GainNode {
  const ac = getCtx();
  if (!masterGain) {
    masterGain = ac.createGain();
    masterGain.gain.value = MASTER_GAIN;
    masterGain.connect(ac.destination);
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
