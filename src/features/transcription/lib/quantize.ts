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
    const treble = quantized.filter((n) => n.midi >= settings.splitMidi);
    const bass = quantized.filter((n) => n.midi < settings.splitMidi);
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
