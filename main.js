/**
 * main.js – Electron main process for Sentory1 Desktop App
 *
 * Responsibilities:
 *  - Creates the BrowserWindow and loads index.html
 *  - Manages electron-store (persistent JSON database in %AppData%\Sentory1)
 *  - Handles IPC messages from preload.js / renderer
 *  - Enforces single-instance lock (no duplicate windows)
 */

'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path  = require('path');
const Store = require('electron-store');

// ── Persistent store ─────────────────────────────────────────────────────────
// Data is saved to: %AppData%\Sentory1\config.json  (Windows)
const store = new Store({
  name: 'sentory1-data',
  // Encrypt the store with a fixed app secret so data isn't plain JSON on disk
  // (remove encryptionKey if you want readable JSON for debugging)
  // encryptionKey: 'sentory1-secret-key-2025',
});

// ── Single-instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  // Another instance is already running – just quit this one
  app.quit();
}

let mainWindow = null;

// ── Create window ─────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Sentory1 – Expense Management',
    icon: path.join(__dirname, 'icon-512.png'),
    backgroundColor: '#080c1a',
    show: false,           // Show only after 'ready-to-show' fires
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,     // Security: isolate renderer context
      nodeIntegration: false,     // Security: no direct Node.js in renderer
      sandbox: false,             // Needed for preload to use require()
      devTools: !app.isPackaged,  // Disable DevTools in production builds
    },
  });

  // Load the existing app
  mainWindow.loadFile('index.html');

  // Smooth reveal: show window only after page is rendered
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Maximise on first run for best experience
    mainWindow.maximize();
  });

  // Open external links in the default browser, not in the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Windows / Linux: quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Second-instance: focus the existing window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── IPC handlers (called from preload.js via ipcRenderer.sendSync) ───────────

/**
 * Read a value from the persistent store.
 * Returns the raw value (string, object, array, etc.) or undefined.
 */
ipcMain.on('store-get', (event, key) => {
  event.returnValue = store.get(key);
});

/**
 * Write a value to the persistent store.
 */
ipcMain.on('store-set', (event, key, value) => {
  store.set(key, value);
  event.returnValue = true;
});

/**
 * Delete a single key from the store.
 */
ipcMain.on('store-delete', (event, key) => {
  store.delete(key);
  event.returnValue = true;
});

/**
 * Return an array of all stored keys.
 */
ipcMain.on('store-keys', (event) => {
  event.returnValue = Object.keys(store.store);
});

/**
 * Clear ALL data in the persistent store.
 */
ipcMain.on('store-clear', (event) => {
  store.clear();
  event.returnValue = true;
});

/**
 * Return the app version from package.json.
 */
ipcMain.on('get-version', (event) => {
  event.returnValue = app.getVersion();
});
