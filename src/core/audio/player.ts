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
 * Schedule all notes on the piano. `onEnd` fires once when playback finishes
 * naturally. Returns a handle to stop early.
 */
export async function playNotes(
  notes: NoteEventTime[],
  onEnd: () => void,
  instrument: InstrumentId = 'piano',
): Promise<PlaybackHandle> {
  const ac = getCtx();
  if (ac.state === 'suspended') await ac.resume();
  await bindToDefaultOutput(ac); // follow the CURRENT default output device
  const inst = await loadInstrument(ac, instrument);

  const sorted = [...notes].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  let total = 0;
  for (const n of sorted) {
    total = Math.max(total, n.startTimeSeconds + Math.max(0.08, n.durationSeconds));
  }

  // Lookahead scheduler: schedule only the next ~0.6 s of notes each tick, so
  // we never block the main thread by creating thousands of nodes at once.
  const t0 = ac.currentTime + 0.2;
  const SCHEDULE_AHEAD = 0.6;
  let i = 0;
  const scheduleDue = () => {
    const horizon = ac.currentTime - t0 + SCHEDULE_AHEAD;
    while (i < sorted.length && sorted[i].startTimeSeconds <= horizon) {
      const n = sorted[i++];
      const duration = Math.max(0.08, n.durationSeconds);
      const gain = Math.min(1, Math.max(0.25, Number.isFinite(n.amplitude) ? n.amplitude : 0.7));
      inst.play(Math.round(n.pitchMidi), t0 + Math.max(0, n.startTimeSeconds), duration, gain);
    }
    if (i >= sorted.length) window.clearInterval(schedulerId);
  };
  scheduleDue(); // schedule the first batch immediately
  const schedulerId = window.setInterval(scheduleDue, 50);

  const endTimer = window.setTimeout(onEnd, (total + 0.6) * 1000);

  return {
    totalSeconds: total,
    source: inst.source,
    currentTime: () => Math.max(0, ac.currentTime - t0),
    stop: () => {
      window.clearInterval(schedulerId);
      window.clearTimeout(endTimer);
      try {
        inst.stop();
      } catch {
        /* nothing playing */
      }
    },
  };
}
