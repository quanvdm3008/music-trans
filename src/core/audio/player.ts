// Preview playback of transcribed notes.
//
// We play the RAW detected notes (absolute seconds, original timing) so the
// preview reflects what the AI actually heard — independent of quantization.
// Instrument selection/loading lives in instruments.ts / instrument-loader.ts;
// this module only schedules notes against the shared AudioContext.

import type { NoteEventTime } from '../music/note-event';
import { getCtx, bindToDefaultOutput } from './audio-context';
import { loadInstrument } from './instrument-loader';
import type { InstrumentId, InstrumentSource } from './instruments';

export type { InstrumentSource, InstrumentId } from './instruments';
export { INSTRUMENTS } from './instruments';

export interface PlaybackHandle {
  /** Length of the scheduled playback in seconds. */
  totalSeconds: number;
  /** Which engine ended up playing. */
  source: InstrumentSource;
  /** Current playback position in REAL seconds (for progress bar). */
  currentTime: () => number;
  /** Current playback position in MUSIC time (= real × speed, matches note.startTimeSeconds). */
  currentMusicTime: () => number;
  /** Stop immediately and cancel the end callback. */
  stop: () => void;
}

/**
 * Schedule all notes for playback.
 *
 * @param speed       Playback speed multiplier (1.0 = normal, 0.5 = half, 2.0 = double).
 * @param startOffsetSeconds  Start playback from this position (seek). Notes before
 *                            this time are skipped; remaining notes are shifted back.
 */
export async function playNotes(
  notes: NoteEventTime[],
  onEnd: () => void,
  instrument: InstrumentId = 'piano',
  speed = 1.0,
  startOffsetSeconds = 0,
): Promise<PlaybackHandle> {
  const ac = getCtx();
  if (ac.state === 'suspended') await ac.resume();
  await bindToDefaultOutput(ac); // follow the CURRENT default output device
  const inst = await loadInstrument(ac, instrument);

  const sorted = [...notes].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

  // Legato + humanization: piano gets a longer release tail and subtle timing
  // variation so it breathes like a real performance.
  const LEGATO_TAIL = instrument === 'piano' ? 0.12 : 0.06;
  // Tiny random jitter emulates a human player's imperfect timing (±4ms).
  const humanize = () => (Math.random() - 0.5) * 0.008;
  const legato = sorted.map((n, idx) => {
    const ownEnd = n.startTimeSeconds + Math.max(0.08, n.durationSeconds);
    const nextStart = idx + 1 < sorted.length ? sorted[idx + 1].startTimeSeconds : Infinity;
    const gap = nextStart - ownEnd;
    const tail = Math.min(LEGATO_TAIL, Math.max(0.02, gap));
    const jitter = instrument === 'piano' ? humanize() : 0;
    return { ...n, durationSeconds: ownEnd + tail - n.startTimeSeconds, startTimeSeconds: n.startTimeSeconds + jitter };
  });

  // Apply speed to all timings — slower speed stretches time, faster compresses it.
  const s = Math.max(0.1, Math.min(5, speed)); // clamp 0.1x–5x

  // Compute full total (before offset) for progress bar reference.
  let fullTotal = 0;
  for (const n of legato) {
    fullTotal = Math.max(fullTotal, (n.startTimeSeconds + Math.max(0.08, n.durationSeconds)) / s);
  }

  // Filter & shift for seek offset.
  const offset = Math.max(0, startOffsetSeconds);
  const effective = offset > 0
    ? legato
        .filter(n => (n.startTimeSeconds + Math.max(0.08, n.durationSeconds)) / s > offset)
        .map(n => ({ ...n, startTimeSeconds: n.startTimeSeconds - offset * s }))
    : legato;

  let total = 0;
  for (const n of effective) {
    total = Math.max(total, (n.startTimeSeconds + Math.max(0.08, n.durationSeconds)) / s);
  }

  // Lookahead scheduler — rAF for tight timing, setTimeout fallback for bg tabs.
  const t0 = ac.currentTime + 0.2;
  // Scale lookahead with speed so fast playback stays ahead of the audio clock.
  const SCHEDULE_AHEAD = 0.8 + Math.min(2.0, s * 0.6);
  let i = 0;
  let rafId: number | null = null;
  let timerId: number | null = null;
  let stopped = false;
  let bgMode = false;

  const scheduleDue = () => {
    if (stopped) return;
    const horizon = (ac.currentTime - t0) + SCHEDULE_AHEAD;
    while (i < effective.length && (effective[i].startTimeSeconds / s) <= horizon) {
      const n = effective[i++];
      const dur = Math.max(0.04, n.durationSeconds) / s;
      // Piano velocity curve: softer range (0.12–0.60) with natural dynamics.
      // Real pianos are never at max velocity — even ff is ~0.6 in this model.
      let rawAmp = Number.isFinite(n.amplitude) ? n.amplitude : 0.4;
      if (instrument === 'piano') {
        // Soften the curve: loud notes become moderate, quiet notes stay gentle.
        rawAmp = rawAmp * 0.65 + 0.05; // remap to ~0.05–0.70
        // Slight random variation (±4%) for natural feel.
        rawAmp += (Math.random() - 0.5) * 0.04;
      }
      const gain = Math.min(0.7, Math.max(0.12, rawAmp));
      inst.play(Math.round(n.pitchMidi), t0 + Math.max(0, n.startTimeSeconds / s), dur, gain);
    }
    if (i >= effective.length) {
      rafId = null;
      timerId = null;
      return;
    }
    // Schedule next tick via rAF (precise ~16ms) or setTimeout (bg fallback).
    if (!bgMode) {
      rafId = requestAnimationFrame(scheduleDue);
      // Fallback: if rAF doesn't fire within 100ms, switch to setTimeout mode.
      timerId = window.setTimeout(() => {
        bgMode = true;
        if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
        scheduleDue();
      }, 120);
    } else {
      timerId = window.setTimeout(scheduleDue, 12);
    }
  };
  scheduleDue();

  const endTimer = window.setTimeout(onEnd, (total + 0.6) * 1000);

  return {
    totalSeconds: fullTotal, // always report full length for progress bar
    source: inst.source,
    // currentTime returns REAL elapsed seconds (for progress bar).
    // Visualization should multiply by speed to get music time matching note.startTimeSeconds.
    currentTime: () => offset + Math.max(0, (ac.currentTime - t0)),
    /** Music time: real elapsed × speed = matches note.startTimeSeconds for viz sync. */
    currentMusicTime: () => (offset + Math.max(0, (ac.currentTime - t0))) * s,
    stop: () => {
      stopped = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      if (timerId != null) window.clearTimeout(timerId);
      window.clearTimeout(endTimer);
      try {
        inst.stop();
      } catch {
        /* nothing playing */
      }
    },
  };
}
