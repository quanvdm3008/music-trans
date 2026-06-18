// Shared types for the note-quantization pipeline (see quantize.ts).

export type ScoreMode = 'piano' | 'melody';

export interface ScoreSettings {
  /** Tempo in BPM (quarter-note beat). Drives seconds -> note-value mapping. */
  tempo: number;
  /** Time signature numerator. */
  beats: number;
  /** Time signature denominator (2, 4, 8 ...). */
  beatType: number;
  /** Key signature in fifths: -7..+7 (negative = flats). */
  keyFifths: number;
  /** Grid resolution in divisions per quarter note (1=quarter, 2=eighth, 4=16th). */
  gridDivisionsPerQuarter: number;
  /** Grand staff (piano) vs single treble/bass staff (melody). */
  mode: ScoreMode;
  /** Split point between staves for piano mode (default middle C). */
  splitMidi: number;
  title?: string;
}

/** A single notated element: a rest, a single note, or a chord. */
export interface MeasureElement {
  isRest: boolean;
  /** MIDI pitches; multiple = chord. Empty for rests. */
  midis: number[];
  /** Duration in divisions (grid units). */
  durationUnits: number;
  /** MusicXML note type, e.g. 'quarter', 'eighth', '16th'. */
  type: string;
  /** Number of augmentation dots (0 or 1). */
  dots: number;
  /** This element ties INTO the next element (same original note continues). */
  tieStart: boolean;
  /** This element is tied FROM the previous element. */
  tieStop: boolean;
}

export interface StaffNotation {
  clef: 'treble' | 'bass';
  /** Elements grouped per measure. */
  measures: MeasureElement[][];
}

export interface QuantizedScore {
  settings: ScoreSettings;
  /** MusicXML <divisions> per quarter note. */
  divisions: number;
  divisionsPerMeasure: number;
  numberOfMeasures: number;
  /** One staff (melody) or two (piano grand staff, treble then bass). */
  staves: StaffNotation[];
}
