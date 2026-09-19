import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1060,
    height: 740,
    minWidth: 800,
    minHeight: 600,
    title: 'YouTube Playlist Downloader',
    titleBarStyle: 'hiddenInset', // Native macOS traffic light controls
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Check if Vite dev server or backend production server is used
  const devUrl = 'http://localhost:5173';
  const prodUrl = 'http://localhost:3001';
  
  fetch(devUrl)
    .then(() => mainWindow.loadURL(devUrl))
    .catch(() => mainWindow.loadURL(prodUrl));


  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
