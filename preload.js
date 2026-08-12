/**
 * preload.js – Secure bridge between renderer (index.html) and main process.
 * Exposes window.electronAPI so index.html can read/write persistent data
 * via electron-store, which stores data in %AppData%\Sentory1\config.json
 *
 * Security: nodeIntegration is OFF; only these whitelisted methods are exposed.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Persistent store ──────────────────────────────────────────────────────
  /** Read a value by key (returns the stored value, or undefined if not set) */
  getData: (key) => ipcRenderer.sendSync('store-get', key),

  /** Write a value by key */
  setData: (key, value) => ipcRenderer.sendSync('store-set', key, value),

  /** Remove a single key */
  removeData: (key) => ipcRenderer.sendSync('store-delete', key),

  /** Get all keys currently stored */
  getAllKeys: () => ipcRenderer.sendSync('store-keys'),

  /** Clear ALL stored data (used only during wipe operations) */
  clearAll: () => ipcRenderer.sendSync('store-clear'),

  // ── App info ──────────────────────────────────────────────────────────────
  /** Returns the app version string from package.json */
  getVersion: () => ipcRenderer.sendSync('get-version'),
});
