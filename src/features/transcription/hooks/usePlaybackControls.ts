// Schedules and tracks preview playback of the transcribed notes.

import { useCallback, useEffect, useRef, useState } from 'react';
import { playNotes, type InstrumentSource, type PlaybackHandle } from '../../../core/audio/player';
import { usePlaybackStore } from '../../../core/stores/playback.store';
import type { NoteEventTime } from '../../../core/music/note-event';

export type PlayState = 'idle' | 'loading' | 'playing';

export function usePlaybackControls(notes: NoteEventTime[] | null) {
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [playProgress, setPlayProgress] = useState(0);
  const [playSource, setPlaySource] = useState<InstrumentSource | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const { instrument, setInstrument } = usePlaybackStore();

  const playbackRef = useRef<PlaybackHandle | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlayState('idle');
    setPlayProgress(0);
  }, []);

  const getPlaybackTime = useCallback(() => playbackRef.current?.currentTime() ?? null, []);

  const handlePlayToggle = useCallback(async () => {
    if (playState !== 'idle') {
      stopPlayback();
      return;
    }
    if (!notes || notes.length === 0) return;
    setPlayState('loading');
    try {
      const handle = await playNotes(notes, () => stopPlayback(), instrument);
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
  }, [playState, notes, stopPlayback, instrument]);

  useEffect(() => stopPlayback, [stopPlayback]);

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
  };
}
