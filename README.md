# YouTube Playlist Downloader (macOS Pro UI)

A modern, fast, and native macOS desktop app to inspect and download entire YouTube playlists or individual videos.

Built with **React**, **Tailwind CSS**, **Lucide Icons**, **Express Backend**, and **Electron** on top of the powerful **`yt-dlp`** and **`ffmpeg`** engines.

---

## Features

- **macOS Native Window Styling:** Sleek dark mode, hidden titlebar with native macOS traffic-light buttons.
- **Instant Playlist Inspection:** Uses `yt-dlp --flat-playlist -J` to parse playlists with thumbnails and video durations in seconds.
- **Granular Selection:** Select all, deselect all, or hand-pick individual tracks with checkboxes.
- **Format & Quality Switcher:**
  - Full Video (Best 4K/Auto, 1080p HD, 720p HD)
  - Audio Extraction (MP3 320kbps, M4A)
- **Live Real-Time Progress Stream:** Per-video progress bars, download speeds (MB/s), and ETA estimates via Server-Sent Events (SSE).
- **Direct Finder Integration:** 1-click button to open your downloaded files in macOS Finder.

---

## Quick Start (from Terminal)

Open Terminal in this folder:

```bash
cd ~/Desktop/youtube-downloader-mac
```

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the App

#### Option A: Native macOS Desktop App (Electron)
```bash
npm start
```
*Opens as a native desktop window on your Mac with macOS window controls.*

#### Option B: Browser Web UI
```bash
npm run dev
```
*Opens the local development server at `http://localhost:5173` which you can view in Safari or Chrome.*

---

## System Requirements

- **macOS**
- **Node.js** (Installed)
- **yt-dlp** (Installed via `brew install yt-dlp`)
- **ffmpeg** (Installed via `brew install ffmpeg`)
