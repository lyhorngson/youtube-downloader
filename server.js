import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));


const clients = new Set();

function broadcastProgress(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

// SSE stream for real-time download progress
app.get('/api/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
});

// Default download folder
app.get('/api/config', (req, res) => {
  const defaultDir = path.join(os.homedir(), 'Downloads');
  res.json({
    defaultDownloadDir: defaultDir,
    platform: process.platform
  });
});

// Open folder in macOS Finder
app.post('/api/open-folder', (req, res) => {
  const { folder } = req.body;
  const target = folder || path.join(os.homedir(), 'Downloads');
  if (fs.existsSync(target)) {
    spawn('open', [target]);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Folder does not exist' });
});

// Inspect Playlist or Video URL
app.post('/api/inspect', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // yt-dlp --flat-playlist -J <url>
  const proc = spawn('yt-dlp', [
    '--flat-playlist',
    '-J',
    '--no-warnings',
    url
  ]);

  let stdoutData = '';
  let stderrData = '';

  proc.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  proc.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: stderrData.trim() || 'Failed to inspect playlist. Please check the URL.'
      });
    }

    try {
      const json = JSON.parse(stdoutData);
      
      let entries = [];
      let isPlaylist = false;
      let title = json.title || 'YouTube Media';

      if (json._type === 'playlist' && Array.isArray(json.entries)) {
        isPlaylist = true;
        entries = json.entries
          .filter(item => item && (item.id || item.url))
          .map((item, index) => {
            const cleanId = String(item.id || `item_${index + 1}`);
            return {
              index: index + 1,
              id: cleanId,
              title: item.title || `Video ${index + 1}`,
              duration: item.duration,
              durationFormatted: formatDuration(item.duration),
              thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || 
                         `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
              url: item.url || `https://www.youtube.com/watch?v=${cleanId}`,
              uploader: item.uploader || item.channel || json.channel || ''
            };
          });
      } else {
        // Single video
        const cleanId = String(json.id || 'video_1');
        entries = [{
          index: 1,
          id: cleanId,
          title: json.title || 'YouTube Video',
          duration: json.duration,
          durationFormatted: formatDuration(json.duration),
          thumbnail: json.thumbnail || `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
          url: json.webpage_url || url,
          uploader: json.uploader || ''
        }];
      }

      res.json({
        isPlaylist,
        title,
        uploader: json.uploader || json.channel || '',
        count: entries.length,
        entries
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to parse yt-dlp metadata: ' + err.message });
    }
  });
});

// Format seconds into mm:ss or hh:mm:ss
function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '--:--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

let activeProcesses = new Map();

// Start downloading selected items
app.post('/api/download', (req, res) => {
  const { items, quality, mediaType, resolution, videoFormat, audioFormat, downloadDir } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items provided' });
  }

  const outputFolder = downloadDir || path.join(os.homedir(), 'Downloads');
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Queue up downloads
  downloadQueue(items, { quality, mediaType, resolution, videoFormat, audioFormat }, outputFolder);

  res.json({ success: true, message: `Queued ${items.length} items for download` });
});

async function downloadQueue(items, options, outputFolder) {
  for (const item of items) {
    await downloadSingleItem(item, options, outputFolder);
  }
}

function downloadSingleItem(item, options, outputFolder) {
  return new Promise((resolve) => {
    broadcastProgress({
      id: item.id,
      status: 'downloading',
      percent: 0,
      speed: 'Starting...',
      eta: '--'
    });

    const outputTemplate = path.join(outputFolder, '%(title)s.%(ext)s');

    let args = [
      '--newline',
      '--no-playlist',
      '--progress-template',
      'PROGRESS:%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s',
      '-o',
      outputTemplate
    ];

    const { mediaType, resolution, videoFormat, audioFormat, quality } = options || {};

    // Audio download mode
    if (mediaType === 'audio' || quality === 'mp3' || quality === 'm4a') {
      const aFormat = audioFormat || (quality === 'm4a' ? 'm4a' : 'mp3');
      args.push('-x', '--audio-format', aFormat);
      if (aFormat === 'mp3') {
        args.push('--audio-quality', '0'); // highest MP3 quality (320kbps)
      }
    } else {
      // Video download mode (Supports MP4, WebM, MKV)
      const vFormat = videoFormat || 'mp4'; // Default to MP4 for native macOS playback
      const res = resolution || quality || 'best';

      if (res === '1080p') {
        args.push('-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]');
      } else if (res === '720p') {
        args.push('-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]');
      } else if (res === '480p') {
        args.push('-f', 'bestvideo[height<=480]+bestaudio/best[height<=480]');
      } else {
        // Best quality available
        args.push('-f', 'bestvideo+bestaudio/best');
      }

      // Format sorting & Container formats: MP4, WebM, Original, MKV
      if (vFormat === 'mp4') {
        args.push('-S', 'res,ext:mp4:m4a');
        args.push('--merge-output-format', 'mp4');
      } else if (vFormat === 'webm') {
        args.push('-S', 'res,ext:webm:opus');
        args.push('--merge-output-format', 'webm');
      } else if (vFormat === 'mkv') {
        args.push('--merge-output-format', 'mkv');
      } else if (vFormat === 'original') {
        // Keeps original container as uploaded to YouTube without remuxing
      }
    }

    args.push(item.url);

    const proc = spawn('yt-dlp', args);
    activeProcesses.set(item.id, proc);

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('PROGRESS:')) {
          const parts = line.replace('PROGRESS:', '').split('|');
          const rawPercent = parts[0]?.trim().replace('%', '') || '0';
          const percent = parseFloat(rawPercent) || 0;
          const speed = parts[1]?.trim() || '';
          const eta = parts[2]?.trim() || '';

          broadcastProgress({
            id: item.id,
            status: 'downloading',
            percent,
            speed,
            eta
          });
        }
      }
    });

    proc.on('close', (code) => {
      activeProcesses.delete(item.id);
      if (code === 0) {
        broadcastProgress({
          id: item.id,
          status: 'finished',
          percent: 100,
          speed: '',
          eta: ''
        });
      } else {
        broadcastProgress({
          id: item.id,
          status: 'error',
          percent: 0,
          speed: '',
          eta: ''
        });
      }
      resolve();
    });

    proc.on('error', (err) => {
      activeProcesses.delete(item.id);
      broadcastProgress({
        id: item.id,
        status: 'error',
        error: err.message
      });
      resolve();
    });
  });
}

// Cancel a download
app.post('/api/cancel', (req, res) => {
  const { id } = req.body;
  if (id && activeProcesses.has(id)) {
    const proc = activeProcesses.get(id);
    proc.kill('SIGTERM');
    activeProcesses.delete(id);
    broadcastProgress({ id, status: 'cancelled' });
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
