import { Controls } from './Controls';
import { GuitarSettings } from '../../tablature/GuitarSettings';
import { downloadFile, formatDuration } from '../../../shared/lib/utils';
import type { useTranscription } from '../hooks/useTranscription';

interface ResultSidebarProps {
  t: ReturnType<typeof useTranscription>;
  stem: string;
  noteCount: number;
  hasResult: boolean;
  showTab: boolean;
  saved: boolean;
  onSave: () => void;
}

/** Left panel once a file has notes: counts, downloads, save, and score/AI controls. */
export function ResultSidebar({ t, stem, noteCount, hasResult, showTab, saved, onSave }: ResultSidebarProps) {
  return (
    <aside className="app__sidebar no-print">
      <div className="result-meta">
        <span>🎹 {noteCount} nốt</span>
        {hasResult && <span>⏱ {formatDuration(t.durationSeconds)}</span>}
        {hasResult && <span>📄 {t.svgPages?.length ?? 0} trang</span>}
      </div>

      {hasResult && (
        <div className="downloads">
          <button
            className="btn btn--download"
            title="Tải file MIDI (.mid)"
            onClick={() => t.midiBytes && downloadFile(t.midiBytes, `${stem}.mid`, 'audio/midi')}
          >
            ⬇ MIDI
          </button>
          <button
            className="btn btn--download"
            title="Tải MusicXML (mở trong MuseScore)"
            onClick={() =>
              t.musicXml &&
              downloadFile(t.musicXml, `${stem}.musicxml`, 'application/vnd.recordare.musicxml+xml')
            }
          >
            ⬇ XML
          </button>
          <button className="btn btn--download" title="In hoặc lưu PDF" onClick={() => window.print()}>
            ⬇ PDF
          </button>
        </div>
      )}

      {hasResult && (
        <button className="btn btn--primary" onClick={onSave}>
          {saved ? '✓ Đã lưu vào Dự án' : '💾 Lưu dự án'}
        </button>
      )}

      <Controls
        score={t.scoreSettings}
        onScore={(patch) => t.setScoreSettings((s) => ({ ...s, ...patch }))}
        transcribe={t.transcribeOptions}
        onTranscribe={(patch) => t.setTranscribeOptions((o) => ({ ...o, ...patch }))}
        onRetranscribe={t.handleRetranscribe}
        busy={t.busy}
        hasAudio={t.hasAudio}
        showScore={hasResult}
      />

      {hasResult && showTab && <GuitarSettings />}
    </aside>
  );
}
