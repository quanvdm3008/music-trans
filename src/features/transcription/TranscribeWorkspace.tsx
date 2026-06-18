import { useState } from 'react';
import './transcribe-workspace.css';
import { useUiStore } from '../../core/stores/ui.store';
import { useProjectStore } from '../projects/project.store';
import { bytesToBase64 } from '../../shared/lib/encode';
import { fileStem } from '../../shared/lib/utils';
import { SourceInputPanel } from './components/SourceInputPanel';
import { ResultSidebar } from './components/ResultSidebar';
import { PlaybackHeader } from './components/PlaybackHeader';
import { ResultView } from './ResultView';
import { useTranscription } from './hooks/useTranscription';

export function TranscribeWorkspace() {
  const t = useTranscription();
  const { viewMode, setViewMode } = useUiStore();
  const createProject = useProjectStore((s) => s.createProject);
  const [saved, setSaved] = useState(false);

  const stem = t.file ? fileStem(t.file.name) : 'transcription';
  const noteCount = t.notes?.length ?? 0;
  const hasResult = Boolean(t.notes && t.notes.length > 0);
  const showTab = viewMode !== 'sheet';

  const handleSave = () => {
    if (!hasResult) return;
    createProject({
      name: t.title || 'Bản nhạc',
      audioFileName: t.file?.name ?? null,
      musicXml: t.musicXml,
      midiBase64: t.midiBytes ? bytesToBase64(t.midiBytes) : null,
      noteCount,
      durationSeconds: t.durationSeconds,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="app">
      <SourceInputPanel t={t} />

      {t.notes !== null && (
        <div className="app__main">
          <ResultSidebar
            t={t}
            stem={stem}
            noteCount={noteCount}
            hasResult={hasResult}
            showTab={showTab}
            saved={saved}
            onSave={handleSave}
          />

          <main className="app__sheet">
            {!hasResult ? (
              <div className="empty-result">
                <div className="empty-result__icon">🔍</div>
                <h3>Không phát hiện nốt nào</h3>
                <p>
                  AI không bắt được nốt rõ ràng trong file này. Thử hạ <strong>onset</strong> và{' '}
                  <strong>frame</strong> ở panel <strong>Độ nhạy nhận diện</strong> rồi bấm{' '}
                  <strong>↻ Áp dụng</strong>.
                </p>
              </div>
            ) : (
              <>
                <PlaybackHeader t={t} viewMode={viewMode} onViewMode={setViewMode} hasResult={hasResult} />

                {t.rendering && <div className="rendering-overlay no-print">Đang khắc bản nhạc…</div>}

                <ResultView
                  viewMode={viewMode}
                  svgPages={t.svgPages}
                  rendering={t.rendering}
                  notes={t.notes ?? []}
                  isPlaying={t.playState === 'playing'}
                  getTime={t.getPlaybackTime}
                />
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
