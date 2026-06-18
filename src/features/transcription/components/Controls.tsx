import type { ScoreSettings } from '../lib/quantize';
import type { TranscribeOptions } from '../lib/transcribe';
import { ScoreSection } from './ScoreSection';
import { SensitivitySection } from './SensitivitySection';

interface ControlsProps {
  score: ScoreSettings;
  onScore: (patch: Partial<ScoreSettings>) => void;
  transcribe: TranscribeOptions;
  onTranscribe: (patch: Partial<TranscribeOptions>) => void;
  onRetranscribe: () => void;
  busy: boolean;
  hasAudio: boolean;
  showScore?: boolean;
}

export function Controls({
  score,
  onScore,
  transcribe,
  onTranscribe,
  onRetranscribe,
  busy,
  hasAudio,
  showScore = true,
}: ControlsProps) {
  return (
    <div className="controls">
      {showScore && <ScoreSection score={score} onScore={onScore} />}
      <SensitivitySection
        transcribe={transcribe}
        onTranscribe={onTranscribe}
        onRetranscribe={onRetranscribe}
        busy={busy}
        hasAudio={hasAudio}
      />
    </div>
  );
}
