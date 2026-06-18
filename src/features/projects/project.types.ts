/** A saved transcription project (Phase 1: stored locally, no backend). */
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Original audio file name (we keep the name; bytes stay client-side only). */
  audioFileName: string | null;
  /** Generated MusicXML (string) — optional until a result exists. */
  musicXml: string | null;
  /** Generated MIDI as base64 (so it survives JSON serialization). */
  midiBase64: string | null;
  /** Detected note count, for quick dashboard stats. */
  noteCount: number;
  /** Source duration in seconds. */
  durationSeconds: number;
}

export type ProjectDraft = Pick<
  Project,
  'name' | 'audioFileName' | 'musicXml' | 'midiBase64' | 'noteCount' | 'durationSeconds'
>;
