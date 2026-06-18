// Owns the audio source (file or URL) and the Basic Pitch transcription
// pipeline: decode -> run model -> derive notes. Re-sensitizing (changing
// onset/frame thresholds) re-derives from the cached model output instead of
// re-running the model.

import { useCallback, useRef, useState } from 'react';
import { prepareAudio } from '../lib/audio';
import {
  DEFAULT_TRANSCRIBE_OPTIONS,
  runModel,
  type NoteEventTime,
  type TranscribeOptions,
} from '../lib/transcribe';
import { deriveNotes, initNoteWorker } from '../lib/noteWorker';
import { preloadVerovio } from '../lib/verovio';
import { fileStem } from '../../../shared/lib/utils';

export type Status = 'idle' | 'fetching' | 'decoding' | 'transcribing' | 'error';

export function useTranscribeSource() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteEventTime[] | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [transcribeOptions, setTranscribeOptions] =
    useState<TranscribeOptions>(DEFAULT_TRANSCRIBE_OPTIONS);

  const hasOutputRef = useRef(false);
  const preparedBufferRef = useRef<AudioBuffer | null>(null);

  const busy = status === 'fetching' || status === 'decoding' || status === 'transcribing';

  const runModelAndDerive = useCallback(async (buffer: AudioBuffer, opts: TranscribeOptions) => {
    setStatus('transcribing');
    setProgress(0);
    preloadVerovio();
    const output = await runModel(buffer, (p) => setProgress(p));
    await initNoteWorker(output.frames, output.onsets);
    hasOutputRef.current = true;
    const result = await deriveNotes(opts);
    setNotes(result);
    setStatus('idle');
  }, []);

  const reDeriveNotes = useCallback(async (opts: TranscribeOptions) => {
    if (!hasOutputRef.current) return;
    const result = await deriveNotes(opts);
    setNotes(result);
  }, []);

  const convertFile = useCallback(
    async (f: File) => {
      setStatus('decoding');
      try {
        const prepared = await prepareAudio(f);
        preparedBufferRef.current = prepared.buffer;
        setDurationSeconds(prepared.durationSeconds);
        await runModelAndDerive(prepared.buffer, transcribeOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    },
    [transcribeOptions, runModelAndDerive],
  );

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setTitle(fileStem(f.name));
    setNotes(null);
    setError(null);
    setStatus('idle');
    preparedBufferRef.current = null;
    hasOutputRef.current = false;
    preloadVerovio();
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setError(null);
    await convertFile(file);
  }, [file, convertFile]);

  const loadFromUrl = useCallback(
    async (raw: string) => {
      const link = raw.trim();
      if (!link) return;
      setError(null);
      setStatus('fetching');
      try {
        const isYt = /(?:youtube\.com|youtu\.be)/i.test(link);
        const api = `${isYt ? '/api/youtube' : '/api/fetch'}?url=${encodeURIComponent(link)}`;
        const resp = await fetch(api);
        if (!resp.ok) {
          let msg = `Tải link lỗi ${resp.status}`;
          try {
            const j = (await resp.json()) as { error?: string };
            if (j?.error) msg = j.error;
          } catch {
            /* not json */
          }
          throw new Error(msg);
        }
        const blob = await resp.blob();
        if (blob.size === 0) throw new Error('Link không trả về dữ liệu âm thanh.');

        const titleHdr = resp.headers.get('x-title');
        const rawName = titleHdr
          ? decodeURIComponent(titleHdr)
          : fileStem(link.split('/').pop() || 'link');
        const name = rawName.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80) || 'link';
        const newFile = new File([blob], name, {
          type: blob.type || 'application/octet-stream',
        });

        handleFile(newFile);
        setTitle(name);
        await convertFile(newFile);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    },
    [handleFile, convertFile],
  );

  const handleRetranscribe = useCallback(async () => {
    if (!hasOutputRef.current) return;
    setError(null);
    try {
      await reDeriveNotes(transcribeOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [transcribeOptions, reDeriveNotes]);

  return {
    file,
    title,
    setTitle,
    urlInput,
    setUrlInput,
    status,
    progress,
    error,
    notes,
    durationSeconds,
    transcribeOptions,
    setTranscribeOptions,
    busy,
    hasAudio: Boolean(preparedBufferRef.current),
    handleFile,
    handleConvert,
    loadFromUrl,
    handleRetranscribe,
  };
}
