// Schedules and tracks preview playback of the transcribed notes.

import { useCallback, useEffect, useRef, useState } from 'react';
import { playNotes, type InstrumentSource, type PlaybackHandle } from '../../../core/audio/player';
import { usePlaybackStore } from '../../../core/stores/playback.store';
import type { NoteEventTime } from '../../../core/music/note-event';
import type { ViewMode } from '../../../core/stores/ui.store';
import type { InstrumentId } from '../../../core/audio/player';

export type PlayState = 'idle' | 'loading' | 'playing';

/** Map view mode → instrument for auto-switching. */
const VIEW_INSTRUMENT: Record<ViewMode, InstrumentId> = {
  sheet: 'piano',
  tab: 'guitar',
  violin: 'violin',
};

export function usePlaybackControls(
  notes: NoteEventTime[] | null,
  /** When set, overrides instrument based on view mode (tab→guitar, etc.). */
  viewMode?: ViewMode,
  /** Filtered tab notes — used instead of raw notes when in tab/violin mode. */
  tabNotes?: NoteEventTime[] | null,
) {
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [playProgress, setPlayProgress] = useState(0);
  const [playSource, setPlaySource] = useState<InstrumentSource | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const { instrument, setInstrument, speed } = usePlaybackStore();

  const playbackRef = useRef<PlaybackHandle | null>(null);
  const rafRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);

  const stopPlayback = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlayState('idle');
    setPlayProgress(0);
  }, []);

  const getPlaybackTime = useCallback(() => playbackRef.current?.currentTime() ?? null, []);

  /** Core play logic — reused by toggle, seek, and instrument-switch restart. */
  const startPlayback = useCallback(async (fromSeconds = 0) => {
    // Choose notes: tab-filtered notes when in tab/violin mode, raw notes for sheet.
    const playNotes_ = (viewMode && viewMode !== 'sheet' && tabNotes) ? tabNotes : notes;
    if (!playNotes_ || playNotes_.length === 0) return;
    const inst: InstrumentId = viewMode ? VIEW_INSTRUMENT[viewMode] : instrument;
    setPlayState('loading');
    setPlayError(null);
    try {
      const handle = await playNotes(playNotes_, () => stopPlayback(), inst, speed, fromSeconds);
      playbackRef.current = handle;
      setPlaySource(handle.source);
      setPlayState('playing');
      const tick = () => {
        const elapsed = handle.currentTime();
        const frac = handle.totalSeconds > 0 ? Math.min(1, elapsed / handle.totalSeconds) : 1;
        setPlayProgress(frac);
        if (frac < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setPlayError(
        'Không phát được tiếng (cần mạng để tải mẫu âm). ' +
          (err instanceof Error ? err.message : ''),
      );
      stopPlayback();
    }
  }, [notes, tabNotes, viewMode, instrument, speed, stopPlayback]);

  const handlePlayToggle = useCallback(async () => {
    if (playState !== 'idle') {
      wasPlayingRef.current = false;
      stopPlayback();
      return;
    }
    wasPlayingRef.current = true;
    await startPlayback(0);
  }, [playState, stopPlayback, startPlayback]);

  /** Seek to a position (seconds). Stops current playback and restarts from offset. */
  const seekTo = useCallback(async (seconds: number) => {
    const wasPlaying = playState === 'playing';
    stopPlayback();
    if (wasPlaying) {
      wasPlayingRef.current = true;
      await startPlayback(Math.max(0, seconds));
    }
  }, [playState, stopPlayback, startPlayback]);

  // When instrument/viewMode changes while playing, restart from beginning.
  useEffect(() => {
    if (wasPlayingRef.current && viewMode !== undefined) {
      stopPlayback();
      // Small delay so the previous audio context can release.
      const t = setTimeout(() => { startPlayback(0); }, 50);
      return () => clearTimeout(t);
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  return {
    playState,
    playProgress,
    playSource,
    playError,
    instrument,
    setInstrument,
    getPlaybackTime,
    handlePlayToggle,
    stopPlayback,
    seekTo,
  };
}
