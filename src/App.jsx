import React, { useState, useEffect } from 'react';
import { 
  PlaySquare, 
  Download, 
  Folder, 
  CheckSquare, 
  MinusSquare,
  Square, 
  Music, 
  Video, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ClipboardPaste,
  Moon,
  Sun,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Format state
  const [mediaType, setMediaType] = useState('video'); // 'video' | 'audio'
  const [resolution, setResolution] = useState('best'); // 'best' | '1080p' | '720p' | '480p'
  const [videoFormat, setVideoFormat] = useState('mp4'); // 'mp4' | 'webm' | 'mkv'
  const [audioFormat, setAudioFormat] = useState('mp3'); // 'mp3' | 'm4a' | 'opus' | 'wav'
  
  const [downloadDir, setDownloadDir] = useState('');
  const [downloads, setDownloads] = useState({}); // { [id]: { status, percent, speed, eta } }
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Sync dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch initial config (default download folder)
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.defaultDownloadDir) {
          setDownloadDir(data.defaultDownloadDir);
        }
      })
      .catch(console.error);

    // Listen to real-time download progress via SSE
    const eventSource = new EventSource('/api/progress');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setDownloads(prev => ({
          ...prev,
          [data.id]: {
            ...prev[data.id],
            ...data
          }
        }));
      } catch (err) {
        console.error('Failed to parse SSE payload', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Handle Fetching Playlist
  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setPlaylist(null);

    try {
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch media details');
      }

      setPlaylist(data);
      // Select all by default
      const allIds = new Set(data.entries.map(e => e.id));
      setSelectedIds(allIds);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch (err) {
      console.warn('Clipboard read failed', err);
    }
  };

  const isAllSelected = Boolean(
    playlist && 
    playlist.entries.length > 0 && 
    playlist.entries.every(e => selectedIds.has(e.id))
  );

  const isSomeSelected = Boolean(
    playlist && 
    selectedIds.size > 0 && 
    !isAllSelected
  );

  const selectAll = () => {
    if (!playlist) return;
    setSelectedIds(new Set(playlist.entries.map(e => e.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (!playlist) return;
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const invertSelection = () => {
    if (!playlist) return;
    const next = new Set();
    playlist.entries.forEach(e => {
      if (!selectedIds.has(e.id)) {
        next.add(e.id);
      }
    });
    setSelectedIds(next);
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const openFolder = async () => {
    try {
      await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: downloadDir })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const startDownload = async () => {
    if (!playlist || selectedIds.size === 0) return;
    setIsDownloading(true);

    const itemsToDownload = playlist.entries.filter(e => selectedIds.has(e.id));
    
    // Initialize state for downloads
    const initialDownloads = { ...downloads };
    itemsToDownload.forEach(item => {
      initialDownloads[item.id] = {
        status: 'queued',
        percent: 0,
        speed: '',
        eta: ''
      };
    });
    setDownloads(initialDownloads);

    try {
      await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToDownload,
          mediaType,
          resolution,
          videoFormat,
          audioFormat,
          downloadDir
        })
      });
    } catch (err) {
      console.error('Download start failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-body transition-colors duration-200">
      
      {/* CamboNex macOS Header */}
      <header className="titlebar-drag h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between px-6 select-none z-50">
        
        {/* Logo & Brand (with macOS traffic light padding on left) */}
        <div className="flex items-center space-x-3.5 pl-16">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <span className="text-white font-extrabold text-sm font-headline">C</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <h1 className="text-base font-extrabold tracking-tight font-headline">
              <span className="text-sky-500">Cambo</span>
              <span className="text-slate-700 dark:text-slate-200">Nex</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-700/50">
              Media Studio
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="titlebar-no-drag flex items-center space-x-2.5">
          {/* Open Downloads Folder */}
          <button 
            onClick={openFolder}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition active:scale-[0.98]"
            title="Open download destination in Finder"
          >
            <Folder className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">Finder</span>
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition active:scale-[0.98]"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl w-full mx-auto">
        
        {/* URL Search Hero Card (AppCard Style) */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-sm shadow-sky-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-headline text-slate-900 dark:text-white">
                Download YouTube Playlists & Videos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paste any playlist or video URL to inspect contents, pick your format, and batch download.
              </p>
            </div>
            <span className="hidden md:inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-3 py-1 rounded-full border border-sky-100 dark:border-sky-800/50">
              <Zap className="w-3.5 h-3.5" />
              <span>Direct Fast Engine</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Paste YouTube playlist or video link (https://www.youtube.com/playlist?list=...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition"
              />
              <button
                onClick={handlePaste}
                className="absolute right-2.5 top-2.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            </div>

            <button
              onClick={handleFetch}
              disabled={loading || !url.trim()}
              className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-sm shadow-sky-500/30 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Fetch Content</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center space-x-2.5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Playlist & Settings Section */}
        {playlist && (
          <div className="space-y-4 animate-fadeIn">
            {/* Control Bar: Playlist Meta & Quality Selector */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold font-headline text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>{playlist.title}</span>
                  {playlist.isPlaylist && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-700/50">
                      Playlist
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {playlist.uploader ? `Channel: ${playlist.uploader} • ` : ''}{playlist.count} items total
                </p>
              </div>

              {/* Format & Container Controls */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Media Type Switcher: Video vs Audio */}
                <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex space-x-1">
                  <button
                    onClick={() => setMediaType('video')}
                    className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 font-bold transition ${
                      mediaType === 'video'
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                  <button
                    onClick={() => setMediaType('audio')}
                    className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 font-bold transition ${
                      mediaType === 'audio'
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Audio Only</span>
                  </button>
                </div>

                {/* Video Options: Resolution + Container (MP4, WebM, MKV) */}
                {mediaType === 'video' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Resolution */}
                    <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex space-x-1">
                      {[
                        { id: 'best', label: 'Best 4K/Auto' },
                        { id: '1080p', label: '1080p HD' },
                        { id: '720p', label: '720p' },
                        { id: '480p', label: '480p' }
                      ].map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setResolution(r.id)}
                          className={`px-3 py-1.5 rounded-xl transition text-[11px] font-semibold ${
                            resolution === r.id
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>

                    {/* Container Format: MP4 / WebM / MKV */}
                    <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex space-x-1">
                      {[
                        { id: 'mp4', label: 'MP4 (Mac/Apple)' },
                        { id: 'webm', label: 'WebM' },
                        { id: 'original', label: 'Original (As-is)' },
                        { id: 'mkv', label: 'MKV' }
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          onClick={() => setVideoFormat(fmt.id)}
                          className={`px-3 py-1.5 rounded-xl transition text-[11px] font-bold ${
                            videoFormat === fmt.id
                              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Audio Options: MP3 / M4A / Opus / WAV */
                  <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex space-x-1">
                    {[
                      { id: 'mp3', label: 'MP3 (320k)' },
                      { id: 'm4a', label: 'M4A (Apple AAC)' },
                      { id: 'opus', label: 'Opus (WebM)' },
                      { id: 'wav', label: 'WAV (Lossless)' }
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => setAudioFormat(fmt.id)}
                        className={`px-3 py-1.5 rounded-xl transition text-[11px] font-bold ${
                          audioFormat === fmt.id
                            ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Toolbar */}
            <div className="flex flex-wrap items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400 gap-2">
              <div className="flex items-center space-x-3">
                {/* Master Toggle Checkbox */}
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center space-x-2 font-semibold hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer"
                  title={isAllSelected ? "Deselect All" : "Select All"}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-sky-500" />
                  ) : isSomeSelected ? (
                    <MinusSquare className="w-4 h-4 text-sky-500" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </span>
                </button>

                <span className="text-slate-300 dark:text-slate-700">•</span>

                {/* Quick Action Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={selectAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 font-medium transition cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 font-medium transition cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={invertSelection}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 font-medium transition cursor-pointer"
                  >
                    Invert
                  </button>
                </div>
              </div>

              {/* Counter Badge */}
              <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-[11px]">
                <strong className="text-sky-600 dark:text-sky-400">{selectedIds.size}</strong> of {playlist.entries.length} selected
              </div>
            </div>

            {/* Video List Items (CamboNex AppCard Style) */}
            <div className="space-y-2">
              {playlist.entries.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const dl = downloads[item.id];

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-300 dark:hover:border-sky-600'
                        : 'bg-white/50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-900 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1 mr-4">
                      {/* Checkbox */}
                      <div className="text-slate-400 group-hover:text-sky-500">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>

                      {/* Thumbnail with duration */}
                      <div className="relative w-24 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <PlaySquare className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white font-mono">
                          {item.durationFormatted}
                        </span>
                      </div>

                      {/* Title & metadata */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 truncate">
                          {item.index}. {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {item.uploader || playlist.uploader}
                        </p>
                      </div>
                    </div>

                    {/* Download Progress / Status badge */}
                    <div className="flex items-center space-x-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {dl ? (
                        <div className="text-right min-w-36">
                          {dl.status === 'downloading' && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span>{dl.percent.toFixed(0)}%</span>
                                <span className="text-[11px] font-normal text-slate-500">{dl.speed}</span>
                              </div>
                              <div className="w-36 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-200"
                                  style={{ width: `${dl.percent}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-slate-400">ETA: {dl.eta || '--'}</div>
                            </div>
                          )}

                          {dl.status === 'finished' && (
                            <span className="inline-flex items-center space-x-1 text-xs px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </span>
                          )}

                          {dl.status === 'queued' && (
                            <span className="text-xs text-slate-400 italic">Queued</span>
                          )}

                          {dl.status === 'error' && (
                            <span className="text-xs text-rose-500 font-semibold">Failed</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-mono">
                          #{item.index}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State Card */}
        {!playlist && !loading && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-12 text-center shadow-sm space-y-4 max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center text-sky-500 mx-auto shadow-sm">
              <PlaySquare className="w-8 h-8 text-sky-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold font-headline text-slate-900 dark:text-white">
                Enter a YouTube Playlist or Video Link
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Seamlessly convert to MP4 or WebM, extract 320k MP3 audio, and save entire channel playlists directly onto your Mac.
              </p>
            </div>
          </div>
        )}

        {/* Brand Footer Notice: POWERED BY CAMBONEX */}
        <footer className="pt-8 pb-4 text-center select-none">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>POWERED BY CAMBONEX</span>
          </div>
        </footer>
      </main>

      {/* Floating Bottom Action Bar */}
      {playlist && selectedIds.size > 0 && (
        <aside className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between z-40">
          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
            <HardDrive className="w-4 h-4 text-sky-500" />
            <span className="truncate max-w-sm font-mono text-slate-700 dark:text-slate-300" title={downloadDir}>
              {downloadDir}
            </span>
          </div>

          <button
            onClick={startDownload}
            disabled={isDownloading || selectedIds.size === 0}
            className="px-7 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center space-x-2 shadow-md shadow-sky-500/30 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading Queue...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {selectedIds.size} Selected</span>
              </>
            )}
          </button>
        </aside>
      )}
    </div>
  );
}
