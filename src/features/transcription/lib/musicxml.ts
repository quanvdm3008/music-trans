// Serialize a QuantizedScore into MusicXML 4.0 (score-partwise).
//
// A grand staff (piano) is one <part> with <staves>2</staves>: voice 1 on the
// treble staff, voice 2 on the bass staff, separated by a <backup>. Renderers
// (incl. Verovio) draw the brace automatically.

import type { MeasureElement, QuantizedScore, StaffNotation } from './quantize';
import { keyUsesFlats, spellMidi } from '../../../core/music/notation';

const COMPOSER = 'Tự động chuyển từ audio (Basic Pitch)';

export interface MusicXmlMeta {
  title?: string;
  partName?: string;
}

export function scoreToMusicXml(score: QuantizedScore, meta: MusicXmlMeta = {}): string {
  const title = meta.title?.trim() || 'Bản ký âm tự động';
  const partName = meta.partName?.trim() || (score.settings.mode === 'piano' ? 'Piano' : 'Nhạc cụ');
  const useFlats = keyUsesFlats(score.settings.keyFifths);
  const isGrand = score.staves.length > 1;

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" ' +
      '"http://www.musicxml.org/dtds/partwise.dtd">',
  );
  lines.push('<score-partwise version="4.0">');
  lines.push(`  <work><work-title>${esc(title)}</work-title></work>`);
  lines.push('  <identification>');
  lines.push(`    <creator type="composer">${esc(COMPOSER)}</creator>`);
  lines.push('    <encoding><software>audio2sheet (web)</software></encoding>');
  lines.push('  </identification>');
  lines.push('  <part-list>');
  lines.push(`    <score-part id="P1"><part-name>${esc(partName)}</part-name></score-part>`);
  lines.push('  </part-list>');
  lines.push('  <part id="P1">');

  for (let m = 0; m < score.numberOfMeasures; m++) {
    lines.push(`    <measure number="${m + 1}">`);
    if (m === 0) {
      lines.push(...attributesXml(score, isGrand));
    }
    // Treble staff (voice 1, staff 1).
    appendStaffMeasure(lines, score.staves[0], m, 1, isGrand ? 1 : null, useFlats);
    // Bass staff (voice 2, staff 2), after a backup to the bar start.
    if (isGrand && score.staves[1]) {
      lines.push(`      <backup><duration>${score.divisionsPerMeasure}</duration></backup>`);
      appendStaffMeasure(lines, score.staves[1], m, 2, 2, useFlats);
    }
    lines.push('    </measure>');
  }

  lines.push('  </part>');
  lines.push('</score-partwise>');
  return lines.join('\n');
}

function attributesXml(score: QuantizedScore, isGrand: boolean): string[] {
  const out: string[] = [];
  out.push('      <attributes>');
  out.push(`        <divisions>${score.divisions}</divisions>`);
  out.push(`        <key><fifths>${score.settings.keyFifths}</fifths></key>`);
  out.push(
    `        <time><beats>${score.settings.beats}</beats>` +
      `<beat-type>${score.settings.beatType}</beat-type></time>`,
  );
  if (isGrand) {
    out.push(`        <staves>${score.staves.length}</staves>`);
    score.staves.forEach((staff, i) => out.push(clefXml(staff.clef, i + 1)));
  } else {
    out.push(clefXml(score.staves[0].clef, null));
  }
  out.push('      </attributes>');
  return out;
}

function clefXml(clef: 'treble' | 'bass', staffNumber: number | null): string {
  const num = staffNumber != null ? ` number="${staffNumber}"` : '';
  if (clef === 'bass') return `        <clef${num}><sign>F</sign><line>4</line></clef>`;
  return `        <clef${num}><sign>G</sign><line>2</line></clef>`;
}

// Beam-able note types and how many beam levels each needs.
const BEAM_LEVELS: Record<string, number> = {
  eighth: 1,
  '16th': 2,
  '32nd': 3,
  '64th': 4,
};

/** Max notes per beam group (standard notation: 4 eighths in 4/4). */
const MAX_BEAM_GROUP = 4;

/** Which MusicXML beam element to emit for a note's position in a group. */
type BeamRole = 'begin' | 'continue' | 'end';

function beamElements(beamCount: number, role: BeamRole): string[] {
  const out: string[] = [];
  for (let n = 1; n <= beamCount; n++) {
    out.push(`        <beam number="${n}">${role}</beam>`);
  }
  return out;
}

function appendStaffMeasure(
  lines: string[],
  staff: StaffNotation,
  measureIndex: number,
  voice: number,
  staffNumber: number | null,
  useFlats: boolean,
): void {
  const elements = staff.measures[measureIndex] ?? [];
  if (elements.length === 0) return;

  // Pre-compute beam groups for consecutive beamed notes (max 4 per group).
  // Groups can mix different beamed types (eighth + 16th) — the shortest
  // note determines the beam count for the whole group.
  const beamInfo: (BeamRole | null)[] = new Array(elements.length).fill(null);
  const beamGroupLevels: number[] = new Array(elements.length).fill(0);
  for (let i = 0; i < elements.length; ) {
    const el = elements[i];
    const elLevels = el.isRest ? 0 : (BEAM_LEVELS[el.type] ?? 0);
    if (elLevels === 0) { i++; continue; }

    // Find consecutive beamed notes (any type that needs beams).
    let j = i + 1;
    let maxLevels = elLevels;
    while (j < elements.length) {
      const next = elements[j];
      if (next.isRest) break;
      const nextLevels = BEAM_LEVELS[next.type] ?? 0;
      if (nextLevels === 0) break;
      maxLevels = Math.max(maxLevels, nextLevels);
      j++;
    }
    // Split into sub-groups of max MAX_BEAM_GROUP notes each.
    for (let gStart = i; gStart < j; gStart += MAX_BEAM_GROUP) {
      const gEnd = Math.min(gStart + MAX_BEAM_GROUP, j);
      const count = gEnd - gStart;
      if (count >= 2) {
        for (let k = 0; k < count; k++) {
          if (k === 0) beamInfo[gStart + k] = 'begin';
          else if (k === count - 1) beamInfo[gStart + k] = 'end';
          else beamInfo[gStart + k] = 'continue';
          beamGroupLevels[gStart + k] = maxLevels;
        }
      }
    }
    i = j;
  }

  for (let idx = 0; idx < elements.length; idx++) {
    const el = elements[idx];
    const role = beamInfo[idx];
    const beams = role != null ? beamGroupLevels[idx] : 0;
    lines.push(...noteElementXml(el, voice, staffNumber, useFlats, beams, role));
  }
}

function noteElementXml(
  el: MeasureElement,
  voice: number,
  staffNumber: number | null,
  useFlats: boolean,
  beamCount = 0,
  beamRole: BeamRole | null = null,
): string[] {
  const out: string[] = [];
  const dots = '<dot/>'.repeat(el.dots);
  const beams = beamCount > 0 && beamRole ? beamElements(beamCount, beamRole) : [];

  if (el.isRest) {
    const staffTag = staffNumber != null ? `<staff>${staffNumber}</staff>` : '';
    out.push('      <note>');
    out.push('        <rest/>');
    out.push(`        <duration>${el.durationUnits}</duration>`);
    out.push(`        <voice>${voice}</voice>`);
    out.push(`        <type>${el.type}</type>`);
    if (dots) out.push(`        ${dots}`);
    if (staffTag) out.push(`        ${staffTag}`);
    out.push('      </note>');
    return out;
  }

  const pitches = el.midis;
  pitches.forEach((midi, idx) => {
    const { step, alter, octave } = spellMidi(midi, useFlats);
    out.push('      <note>');
    if (idx > 0) out.push('        <chord/>');
    out.push('        <pitch>');
    out.push(`          <step>${step}</step>`);
    if (alter !== 0) out.push(`          <alter>${alter}</alter>`);
    out.push(`          <octave>${octave}</octave>`);
    out.push('        </pitch>');
    out.push(`        <duration>${el.durationUnits}</duration>`);
    if (el.tieStop) out.push('        <tie type="stop"/>');
    if (el.tieStart) out.push('        <tie type="start"/>');
    out.push(`        <voice>${voice}</voice>`);
    out.push(`        <type>${el.type}</type>`);
    if (dots) out.push(`        ${dots}`);
    if (staffNumber != null) out.push(`        <staff>${staffNumber}</staff>`);
    // Beam elements (only on the first note of a chord).
    if (idx === 0 && beams.length > 0) out.push(...beams);
    if (el.tieStop || el.tieStart) {
      out.push('        <notations>');
      if (el.tieStop) out.push('          <tied type="stop"/>');
      if (el.tieStart) out.push('          <tied type="start"/>');
      out.push('        </notations>');
    }
    out.push('      </note>');
  });
  return out;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
