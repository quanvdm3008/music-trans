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

/**
 * Cap each onset-chord to one hand's reach. Real pianists can't grab notes more
 * than ~a 10th apart with one hand, so the detector's wide vertical stacks are
 * unplayable ("dư"). We keep the outer voice — the top note for the right hand
 * (where the melody usually sits) and the bottom note for the left hand (the
 * bass) — and drop anything farther than a 10th from that anchor.
 */
function capHandSpan<T extends { start: number; midi: number }>(
  notes: T[],
  keep: 'top' | 'bottom',
  maxSpan = MAX_HAND_SPAN,
): T[] {
  const byOnset = new Map<number, T[]>();
  for (const n of notes) {
    const arr = byOnset.get(n.start);
    if (arr) arr.push(n);
    else byOnset.set(n.start, [n]);
  }
  const out: T[] = [];
  for (const arr of byOnset.values()) {
    if (arr.length <= 1) {
      out.push(...arr);
      continue;
    }
    const midis = arr.map((n) => n.midi);
    const anchor = keep === 'top' ? Math.max(...midis) : Math.min(...midis);
    for (const n of arr) {
      const within = keep === 'top' ? n.midi >= anchor - maxSpan : n.midi <= anchor + maxSpan;
      if (within) out.push(n);
    }
  }
  return out;
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
    const treble = capHandSpan(quantized.filter((n) => n.midi >= settings.splitMidi), 'top');
    const bass = capHandSpan(quantized.filter((n) => n.midi < settings.splitMidi), 'bottom');
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
 * Turn the *engraved* score back into playable notes so the audio is exactly
 * what the staff shows — same pitches, same onsets, same durations, with tied
 * notes merged into one sustained note. This is the single source of truth:
 * playback, the piano-roll highlight, and the printed sheet all read from here.
 */
export function scoreToPlaybackNotes(score: QuantizedScore): NoteEventTime[] {
  const secondsPerGrid = 60 / Math.max(1, score.settings.tempo) / Math.max(1, score.divisions);
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
            result.push({
              pitchMidi: midi,
              startTimeSeconds: note.startUnits * secondsPerGrid,
              durationSeconds: note.durUnits * secondsPerGrid,
              amplitude: 0.7,
            } as NoteEventTime);
            pending.delete(midi);
          }
        }
      }
    }
  }

  return result.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
}
