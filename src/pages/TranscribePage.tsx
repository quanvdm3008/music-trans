import { useState, useRef, useCallback, useMemo } from 'react';
import {
  IconMusicNote, IconUpload, IconPlay, IconPause, IconZoomIn, IconZoomOut,
  IconDownload, IconShare, IconTranspose, IconCloud,
  IconArrowRight,
  IconChord, IconLeadSheet, IconStaff, IconTempo, IconEye, IconEyeOff, IconCheck, IconChevronDown,
} from '../components/icons/Icons';
import { useTranscription } from '../features/transcription/hooks/useTranscription';
import { ResultView } from '../features/transcription/ResultView';
import { TabView } from '../features/tablature/TabView';
import { Fretboard } from '../features/transcription/components/Fretboard';
import { useTablatureStore, TUNINGS } from '../features/tablature/tablature.store';
import { useUiStore, VIEW_MODES, type ViewMode } from '../core/stores/ui.store';
import { downloadFile } from '../shared/lib/utils';
import { detectKey, detectChordsFromNotes } from '../core/music/chords';

/* ================================================================== */
/*  1. HEADER                                                          */
/* ================================================================== */
function Header({ hasFile }: { hasFile: boolean }) {
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b border-[#E2E8F0]">
      <div className="ms-section !py-0">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--ms-gradient)' }}>
              <IconMusicNote className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-ms-ink" style={{ fontFamily: 'var(--font-display)' }}>
              Melody<span style={{ color: 'var(--ms-primary)' }}>Scribe</span>
              <span className="text-[11px] font-semibold ml-1.5 px-2 py-0.5 rounded-full" style={{ background: 'var(--ms-lavender-soft)', color: 'var(--ms-lavender)' }}>Pro</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-1">
            <a href="#dashboard" className="btn-ghost text-sm">Dashboard</a>
            <a href="#sheet-music" className="btn-ghost text-sm">Sheet Music</a>
            <span className="badge-lavender ml-2">✨ Pro Features</span>
          </nav>
          <div className="flex items-center gap-3">
            {hasFile && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--ms-mint-soft)', color: 'var(--ms-mint)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-ms-mint animate-pulse-soft" />
                File ready
              </span>
            )}
            <a href="#sheet-music" className="btn-primary text-sm !py-2 !px-5">
              View Sheet <IconArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ================================================================== */
/*  2. HERO + FUNCTIONAL FILE UPLOAD                                   */
/* ================================================================== */
function HeroUploadSection({
  onFileSelected, hasFile, fileName, busy, error,
}: {
  onFileSelected: (f: File) => void;
  hasFile: boolean;
  fileName: string | null;
  busy: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handlePick = useCallback(() => {
    if (!busy) inputRef.current?.click();
  }, [busy]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected],
  );

  return (
    <section className="ms-section text-center" style={{ paddingTop: '5rem', paddingBottom: '2rem' }}>
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 animate-fade-in-up" style={{ background: 'var(--ms-primary-soft)', color: 'var(--ms-primary)', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
        <span className="inline-block w-2 h-2 rounded-full bg-ms-primary animate-pulse-soft" />
        AI-powered audio to sheet music &amp; chord detection
      </div>

      <h1 className="ms-display text-4xl sm:text-5xl lg:text-6xl mb-4 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s', color: 'var(--ms-ink)' }}>
        Turn Your Audio Into{' '}
        <span style={{ background: 'var(--ms-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Beautiful Notation</span>
      </h1>

      <p className="text-lg sm:text-xl max-w-xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s', color: 'var(--ms-muted)' }}>
        Smart AI detects notes, tempo, and key — then renders perfect sheet music. Just drop your audio and let the magic begin.
      </p>

      {/* Upload zone with REAL file input */}
      <div className="max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*,.mp3,.wav,.flac,.ogg,.m4a,.mp4,.mov,.webm"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div
          className={`dropzone-glow flex flex-col items-center gap-5 p-10 rounded-[24px] cursor-pointer text-center transition-all duration-300 ${dragOver ? 'ring-4 ring-ms-primary/20' : ''}`}
          style={{ border: dragOver ? '2px solid var(--ms-primary)' : '2px dashed #CBD5E1', background: 'white', boxShadow: 'var(--ms-shadow-md)' }}
          onClick={handlePick}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          {hasFile ? (
            <>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--ms-mint-soft)' }}>
                <IconMusicNote className="w-10 h-10" style={{ color: 'var(--ms-mint)' }} />
              </div>
              <div>
                <p className="font-semibold text-ms-ink text-sm truncate max-w-[200px]" style={{ fontFamily: 'var(--font-display)' }}>{fileName}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--ms-muted)' }}>File loaded — click Convert below</p>
              </div>
              <button className="btn-outline text-sm !py-2 !px-5" onClick={(e) => { e.stopPropagation(); handlePick(); }}>
                <IconUpload className="w-4 h-4" /> Change File
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--ms-primary-soft)' }}>
                <IconCloud className="w-10 h-10" style={{ color: 'var(--ms-primary)' }} />
              </div>
              <div>
                <p className="font-semibold text-ms-ink text-lg" style={{ fontFamily: 'var(--font-display)' }}>Drag &amp; drop your audio file</p>
                <p className="text-sm mt-1" style={{ color: 'var(--ms-muted)' }}>or click to browse</p>
              </div>
              <button className="btn-primary text-base !py-3 !px-8" onClick={(e) => { e.stopPropagation(); handlePick(); }}>
                <IconUpload className="w-5 h-5" /> Browse Files
              </button>
            </>
          )}
          <p className="text-xs" style={{ color: 'var(--ms-muted-light)' }}>MP3 · WAV · FLAC · M4A — Up to 50MB</p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-3 p-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200">
            ⚠️ {error}
          </div>
        )}
      </div>

      <p className="mt-5 text-sm animate-fade-in-up" style={{ animationDelay: '0.4s', color: 'var(--ms-muted-light)' }}>
        🎵 Free to try · No account needed · Instant AI analysis
      </p>
    </section>
  );
}

/* ================================================================== */
/*  3. AI ANALYSIS DASHBOARD (real data from transcription hook)       */
/* ================================================================== */
function AiDashboardSection({
  file, fileName, status, progress, notes, durationSeconds, svgPages, musicXml, midiBytes,
  onConvert, busy, hasResult, barChords,
  transcribeOptions, onTranscribeOption, onRetranscribe,
  scoreSettings, onScoreSetting,
  instrument, onInstrument,
}: {
  file: File | null; fileName: string; status: string; progress: number;
  notes: { pitchMidi: number; startTimeSeconds: number; durationSeconds: number }[] | null;
  durationSeconds: number; svgPages: string[] | null; musicXml: string | null;
  midiBytes: Uint8Array | null; onConvert: () => void; busy: boolean; hasResult: boolean;
  barChords: ReturnType<typeof detectChordsFromNotes> | null;
  transcribeOptions?: { onsetThreshold: number; frameThreshold: number; minNoteLength: number };
  onTranscribeOption?: (patch: Record<string, number>) => void;
  onRetranscribe?: () => void;
  scoreSettings?: { tempo: number; beats: number; beatType: number; keyFifths: number; mode: string; gridDivisionsPerQuarter: number };
  onScoreSetting?: (patch: Record<string, number | string>) => void;
  instrument?: string;
  onInstrument?: (id: string) => void;
}) {
  const noteCount = notes?.length ?? 0;
  const pageCount = svgPages?.length ?? 0;
  const fmtDuration = (s: number) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}`; };
  const fmtSize = (f: File | null) => { if (!f) return '—'; const kb = f.size / 1024; return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`; };

  const statusLabel = status === 'fetching' ? 'Fetching audio…' : status === 'decoding' ? 'Decoding audio…' : status === 'transcribing' ? `AI transcribing… ${Math.round(progress * 100)}%` : '';

  const downloadMidi = () => { if (midiBytes) downloadFile(midiBytes, `${fileName || 'output'}.mid`, 'audio/midi'); };
  const downloadXml = () => { if (musicXml) downloadFile(musicXml, `${fileName || 'output'}.musicxml`, 'application/vnd.recordare.musicxml+xml'); };

  return (
    <section id="dashboard" className="ms-section" style={{ paddingTop: '1rem' }}>
      <div className="mb-8">
        <h2 className="ms-heading text-3xl mb-2" style={{ color: 'var(--ms-ink)' }}>AI Analysis Dashboard</h2>
        <p className="text-sm" style={{ color: 'var(--ms-muted)' }}>Real-time transcription — notes, duration, and sheet music pages.</p>
      </div>

      {/* Convert button area */}
      {file && (
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <button className="btn-primary text-base !py-3 !px-8" onClick={onConvert} disabled={busy}>
            {busy ? (
              <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" /> {statusLabel || 'Processing…'}</>
            ) : hasResult ? (
              <><IconTranspose className="w-5 h-5" /> ↻ Re-transcribe</>
            ) : (
              <><IconMusicNote className="w-5 h-5" /> 🎼 Convert to Sheet Music</>
            )}
          </button>
          {hasResult && (
            <>
              <button className="btn-outline text-sm !py-2.5 !px-5" onClick={downloadMidi}>
                <IconDownload className="w-4 h-4" /> Download MIDI
              </button>
              <button className="btn-outline text-sm !py-2.5 !px-5" onClick={downloadXml}>
                <IconDownload className="w-4 h-4" /> Download MusicXML
              </button>
            </>
          )}
        </div>
      )}

      {/* Progress bar during transcription */}
      {busy && (
        <div className="mb-6 card-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--ms-ink)' }}>{statusLabel}</span>
            <span className="text-xs font-bold" style={{ color: 'var(--ms-primary)' }}>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
            <div className="progress-shimmer h-full rounded-full transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 stagger-children">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* File Info Card */}
          <div className="card-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4" style={{ color: 'var(--ms-muted)' }}>
              <IconStaff className="w-4 h-4" /> Audio Source
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: file ? 'var(--ms-mint-soft)' : 'var(--ms-primary-soft)' }}>
                <IconMusicNote className="w-6 h-6" style={{ color: file ? 'var(--ms-mint)' : 'var(--ms-primary)' }} />
              </div>
              <div>
                <p className="font-semibold text-ms-ink">{fileName || 'No file loaded'}</p>
                <p className="text-xs" style={{ color: 'var(--ms-muted-light)' }}>{fmtSize(file)} · {fmtDuration(durationSeconds)}</p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4" style={{ color: 'var(--ms-muted)' }}>
              <IconTempo className="w-4 h-4" /> Transcription Stats
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl" style={{ background: 'var(--ms-primary-soft)' }}>
                <div className="text-2xl font-extrabold" style={{ color: 'var(--ms-primary)', fontFamily: 'var(--font-display)' }}>{noteCount}</div>
                <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--ms-muted)' }}>Notes</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: 'var(--ms-mint-soft)' }}>
                <div className="text-2xl font-extrabold" style={{ color: 'var(--ms-mint)', fontFamily: 'var(--font-display)' }}>{pageCount}</div>
                <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--ms-muted)' }}>Pages</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: 'var(--ms-lavender-soft)' }}>
                <div className="text-2xl font-extrabold" style={{ color: 'var(--ms-lavender)', fontFamily: 'var(--font-display)' }}>{fmtDuration(durationSeconds)}</div>
                <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--ms-muted)' }}>Duration</div>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {hasResult && <div className="card-white p-5">
            <details className="group" open>
              <summary className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer select-none" style={{ color: 'var(--ms-muted)' }}>
                ⚙️ Fine-tune
                <IconChevronDown className="w-3.5 h-3.5 ml-auto transition-transform group-open:rotate-180" />
              </summary>

              <div className="mt-4 space-y-4">
                {/* AI Sensitivity */}
                {transcribeOptions && onTranscribeOption && <div>
                  <div className="text-[11px] font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--ms-ink-soft)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ms-primary)' }} /> AI Sensitivity
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'onsetThreshold', label: 'Onset', v: transcribeOptions.onsetThreshold, min: 0.05, max: 0.9, step: 0.05 },
                      { key: 'frameThreshold', label: 'Frame', v: transcribeOptions.frameThreshold, min: 0.05, max: 0.9, step: 0.05 },
                      { key: 'minNoteLength', label: 'Min Note', v: (transcribeOptions as any).minNoteLength ?? 0.06, min: 0.03, max: 0.5, step: 0.01 },
                    ].map(s => <div key={s.key} className="text-center">
                      <div className="text-xs font-bold mb-1" style={{ color: 'var(--ms-primary)' }}>{typeof s.v === 'number' ? s.v.toFixed(2) : s.v}</div>
                      <div className="text-[9px] mb-1" style={{ color: 'var(--ms-muted)' }}>{s.label}</div>
                      <input type="range" min={s.min} max={s.max} step={s.step} value={s.v}
                        onChange={e => onTranscribeOption({ [s.key]: Number(e.target.value) })}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: 'var(--ms-primary)' }} />
                    </div>)}
                  </div>
                  {onRetranscribe && <button onClick={onRetranscribe} className="btn-primary !py-1.5 !px-3 text-xs !rounded-lg w-full mt-3">↻ Re-analyze</button>}
                </div>}

                {/* Score Settings */}
                {scoreSettings && onScoreSetting && <div className="pt-3 border-t" style={{ borderColor: 'var(--ms-border)' }}>
                  <div className="text-[11px] font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--ms-ink-soft)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ms-lavender)' }} /> Score
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] mb-1" style={{ color: 'var(--ms-muted)' }}>Tempo: <b>{scoreSettings.tempo} BPM</b></div>
                      <input type="range" min={40} max={240} step={1} value={scoreSettings.tempo}
                        onChange={e => onScoreSetting({ tempo: Number(e.target.value) })}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: 'var(--ms-lavender)' }} />
                    </div>
                    <div>
                      <div className="text-[10px] mb-1" style={{ color: 'var(--ms-muted)' }}>Time Sig</div>
                      <select value={`${scoreSettings.beats}/${scoreSettings.beatType}`}
                        onChange={e => { const [b, bt] = e.target.value.split('/'); onScoreSetting({ beats: Number(b), beatType: Number(bt) }); }}
                        className="w-full text-xs rounded-lg px-2 py-1.5 border outline-none" style={{ borderColor: 'var(--ms-border)', background: 'white' }}>
                        {['4/4','3/4','2/4','6/8','5/4'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>}

                {/* Instrument */}
                {instrument && onInstrument && <div className="pt-3 border-t" style={{ borderColor: 'var(--ms-border)' }}>
                  <div className="text-[11px] font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--ms-ink-soft)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ms-mint)' }} /> Sound
                  </div>
                  <div className="flex gap-2">
                    {['piano','guitar','violin'].map(id => {
                      const icons: Record<string, string> = { piano: '🎹', guitar: '🎸', violin: '🎻' };
                      const labels: Record<string, string> = { piano: 'Piano', guitar: 'Guitar', violin: 'Violin' };
                      return (
                        <button key={id} onClick={() => onInstrument(id)}
                          className="flex-1 text-xs font-semibold rounded-lg py-2 border transition-all duration-200"
                          style={{
                            background: instrument === id ? 'var(--ms-primary-soft)' : 'white',
                            borderColor: instrument === id ? 'var(--ms-primary)' : 'var(--ms-border)',
                            color: instrument === id ? 'var(--ms-primary)' : 'var(--ms-muted)',
                          }}>
                          {icons[id]} {labels[id]}
                        </button>
                      );
                    })}
                  </div>
                </div>}
              </div>
            </details>
          </div>}

          {/* Key Detection Card */}
          <div className="card-white p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-3" style={{ color: 'var(--ms-muted)' }}>
              <IconMusicNote className="w-4 h-4" /> Key Detection
            </h3>
            {(() => {
              const keyResult = hasResult && notes ? detectKey(notes) : null;
              return (
                <div className="flex items-center gap-4">
                  <div className="key-badge">
                    <span>🎵</span> {keyResult ? keyResult.key : (hasResult ? 'Detecting…' : '—')}
                  </div>
                  <div className="flex flex-col gap-1">
                    {keyResult ? (
                      <span className="text-xs font-semibold" style={{ color: 'var(--ms-mint)' }}>
                        <IconCheck className="w-3.5 h-3.5 inline mr-1" style={{ color: 'var(--ms-mint)' }} />
                        AI detected · {Math.round(keyResult.confidence * 100)}% confidence
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--ms-muted-light)' }}>{hasResult ? 'Analyzing…' : 'Upload & convert to detect key'}</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT COLUMN: Chord Progression — vertical grid */}
        <div className="card-white p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ms-muted)' }}>
              <IconChord className="w-4 h-4" /> Chord Progression
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--ms-mint-soft)', color: 'var(--ms-mint)' }}>
              {hasResult ? `${barChords?.length ?? 0} chords` : 'No data'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto studio-scroll" style={{ maxHeight: '420px' }}>
            {!hasResult ? (
              <div className="flex items-center justify-center h-32 text-sm text-center" style={{ color: 'var(--ms-muted-light)' }}>
                <div><IconCloud className="w-8 h-8 mx-auto mb-2 opacity-20" /><p className="text-xs">Upload & convert to see chords</p></div>
              </div>
            ) : (
              (() => {
                const realChords = barChords ?? (notes ? detectChordsFromNotes(notes, 200) : []);
                if (realChords.length === 0) return <p className="text-xs text-center py-8" style={{ color: 'var(--ms-muted-light)' }}>No chords detected</p>;
                return (
                  <div className="space-y-2">
                    {realChords.slice(0, 16).map((ch, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-white/50"
                        style={{ background: i % 2 === 0 ? 'var(--ms-bg-alt)' : 'transparent' }}>
                        {/* Bar number */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: 'var(--ms-mint-soft)', color: 'var(--ms-mint)' }}>
                          {i + 1}
                        </div>
                        {/* Chord name */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-extrabold" style={{ color: 'var(--ms-ink)', fontFamily: 'var(--font-display)' }}>{ch.chord.name}</div>
                          <div className="text-[10px]" style={{ color: 'var(--ms-muted-light)' }}>{ch.chord.explanation?.slice(0, 60) || ''}</div>
                        </div>
                        {/* Time */}
                        <div className="text-[10px] font-semibold shrink-0" style={{ color: 'var(--ms-muted)' }}>
                          {(() => { const m = Math.floor(ch.time / 60); const s = Math.floor(ch.time % 60); return `${m}:${String(s).padStart(2, '0')}`; })()}
                        </div>
                        {/* Confidence bar */}
                        <div className="w-12 h-1.5 rounded-full shrink-0" style={{ background: 'var(--ms-border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.round(ch.chord.confidence * 100)}%`, background: 'var(--ms-mint)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  4. ENHANCED SHEET MUSIC + GUITAR TAB PREVIEWER                     */
/*  4. ENHANCED SHEET MUSIC + GUITAR TAB PREVIEWER                     */
/* ================================================================== */
function SheetMusicPreviewerSection({
  svgPages, rendering, notes, isPlaying, viewMode, setViewMode,
  onPlayToggle, getTime, musicXml, midiBytes, fileName, barChords, barDuration,
}: {
  svgPages: string[] | null; rendering: boolean; notes: { pitchMidi: number; startTimeSeconds: number; durationSeconds: number }[] | null;
  isPlaying: boolean; playProgress: number; viewMode: ViewMode; setViewMode: (m: ViewMode) => void;
  onPlayToggle: () => void; getTime: () => number | null; musicXml: string | null;
  midiBytes: Uint8Array | null; fileName: string;
  barChords: ReturnType<typeof detectChordsFromNotes> | null;
  barDuration: number;
}) {
  const [zoom, setZoom] = useState(100);
  const [showChords, setShowChords] = useState(true);
  const { tuning, capo, setTuning, setCapo } = useTablatureStore();
  const hasResult = Boolean(svgPages && svgPages.length > 0);
  const isTabMode = viewMode === 'tab' || viewMode === 'violin';
  const isViolin = viewMode === 'violin';
  const currentInstrument: string = isViolin ? 'violin' : 'guitar';
  const tuningLabel = isViolin ? 'G D A E' : (tuning === 'dropD' ? 'D A D G B e' : 'E A D G B e');

  const downloadMidi = () => { if (midiBytes) downloadFile(midiBytes, `${fileName || 'output'}.mid`, 'audio/midi'); };
  const downloadXml = () => { if (musicXml) downloadFile(musicXml, `${fileName || 'output'}.musicxml`, 'application/vnd.recordare.musicxml+xml'); };
  const downloadPdf = () => window.print();

  return (
    <section id="sheet-music" className="ms-section">
      <div className="text-center mb-8">
        <h2 className="ms-heading text-3xl sm:text-4xl mb-3" style={{ color: 'var(--ms-ink)' }}>Interactive Sheet Music</h2>
        <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--ms-muted)' }}>
          {hasResult ? 'Your AI-generated notation — play, zoom, and export.' : 'Convert your audio to see the sheet music here.'}
        </p>
      </div>

      <div className="card-white-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'var(--ms-border)', background: '#FAFBFC' }}>
          <button onClick={onPlayToggle} disabled={!hasResult} className="btn-primary !py-2 !px-4 text-sm !rounded-xl" style={{ opacity: hasResult ? 1 : 0.5 }}>
            {isPlaying ? <IconPause className="w-4 h-4" /> : <IconPlay className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="w-px h-7 mx-1" style={{ background: 'var(--ms-border)' }} />

          {/* View mode selector — Piano / Guitar / Violin */}
          {VIEW_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setViewMode(m.id);
                if (m.id === 'violin') setTuning('violin');
                else if (m.id === 'tab' && tuning === 'violin') setTuning('standard');
              }}
              className="btn-ghost text-sm !rounded-xl !px-3 !py-2"
              style={{
                color: viewMode === m.id ? 'var(--ms-primary)' : 'var(--ms-muted)',
                background: viewMode === m.id ? 'var(--ms-primary-soft)' : 'transparent',
                fontWeight: viewMode === m.id ? 700 : 500,
              }}
            >
              {m.label}
            </button>
          ))}

          <div className="w-px h-7 mx-1" style={{ background: 'var(--ms-border)' }} />

          {/* Chords Toggle */}
          <button onClick={() => setShowChords(!showChords)} className="btn-ghost text-sm !rounded-xl !px-3 !py-2 hidden sm:flex items-center gap-1.5" style={{ color: showChords ? 'var(--ms-mint)' : 'var(--ms-muted)' }}>
            {showChords ? <IconEye className="w-4 h-4" /> : <IconEyeOff className="w-4 h-4" />}{showChords ? 'Chords' : 'Chords'}
          </button>

          <div className="w-px h-7 mx-1" style={{ background: 'var(--ms-border)' }} />

          <div className="flex items-center gap-1 ml-auto sm:ml-0">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="btn-ghost !p-2 !rounded-xl"><IconZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-semibold min-w-[3rem] text-center" style={{ color: 'var(--ms-ink-soft)' }}>{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="btn-ghost !p-2 !rounded-xl"><IconZoomIn className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Tuning settings row (when tab/violin is visible) */}
        {isTabMode && hasResult && (
          <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b" style={{ borderColor: 'var(--ms-border)', background: '#FAFBFC' }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ms-muted-light)' }}>
              {isViolin ? '🎻 Violin Settings' : '🎸 Guitar Settings'}
            </span>
            <select
              value={tuning}
              onChange={(e) => setTuning(e.target.value as any)}
              className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer"
              style={{ borderColor: 'var(--ms-border)', color: 'var(--ms-ink)', background: 'white' }}
            >
              {TUNINGS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {!isViolin && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold" style={{ color: 'var(--ms-muted)' }}>Capo: {capo === 0 ? 'None' : `Fret ${capo}`}</span>
                <input
                  type="range" min={0} max={7} step={1} value={capo}
                  onChange={(e) => setCapo(Number(e.target.value))}
                  className="w-20 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--ms-primary)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Canvas: Sheet Music OR Tab */}
        <div className="flex flex-col" style={{ background: 'white', minHeight: '380px' }}>
          {!hasResult ? (
            <div className="flex-1 flex items-center justify-center p-10 text-center" style={{ color: 'var(--ms-muted-light)' }}>
              <div>
                <IconMusicNote className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Upload &amp; convert audio to see your sheet music here</p>
                <p className="text-xs mt-1 opacity-70">Your music notation will appear after AI transcription</p>
              </div>
            </div>
          ) : !isTabMode ? (
            /* === Piano Sheet Music === */
            <div className="flex-1 flex items-start justify-center p-6 md:p-10 overflow-x-auto" style={{ minHeight: '380px' }}>
              <div className="transition-transform duration-300" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}>
                {rendering && <p className="text-sm text-center py-4" style={{ color: 'var(--ms-muted)' }}>Rendering sheet music…</p>}
                <ResultView
                  viewMode="sheet"
                  svgPages={svgPages}
                  rendering={rendering}
                  notes={(notes as any) ?? []}
                  isPlaying={isPlaying}
                  getTime={getTime}
                />
              </div>
            </div>
          ) : (
            /* === Guitar / Violin Tab === */
            <div className="flex flex-col">
              {/* Full-width Fretboard */}
              {hasResult && (
                <div className="p-4 pb-1">
                  <div className="card-white overflow-hidden w-full" style={{ borderRadius: 'var(--ms-radius-lg)' }}>
                    <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--ms-border)', background: '#FAFBFC' }}>
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ms-muted)' }}>
                        {isViolin ? '🎻 Violin' : '🎸 Guitar'} Neck · {tuningLabel}{!isViolin && capo > 0 ? ` · Capo ${capo}` : ''}
                      </span>
                      <span className="text-[9px] ml-auto" style={{ color: 'var(--ms-muted-light)' }}>Notes light up during playback</span>
                    </div>
                    <Fretboard
                      instrument={currentInstrument as any}
                      notes={(notes as any) ?? []}
                      isPlaying={isPlaying}
                      getTime={getTime}
                    />
                  </div>
                </div>
              )}

              {/* Tab with chord labels built-in */}
              <div className="p-4">
                <div className="card-white overflow-hidden w-full" style={{ borderRadius: 'var(--ms-radius-lg)' }}>
                  <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--ms-border)', background: '#FAFBFC' }}>
                    <IconChord className="w-3.5 h-3.5" style={{ color: 'var(--ms-mint)' }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ms-muted)' }}>
                      {isViolin ? 'Violin' : 'Guitar'} Tab with Chords
                    </span>
                    <span className="text-[9px] ml-auto" style={{ color: 'var(--ms-muted-light)' }}>
                      {tuningLabel} · chords at top with vertical markers
                    </span>
                  </div>
                  <TabView notes={(notes as any) ?? []} isPlaying={isPlaying} getTime={getTime} chords={barChords ?? undefined} barDuration={barDuration} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--ms-border)', background: '#FAFBFC' }}>
          <button className="btn-primary !py-2.5 !px-5 text-sm" onClick={downloadPdf} disabled={!hasResult} style={{ opacity: hasResult ? 1 : 0.5 }}>
            <IconDownload className="w-4 h-4" /> Download PDF Sheet
          </button>
          <button className="btn-mint !py-2.5 !px-5 text-sm" onClick={downloadXml} disabled={!hasResult} style={{ opacity: hasResult ? 1 : 0.5 }}>
            <IconLeadSheet className="w-4 h-4" /> Export MusicXML
          </button>
          <button className="btn-outline !py-2.5 !px-5 text-sm" onClick={downloadMidi} disabled={!hasResult} style={{ opacity: hasResult ? 1 : 0.5 }}>
            <IconDownload className="w-4 h-4" /> Export MIDI
          </button>
          <button className="btn-outline !py-2.5 !px-5 text-sm" disabled><IconShare className="w-4 h-4" /> Share</button>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  5. FOOTER                                                          */
/* ================================================================== */
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--ms-border)', background: 'white' }}>
      <div className="ms-section !py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--ms-gradient)' }}>
              <IconMusicNote className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--ms-ink-soft)' }}>MelodyScribe <span style={{ color: 'var(--ms-lavender)' }}>Pro</span></span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs hover:underline" style={{ color: 'var(--ms-muted-light)' }}>Privacy</a>
            <a href="#" className="text-xs hover:underline" style={{ color: 'var(--ms-muted-light)' }}>Terms</a>
            <a href="#" className="text-xs hover:underline" style={{ color: 'var(--ms-muted-light)' }}>Contact</a>
          </div>
          <p className="text-xs" style={{ color: 'var(--ms-muted-light)' }}>© 2026 MelodyScribe Pro · Made with ♪ for musicians everywhere.</p>
        </div>
      </div>
    </footer>
  );
}

/* ================================================================== */
/*  MAIN PAGE — integrated with real transcription                    */
/* ================================================================== */
export function TranscribePage() {
  const t = useTranscription();
  const { viewMode, setViewMode } = useUiStore();
  const noteCount = t.notes?.length ?? 0;
  const hasFile = Boolean(t.file);
  const hasResult = Boolean(t.notes && noteCount > 0);

  // Compute bar-based chords and bar duration
  const barDuration = (60 / (t.scoreSettings?.tempo ?? 120)) * (t.scoreSettings?.beats ?? 4);
  const barChords = useMemo(() => {
    if (!t.notes || t.notes.length === 0) return null;
    const bpm = t.scoreSettings?.tempo ?? 120;
    const beats = t.scoreSettings?.beats ?? 4;
    return detectChordsFromNotes(t.notes as any, { bpm, beatsPerBar: beats });
  }, [t.notes, t.scoreSettings?.tempo, t.scoreSettings?.beats]);

  return (
    <>
      <Header hasFile={hasFile} />
      <HeroUploadSection
        onFileSelected={t.handleFile}
        hasFile={hasFile}
        fileName={t.file?.name ?? null}
        busy={t.busy}
        error={t.error}
      />

      {(hasFile || hasResult) && (
        <AiDashboardSection
          file={t.file}
          fileName={t.title || t.file?.name || 'Untitled'}
          status={t.status}
          progress={t.progress}
          notes={t.notes as any}
          durationSeconds={t.durationSeconds}
          svgPages={t.svgPages}
          musicXml={t.musicXml}
          midiBytes={t.midiBytes}
          onConvert={t.handleConvert}
          busy={t.busy}
          hasResult={hasResult}
          barChords={barChords}
          transcribeOptions={t.transcribeOptions as any}
          onTranscribeOption={(p) => t.setTranscribeOptions?.((prev: any) => ({ ...prev, ...p }))}
          onRetranscribe={t.handleRetranscribe}
          scoreSettings={t.scoreSettings as any}
          onScoreSetting={(p) => t.setScoreSettings?.((prev: any) => ({ ...prev, ...p }))}
          instrument={t.instrument}
          onInstrument={(id) => t.setInstrument?.(id as any)}
        />
      )}

      {(hasFile || hasResult) && (
        <SheetMusicPreviewerSection
          svgPages={t.svgPages}
          rendering={t.rendering}
          notes={t.notes as any}
          isPlaying={t.playState === 'playing'}
          playProgress={t.playProgress}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onPlayToggle={t.handlePlayToggle}
          getTime={t.getPlaybackTime}
          musicXml={t.musicXml}
          midiBytes={t.midiBytes}
          fileName={t.title || t.file?.name || 'output'}
          barChords={barChords}
          barDuration={barDuration}
        />
      )}

      <Footer />
    </>
  );
}

