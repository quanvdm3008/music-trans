/**
 * Professional chord recognition engine.
 * - Identifies chords including inversions (slash chords like C/E, G/B)
 * - Ranks alternatives by confidence
 * - Explains why each chord was chosen
 * - Common chords in modern music are prioritized
 */

const PC_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface ChordTemplate {
  name: string;        // e.g. "maj7"
  suffix: string;      // e.g. "maj7"
  intervals: number[]; // semitones from root
  priority: number;    // higher = more common, preferred when tied
}

// Ordered by priority: most common chords first
const CHORD_TEMPLATES: ChordTemplate[] = [
  // === Triads (most common) ===
  { name: '', suffix: '', intervals: [0, 4, 7], priority: 100 },           // major
  { name: 'm', suffix: 'm', intervals: [0, 3, 7], priority: 95 },          // minor
  { name: 'dim', suffix: 'dim', intervals: [0, 3, 6], priority: 40 },      // diminished
  { name: 'aug', suffix: 'aug', intervals: [0, 4, 8], priority: 30 },      // augmented
  { name: 'sus4', suffix: 'sus4', intervals: [0, 5, 7], priority: 60 },    // sus4
  { name: 'sus2', suffix: 'sus2', intervals: [0, 2, 7], priority: 55 },    // sus2

  // === Sevenths ===
  { name: '7', suffix: '7', intervals: [0, 4, 7, 10], priority: 90 },      // dominant 7th
  { name: 'maj7', suffix: 'maj7', intervals: [0, 4, 7, 11], priority: 85 },// major 7th
  { name: 'm7', suffix: 'm7', intervals: [0, 3, 7, 10], priority: 80 },    // minor 7th
  { name: 'dim7', suffix: 'dim7', intervals: [0, 3, 6, 9], priority: 35 }, // dim 7th
  { name: 'm7♭5', suffix: 'm7♭5', intervals: [0, 3, 6, 10], priority: 35 },// half-dim
  { name: 'm(maj7)', suffix: 'm(maj7)', intervals: [0, 3, 7, 11], priority: 25 },

  // === Sixths ===
  { name: '6', suffix: '6', intervals: [0, 4, 7, 9], priority: 50 },       // major 6th
  { name: 'm6', suffix: 'm6', intervals: [0, 3, 7, 9], priority: 45 },     // minor 6th

  // === Add chords ===
  { name: 'add9', suffix: 'add9', intervals: [0, 4, 7, 14], priority: 55 }, // major add9
  { name: 'madd9', suffix: 'madd9', intervals: [0, 3, 7, 14], priority: 45 },

  // === Ninths ===
  { name: '9', suffix: '9', intervals: [0, 4, 7, 10, 14], priority: 40 },
  { name: 'maj9', suffix: 'maj9', intervals: [0, 4, 7, 11, 14], priority: 35 },
  { name: 'm9', suffix: 'm9', intervals: [0, 3, 7, 10, 14], priority: 30 },
];

/** Normalize pitch classes: drop octave, dedupe, sort */
function normalizePcs(notes: number[]): number[] {
  return [...new Set(notes.map(n => ((Math.round(n) % 12) + 12) % 12))].sort((a, b) => a - b);
}

function matchTemplate(actual: Set<number>, intervals: number[], root: number): boolean {
  return intervals.every(i => actual.has((root + i) % 12));
}

interface ScoredResult {
  root: string;
  suffix: string;
  name: string;       // full name e.g. "Cmaj7"
  bass: string;       // actual bass note name
  isInversion: boolean;
  slashName: string;  // e.g. "C/E" if inverted
  confidence: number;
  priority: number;
  explanation: string;
}

function scoreAndExplain(
  actual: Set<number>,
  intervals: number[],
  rootPc: number,
  bassPc: number,
  template: ChordTemplate,
): ScoredResult {
  let matched = 0;
  let extra: number[] = [];
  for (const i of intervals) {
    if (actual.has((rootPc + i) % 12)) matched++;
  }
  for (const pc of actual) {
    if (!intervals.some(i => (rootPc + i) % 12 === pc)) {
      extra.push(pc);
    }
  }

  const coverage = matched / intervals.length;
  const isInversion = bassPc !== rootPc;
  const rootName = PC_NAMES[rootPc];
  const bassName = PC_NAMES[bassPc];
  const slashName = isInversion ? `${rootName}${template.name}/${bassName}` : rootName + template.name;

  // Confidence: coverage * priority bonus * inversion penalty
  let confidence = coverage;
  if (extra.length === 0) confidence += 0.1;
  if (extra.length > 1) confidence -= extra.length * 0.05;
  if (isInversion) confidence *= 0.95;
  confidence = Math.min(0.99, Math.max(0.1, confidence));

  // Explanation
  const noteNames = Array.from(actual).map(pc => PC_NAMES[pc]).join('-');
  const rootNotes = intervals.map(i => PC_NAMES[(rootPc + i) % 12]).join('-');
  let explanation = `Các nốt ${noteNames} tạo thành ${rootName}${template.name} (${rootNotes})`;
  if (isInversion) {
    const inv = intervals.indexOf((bassPc - rootPc + 12) % 12);
    const invLabel = inv === 1 ? 'đảo 1' : inv === 2 ? 'đảo 2' : inv === 3 ? 'đảo 3' : 'đảo';
    explanation += ` ở thế ${invLabel} với bass là ${bassName}`;
  }
  if (extra.length > 0) {
    explanation += `. Nốt thêm: ${extra.map(pc => PC_NAMES[pc]).join(', ')}`;
  }

  return {
    root: rootName,
    suffix: template.suffix || '',
    name: rootName + template.name,
    bass: bassName,
    isInversion,
    slashName,
    confidence,
    priority: template.priority,
    explanation,
  };
}

export interface ChordResult {
  root: string;
  suffix: string;
  name: string;        // root name (no inversion)
  bass?: string;       // actual bass
  slashName?: string;  // with inversion e.g. "C/E"
  confidence: number;
  explanation: string;
  alternatives?: { name: string; confidence: number }[];
}

/**
 * Detect the best chord from MIDI pitch classes + optional bass note.
 * Returns alternatives ranked by confidence.
 */
export function detectChord(
  midiNotes: number[],
  bassMidi?: number,
): ChordResult | null {
  if (midiNotes.length === 0) return null;

  const pcs = normalizePcs(midiNotes);
  const pcSet = new Set(pcs);
  const bassPc = bassMidi != null ? ((Math.round(bassMidi) % 12) + 12) % 12 : pcs[0];

  if (pcs.length === 1) {
    const n = PC_NAMES[pcs[0]];
    return {
      root: n, suffix: '', name: n,
      confidence: 1,
      explanation: `Một nốt đơn ${n} — không đủ để xác định hợp âm.`,
      alternatives: [],
    };
  }

  // === Score all possible chords ===
  const allResults: ScoredResult[] = [];

  for (const rootPc of pcs) {
    for (const template of CHORD_TEMPLATES) {
      if (!matchTemplate(pcSet, template.intervals, rootPc)) continue;
      allResults.push(scoreAndExplain(pcSet, template.intervals, rootPc, bassPc, template));
    }
  }

  // Sort: confidence desc, then priority desc
  allResults.sort((a, b) => {
    const confDiff = b.confidence - a.confidence;
    if (Math.abs(confDiff) > 0.01) return confDiff;
    return b.priority - a.priority;
  });

  // === Fallback for 2 notes ===
  if (allResults.length === 0 && pcs.length >= 2) {
    const interval = (pcs[1] - pcs[0] + 12) % 12;
    const intervalNames: Record<number, string> = { 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4', 6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7' };
    const intName = intervalNames[interval] || `${interval}st`;
    const rootName = PC_NAMES[pcs[0]];
    const bassName = PC_NAMES[bassPc];

    // Suggest possible chords
    const suggestions: { name: string; confidence: number }[] = [];
    if (interval === 7) {
      suggestions.push({ name: rootName + '5', confidence: 0.7 });
      suggestions.push({ name: rootName, confidence: 0.5 });
      suggestions.push({ name: rootName + 'm', confidence: 0.3 });
    } else if (interval === 4) {
      suggestions.push({ name: rootName, confidence: 0.6 });
      suggestions.push({ name: rootName + 'm', confidence: 0.2 });
    } else if (interval === 3) {
      suggestions.push({ name: rootName + 'm', confidence: 0.6 });
      suggestions.push({ name: rootName, confidence: 0.2 });
    }

    return {
      root: rootName,
      suffix: intName,
      name: bassPc !== pcs[0] ? `${rootName}/${bassName}` : rootName,
      bass: bassName,
      slashName: bassPc !== pcs[0] ? `${rootName}/${bassName}` : undefined,
      confidence: 0.4,
      explanation: `Chỉ có 2 nốt ${PC_NAMES[pcs[0]]}-${PC_NAMES[pcs[1]]} (quãng ${intName}). Không đủ xác định hợp âm duy nhất.`,
      alternatives: suggestions,
    };
  }

  // === No match at all ===
  if (allResults.length === 0) {
    const n = PC_NAMES[pcs[0]];
    return {
      root: n, suffix: '?', name: n + '?',
      confidence: 0.15,
      explanation: `Tổ hợp nốt ${Array.from(pcSet).map(pc => PC_NAMES[pc]).join('-')} không khớp mẫu hợp âm nào.`,
      alternatives: [],
    };
  }

  // === Best result ===
  const best = allResults[0];
  const alternatives = allResults.slice(1, 4).map(r => ({
    name: r.slashName,
    confidence: r.confidence,
  }));

  return {
    root: best.root,
    suffix: best.suffix,
    name: best.isInversion ? best.slashName : best.name,
    bass: best.bass,
    slashName: best.isInversion ? best.slashName : undefined,
    confidence: best.confidence,
    explanation: best.explanation,
    alternatives: alternatives.length > 0 ? alternatives : [],
  };
}

// ============================================================
// Bar-based chord detection (re-exported)
// ============================================================

export interface ChordEvent {
  time: number;
  chord: ChordResult;
  notes: number[];
}

export function detectChordsFromNotes(
  notes: { pitchMidi: number; startTimeSeconds: number }[],
  options?: { bpm?: number; beatsPerBar?: number } | number,
): ChordEvent[] {
  if (notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

  if (typeof options === 'object' && options?.bpm && options?.beatsPerBar) {
    const { bpm, beatsPerBar } = options;
    const barDuration = (60 / bpm) * beatsPerBar;
    const totalBars = Math.ceil(sorted[sorted.length - 1].startTimeSeconds / barDuration) + 1;

    const events: ChordEvent[] = [];
    let lastChord: ChordResult | null = null;

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * barDuration;
      const barEnd = (bar + 1) * barDuration;
      const barNotes = sorted
        .filter(n => n.startTimeSeconds >= barStart && n.startTimeSeconds < barEnd)
        .map(n => Math.round(n.pitchMidi));

      if (barNotes.length > 0) {
        const bass = Math.min(...barNotes);
        const chord = detectChord(barNotes, bass);
        if (chord && chord.confidence >= 0.3) {
          lastChord = chord;
          events.push({ time: barStart, chord, notes: barNotes });
        } else if (lastChord) {
          events.push({ time: barStart, chord: lastChord, notes: barNotes });
        }
      } else if (lastChord) {
        events.push({ time: barStart, chord: lastChord, notes: [] });
      }
    }
    return events;
  }

  // Fallback: time-window
  const windowMs = typeof options === 'number' ? options : 150;
  const events: ChordEvent[] = [];
  let currentGroup: number[] = [];
  let groupTime = sorted[0].startTimeSeconds;

  for (const note of sorted) {
    const gap = note.startTimeSeconds - groupTime;
    if (gap > windowMs / 1000 && currentGroup.length > 0) {
      const bass = Math.min(...currentGroup);
      const chord = detectChord(currentGroup, bass);
      if (chord) events.push({ time: groupTime, chord, notes: [...currentGroup] });
      currentGroup = [];
      groupTime = note.startTimeSeconds;
    }
    currentGroup.push(Math.round(note.pitchMidi));
  }

  if (currentGroup.length > 0) {
    const bass = Math.min(...currentGroup);
    const chord = detectChord(currentGroup, bass);
    if (chord) events.push({ time: groupTime, chord, notes: [...currentGroup] });
  }

  return events;
}

// ============================================================
// Key detection (unchanged)
// ============================================================

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export function detectKey(notes: { pitchMidi: number }[]): { key: string; confidence: number } | null {
  if (notes.length === 0) return null;
  const counts = new Array(12).fill(0);
  for (const n of notes) counts[((Math.round(n.pitchMidi) % 12) + 12) % 12]++;
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const vec = counts.map(c => c / total);

  let bestScore = -Infinity, bestKey = '';
  for (let tonic = 0; tonic < 12; tonic++) {
    let score = 0;
    for (let i = 0; i < 12; i++) score += vec[i] * MAJOR_PROFILE[(i - tonic + 12) % 12];
    if (score > bestScore) { bestScore = score; bestKey = PC_NAMES[tonic] + ' Major'; }
    score = 0;
    for (let i = 0; i < 12; i++) score += vec[i] * MINOR_PROFILE[(i - tonic + 12) % 12];
    if (score > bestScore) { bestScore = score; bestKey = PC_NAMES[tonic] + ' Minor'; }
  }
  return { key: bestKey, confidence: Math.min(0.99, Math.max(0.3, bestScore * 10)) };
}
