// Derives notation (MusicXML, engraved SVG pages) and a Standard MIDI File
// from the transcribed notes, driven by user-tunable score settings (tempo,
// time signature, key, grid resolution).

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SCORE_SETTINGS, quantizeScore, type ScoreSettings } from '../lib/quantize';
import { scoreToMusicXml } from '../lib/musicxml';
import { notesToMidiBytes } from '../lib/midi';
import { renderMusicXmlToSvg } from '../lib/verovio';
import type { NoteEventTime } from '../../../core/music/note-event';

export function useScoreExport(notes: NoteEventTime[] | null, title: string) {
  const [scoreSettings, setScoreSettings] = useState<ScoreSettings>(DEFAULT_SCORE_SETTINGS);
  const [svgPages, setSvgPages] = useState<string[] | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const quantized = useMemo(
    () => (notes && notes.length > 0 ? quantizeScore(notes, scoreSettings) : null),
    [notes, scoreSettings],
  );

  const musicXml = useMemo(
    () => (quantized ? scoreToMusicXml(quantized, { title }) : null),
    [quantized, title],
  );

  const midiBytes = useMemo(
    () =>
      notes && notes.length > 0
        ? notesToMidiBytes(notes, {
            tempo: scoreSettings.tempo,
            instrumentName: scoreSettings.mode === 'piano' ? 'Piano' : 'Instrument',
          })
        : null,
    [notes, scoreSettings.tempo, scoreSettings.mode],
  );

  useEffect(() => {
    if (!musicXml) {
      setSvgPages(null);
      return;
    }
    let cancelled = false;
    setRendering(true);
    renderMusicXmlToSvg(musicXml)
      .then((pages) => {
        if (!cancelled) setSvgPages(pages);
      })
      .catch((err) => {
        if (!cancelled) setRenderError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [musicXml]);

  return { scoreSettings, setScoreSettings, musicXml, midiBytes, svgPages, rendering, renderError };
}
