const { BrowserWindow, app, ipcMain, session } = require("electron");
const path = require("path");
const net = require("net");
const applicationManager = require("./services/applicationManager.cjs");
const privacyManager = require("./services/privacyManager.cjs");

let mainWindow = null;

// Helper to check if Vite dev server is running on port 5173
function checkPortOpen(port, host = "127.0.0.1", timeout = 600) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeout);
    socket.once("connect", () => {
      status = true;
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: "Athena — Examination & Focus Security",
    backgroundColor: "#0B132B",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for preload script IPC access
      webSecurity: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Load Vite dev server if running, otherwise load production build
  const isDevPortOpen = await checkPortOpen(5173);
  if (isDevPortOpen) {
    console.log("[Athena Main] Connected to Vite dev server at http://localhost:5173/");
    mainWindow.loadURL("http://localhost:5173/");
  } else {
    const distIndexPath = path.join(__dirname, "../dist/index.html");
    console.log(`[Athena Main] Loading static production bundle from: ${distIndexPath}`);
    mainWindow.loadFile(distIndexPath).catch((err) => {
      console.warn("[Athena Main] Could not load dist/index.html, falling back to localhost:5173", err.message);
      mainWindow.loadURL("http://localhost:5173/");
    });
  }

  // Handle window close
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Security: Verify IPC request came from our trusted main window
function validateSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error("Unauthorized IPC invocation from untrusted sender.");
  }
}

// Register IPC Handlers
function registerIpcHandlers() {
  // Query running applications
  ipcMain.handle("focus:get-running-apps", async (event) => {
    validateSender(event);
    return await applicationManager.scanRunningApplications();
  });

  // Activate Focus Mode
  ipcMain.handle("focus:activate", async (event, options) => {
    validateSender(event);
    const result = await applicationManager.activateFocusMode(options);

    // Notify window of status update
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("focus:status-changed", {
        status: applicationManager.status,
        report: applicationManager.lastReport
      });
    }

    return result;
  });

  // Deactivate Focus Mode
  ipcMain.handle("focus:deactivate", async (event) => {
    validateSender(event);
    const result = applicationManager.deactivateFocusMode();

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("focus:status-changed", {
        status: "inactive",
        report: null
      });
    }

    return result;
  });

  // Get current status
  ipcMain.handle("focus:get-status", async (event) => {
    validateSender(event);
    return applicationManager.getStatus();
  });

  // System and Application info
  ipcMain.handle("system:get-app-info", async (event) => {
    validateSender(event);
    return {
      name: app.getName(),
      version: app.getVersion(),
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      isPackaged: app.isPackaged,
      electronVersion: process.versions.electron
    };
  });

  // Window Controls
  ipcMain.handle("window:toggle-fullscreen", async (event) => {
    validateSender(event);
    if (mainWindow && !mainWindow.isDestroyed()) {
      const current = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!current);
      return !current;
    }
    return false;
  });

  ipcMain.handle("window:get-fullscreen", async (event) => {
    validateSender(event);
    if (mainWindow && !mainWindow.isDestroyed()) {
      return mainWindow.isFullScreen();
    }
    return false;
  });

  // ==========================================
  // Privacy & Permissions Central Activity API
  // ==========================================

  // Set resource activity (e.g., camera: true / false)
  ipcMain.handle("privacy:set-activity", async (event, type, isActive) => {
    validateSender(event);
    return privacyManager.setActivity(type, isActive);
  });

  // Get active activities
  ipcMain.handle("privacy:get-activities", async (event) => {
    validateSender(event);
    return privacyManager.getActivities();
  });

  // Get system permissions (e.g. macOS Camera permission status)
  ipcMain.handle("privacy:get-permissions", async (event) => {
    validateSender(event);
    return privacyManager.getAllPermissions();
  });

  // Get combined privacy dashboard state
  ipcMain.handle("privacy:get-state", async (event) => {
    validateSender(event);
    return privacyManager.getPrivacyState();
  });

  // Manage Examination Session Lifecycle
  ipcMain.handle("session:set-state", async (event, state) => {
    validateSender(event);
    return privacyManager.setSessionState(state);
  });
}

// Configure security & permissions for media access
function configureSessionSecurity() {
  if (!session || !session.defaultSession) return;

  // Verify permission checks for camera & media
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (permission === "media" || permission === "camera" || permission === "microphone") {
      // Validate that request originated from our own window
      if (mainWindow && webContents === mainWindow.webContents) {
        return true;
      }
    }
    return false;
  });

  // Handle permission requests explicitly for trusted application origin
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (permission === "media" || permission === "camera" || permission === "microphone") {
      if (mainWindow && webContents === mainWindow.webContents) {
        callback(true);
        return;
      }
    }
    callback(false);
  });
}

if (app && app.whenReady) {
  app.whenReady().then(() => {
    configureSessionSecurity();
    registerIpcHandlers();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow && BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  // Ensure camera & media tracks are released on app quit
  app.on("before-quit", () => {
    console.log("[Athena Main] Application shutting down — stopping media activities.");
    privacyManager.stopAllActivities("app_before_quit");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("session:before-quit");
    }
  });

  app.on("window-all-closed", () => {
    privacyManager.stopAllActivities("window_all_closed");
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

module.exports = {
  createWindow,
  registerIpcHandlers
};
