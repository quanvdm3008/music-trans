import type { TranscribeOptions } from '../lib/transcribe';

interface SensitivitySectionProps {
  transcribe: TranscribeOptions;
  onTranscribe: (patch: Partial<TranscribeOptions>) => void;
  onRetranscribe: () => void;
  busy: boolean;
  hasAudio: boolean;
}

/** AI note-detection thresholds (onset / frame / minimum length) + re-apply. */
export function SensitivitySection({
  transcribe,
  onTranscribe,
  onRetranscribe,
  busy,
  hasAudio,
}: SensitivitySectionProps) {
  return (
    <details className="controls__section" open>
      <summary>Độ nhạy nhận diện (AI)</summary>

      <div className="field">
        <label htmlFor="onset">Ngưỡng nốt mới (onset): {transcribe.onsetThreshold.toFixed(2)}</label>
        <input
          id="onset"
          type="range"
          min={0.05}
          max={0.9}
          step={0.05}
          value={transcribe.onsetThreshold}
          onChange={(e) => onTranscribe({ onsetThreshold: Number(e.target.value) })}
        />
      </div>

      <div className="field">
        <label htmlFor="frame">Ngưỡng duy trì nốt (frame): {transcribe.frameThreshold.toFixed(2)}</label>
        <input
          id="frame"
          type="range"
          min={0.05}
          max={0.9}
          step={0.05}
          value={transcribe.frameThreshold}
          onChange={(e) => onTranscribe({ frameThreshold: Number(e.target.value) })}
        />
      </div>

      <div className="field">
        <label htmlFor="minlen">
          Độ dài nốt tối thiểu: {transcribe.minNoteLengthFrames} frame (~
          {Math.round(transcribe.minNoteLengthFrames * 11.6)} ms)
        </label>
        <input
          id="minlen"
          type="range"
          min={3}
          max={40}
          step={1}
          value={transcribe.minNoteLengthFrames}
          onChange={(e) => onTranscribe({ minNoteLengthFrames: Number(e.target.value) })}
        />
      </div>

      <button type="button" className="btn btn--secondary" disabled={busy || !hasAudio} onClick={onRetranscribe}>
        ↻ Áp dụng
      </button>
    </details>
  );
}
