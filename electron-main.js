const path = require('path');
const { app, BrowserWindow } = require('electron');
const { startServer, stopServer } = require('./server');

const BACKEND_PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

async function createWindow() {
  await startServer(BACKEND_PORT);

  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      contextIsolation: true,
    },
    title: 'BeaverKiosk',
    show: false,
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  await window.loadFile(path.join(__dirname, 'resources', 'index.html'));
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
