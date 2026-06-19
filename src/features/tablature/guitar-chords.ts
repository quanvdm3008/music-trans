/**
 * Guitar chord voicing database — standard tuning (E A D G B e).
 * Fret positions per string, index 0 = high e, index 5 = low E.
 * null = muted string, 0 = open string, 1+ = fret number.
 * Barre chords use the lowest root-position shape and are transposed by capo/fret.
 */

export interface ChordFingering {
  /** Fret per string (high e → low E), null = muted. */
  frets: (number | null)[];
  /** Optional barre fret (the index finger bars across this fret). */
  barre?: number;
  /** Starting fret for transposable shapes (0 = open position). */
  baseFret?: number;
}

type ChordKey = string; // e.g. "C", "Cm", "C7", "Cmaj7"

// Open-position chords (baseFret = 0)
const OPEN_CHORDS: Record<ChordKey, ChordFingering> = {
  // === Major ===
  C:  { frets: [0, 1, 0, 2, 3, null], baseFret: 0 },  // x32010
  D:  { frets: [2, 3, 2, 0, null, null], baseFret: 0 }, // xx0232
  E:  { frets: [0, 0, 1, 2, 2, 0], baseFret: 0 },      // 022100
  F:  { frets: [1, 1, 2, 3, 3, 1], barre: 1, baseFret: 1 }, // 133211
  G:  { frets: [3, 0, 0, 0, 2, 3], baseFret: 0 },      // 320003
  A:  { frets: [0, 2, 2, 2, 0, null], baseFret: 0 },    // x02220
  B:  { frets: [2, 4, 4, 4, 2, 2], barre: 2, baseFret: 2 }, // 224442

  // === Minor ===
  Cm: { frets: [3, 4, 5, 5, 3, 3], barre: 3, baseFret: 3 }, // barre
  Dm: { frets: [1, 3, 2, 0, null, null], baseFret: 0 },      // xx0231
  Em: { frets: [0, 0, 0, 2, 2, 0], baseFret: 0 },            // 022000
  Fm: { frets: [1, 1, 1, 3, 3, 1], barre: 1, baseFret: 1 }, // 133111
  Gm: { frets: [3, 3, 3, 5, 5, 3], barre: 3, baseFret: 3 }, // barre
  Am: { frets: [0, 1, 2, 2, 0, null], baseFret: 0 },         // x02210
  Bm: { frets: [2, 3, 4, 4, 2, 2], barre: 2, baseFret: 2 }, // barre

  // === Dominant 7th ===
  C7: { frets: [0, 1, 3, 2, 3, null], baseFret: 0 },         // x32310
  D7: { frets: [2, 1, 2, 0, null, null], baseFret: 0 },       // xx0212
  E7: { frets: [0, 0, 1, 0, 2, 0], baseFret: 0 },            // 020100
  F7: { frets: [1, 1, 2, 1, 3, 1], barre: 1, baseFret: 1 },  // 131211
  G7: { frets: [1, 0, 0, 0, 2, 3], baseFret: 0 },            // 320001
  A7: { frets: [0, 2, 0, 2, 0, null], baseFret: 0 },          // x02020
  B7: { frets: [2, 0, 2, 1, 2, null], baseFret: 0 },          // x21202

  // === Major 7th ===
  Cmaj7:  { frets: [0, 0, 0, 2, 3, null], baseFret: 0 },     // x32000
  Dmaj7:  { frets: [2, 2, 2, 0, null, null], baseFret: 0 },   // xx0222
  Emaj7:  { frets: [0, 0, 1, 1, 2, 0], baseFret: 0 },        // 021100
  Fmaj7:  { frets: [0, 1, 2, 3, null, null], baseFret: 0 },   // xx3210
  Gmaj7:  { frets: [2, 0, 0, 0, 2, 3], baseFret: 0 },        // 320002
  Amaj7:  { frets: [0, 2, 1, 2, 0, null], baseFret: 0 },      // x02120

  // === Minor 7th ===
  Dm7: { frets: [1, 1, 2, 0, null, null], baseFret: 0 },      // xx0211
  Em7: { frets: [0, 0, 0, 0, 2, 0], baseFret: 0 },           // 020000
  Am7: { frets: [0, 1, 0, 2, 0, null], baseFret: 0 },         // x02010
  Bm7: { frets: [2, 0, 2, 2, 2, null], baseFret: 0 },         // x20202

  // === Diminished ===
  Bdim: { frets: [1, 0, 3, 2, 0, null], baseFret: 0 },       // x23010
  Ddim: { frets: [1, 0, 1, null, null, null], baseFret: 0 }, // xx0101

  // === Sus4 ===
  Dsus4: { frets: [3, 3, 2, 0, null, null], baseFret: 0 },    // xx0233
  Esus4: { frets: [0, 0, 2, 2, 2, 0], baseFret: 0 },         // 022200
  Asus4: { frets: [0, 3, 2, 2, 0, null], baseFret: 0 },       // x02230
};

/**
 * Movable barre-chord templates — transpose by root fret.
 * interval: semitones from nut/barre to root note on low E or A string.
 */
interface MovableShape {
  type: string;        // e.g. "maj", "m", "7", "maj7", "m7"
  rootString: 5 | 4;   // 5 = low E, 4 = A string
  interval: number;     // semitones from nut/barre to root
  frets: (number | null)[];
  barre: number;
}

const MOVABLE_SHAPES: MovableShape[] = [
  // E-form (root on low E, string 5): barre at root
  { type: '',      rootString: 5, interval: 0,  frets: [0, 0, 1, 2, 2, 0], barre: 1 },  // E major
  { type: 'm',     rootString: 5, interval: 0,  frets: [0, 0, 0, 2, 2, 0], barre: 1 },  // Em
  { type: '7',     rootString: 5, interval: 0,  frets: [0, 0, 1, 0, 2, 0], barre: 1 },  // E7
  { type: 'maj7',  rootString: 5, interval: 0,  frets: [0, 0, 1, 1, 2, 0], barre: 1 },  // Emaj7
  { type: 'm7',    rootString: 5, interval: 0,  frets: [0, 0, 0, 0, 2, 0], barre: 1 },  // Em7
  // A-form (root on A, string 4): barre at root
  { type: '',      rootString: 4, interval: 0,  frets: [0, 2, 2, 2, 0, null], barre: 1 }, // A major
  { type: 'm',     rootString: 4, interval: 0,  frets: [0, 1, 2, 2, 0, null], barre: 1 }, // Am
  { type: '7',     rootString: 4, interval: 0,  frets: [0, 2, 0, 2, 0, null], barre: 1 }, // A7
  { type: 'maj7',  rootString: 4, interval: 0,  frets: [0, 2, 1, 2, 0, null], barre: 1 }, // Amaj7
  { type: 'm7',    rootString: 4, interval: 0,  frets: [0, 1, 0, 2, 0, null], barre: 1 }, // Am7
];

/** Map note name to semitone (C=0...B=11). */
const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10,
  Bb: 10, B: 11,
};

/** Map chord suffix to type for lookup (e.g. "m7♭5" -> m7b5). */
function suffixToType(suffix: string): string {
  const s = suffix.toLowerCase();
  if (s === '' || s === 'maj') return '';
  if (s === 'm' || s === 'min') return 'm';
  if (s === '7') return '7';
  if (s === 'maj7') return 'maj7';
  if (s === 'm7') return 'm7';
  if (s === 'dim' || s === 'dim7') return 'dim';
  if (s === 'sus4') return 'sus4';
  return '';
}

const SHARP_KEYS = new Set(['G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m']);
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);

function rootSemitone(root: string): number {
  // Handle flat/double-flat notation
  if (root.endsWith('bb')) return (NOTE_TO_SEMITONE[root.slice(0, -2)] ?? 0) - 2;
  if (root.endsWith('b')) return NOTE_TO_SEMITONE[root] ?? NOTE_TO_SEMITONE[root.slice(0, -1) + 'b'] ?? 0;
  return NOTE_TO_SEMITONE[root] ?? 0;
}

/** Transpose a fingering by `fret` frets up the neck. */
function transposeFingering(f: ChordFingering, fret: number): ChordFingering {
  if (fret === 0) return f;
  return {
    frets: f.frets.map((fr) => (fr != null ? fr + fret : null)),
    barre: f.barre != null ? f.barre + fret : undefined,
    baseFret: (f.baseFret ?? 0) + fret,
  };
}

/**
 * Look up a guitar chord fingering for a given chord name and optional key context.
 * Returns null if no suitable voicing is found.
 */
export function lookupGuitarChord(
  chordName: string,
  keyRoot?: string,
): ChordFingering | null {
  // Parse "Cmaj7" -> root="C", type="maj7"
  const match = chordName.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) return null;
  const [, root, rawSuffix] = match;
  const suffix = suffixToType(rawSuffix);

  // 1. Try open chord first (only for roots that have open shapes)
  const directKey = root + (suffix === '' ? '' : suffix === 'm' ? 'm' : suffix);
  const openChord = OPEN_CHORDS[directKey];
  if (openChord && openChord.baseFret === 0) return openChord;

  // 2. Try movable shapes
  const rootSt = rootSemitone(root);
  const suffixForMovable = suffix === '' ? '' : suffix;

  for (const shape of MOVABLE_SHAPES) {
    if (shape.type !== suffixForMovable) continue;
    // Compute which fret to place the barre
    const stringSt = shape.rootString === 5 ? NOTE_TO_SEMITONE['E'] ?? 4 : NOTE_TO_SEMITONE['A'] ?? 9;
    let fret = (rootSt - stringSt - shape.interval + 12) % 12;
    if (fret === 0) fret = 12; // use 12th fret instead of open for barre shapes
    if (fret < 1 || fret > 15) continue;

    const base: ChordFingering = {
      frets: shape.frets.map((fr) => {
        if (fr == null) return null;
        // The shape's first note is at barre position
        return fr + fret - shape.barre;
      }),
      barre: fret,
      baseFret: fret,
    };

    // For A-form shapes on string 4 root, mute low E
    if (shape.rootString === 4 && shape.frets[5] != null) {
      base.frets[5] = null;
    }

    return base;
  }

  // 3. Try open chord with barre transposition for same voicing type
  // E.g., Fm -> look up Em and transpose +1
  if (openChord) {
    // Already tried above, no match
  }

  // Find any open chord with matching type and transpose
  for (const [key, fingering] of Object.entries(OPEN_CHORDS)) {
    const keyMatch = key.match(/^([A-G](?:#|b)?)(.*)$/);
    if (!keyMatch) continue;
    const [, keyRoot, keySuffix] = keyMatch;
    if (suffixToType(keySuffix) !== suffix) continue;
    if (fingering.baseFret !== 0) continue;

    const keySt = rootSemitone(keyRoot);
    let delta = (rootSt - keySt + 12) % 12;
    if (delta === 0) continue; // same root, already tried
    if (delta < 1 || delta > 11) continue;

    return transposeFingering(fingering, delta);
  }

  return null;
}

/**
 * Get a human-readable description of the chord fingering.
 */
export function describeFingering(f: ChordFingering, capo = 0): string {
  const parts: string[] = [];
  const effectiveFrets = f.frets.map((fr) => (fr != null ? fr - capo : null));
  
  for (let s = 0; s < effectiveFrets.length; s++) {
    const fret = effectiveFrets[s];
    if (fret == null) parts.push('x');
    else if (fret <= 0) parts.push('0');
    else parts.push(String(fret));
  }
  
  let desc = parts.join(' ');
  if (capo > 0) desc += `  (capo ${capo})`;
  if (f.barre != null) {
    const effectiveBarre = f.barre - capo;
    desc += `  barre ${effectiveBarre > 0 ? effectiveBarre : 1}`;
  }
  return desc;
}

/**
 * Search for the best matching guitar chord voicing given a set of MIDI notes.
 * Returns the chord name + fingering if found.
 */
export function detectGuitarChord(
  midiNotes: number[],
): { name: string; fingering: ChordFingering } | null {
  if (midiNotes.length < 2) return null;

  // Normalize to pitch classes
  const pcs = [...new Set(midiNotes.map((n) => ((Math.round(n) % 12) + 12) % 12))].sort((a, b) => a - b);

  // Try matching against known chord fingerings
  let best: { name: string; fingering: ChordFingering; score: number } | null = null;

  for (const [chordName, fingering] of Object.entries(OPEN_CHORDS)) {
    const chordPcs = new Set<number>();
    for (let s = 0; s < fingering.frets.length; s++) {
      const fret = fingering.frets[s];
      if (fret == null) continue;
      const openMidi = [64, 59, 55, 50, 45, 40][s];
      if (openMidi == null) continue;
      const midi = openMidi + fret;
      chordPcs.add(midi % 12);
    }

    // Score: how many detected notes match the chord
    let matchCount = 0;
    for (const pc of pcs) {
      if (chordPcs.has(pc)) matchCount++;
    }
    const score = matchCount / Math.max(pcs.length, chordPcs.size);
    if (score >= 0.5 && (!best || score > best.score)) {
      best = { name: chordName, fingering, score };
    }
  }

  return best ? { name: best.name, fingering: best.fingering } : null;
}
