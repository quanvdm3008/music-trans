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
  /** Current playback position in seconds, read from the AUDIO clock. */
  currentTime: () => number;
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

  // Legato: durations now come straight from the engraved score (note values that
  // already touch the next note), so we only add a tiny release tail to avoid
  // clicky cut-offs. The tail never bridges a real rest, so the audio stays in
  // sync with the printed rhythm.
  const LEGATO_TAIL = 0.06;
  const legato = sorted.map((n, idx) => {
    const ownEnd = n.startTimeSeconds + Math.max(0.08, n.durationSeconds);
    const nextStart = idx + 1 < sorted.length ? sorted[idx + 1].startTimeSeconds : Infinity;
    const gap = nextStart - ownEnd;
    const tail = Math.min(LEGATO_TAIL, Math.max(0.02, gap));
    return { ...n, durationSeconds: ownEnd + tail - n.startTimeSeconds };
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

  // Lookahead scheduler — adaptive setTimeout for tighter Web Audio timing.
  const t0 = ac.currentTime + 0.2;
  const SCHEDULE_AHEAD = 1.2;
  const TICK_MIN_MS = 10;
  let i = 0;
  let schedulerTimer: number | null = null;
  let stopped = false;

  const scheduleDue = () => {
    if (stopped) return;
    const horizon = (ac.currentTime - t0) + SCHEDULE_AHEAD;
    while (i < effective.length && (effective[i].startTimeSeconds / s) <= horizon) {
      const n = effective[i++];
      const dur = Math.max(0.04, n.durationSeconds) / s;
      const gain = Math.min(0.9, Math.max(0.2, Number.isFinite(n.amplitude) ? n.amplitude : 0.65));
      inst.play(Math.round(n.pitchMidi), t0 + Math.max(0, n.startTimeSeconds / s), dur, gain);
    }
    if (i >= effective.length) {
      schedulerTimer = null;
      return;
    }
    // Adaptive delay: schedule sooner if next note is close.
    const nextDue = (effective[i].startTimeSeconds / s) - (ac.currentTime - t0);
    const delay = Math.max(TICK_MIN_MS, Math.min(80, (nextDue - SCHEDULE_AHEAD * 0.5) * 1000));
    schedulerTimer = window.setTimeout(scheduleDue, delay);
  };
  scheduleDue();

  const endTimer = window.setTimeout(onEnd, (total + 0.6) * 1000);

  return {
    totalSeconds: fullTotal, // always report full length for progress bar
    source: inst.source,
    currentTime: () => offset + Math.max(0, (ac.currentTime - t0)),
    stop: () => {
      stopped = true;
      if (schedulerTimer != null) window.clearTimeout(schedulerTimer);
      window.clearTimeout(endTimer);
      try {
        inst.stop();
      } catch {
        /* nothing playing */
      }
    },
  };
}
