// Generate guitar tablature from detected notes.
// Basic tab only (no advanced Guitar Pro features): pick the lowest playable
// fret for each note, group near-simultaneous notes into chord columns.
// Columns keep their real timestamp so the renderer can space them by actual
// rhythm (an eighth note sits farther from its neighbor than a sixteenth).

import type { NoteEventTime } from '../../core/music/note-event';
import { midiToNoteName } from '../../core/music/notation';
import type { TuningId } from './tablature.store';

const FRET_COUNT = 18;
const COLUMN_EPSILON = 0.06;
const MIN_HOLD_SECONDS = 0.08;
/** Minimum spacing between columns in seconds (= eighth note at 120 BPM) */
const MIN_COLUMN_SPACING = 0.25;
/** Drop notes closer than a sixteenth note (0.125s @ 120 BPM) to avoid unplayable clusters on guitar tab. */
const SIXTEENTH_NOTE_MIN_GAP = 0.125;

// Open-string MIDI pitches, ordered top (highest) → bottom (lowest), like tab.
const OPEN_PITCHES: Record<TuningId, number[]> = {
  standard: [64, 59, 55, 50, 45, 40], // e B G D A E
  dropD: [64, 59, 55, 50, 45, 38],   // e B G D A D
  violin: [76, 69, 62, 55],           // E A D G
};

export interface TabColumn {
  /** Fret per string (index 0 = high e), or null if the string is unplayed. */
  frets: (number | null)[];
  /** When each string's note stops sounding (seconds), for playhead highlight. */
  until: (number | null)[];
  /** Start time of this column (seconds) — also its real position on the timeline. */
  time: number;
}

export interface TabData {
  /** String labels, high → low (e.g. ['e','B','G','D','A','E']). */
  labels: string[];
  columns: TabColumn[];
}

/** Lowest-fret position for a pitch given open strings + capo, or null. */
function position(midi: number, open: number[], capo: number): { s: number; fret: number } | null {
  let best: { s: number; fret: number } | null = null;
  for (let s = 0; s < open.length; s++) {
    const fret = midi - (open[s] + capo);
    if (fret >= 0 && fret <= FRET_COUNT && (!best || fret < best.fret)) best = { s, fret };
  }
  return best;
}

/**
 * Filter notes to only those that appear on the guitar/violin tab.
 * Rules: (1) must be playable on the instrument, (2) on each string,
 * notes closer than a sixteenth note are skipped (unplayable re-picks).
 * Returns the surviving notes in their original sorted order.
 */
export function filterTabNotes(
  notes: NoteEventTime[],
  tuning: TuningId,
  capo = 0,
): NoteEventTime[] {
  const open = OPEN_PITCHES[tuning];
  const sorted = [...notes].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  const isViolin = tuning === 'violin';

  // Pass 1: per-string sixteenth-note filter
  const afterStringFilter: NoteEventTime[] = [];
  const lastKeptByString = new Map<number, number>();
  for (const note of sorted) {
    const pos = position(Math.round(note.pitchMidi), open, capo);
    if (!pos) continue;
    const lastTime = lastKeptByString.get(pos.s) ?? -Infinity;
    if (note.startTimeSeconds - lastTime < SIXTEENTH_NOTE_MIN_GAP) continue;
    afterStringFilter.push(note);
    lastKeptByString.set(pos.s, note.startTimeSeconds);
  }

  // Pass 2: violin is monophonic — at most one note per COLUMN_EPSILON window.
  // Pick the note with the lowest fret position (easiest to play).
  if (!isViolin) return afterStringFilter;

  const result: NoteEventTime[] = [];
  for (const note of afterStringFilter) {
    const last = result[result.length - 1];
    if (last && Math.abs(note.startTimeSeconds - last.startTimeSeconds) <= COLUMN_EPSILON) {
      // Two notes at nearly the same time — keep the one with the lower fret.
      const prevPos = position(Math.round(last.pitchMidi), open, capo);
      const curPos = position(Math.round(note.pitchMidi), open, capo);
      if (curPos && (!prevPos || curPos.fret < prevPos.fret)) {
        result[result.length - 1] = note; // replace — this note is easier
      }
      // else: keep the previous note, discard this one
    } else {
      result.push(note);
    }
  }
  return result;
}

export function generateTab(notes: NoteEventTime[], tuning: TuningId, capo = 0): TabData {
  const open = OPEN_PITCHES[tuning];
  const filtered = filterTabNotes(notes, tuning, capo);
  const labels = open.map((m) => midiToNoteName(m).replace(/[0-9-]/g, ''));

  const columns: TabColumn[] = [];

  for (const note of filtered) {
    const pos = position(Math.round(note.pitchMidi), open, capo);
    if (!pos) continue;
    const until = note.startTimeSeconds + Math.max(MIN_HOLD_SECONDS, note.durationSeconds);
    const last = columns[columns.length - 1];
    const sameColumn =
      last &&
      Math.abs(note.startTimeSeconds - last.time) <= COLUMN_EPSILON &&
      last.frets[pos.s] == null;
    if (sameColumn) {
      last.frets[pos.s] = pos.fret;
      last.until[pos.s] = until;
    } else {
      const frets = new Array<number | null>(open.length).fill(null);
      const untilArr = new Array<number | null>(open.length).fill(null);
      frets[pos.s] = pos.fret;
      untilArr[pos.s] = until;
      columns.push({ frets, until: untilArr, time: note.startTimeSeconds });
    }
  }

  // Post-process: enforce minimum spacing (= eighth note) so notes never overlap
  for (let i = 1; i < columns.length; i++) {
    const gap = columns[i].time - columns[i - 1].time;
    if (gap < MIN_COLUMN_SPACING) {
      columns[i].time = columns[i - 1].time + MIN_COLUMN_SPACING;
    }
  }

  return { labels, columns };
}
