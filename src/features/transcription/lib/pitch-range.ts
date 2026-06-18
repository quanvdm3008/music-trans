import type { NoteEventTime } from '../../../core/music/note-event';

export interface PitchRange {
  low: number;
  high: number;
}

/** Vertical viewport range (MIDI) for the piano roll, padded around the notes. */
export function getPitchRange(notes: NoteEventTime[] | null): PitchRange {
  if (!notes || notes.length === 0) return { low: 48, high: 72 };
  let low = 127;
  let high = 0;
  for (const n of notes) {
    const m = Math.round(n.pitchMidi);
    if (m < low) low = m;
    if (m > high) high = m;
  }
  return { low: Math.min(low, high - 11), high: Math.max(high, low + 11) };
}
