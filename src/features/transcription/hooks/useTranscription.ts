// Composes the transcription source, score export, and playback hooks into
// the single API the workspace UI consumes.

import { useCallback, useMemo } from 'react';
import { useTranscribeSource } from './useTranscribeSource';
import { useScoreExport } from './useScoreExport';
import { usePlaybackControls } from './usePlaybackControls';
import { getPitchRange } from '../lib/pitch-range';
import type { ViewMode } from '../../../core/stores/ui.store';
import type { TuningId } from '../../tablature/tablature.store';
import { filterTabNotes } from '../../tablature/tab';

export function useTranscription(
  viewMode?: ViewMode,
  tuning?: TuningId,
  capo?: number,
) {
  const source = useTranscribeSource();
  const scoreExport = useScoreExport(source.notes, source.title);

  // Compute tab-filtered notes for playback — only notes that survive
  // the per-string sixteenth-note filter and are playable on the instrument.
  const tabNotes = useMemo(
    () => {
      if (!source.notes || !tuning) return null;
      const t: TuningId = viewMode === 'violin' ? 'violin' : tuning;
      return filterTabNotes(source.notes, t, capo ?? 0);
    },
    [source.notes, viewMode, tuning, capo],
  );

  const playback = usePlaybackControls(source.notes, viewMode, tabNotes);

  const handleConvert = useCallback(async () => {
    playback.stopPlayback();
    await source.handleConvert();
  }, [playback.stopPlayback, source.handleConvert]);

  const loadFromUrl = useCallback(
    async (raw: string) => {
      playback.stopPlayback();
      await source.loadFromUrl(raw);
    },
    [playback.stopPlayback, source.loadFromUrl],
  );

  const handleRetranscribe = useCallback(async () => {
    playback.stopPlayback();
    await source.handleRetranscribe();
  }, [playback.stopPlayback, source.handleRetranscribe]);

  return {
    ...source,
    ...scoreExport,
    ...playback,
    error: source.error ?? scoreExport.renderError ?? playback.playError,
    pitchRange: getPitchRange(source.notes),
    handleConvert,
    loadFromUrl,
    handleRetranscribe,
  };
}
