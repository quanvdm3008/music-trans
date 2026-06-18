import { motion } from 'framer-motion';
import { ModeSelector } from './ModeSelector';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function Slider({ label, value, min, max, step, onChange, disabled }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/60">{label}</span>
        <span className="text-[11px] font-semibold text-white/80">{value}</span>
      </div>
      <input
        type="range"
        className="aurora-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function Toggle({ label, value, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-white/60">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => !disabled && onChange(!value)}
        className={`aurora-toggle ${value ? 'active' : ''}`}
      />
    </div>
  );
}

export interface ControlPanelState {
  mode: string;
  sensitivity: number;
  onsetThreshold: number;
  frameThreshold: number;
  minNoteLength: number;
  splitInstruments: boolean;
  polyphonic: boolean;
  quantize: boolean;
}

interface ControlPanelProps {
  state: ControlPanelState;
  onChange: (patch: Partial<ControlPanelState>) => void;
  onProcess: () => void;
  busy: boolean;
  hasAudio: boolean;
}

/** Left panel — all controls for the AI music conversion process. */
export function ControlPanel({ state, onChange, onProcess, busy, hasAudio }: ControlPanelProps) {
  return (
    <motion.div
      className="glass-panel flex flex-col gap-5 p-5 h-full overflow-y-auto studio-scroll"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div>
        <h2 className="text-base font-bold glow-text">🎛️ Controls</h2>
        <p className="text-[11px] text-white/40 mt-0.5">Tune the AI magic</p>
      </div>

      {/* Mode selector */}
      <ModeSelector
        value={state.mode}
        onChange={(mode) => onChange({ mode })}
        disabled={busy}
      />

      {/* Divider */}
      <div className="h-px bg-white/8" />

      {/* Sensitivity */}
      <div className="space-y-3">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Sensitivity
        </label>
        <Slider
          label="Detection"
          value={state.sensitivity}
          min={0.1}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ sensitivity: v })}
          disabled={busy}
        />
        <Slider
          label="Onset"
          value={state.onsetThreshold}
          min={0.1}
          max={0.9}
          step={0.05}
          onChange={(v) => onChange({ onsetThreshold: v })}
          disabled={busy}
        />
        <Slider
          label="Frame"
          value={state.frameThreshold}
          min={0.1}
          max={0.9}
          step={0.05}
          onChange={(v) => onChange({ frameThreshold: v })}
          disabled={busy}
        />
        <Slider
          label="Min Note"
          value={state.minNoteLength}
          min={0.03}
          max={0.5}
          step={0.01}
          onChange={(v) => onChange({ minNoteLength: v })}
          disabled={busy}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-white/8" />

      {/* Toggles */}
      <div className="space-y-3">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Options
        </label>
        <Toggle
          label="Polyphonic"
          value={state.polyphonic}
          onChange={(v) => onChange({ polyphonic: v })}
          disabled={busy}
        />
        <Toggle
          label="Split Instruments"
          value={state.splitInstruments}
          onChange={(v) => onChange({ splitInstruments: v })}
          disabled={busy}
        />
        <Toggle
          label="Auto Quantize"
          value={state.quantize}
          onChange={(v) => onChange({ quantize: v })}
          disabled={busy}
        />
      </div>

      {/* Process button */}
      <div className="mt-auto pt-2">
        <motion.button
          className="aurora-btn w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
          onClick={onProcess}
          disabled={!hasAudio || busy}
          whileHover={hasAudio && !busy ? { scale: 1.02 } : {}}
          whileTap={hasAudio && !busy ? { scale: 0.98 } : {}}
          style={{ opacity: !hasAudio || busy ? 0.4 : 1 }}
        >
          {busy ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing…
            </>
          ) : (
            <>
              ✨ Convert Magic
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
