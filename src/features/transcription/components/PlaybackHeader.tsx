import { cn } from '../../../shared/lib/cn';
import { INSTRUMENTS } from '../../../core/audio/player';
import { VIEW_MODES, type ViewMode } from '../../../core/stores/ui.store';
import { PianoRoll } from './PianoRoll';
import { Fretboard } from './Fretboard';
import type { useTranscription } from '../hooks/useTranscription';

interface PlaybackHeaderProps {
  t: ReturnType<typeof useTranscription>;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  hasResult: boolean;
}

/** Play toolbar + view-mode switch + the live piano-roll/fretboard visualizer. */
export function PlaybackHeader({ t, viewMode, onViewMode, hasResult }: PlaybackHeaderProps) {
  return (
    <div className="sheet-header no-print">
      <div className="sheet-toolbar">
        <button className="btn btn--play" onClick={t.handlePlayToggle} disabled={!hasResult}>
          {t.playState === 'loading' ? '⏳ Đang tải…' : t.playState === 'playing' ? '⏹ Dừng' : '▶ Nghe thử'}
        </button>
        <select
          className="instrument-select"
          value={t.instrument}
          title="Nhạc cụ phát"
          onChange={(e) => {
            t.stopPlayback();
            t.setInstrument(e.target.value as never);
          }}
        >
          {INSTRUMENTS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
        <div className="play-progress">
          <div className="play-progress__bar" style={{ width: `${Math.round(t.playProgress * 100)}%` }} />
        </div>
      </div>

      <div className="viewmode-bar">
        {VIEW_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={cn('viewmode-btn', viewMode === m.id && 'active')}
            onClick={() => onViewMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {t.instrument === 'piano' ? (
        <PianoRoll
          notes={t.notes ?? []}
          lowMidi={t.pitchRange.low}
          highMidi={t.pitchRange.high}
          isPlaying={t.playState === 'playing'}
          getTime={t.getPlaybackTime}
        />
      ) : (
        <Fretboard
          instrument={t.instrument}
          notes={t.notes ?? []}
          isPlaying={t.playState === 'playing'}
          getTime={t.getPlaybackTime}
        />
      )}
    </div>
  );
}
