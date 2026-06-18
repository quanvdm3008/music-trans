// Generate guitar tablature from detected notes.
// Basic tab only (no advanced Guitar Pro features): pick the lowest playable
// fret for each note, group near-simultaneous notes into chord columns.
// Columns keep their real timestamp so the renderer can space them by actual
// rhythm (an eighth note sits farther from its neighbor than a sixteenth).

import type { NoteEventTime } from '../../core/music/note-event';
import { midiToNoteName } from '../../core/music/notation';
import type { TuningId } from './tablature.store';

const FRET_COUNT = 18;
/** Fretted notes within one chord must fit inside this many frets (one hand's reach). */
const FRET_WINDOW = 4;
const COLUMN_EPSILON = 0.06;
const MIN_HOLD_SECONDS = 0.08;
/** Minimum spacing between columns in seconds (= eighth note at 120 BPM) */
const MIN_COLUMN_SPACING = 0.25;
/** Drop notes closer than a sixteenth note (0.125s @ 120 BPM) to avoid unplayable clusters on guitar tab. */
const SIXTEENTH_NOTE_MIN_GAP = 0.125;

// Open-string MIDI pitches, ordered top (highest) → bottom (lowest), like tab.
export const OPEN_PITCHES: Record<TuningId, number[]> = {
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
  // Use a fixed window anchor so clusters don't chain-collapse.
  // Pick the note with the lowest fret position (easiest to play).
  if (!isViolin) return afterStringFilter;

  const result: NoteEventTime[] = [];
  let windowStart = -Infinity;
  let bestInWindow: { note: NoteEventTime; fret: number } | null = null;

  const flushWindow = () => {
    if (bestInWindow) {
      result.push(bestInWindow.note);
      bestInWindow = null;
    }
  };

  for (const note of afterStringFilter) {
    if (note.startTimeSeconds - windowStart > COLUMN_EPSILON) {
      // New time window — flush the previous one.
      flushWindow();
      windowStart = note.startTimeSeconds;
      const pos = position(Math.round(note.pitchMidi), open, capo);
      bestInWindow = pos ? { note, fret: pos.fret } : null;
    } else {
      // Same window — compete: keep the note with the lower fret.
      const pos = position(Math.round(note.pitchMidi), open, capo);
      if (pos && (!bestInWindow || pos.fret < bestInWindow.fret)) {
        bestInWindow = { note, fret: pos.fret };
      }
    }
  }
  flushWindow();
  return result;
}

/** A note in a chord and all the (string, fret) positions that can voice it. */
interface ChordCandidate {
  until: number | null;
  positions: { s: number; fret: number }[];
}

/**
 * Assign as many notes as possible to distinct strings using only frets that are
 * open (0) or inside the window [lo, lo+FRET_WINDOW]. Returns the best assignment
 * (note index → position), maximizing placed notes then minimizing the fret span.
 * A small backtracking search — chords have at most a handful of notes.
 */
function matchWindow(
  cands: ChordCandidate[],
  lo: number,
): Map<number, { s: number; fret: number }> {
  let best = { count: -1, span: Infinity, assign: new Map<number, { s: number; fret: number }>() };
  const usedStrings = new Set<number>();
  const cur = new Map<number, { s: number; fret: number }>();

  const recurse = (idx: number) => {
    if (idx === cands.length) {
      const frets = [...cur.values()].map((p) => p.fret).filter((f) => f > 0);
      const span = frets.length ? Math.max(...frets) - Math.min(...frets) : 0;
      if (cur.size > best.count || (cur.size === best.count && span < best.span)) {
        best = { count: cur.size, span, assign: new Map(cur) };
      }
      return;
    }
    for (const p of cands[idx].positions) {
      if (usedStrings.has(p.s)) continue;
      if (p.fret !== 0 && (p.fret < lo || p.fret > lo + FRET_WINDOW)) continue;
      usedStrings.add(p.s);
      cur.set(idx, p);
      recurse(idx + 1);
      cur.delete(idx);
      usedStrings.delete(p.s);
    }
    // Also allow dropping this note (it may be unreachable inside this window).
    recurse(idx + 1);
  };
  recurse(0);
  return best.assign;
}

/**
 * Pick a playable voicing for one chord: one note per string, fretted notes
 * within a 4-fret hand reach, dropping notes that can't fit. Tries each fret as
 * the window's low anchor and keeps the assignment that plays the most notes in
 * the lowest, tightest position.
 */
function voiceChord(cands: ChordCandidate[]): Map<number, { s: number; fret: number }> {
  // Candidate window anchors: every fret that appears, plus the nut (0).
  const anchors = new Set<number>([0]);
  for (const c of cands) for (const p of c.positions) anchors.add(p.fret);

  let best = { count: -1, span: Infinity, assign: new Map<number, { s: number; fret: number }>() };
  for (const lo of [...anchors].sort((a, b) => a - b)) {
    const assign = matchWindow(cands, lo);
    const frets = [...assign.values()].map((p) => p.fret).filter((f) => f > 0);
    const span = frets.length ? Math.max(...frets) - Math.min(...frets) : 0;
    // Strict comparisons → earlier (lower) anchors win ties: prefer low positions.
    if (assign.size > best.count || (assign.size === best.count && span < best.span)) {
      best = { count: assign.size, span, assign };
    }
  }
  return best.assign;
}

export function generateTab(notes: NoteEventTime[], tuning: TuningId, capo = 0): TabData {
  const open = OPEN_PITCHES[tuning];
  const filtered = filterTabNotes(notes, tuning, capo);
  const labels = open.map((m) => midiToNoteName(m).replace(/[0-9-]/g, ''));

  // Group near-simultaneous notes into chords (one timeline column each).
  const groups: { time: number; notes: { midi: number; until: number }[] }[] = [];
  for (const note of filtered) {
    const midi = Math.round(note.pitchMidi);
    const until = note.startTimeSeconds + Math.max(MIN_HOLD_SECONDS, note.durationSeconds);
    const last = groups[groups.length - 1];
    if (last && Math.abs(note.startTimeSeconds - last.time) <= COLUMN_EPSILON) {
      last.notes.push({ midi, until });
    } else {
      groups.push({ time: note.startTimeSeconds, notes: [{ midi, until }] });
    }
  }

  const columns: TabColumn[] = [];
  for (const g of groups) {
    // Build candidates (dedupe identical pitches in the same chord).
    const cands: ChordCandidate[] = [];
    const seen = new Set<number>();
    for (const n of g.notes) {
      if (seen.has(n.midi)) continue;
      seen.add(n.midi);
      const positions: { s: number; fret: number }[] = [];
      for (let s = 0; s < open.length; s++) {
        const fret = n.midi - (open[s] + capo);
        if (fret >= 0 && fret <= FRET_COUNT) positions.push({ s, fret });
      }
      if (positions.length) cands.push({ until: n.until, positions });
    }
    if (cands.length === 0) continue;

    const assign = voiceChord(cands);
    if (assign.size === 0) continue;

    const frets = new Array<number | null>(open.length).fill(null);
    const untilArr = new Array<number | null>(open.length).fill(null);
    for (const [idx, p] of assign) {
      frets[p.s] = p.fret;
      untilArr[p.s] = cands[idx].until;
    }
    columns.push({ frets, until: untilArr, time: g.time });
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
