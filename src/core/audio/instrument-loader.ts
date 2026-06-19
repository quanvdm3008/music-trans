// Loads (and caches) a playable Instrument: bundled soundfont -> hosted
// soundfont -> oscillator synth, so there is always audible output.

import Soundfont, { type SoundfontInstrument } from 'soundfont-player';
import { getMaster } from './audio-context';
import { withTimeout } from './audio-context';
import { gmName, type Instrument, type InstrumentId, type InstrumentSource } from './instruments';

const instrumentCache = new Map<InstrumentId, Promise<Instrument>>();

function wrapSoundfont(sf: SoundfontInstrument, source: InstrumentSource): Instrument {
  return {
    source,
    play: (midi, when, duration, gain) => {
      // Cap per-note gain to prevent clipping from velocity spikes.
      const safeGain = Math.min(0.85, Math.max(0.15, gain));
      sf.play(midi, when, { duration, gain: safeGain });
    },
    stop: () => sf.stop(),
  };
}

/** Oscillator fallback — guarantees audible output even with no samples. */
function makeSynth(ac: AudioContext): Instrument {
  const active = new Set<{ osc: OscillatorNode; gain: GainNode }>();
  return {
    source: 'synth',
    play: (midi, when, duration, gain) => {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const osc = ac.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const g = ac.createGain();
      const peak = Math.min(0.5, Math.max(0.05, gain) * 0.5);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(peak, when + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0008, when + duration);
      osc.connect(g);
      g.connect(getMaster());
      osc.start(when);
      osc.stop(when + duration + 0.05);
      const rec = { osc, gain: g };
      active.add(rec);
      osc.onended = () => {
        try {
          g.disconnect();
          osc.disconnect();
        } catch {
          /* already gone */
        }
        active.delete(rec);
      };
    },
    stop: () => {
      const now = ac.currentTime;
      for (const { osc, gain } of active) {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(0.0001, now);
          osc.stop(now + 0.02);
        } catch {
          /* ignore */
        }
      }
      active.clear();
    },
  };
}

async function loadSoundfontInstrument(ac: AudioContext, id: InstrumentId): Promise<Instrument> {
  const base = import.meta.env.BASE_URL ?? '/';
  const gm = gmName(id);
  const localUrl = `${base}soundfonts/${gm}-mp3.js`;
  const dest = getMaster();
  // 1. Local bundled soundfont (no network).
  try {
    const sf = await withTimeout(
      Soundfont.instrument(ac, localUrl, { destination: dest }),
      20000,
      `tải tiếng ${gm} (local)`,
    );
    return wrapSoundfont(sf, 'soundfont-local');
  } catch (errLocal) {
    console.warn(`[player] local soundfont (${gm}) failed, trying CDN:`, errLocal);
  }
  // 2. Hosted soundfont (needs network).
  const sf = await withTimeout(
    Soundfont.instrument(ac, gm, { soundfont: 'FluidR3_GM', destination: dest }),
    20000,
    `tải tiếng ${gm} (CDN)`,
  );
  return wrapSoundfont(sf, 'soundfont-cdn');
}

/** Load (and cache) an instrument. Never rejects: falls back to a synth. */
export function loadInstrument(ac: AudioContext, id: InstrumentId): Promise<Instrument> {
  let p = instrumentCache.get(id);
  if (!p) {
    p = loadSoundfontInstrument(ac, id).catch((err) => {
      console.warn(`[player] all soundfonts failed for ${id}, using synth fallback:`, err);
      return makeSynth(ac);
    });
    instrumentCache.set(id, p);
  }
  return p;
}
