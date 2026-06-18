import { Dropzone } from './Dropzone';
import type { useTranscription } from '../hooks/useTranscription';

interface SourceInputPanelProps {
  t: ReturnType<typeof useTranscription>;
}

/** Top bar: file dropzone, "load from URL" row, title + convert button, status/error. */
export function SourceInputPanel({ t }: SourceInputPanelProps) {
  return (
    <div className="app__top no-print">
      <Dropzone
        onFile={t.handleFile}
        disabled={t.busy}
        currentName={t.file?.name ?? null}
        compact={Boolean(t.file)}
      />

      <div className="url-row">
        <input
          className="url-input"
          type="url"
          placeholder="hoặc dán link YouTube / audio / video…"
          value={t.urlInput}
          onChange={(e) => t.setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') t.loadFromUrl(t.urlInput);
          }}
          disabled={t.busy}
        />
        <button
          className="btn btn--primary"
          onClick={() => t.loadFromUrl(t.urlInput)}
          disabled={t.busy || !t.urlInput.trim()}
        >
          Tải từ link
        </button>
      </div>

      {t.file && (
        <div className="convert-bar">
          <input
            className="title-input"
            type="text"
            value={t.title}
            placeholder="Tiêu đề bản nhạc"
            onChange={(e) => t.setTitle(e.target.value)}
            disabled={t.busy}
          />
          <button className="btn btn--primary" onClick={t.handleConvert} disabled={t.busy}>
            {t.busy ? 'Đang xử lý…' : t.notes ? '↻ Chuyển lại' : '🎼 Chuyển thành sheet'}
          </button>
        </div>
      )}

      {t.busy && (
        <div className="status">
          <div className="status__label">
            {t.status === 'fetching'
              ? 'Đang tải từ link…'
              : t.status === 'decoding'
                ? 'Đang giải mã & resample âm thanh…'
                : `Đang nhận diện nốt bằng AI… ${Math.round(t.progress * 100)}%`}
          </div>
          {t.status === 'transcribing' && (
            <div className="progress">
              <div className="progress__bar" style={{ width: `${Math.round(t.progress * 100)}%` }} />
            </div>
          )}
        </div>
      )}

      {t.error && <div className="error">⚠️ {t.error}</div>}
    </div>
  );
}
