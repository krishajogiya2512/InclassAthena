/**
 * Athena Client Service
 * 
 * Provides a clean, resilient client-side interface to the Electron main process
 * via window.athenaAPI exposed by preload.cjs.
 * 
 * If running in a standard web browser (e.g. during Vite development or preview),
 * it provides realistic fallback mock data with transparent status indications.
 */

const isElectronAvailable = typeof window !== "undefined" && Boolean(window.athenaAPI);

// In-memory mock state for web browser preview mode
let mockStatus = "inactive";
let mockRunningApps = [
  {
    name: "Athena",
    bundleId: "org.erb.NewtonAthena",
    pid: 10171,
    category: "protected_athena",
    isProtected: true,
    protectionReason: "Current Athena proctoring application (Protected)",
    status: "running"
  },
  {
    name: "Google Chrome",
    bundleId: "com.google.Chrome",
    pid: 450,
    category: "protected_chrome",
    isProtected: true,
    protectionReason: "Designated examination browser (Protected)",
    status: "running"
  },
  {
    name: "Slack",
    bundleId: "com.tinyspeck.slackmacgap",
    pid: 10182,
    category: "eligible",
    isProtected: false,
    protectionReason: null,
    status: "running"
  },
  {
    name: "WhatsApp",
    bundleId: "net.whatsapp.WhatsApp",
    pid: 5124,
    category: "eligible",
    isProtected: false,
    protectionReason: null,
    status: "running"
  },
  {
    name: "Spotify",
    bundleId: "com.spotify.client",
    pid: 8812,
    category: "eligible",
    isProtected: false,
    protectionReason: null,
    status: "running"
  },
  {
    name: "Calculator",
    bundleId: "com.apple.calculator",
    pid: 5425,
    category: "eligible",
    isProtected: false,
    protectionReason: null,
    status: "running"
  },
  {
    name: "Finder",
    bundleId: "com.apple.finder",
    pid: 469,
    category: "system_excluded",
    isProtected: true,
    protectionReason: "Essential macOS desktop system service (Excluded)",
    status: "running"
  }
];

export const athenaClient = {
  isElectron: isElectronAvailable,
  platform: isElectronAvailable ? window.athenaAPI.platform : "darwin-web-preview",

  async getAppInfo() {
    if (isElectronAvailable) {
      return await window.athenaAPI.getAppInfo();
    }
    return {
      name: "Athena (Web Preview)",
      version: "1.2.0",
      pid: 99999,
      platform: "darwin",
      arch: "arm64",
      isPackaged: false,
      electronVersion: "41.10.7 (simulated)"
    };
  },

  async getRunningApps() {
    if (isElectronAvailable) {
      return await window.athenaAPI.getRunningApps();
    }
    // Web fallback
    await new Promise(r => setTimeout(r, 300));
    const summary = {
      total: mockRunningApps.length,
      protected: mockRunningApps.filter(a => a.isProtected).length,
      eligible: mockRunningApps.filter(a => a.category === "eligible").length,
      system: mockRunningApps.filter(a => a.category === "system_excluded").length
    };
    return {
      success: true,
      timestamp: Date.now(),
      apps: [...mockRunningApps],
      summary,
      isMock: true
    };
  },

  async activateFocusMode(options = {}) {
    if (isElectronAvailable) {
      return await window.athenaAPI.activateFocusMode(options);
    }
    // Web fallback simulation
    mockStatus = "preparing";
    await new Promise(r => setTimeout(r, 1000));

    const eligible = mockRunningApps.filter(a => a.category === "eligible");
    const closedApps = [];
    const remainingApps = [];

    // Simulate closing eligible apps (keep 1 open if multiple to show realistic exception handling)
    eligible.forEach((app, index) => {
      if (index === eligible.length - 1 && eligible.length > 2) {
        remainingApps.push({
          name: app.name,
          bundleId: app.bundleId,
          status: "refused",
          message: "Application remained open — may have unsaved changes or active prompt."
        });
      } else {
        closedApps.push({
          name: app.name,
          bundleId: app.bundleId,
          status: "closed",
          message: "Application terminated normally."
        });
      }
    });

    mockStatus = remainingApps.length > 0 ? "active_with_exceptions" : "active";

    return {
      success: true,
      status: mockStatus,
      report: {
        activatedAt: new Date().toISOString(),
        status: mockStatus,
        targetedCount: eligible.length,
        closedCount: closedApps.length,
        remainingCount: remainingApps.length,
        closedApps,
        remainingApps,
        protectedApps: mockRunningApps.filter(a => a.isProtected)
      },
      isMock: true
    };
  },

  async deactivateFocusMode() {
    if (isElectronAvailable) {
      return await window.athenaAPI.deactivateFocusMode();
    }
    mockStatus = "inactive";
    return {
      success: true,
      status: "inactive",
      message: "Athena Focus Mode has ended. Please note that applications closed during Focus Mode will not automatically reopen.",
      isMock: true
    };
  },

  async getFocusStatus() {
    if (isElectronAvailable) {
      return await window.athenaAPI.getFocusStatus();
    }
    return {
      status: mockStatus,
      activatedAt: mockStatus === "active" ? new Date().toISOString() : null,
      isOperationInProgress: false,
      isMock: true
    };
  },

  async toggleFullscreen() {
    if (isElectronAvailable && window.athenaAPI.toggleFullscreen) {
      return await window.athenaAPI.toggleFullscreen();
    }
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      return true;
    } else {
      await document.exitFullscreen().catch(() => {});
      return false;
    }
  },

  onFocusStatusChanged(callback) {
    if (isElectronAvailable && window.athenaAPI.onFocusStatusChanged) {
      return window.athenaAPI.onFocusStatusChanged(callback);
    }
    return () => {};
  }
};
