# 🎵 MelodyScribe Pro — AI Audio to Sheet Music & Chord Converter

Turn any **audio or video** into **sheet music, guitar tab, and chord progressions** — right in your browser. Drop in a song, and the AI detects notes, chords, key, and renders beautiful notation. Your file never leaves your device.

## ✨ Features

- 🎧 **Import audio/video** (MP3, WAV, FLAC, OGG, M4A, MP4, MOV, WebM)
- 🤖 **AI note detection** via Spotify Basic Pitch
- 🎼 **Sheet music** rendered with Verovio (MusicXML, MIDI, PDF export)
- 🎸 **Guitar & Violin tab** with real-time chord labels, bar markers, and playback
- 🎹 **Playback** on Piano, Guitar, or Violin (SoundFont)
- 🔍 **Chord detection** with inversions (slash chords), alternatives, and explanations
- 🎛️ **Fine-tune**: AI sensitivity, tempo, time signature, key, layout

## 🏗️ Project Structure

```
music-converter/
├── index.html                    # Entry HTML
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite bundler config
├── tsconfig.json                 # TypeScript config
├── wrangler.jsonc                # Cloudflare Workers config
│
├── public/
│   ├── model/                    # Basic Pitch AI model
│   └── soundfonts/               # Instrument SoundFont JS files
│
├── src/
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Design tokens + Tailwind utilities
│   │
│   ├── app/
│   │   ├── router.tsx            # React Router config
│   │   └── AppLayout.tsx         # Full-screen studio shell
│   │
│   ├── core/
│   │   ├── audio/                # Web Audio: context, instruments, player
│   │   ├── music/
│   │   │   ├── chords.ts         # Chord recognition engine (19 templates, inversions, key detection)
│   │   │   ├── notation.ts       # MIDI ↔ note name conversion
│   │   │   └── note-event.ts     # NoteEventTime type
│   │   └── stores/
│   │       ├── playback.store.ts # Playback preferences (instrument, loop)
│   │       ├── theme.store.ts    # Theme mode (cute/cosmic/pro)
│   │       └── ui.store.ts       # View mode (sheet/tab/violin)
│   │
│   ├── features/
│   │   ├── transcription/
│   │   │   ├── hooks/            # useTranscription, useTranscribeSource, usePlaybackControls, useScoreExport
│   │   │   ├── lib/              # Audio decode, Basic Pitch, quantization, MIDI/MusicXML, Verovio, note worker
│   │   │   └── components/       # Dropzone, Controls, Fretboard, PianoRoll, SheetMusic, ResultView
│   │   ├── tablature/
│   │   │   ├── TabView.tsx       # Canvas-rendered guitar/violin tab
│   │   │   ├── tab.ts            # Tab generation from notes
│   │   │   ├── tab-view-geometry.ts # Layout math (spacing, padding, zoom)
│   │   │   └── tablature.store.ts # Tuning, capo, zoom state
│   │   └── projects/             # Project CRUD + local storage
│   │
│   ├── components/
│   │   ├── icons/Icons.tsx       # 24 inline SVG icons
│   │   └── studio/               # OrbUpload, ControlPanel, ResultPanel, WaveformPlayer, ThemeToggle, ParticleBackground
│   │
│   ├── pages/
│   │   ├── TranscribePage.tsx    # Main studio: Hero → Dashboard → Sheet Music
│   │   ├── DashboardPage.tsx     # Overview + quick actions
│   │   ├── ProjectsPage.tsx      # Saved projects list
│   │   ├── LibraryPage.tsx       # Download exports
│   │   └── SettingsPage.tsx      # Theme + preferences
│   │
│   └── shared/
│       ├── lib/                  # cn(), encode, utils
│       └── ui/                   # GlassCard, SkyButton, PageHeader
│
└── worker/                       # Cloudflare Worker (API proxy)
```

## 🚀 Run

```bash
npm install
npm run dev      # → http://localhost:3000/
npm run build    # Production build
npm run test     # Vitest
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| AI | Spotify Basic Pitch |
| Notation | Verovio |
| Audio | Web Audio API + SoundFont |
| Deploy | Cloudflare Workers + Wrangler |
