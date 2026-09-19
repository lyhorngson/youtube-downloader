# CamboNex | Media Downloader

A modern, high-performance desktop application to inspect and batch download YouTube playlists, channels, or individual videos with custom formats (MP4, WebM, MKV, MP3, M4A).

**Powered by CamboNex** • Built with React, Tailwind CSS, Lucide Icons, Express, and Electron on top of `yt-dlp` and `ffmpeg`.

---

## Features

- **CamboNex Component UI:** Clean, modern cards, light/dark mode switcher, and native desktop window controls.
- **Fast Playlist Inspection:** Parses complete playlists with thumbnails and video durations in seconds using `yt-dlp --flat-playlist -J`.
- **Advanced Selection Toolbar:** Master checkbox (with indeterminate state), **Select All**, **Deselect All**, and **Invert Selection** buttons.
- **Strict Format & Container Control:**
  - **Video Formats:** MP4 (Mac/Apple QuickTime friendly), WebM, Original (As-is), MKV.
  - **Resolutions:** Best 4K/Auto, 1080p Full HD, 720p HD, 480p.
  - **Audio Formats:** MP3 (320kbps), M4A (Apple AAC), Opus (WebM Audio), WAV (Lossless).
- **Live Transfer Stream:** Real-time percentage progress bars, live transfer speed (MB/s), and ETA estimates via Server-Sent Events (SSE).
- **OS File Manager Integration:** 1-click button to open your download destination directly in macOS Finder or Windows File Explorer.

---

## 🍎 macOS Setup & Run

### 1. Prerequisites (Homebrew)
```bash
brew install node yt-dlp ffmpeg
```

### 2. Install Project Dependencies
```bash
cd ~/Desktop/youtube-downloader-mac
npm install
```

### 3. Launch the App
- **Desktop Window Mode:**
  ```bash
  npm start
  ```
- **Web Browser Mode:**
  ```bash
  npm run dev
  ```

---

## 🪟 Windows Setup & Run (Windows 10 & 11)

### 1. Prerequisites (PowerShell as Administrator)
Install Node.js, `yt-dlp`, and `ffmpeg` using Windows Package Manager (`winget`):
```powershell
winget install OpenJS.NodeJS
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

### 2. Install Project Dependencies
Open PowerShell or Command Prompt inside the project folder:
```powershell
npm install
```

### 3. Launch the App on Windows
- **Desktop Window Mode:**
  ```powershell
  npm start
  ```
- **Web Browser Mode:**
  ```powershell
  npm run dev
  ```

---

## System Architecture

```
youtube-downloader-mac/
├── electron.js        # Native desktop window manager (macOS & Windows)
├── server.js          # Express backend coordinating yt-dlp & ffmpeg
├── src/
│   ├── App.jsx        # CamboNex React interface & selection engine
│   └── index.css      # Tailwind & typography styles
├── tailwind.config.js # CamboNex design tokens & colors
└── package.json       # Project dependencies & scripts
```
