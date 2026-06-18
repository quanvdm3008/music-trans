import type { ScoreSettings } from '../lib/quantize';
import { midiToNoteName } from '../../../core/music/notation';
import { GRID_OPTIONS, KEY_NAMES, TIME_SIGNATURES } from './controls.constants';

interface ScoreSectionProps {
  score: ScoreSettings;
  onScore: (patch: Partial<ScoreSettings>) => void;
}

/** Notation settings: layout, tempo, time signature, grid, key, hand split. */
export function ScoreSection({ score, onScore }: ScoreSectionProps) {
  return (
    <details className="controls__section" open>
      <summary>Ký âm</summary>

      <div className="field">
        <label>Bố cục</label>
        <div className="segmented">
          <button
            type="button"
            className={score.mode === 'piano' ? 'active' : ''}
            onClick={() => onScore({ mode: 'piano' })}
          >
            Piano (2 tay)
          </button>
          <button
            type="button"
            className={score.mode === 'melody' ? 'active' : ''}
            onClick={() => onScore({ mode: 'melody' })}
          >
            Giai điệu (1 khuông)
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="tempo">Tempo: {score.tempo} BPM</label>
        <input
          id="tempo"
          type="range"
          min={40}
          max={240}
          step={1}
          value={score.tempo}
          onChange={(e) => onScore({ tempo: Number(e.target.value) })}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="timesig">Số chỉ nhịp</label>
          <select
            id="timesig"
            value={`${score.beats}/${score.beatType}`}
            onChange={(e) => {
              const ts = TIME_SIGNATURES.find((t) => t.label === e.target.value);
              if (ts) onScore({ beats: ts.beats, beatType: ts.beatType });
            }}
          >
            {TIME_SIGNATURES.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="grid">Lưới làm tròn</label>
          <select
            id="grid"
            value={score.gridDivisionsPerQuarter}
            onChange={(e) => onScore({ gridDivisionsPerQuarter: Number(e.target.value) })}
          >
            {GRID_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="key">Hóa biểu</label>
        <select
          id="key"
          value={score.keyFifths}
          onChange={(e) => onScore({ keyFifths: Number(e.target.value) })}
        >
          {Object.keys(KEY_NAMES)
            .map(Number)
            .sort((a, b) => a - b)
            .map((f) => (
              <option key={f} value={f}>
                {KEY_NAMES[f]}
              </option>
            ))}
        </select>
      </div>

      {score.mode === 'piano' && (
        <div className="field">
          <label htmlFor="split">
            Ranh giới 2 tay: {midiToNoteName(score.splitMidi)} (MIDI {score.splitMidi})
          </label>
          <input
            id="split"
            type="range"
            min={48}
            max={72}
            step={1}
            value={score.splitMidi}
            onChange={(e) => onScore({ splitMidi: Number(e.target.value) })}
          />
        </div>
      )}
    </details>
  );
}
