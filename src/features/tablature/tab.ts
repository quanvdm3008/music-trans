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
/** Max fret delta between consecutive chords — bigger = hand jumps too far. */
const MAX_FRET_JUMP = 5;
const COLUMN_EPSILON = 0.06;
const MIN_HOLD_SECONDS = 0.08;
/** Minimum spacing between columns in seconds (= eighth note at 120 BPM) */
const MIN_COLUMN_SPACING = 0.25;
/** Minimal gap to avoid literal duplicate notes on same string.
 *  Much smaller now so the tab shows nearly all notes the Fretboard displays. */
const SIXTEENTH_NOTE_MIN_GAP = 0.03;

// Open-string MIDI pitches, ordered top (highest) → bottom (lowest), like tab.
export const OPEN_PITCHES: Record<TuningId, number[]> = {
  standard: [64, 59, 55, 50, 45, 40], // e B G D A E
  dropD: [64, 59, 55, 50, 45, 38],   // e B G D A D
  violin: [76, 69, 62, 55],           // E A D G
};

/** Guitar articulation techniques. */
export type GuitarTechnique = 'hammer-on' | 'pull-off' | 'slide-up' | 'slide-down';

export interface TabTechnique {
  type: GuitarTechnique;
  /** String index (0 = high e). */
  string: number;
  /** Index of the target column this technique connects FROM. */
  fromCol: number;
}

export interface TabColumn {
  /** Fret per string (index 0 = high e), or null if the string is unplayed. */
  frets: (number | null)[];
  /** When each string's note stops sounding (seconds), for playhead highlight. */
  until: (number | null)[];
  /** Start time of this column (seconds) — also its real position on the timeline. */
  time: number;
  /** Techniques that apply TO this column (e.g. pull-off from previous note). */
  techniques?: TabTechnique[];
}

export interface TabData {
  /** String labels, high → low (e.g. ['e','B','G','D','A','E']). */
  labels: string[];
  columns: TabColumn[];
}

/** Lowest-fret position for a pitch (same algorithm as Fretboard component). */
function lowestFretPosition(midi: number, open: number[], capo: number): { s: number; fret: number } | null {
  let best: { s: number; fret: number } | null = null;
  for (let s = 0; s < open.length; s++) {
    const fret = midi - (open[s] + capo);
    if (fret >= 0 && fret <= FRET_COUNT && (!best || fret < best.fret)) {
      best = { s, fret };
    }
  }
  return best;
}

/** All playable positions for a pitch, sorted by preference: open strings first, then lowest fret. */
function allPositions(midi: number, open: number[], capo: number): { s: number; fret: number }[] {
  const result: { s: number; fret: number }[] = [];
  for (let s = 0; s < open.length; s++) {
    const fret = midi - (open[s] + capo);
    if (fret >= 0 && fret <= FRET_COUNT) {
      result.push({ s, fret });
    }
  }
  // Sort: open strings (fret 0) first, then lowest fret, then highest string (for melody).
  result.sort((a, b) => {
    if (a.fret === 0 && b.fret !== 0) return -1;
    if (b.fret === 0 && a.fret !== 0) return 1;
    if (a.fret !== b.fret) return a.fret - b.fret;
    return a.s - b.s; // higher string preferred for melody
  });
  return result;
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

  // Pass 1: minimal filter — only drop true duplicates (same string, near-same time).
  const afterStringFilter: NoteEventTime[] = [];
  const lastTimeByString = new Map<number, number>();
  for (const note of sorted) {
    const positions = allPositions(Math.round(note.pitchMidi), open, capo);
    if (positions.length === 0) continue;
    // Only drop if ALL possible strings have a note too recently.
    let keep = false;
    for (const p of positions) {
      const lastTime = lastTimeByString.get(p.s) ?? -Infinity;
      if (note.startTimeSeconds - lastTime >= SIXTEENTH_NOTE_MIN_GAP) {
        keep = true;
        break;
      }
    }
    if (!keep) continue;
    afterStringFilter.push(note);
    for (const p of positions) {
      lastTimeByString.set(p.s, note.startTimeSeconds);
    }
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
      const positions = allPositions(Math.round(note.pitchMidi), open, capo);
      bestInWindow = positions.length > 0 ? { note, fret: positions[0].fret } : null;
    } else {
      // Same window — compete: keep the note with the lower fret.
      const positions = allPositions(Math.round(note.pitchMidi), open, capo);
      if (positions.length > 0 && (!bestInWindow || positions[0].fret < bestInWindow.fret)) {
        bestInWindow = { note, fret: positions[0].fret };
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
 * the lowest, tightest position. If previousFrets is provided, prefers anchors
 * near the previous hand position for smoother transitions.
 */
function voiceChord(
  cands: ChordCandidate[],
  previousFrets?: (number | null)[],
): Map<number, { s: number; fret: number }> {
  // Candidate window anchors: every fret that appears, plus the nut (0).
  const anchors = new Set<number>([0]);
  for (const c of cands) for (const p of c.positions) anchors.add(p.fret);

  // If we know the previous hand position, bias anchors near it.
  let sortedAnchors = [...anchors].sort((a, b) => a - b);
  if (previousFrets) {
    const prevFretted = previousFrets.filter((f): f is number => f !== null && f > 0);
    if (prevFretted.length > 0) {
      const prevAvg = prevFretted.reduce((s, f) => s + f, 0) / prevFretted.length;
      // Sort anchors by distance to previous average position, then by fret.
      sortedAnchors.sort((a, b) => {
        const distA = Math.abs(a - prevAvg);
        const distB = Math.abs(b - prevAvg);
        if (distA !== distB) return distA - distB;
        return a - b;
      });
    }
  }

  let best = { count: -1, span: Infinity, avgFret: 0, assign: new Map<number, { s: number; fret: number }>() };
  for (const lo of sortedAnchors) {
    const assign = matchWindow(cands, lo);
    const frets = [...assign.values()].map((p) => p.fret).filter((f) => f > 0);
    const span = frets.length ? Math.max(...frets) - Math.min(...frets) : 0;
    const count = assign.size;
    const curAvg = frets.length ? frets.reduce((s, f) => s + f, 0) / frets.length : 0;

    // Penalize large jumps from previous hand position.
    let jumpPenalty = 0;
    if (previousFrets) {
      const prevFretted = previousFrets.filter((f): f is number => f !== null && f > 0);
      if (prevFretted.length > 0 && frets.length > 0) {
        const prevAvg = prevFretted.reduce((s, f) => s + f, 0) / prevFretted.length;
        const delta = Math.abs(curAvg - prevAvg);
        if (delta > MAX_FRET_JUMP) jumpPenalty = delta * 0.5; // heavily penalize big jumps
      }
    }

    // Prefer: more notes > tighter span > closer to previous position > less jump.
    let better = false;
    if (count > best.count) better = true;
    else if (count === best.count) {
      const bestFrets = [...best.assign.values()].map((p) => p.fret).filter((f) => f > 0);
      const bestAvg = bestFrets.length ? bestFrets.reduce((s, f) => s + f, 0) / bestFrets.length : 0;

      // Effective span = actual span + jump penalty.
      const curScore = span + jumpPenalty;
      let bestJumpPenalty = 0;
      if (previousFrets) {
        const prevFretted = previousFrets.filter((f): f is number => f !== null && f > 0);
        if (prevFretted.length > 0 && bestFrets.length > 0) {
          const prevAvg = prevFretted.reduce((s, f) => s + f, 0) / prevFretted.length;
          const delta = Math.abs(bestAvg - prevAvg);
          if (delta > MAX_FRET_JUMP) bestJumpPenalty = delta * 0.5;
        }
      }
      const bestScore = best.span + bestJumpPenalty;

      if (curScore < bestScore) better = true;
    }

    if (better) {
      best = { count, span, avgFret: curAvg, assign };
    }
  }
  return best.assign;
}

export function generateTab(notes: NoteEventTime[], tuning: TuningId, capo = 0): TabData {
  const open = OPEN_PITCHES[tuning];
  // Use RAW notes — same set the Fretboard sees (no filterTabNotes).
  const sorted = [...notes].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  const labels = open.map((m) => midiToNoteName(m).replace(/[0-9-]/g, ''));

  // Group near-simultaneous notes into chords (one timeline column each).
  const groups: { time: number; notes: { midi: number; until: number }[] }[] = [];
  for (const note of sorted) {
    const midi = Math.round(note.pitchMidi);
    if (midi < 0 || midi > 127) continue;
    const until = note.startTimeSeconds + Math.max(MIN_HOLD_SECONDS, note.durationSeconds);
    const last = groups[groups.length - 1];
    if (last && Math.abs(note.startTimeSeconds - last.time) <= COLUMN_EPSILON) {
      last.notes.push({ midi, until });
    } else {
      groups.push({ time: note.startTimeSeconds, notes: [{ midi, until }] });
    }
  }

  const columns: TabColumn[] = [];
  let prevFrets: (number | null)[] | undefined;

  for (const g of groups) {
    const frets = new Array<number | null>(open.length).fill(null);
    const untilArr = new Array<number | null>(open.length).fill(null);

    if (g.notes.length === 1) {
      // Single note → use lowest-fret position, exactly like Fretboard.
      const pos = lowestFretPosition(g.notes[0].midi, open, capo);
      if (pos) {
        frets[pos.s] = pos.fret;
        untilArr[pos.s] = g.notes[0].until;
      }
    } else {
      // Multiple notes → use lowest-fret first, resolve conflicts with voiceChord.
      const assigned: { s: number; fret: number }[] = [];
      const usedStrings = new Set<number>();
      const remaining: ChordCandidate[] = [];

      for (const n of g.notes) {
        const pos = lowestFretPosition(n.midi, open, capo);
        if (pos && !usedStrings.has(pos.s)) {
          assigned.push(pos);
          usedStrings.add(pos.s);
          frets[pos.s] = pos.fret;
          untilArr[pos.s] = n.until;
        } else {
          // Conflict — add to candidates for voiceChord fallback.
          const positions = allPositions(n.midi, open, capo);
          if (positions.length) {
            remaining.push({ until: n.until, positions });
          }
        }
      }

      // Use voiceChord for any remaining notes that couldn't get their preferred position.
      if (remaining.length > 0) {
        const assign = voiceChord(remaining, prevFrets);
        for (const [, p] of assign) {
          if (frets[p.s] == null) {
            frets[p.s] = p.fret;
            // Find the until from remaining candidates.
            const candIdx = [...assign.entries()].find(([_k, v]) => v === p)?.[0];
            if (candIdx != null && candIdx < remaining.length) {
              untilArr[p.s] = remaining[candIdx].until;
            }
          }
        }
      }
    }

    // Only add column if at least one string has a note.
    if (frets.some(f => f != null)) {
      columns.push({ frets, until: untilArr, time: g.time });
      prevFrets = frets;
    }
  }

  // Post-process 1: detect guitar techniques between consecutive notes on same string.
  const LEGATO_GAP = 0.06; // max gap (s) to consider hammer-on / pull-off
  for (let i = 1; i < columns.length; i++) {
    const prev = columns[i - 1];
    const cur = columns[i];

    for (let s = 0; s < open.length; s++) {
      const prevFret = prev.frets[s];
      const curFret = cur.frets[s];
      if (prevFret == null || curFret == null) continue;
      if (prevFret === curFret) continue;

      const prevUntil = prev.until[s] ?? prev.time;
      const timeBetween = cur.time - prevUntil;

      if (prevUntil > cur.time) {
        // Overlap: slide
        const tech: GuitarTechnique = curFret > prevFret ? 'slide-up' : 'slide-down';
        cur.techniques = cur.techniques ?? [];
        cur.techniques.push({ type: tech, string: s, fromCol: i - 1 });
      } else if (timeBetween <= LEGATO_GAP && timeBetween >= 0) {
        // Tiny gap: hammer-on or pull-off
        const tech: GuitarTechnique = curFret > prevFret ? 'hammer-on' : 'pull-off';
        cur.techniques = cur.techniques ?? [];
        cur.techniques.push({ type: tech, string: s, fromCol: i - 1 });
      }
    }
  }

  // Post-process 2: enforce minimum spacing so notes never overlap visually.
  for (let i = 1; i < columns.length; i++) {
    const gap = columns[i].time - columns[i - 1].time;
    if (gap < MIN_COLUMN_SPACING) {
      columns[i].time = columns[i - 1].time + MIN_COLUMN_SPACING;
    }
  }

  return { labels, columns };
}
