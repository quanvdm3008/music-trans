// Quantize raw note events into a measure/voice model suitable for notation.
//
// Pipeline: NoteEventTime[] (seconds) -> grid units -> per-staff chord/rest
// timeline (spans.ts) -> split at barlines -> decompose each span into tied
// note values (note-values.ts). The result (MeasureElement[][] per staff) is
// rendered to MusicXML elsewhere.

import type { NoteEventTime } from '../../../core/music/note-event';
import { MIDDLE_C } from '../../../core/music/notation';
import { noteValueTable } from './note-values';
import { buildSpans, medianMidi, secondsToUnits, spansToMeasures } from './spans';
import type { QuantizedScore, ScoreSettings, StaffNotation } from './quantize.types';

export type { ScoreMode, ScoreSettings, MeasureElement, StaffNotation, QuantizedScore } from './quantize.types';

export const DEFAULT_SCORE_SETTINGS: ScoreSettings = {
  tempo: 120,
  beats: 4,
  beatType: 4,
  keyFifths: 0,
  gridDivisionsPerQuarter: 4,
  mode: 'piano',
  splitMidi: MIDDLE_C,
};

/** A single hand can comfortably span a 10th = octave + major third = 16 semitones. */
const MAX_HAND_SPAN = 16;
/** Slightly wider span for the left hand (bass can stretch more). */
const MAX_BASS_SPAN = 19;

/** Result of hand-span capping: which notes were kept and which were dropped. */
interface CapHandResult<T> {
  kept: T[];
  dropped: T[];
}

/**
 * Cap each onset-chord to one hand's reach. Real pianists can't grab notes more
 * than ~a 10th apart with one hand, so the detector's wide vertical stacks are
 * unplayable. We keep the outer voice — the top note for the right hand
 * (where the melody usually sits) and the bottom note for the left hand (the
 * bass) — and drop anything farther than the hand span from that anchor.
 *
 * When `previousMidis` is provided (notes from the previous same-hand chord),
 * the filter prefers keeping notes that create smooth voice leading (small
 * intervals from the previous chord's notes), so the hand doesn't jump around.
 *
 * Returns both kept and dropped notes so the caller can try cross-staff
 * redistribution (give dropped notes to the other hand).
 */
function capHandSpan<T extends { start: number; midi: number }>(
  notes: T[],
  keep: 'top' | 'bottom',
  maxSpan = MAX_HAND_SPAN,
  previousMidis?: number[],
): CapHandResult<T> {
  const byOnset = new Map<number, T[]>();
  for (const n of notes) {
    const arr = byOnset.get(n.start);
    if (arr) arr.push(n);
    else byOnset.set(n.start, [n]);
  }

  const sortedOnsets = [...byOnset.keys()].sort((a, b) => a - b);
  const kept: T[] = [];
  const dropped: T[] = [];

  for (let oi = 0; oi < sortedOnsets.length; oi++) {
    const onset = sortedOnsets[oi];
    const arr = byOnset.get(onset)!;
    if (arr.length <= 1) {
      kept.push(...arr);
      previousMidis = arr.map((n) => n.midi);
      continue;
    }
    const midis = arr.map((n) => n.midi);
    const anchor = keep === 'top' ? Math.max(...midis) : Math.min(...midis);

    // Collect all notes within span, scored by voice-leading quality.
    interface ScoredNote { note: T; score: number }
    const scored: ScoredNote[] = [];
    const noteKey = (n: T) => `${n.start}:${n.midi}`;
    const outOfReach = new Set<string>();
    for (const n of arr) {
      const within = keep === 'top' ? n.midi >= anchor - maxSpan : n.midi <= anchor + maxSpan;
      if (!within) {
        dropped.push(n);
        outOfReach.add(noteKey(n));
        continue;
      }
      // Voice-leading score: smaller interval to nearest previous note = better.
      let score = 0;
      if (previousMidis && previousMidis.length > 0) {
        const minDist = Math.min(...previousMidis.map((pm) => Math.abs(n.midi - pm)));
        // Prefer notes within an octave of a previous note; penalize jumps > 12.
        score = minDist <= 12 ? 12 - minDist : -(minDist - 12);
      }
      scored.push({ note: n, score });
    }

    if (scored.length <= 1) {
      kept.push(...scored.map((s) => s.note));
      previousMidis = scored.map((s) => s.note.midi);
      continue;
    }

    // Keep the anchor note always, then keep additional notes up to a
    // comfortable 4-note chord, preferring better voice-leading scores.
    const keepAnchor = scored.find((s) => s.note.midi === anchor);
    const others = scored.filter((s) => s.note.midi !== anchor).sort((a, b) => b.score - a.score);
    const keptHere: T[] = keepAnchor ? [keepAnchor.note] : [];
    const MAX_CHORD_NOTES = 4;
    for (const s of others) {
      if (keptHere.length >= MAX_CHORD_NOTES) {
        dropped.push(s.note);
        continue;
      }
      keptHere.push(s.note);
    }
    kept.push(...keptHere);
    previousMidis = keptHere.map((n) => n.midi);
  }
  return { kept, dropped };
}

/** Quantize note events into a full score model. */
export function quantizeScore(notes: NoteEventTime[], settings: ScoreSettings): QuantizedScore {
  const divisions = Math.max(1, Math.round(settings.gridDivisionsPerQuarter));
  const secondsPerQuarter = 60 / Math.max(1, settings.tempo);
  const secondsPerGrid = secondsPerQuarter / divisions;

  const divisionsPerMeasure = Math.max(
    1,
    Math.round(settings.beats * (4 / settings.beatType) * divisions),
  );

  // Quantize to integer grid units.
  const quantized = notes
    .map((n) => ({
      start: Math.max(0, secondsToUnits(n.startTimeSeconds, secondsPerGrid)),
      dur: Math.max(1, secondsToUnits(n.durationSeconds, secondsPerGrid)),
      midi: Math.round(n.pitchMidi),
    }))
    .filter((n) => n.midi >= 0 && n.midi <= 127);

  const maxEnd = quantized.reduce((mx, n) => Math.max(mx, n.start + n.dur), 0);
  const numberOfMeasures = Math.max(1, Math.ceil(maxEnd / divisionsPerMeasure));
  const totalUnits = numberOfMeasures * divisionsPerMeasure;
  const table = noteValueTable(divisions);

  let staves: StaffNotation[];
  if (settings.mode === 'melody') {
    const median = medianMidi(quantized.map((n) => n.midi));
    const clef: 'treble' | 'bass' = median != null && median < 56 ? 'bass' : 'treble';
    staves = [
      {
        clef,
        measures: spansToMeasures(
          buildSpans(quantized, totalUnits),
          divisionsPerMeasure,
          numberOfMeasures,
          table,
        ),
      },
    ];
  } else {
    // Piano: adaptive two-hand assignment with cross-staff redistribution.
    const { treble, bass } = assignPianoHands(quantized, settings.splitMidi);
    staves = [
      {
        clef: 'treble',
        measures: spansToMeasures(
          buildSpans(treble, totalUnits),
          divisionsPerMeasure,
          numberOfMeasures,
          table,
        ),
      },
      {
        clef: 'bass',
        measures: spansToMeasures(
          buildSpans(bass, totalUnits),
          divisionsPerMeasure,
          numberOfMeasures,
          table,
        ),
      },
    ];
  }

  return { settings, divisions, divisionsPerMeasure, numberOfMeasures, staves };
}

/**
 * Adaptive piano hand assignment: split notes between two hands comfortably.
 *
 * 1. Finds a natural split point (not rigidly middle C) based on note clusters.
 * 2. Caps each hand to its comfortable span with voice-leading.
 * 3. Redistributes dropped notes to the other hand when possible (cross-staff).
 *
 * This makes both hands comfortable — no note is dropped if either hand can
 * reach it, and the split adapts to the music instead of being fixed at C4.
 */
function assignPianoHands(
  quantized: { start: number; dur: number; midi: number }[],
  splitMidi: number,
): { treble: typeof quantized; bass: typeof quantized } {
  // Step 1: adaptive split — find the natural gap between note clusters.
  const activeSplit = findBestSplit(quantized, splitMidi);

  // Step 2: initial assignment.
  const trebleNotes = quantized.filter((n) => n.midi >= activeSplit);
  const bassNotes = quantized.filter((n) => n.midi < activeSplit);

  // Step 3: cap each hand independently.
  const trebleResult = capHandSpan(trebleNotes, 'top', MAX_HAND_SPAN);
  const bassResult = capHandSpan(bassNotes, 'bottom', MAX_BASS_SPAN);

  let treble = trebleResult.kept;
  let bass = bassResult.kept;
  let droppedTreble = trebleResult.dropped;
  let droppedBass = bassResult.dropped;

  // Step 4: cross-staff redistribution — give dropped notes to the other hand.
  // Try up to 2 passes: some notes might only fit after the other hand's drops are added.
  for (let pass = 0; pass < 2; pass++) {
    if (droppedTreble.length === 0 && droppedBass.length === 0) break;

    // Try moving dropped treble notes to the bass hand.
    const stillDroppedTreble: typeof droppedTreble = [];
    for (const note of droppedTreble) {
      if (canHandTakeNote(note, bass, 'bottom', MAX_BASS_SPAN)) {
        bass.push(note);
      } else {
        stillDroppedTreble.push(note);
      }
    }

    // Try moving dropped bass notes to the treble hand.
    const stillDroppedBass: typeof droppedBass = [];
    for (const note of droppedBass) {
      if (canHandTakeNote(note, treble, 'top', MAX_HAND_SPAN)) {
        treble.push(note);
      } else {
        stillDroppedBass.push(note);
      }
    }

    droppedTreble = stillDroppedTreble;
    droppedBass = stillDroppedBass;
  }

  // Sort each hand by onset then pitch.
  treble.sort((a, b) => a.start - b.start || a.midi - b.midi);
  bass.sort((a, b) => a.start - b.start || a.midi - b.midi);

  return { treble, bass };
}

/**
 * Find the best MIDI split point by looking for a natural gap in the note
 * distribution. Returns a value near `defaultSplit` but shifted toward any
 * significant gap in the note MIDI range.
 *
 * Strategy: scan around the default split (±1 octave) and pick the MIDI value
 * with the fewest notes crossing it, so the split falls in a natural "rest" zone.
 */
function findBestSplit(
  notes: { midi: number }[],
  defaultSplit: number,
): number {
  if (notes.length < 4) return defaultSplit;

  // Build a histogram of note counts per MIDI pitch.
  const hist = new Map<number, number>();
  for (const n of notes) {
    const m = Math.round(n.midi);
    hist.set(m, (hist.get(m) ?? 0) + 1);
  }

  const range = 12; // search ±1 octave around default
  let bestSplit = defaultSplit;
  let bestGap = -Infinity;

  for (let split = defaultSplit - range; split <= defaultSplit + range; split++) {
    // "Gap" = how few notes exist in a 4-semitone window centered at the split.
    // A large gap means the split naturally separates two clusters.
    let nearbyNotes = 0;
    for (let d = -2; d <= 2; d++) {
      nearbyNotes += hist.get(split + d) ?? 0;
    }
    // We want the split with the FEWEST nearby notes AND close to default.
    const gapScore = -nearbyNotes - Math.abs(split - defaultSplit) * 0.3;
    if (gapScore > bestGap) {
      bestGap = gapScore;
      bestSplit = split;
    }
  }

  return bestSplit;
}

/**
 * Check whether a hand (with its current notes) can additionally take `note`
 * without exceeding its maximum span. Considers only notes at the same onset.
 */
function canHandTakeNote(
  note: { start: number; midi: number },
  handNotes: { start: number; midi: number }[],
  keep: 'top' | 'bottom',
  maxSpan: number,
): boolean {
  // Find all notes in the hand at the same onset.
  const sameOnset = handNotes.filter((n) => n.start === note.start);
  if (sameOnset.length === 0) return true; // no conflict — hand is free

  const withNew = [...sameOnset.map((n) => n.midi), note.midi];
  const anchor = keep === 'top' ? Math.max(...withNew) : Math.min(...withNew);

  for (const m of withNew) {
    const within = keep === 'top' ? m >= anchor - maxSpan : m <= anchor + maxSpan;
    if (!within) return false;
  }
  return true;
}

/**
 * Turn the *engraved* score back into playable notes so the audio is exactly
 * what the staff shows — same pitches, same onsets, same durations, with tied
 * notes merged into one sustained note. This is the single source of truth:
 * playback, the piano-roll highlight, and the printed sheet all read from here.
 *
 * For piano mode, notes are extended with a legato overlap (≈30 ms) so they
 * connect smoothly instead of feeling detached / choppy.
 */
export function scoreToPlaybackNotes(score: QuantizedScore): NoteEventTime[] {
  const secondsPerGrid = 60 / Math.max(1, score.settings.tempo) / Math.max(1, score.divisions);
  const isPiano = score.settings.mode === 'piano';
  // Legato overlap: extend each note by ~30 ms so it rings into the next note.
  const legatoOverlapSeconds = isPiano ? 0.03 : 0;
  const result: NoteEventTime[] = [];

  for (const staff of score.staves) {
    // Notes mid-tie, keyed by MIDI pitch: { startUnits, durUnits }.
    const pending = new Map<number, { startUnits: number; durUnits: number }>();

    for (let m = 0; m < staff.measures.length; m++) {
      const base = m * score.divisionsPerMeasure;
      let cursor = 0;
      for (const el of staff.measures[m]) {
        const startUnits = base + cursor;
        cursor += el.durationUnits;
        if (el.isRest) continue;

        for (const midi of el.midis) {
          const open = pending.get(midi);
          if (el.tieStop && open) {
            open.durUnits += el.durationUnits;
          } else {
            pending.set(midi, { startUnits, durUnits: el.durationUnits });
          }
          if (!el.tieStart) {
            const note = pending.get(midi)!;
            const durSeconds = note.durUnits * secondsPerGrid + legatoOverlapSeconds;
            // Natural piano amplitude: bass notes slightly fuller, treble slightly softer.
            // Maps MIDI 21–108 to amplitude ~0.35–0.55 for a gentle, realistic curve.
            const pianoAmp = isPiano ? 0.35 + ((midi - 21) / (108 - 21)) * 0.20 : 0.7;
            result.push({
              pitchMidi: midi,
              startTimeSeconds: note.startUnits * secondsPerGrid,
              durationSeconds: durSeconds,
              amplitude: pianoAmp,
            } as NoteEventTime);
            pending.delete(midi);
          }
        }
      }
    }
  }

  return result.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
}
