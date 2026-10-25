const { contextBridge, ipcRenderer } = require("electron");

/**
 * Athena Secure Preload Script
 * 
 * Exposes a tightly scoped, secure API bridge between the Electron main process
 * and the React renderer.
 * 
 * Best Practices:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - No unrestricted Node.js or child_process exposed
 * - Explicit typed methods only
 */
if (contextBridge && contextBridge.exposeInMainWorld) {
  contextBridge.exposeInMainWorld("athenaAPI", {
    isElectron: true,
    platform: process.platform,

    // Focus Mode API
    getRunningApps: () => ipcRenderer.invoke("focus:get-running-apps"),
    activateFocusMode: (options) => ipcRenderer.invoke("focus:activate", options),
    deactivateFocusMode: () => ipcRenderer.invoke("focus:deactivate"),
    getFocusStatus: () => ipcRenderer.invoke("focus:get-status"),

    // System & Window Controls
    getAppInfo: () => ipcRenderer.invoke("system:get-app-info"),
    toggleFullscreen: () => ipcRenderer.invoke("window:toggle-fullscreen"),
    getFullscreenState: () => ipcRenderer.invoke("window:get-fullscreen"),

    // Reactive Listeners
    onFocusStatusChanged: (callback) => {
      if (typeof callback !== "function") return () => {};
      const subscription = (event, data) => callback(data);
      ipcRenderer.on("focus:status-changed", subscription);
      return () => ipcRenderer.removeListener("focus:status-changed", subscription);
    }
  });
}
