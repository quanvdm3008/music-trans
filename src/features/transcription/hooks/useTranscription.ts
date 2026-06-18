// Composes the transcription source, score export, and playback hooks into
// the single API the workspace UI consumes.

import { useCallback } from 'react';
import { useTranscribeSource } from './useTranscribeSource';
import { useScoreExport } from './useScoreExport';
import { usePlaybackControls } from './usePlaybackControls';
import { getPitchRange } from '../lib/pitch-range';

export function useTranscription() {
  const source = useTranscribeSource();
  const scoreExport = useScoreExport(source.notes, source.title);
  const playback = usePlaybackControls(source.notes);

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
