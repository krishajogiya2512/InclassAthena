const { contextBridge, ipcRenderer } = require("electron");

/**
 * Athena Secure Preload Script
 * 
 * Exposes tightly scoped, secure API bridges between the Electron main process
 * and the React renderer:
 * 1. window.athenaAPI - System & Focus Mode controls
 * 2. window.athenaPrivacy - Central Privacy & Permission Activity Registry
 * 
 * Best Practices:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - No unrestricted Node.js or child_process exposed
 * - Explicit typed methods only
 */

const privacyBridge = {
  // Central Activity Registry
  setActivity: (type, isActive) => ipcRenderer.invoke("privacy:set-activity", type, isActive),
  getActivities: () => ipcRenderer.invoke("privacy:get-activities"),
  getPermissions: () => ipcRenderer.invoke("privacy:get-permissions"),
  getPrivacyState: () => ipcRenderer.invoke("privacy:get-state"),

  // Managed Session Control
  setSessionState: (state) => ipcRenderer.invoke("session:set-state", state),

  // Reactive Listeners
  onActivityChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("privacy:activity-changed", subscription);
    return () => ipcRenderer.removeListener("privacy:activity-changed", subscription);
  },

  onSessionStateChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("session:state-changed", subscription);
    return () => ipcRenderer.removeListener("session:state-changed", subscription);
  },

  onBeforeQuit: (callback) => {
    if (typeof callback !== "function") return () => {};
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("session:before-quit", subscription);
    return () => ipcRenderer.removeListener("session:before-quit", subscription);
  }
};

if (contextBridge && contextBridge.exposeInMainWorld) {
  // Expose dedicated privacy API requested by specification
  contextBridge.exposeInMainWorld("athenaPrivacy", privacyBridge);

  // Expose main Athena API
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

    // Privacy API reference on athenaAPI for convenience
    privacy: privacyBridge,

    // Reactive Listeners
    onFocusStatusChanged: (callback) => {
      if (typeof callback !== "function") return () => {};
      const subscription = (event, data) => callback(data);
      ipcRenderer.on("focus:status-changed", subscription);
      return () => ipcRenderer.removeListener("focus:status-changed", subscription);
    }
  });
}
