const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const { startServer, stopServer } = require('../backend/server');

const BACKEND_PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const isDev = !app.isPackaged;

async function createWindow() {
  await startServer(BACKEND_PORT);

  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    title: 'BeaverKiosk',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
    if (isDev) {
      window.webContents.openDevTools({ mode: 'detach' });
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (isDev && devServerUrl) {
    await window.loadURL(devServerUrl);
  } else {
    const indexHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
    await window.loadFile(indexHtmlPath);
  }
}

app.whenReady().then(createWindow).catch((error) => {
  console.error('Failed to launch BeaverKiosk', error);
  app.exit(1);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer().catch((error) => {
    console.error('Failed to stop backend server cleanly', error);
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((error) => {
      console.error('Failed to recreate BeaverKiosk window', error);
    });
  }
});
