import { TUNINGS, useTablatureStore } from './tablature.store';

/** Right-panel guitar controls: tuning, capo, tab zoom. */
export function GuitarSettings() {
  const { tuning, capo, zoom, setTuning, setCapo, setZoom } = useTablatureStore();

  return (
    <div className="controls__section" style={{ background: 'var(--panel)' }}>
      <div className="field">
        <label htmlFor="tuning">Lên dây (tuning)</label>
        <select id="tuning" value={tuning} onChange={(e) => setTuning(e.target.value as never)}>
          {TUNINGS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="capo">Capo: {capo === 0 ? 'không' : `ngăn ${capo}`}</label>
        <input
          id="capo"
          type="range"
          min={0}
          max={7}
          step={1}
          value={capo}
          onChange={(e) => setCapo(Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label htmlFor="tabzoom">Độ giãn tab: {zoom.toFixed(1)}×</label>
        <input
          id="tabzoom"
          type="range"
          min={0.7}
          max={1.6}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
