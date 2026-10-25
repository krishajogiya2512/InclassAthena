/**
 * Athena Focus Mode — Application Management Service (macOS)
 * 
 * Securely and gracefully manages macOS desktop applications to maintain
 * a distraction-free examination environment.
 * 
 * Strict Guarantees:
 * 1. Athena is ALWAYS protected and never terminated.
 * 2. Google Chrome is ALWAYS protected as the designated examination browser.
 * 3. Essential macOS system services (Finder, Dock, loginwindow, WindowServer, etc.)
 *    are strictly excluded and never terminated.
 * 4. Normal, graceful termination (AppleScript tell application ... to quit) is used
 *    so applications can prompt to save unsaved documents.
 * 5. No sudo, no root elevation, no indiscriminate force-killing (SIGKILL).
 * 6. Honest verification and post-activation reporting of open/closed status.
 */

const { execFile } = require("child_process");
const { app } = require("electron");

// Essential macOS system processes that must NEVER be touched
const SYSTEM_SERVICE_BUNDLE_PREFIXES = [
  "com.apple.coreservices.",
  "com.apple.appkit.xpc.",
  "com.apple.quicklook.",
  "com.apple.WorkflowKit.",
  "com.apple.SafariPlatformSupport.",
  "com.apple.systemevents",
  "com.apple.security.",
  "com.apple.LocalAuthentication.",
  "com.apple.TextInputUI.",
  "com.apple.accessibility."
];

const SYSTEM_CRITICAL_BUNDLES = new Set([
  "com.apple.finder",
  "com.apple.dock",
  "com.apple.systemuiserver",
  "com.apple.controlcenter",
  "com.apple.WindowManager",
  "com.apple.loginwindow",
  "com.apple.Spotlight",
  "com.apple.notificationcenterui",
  "com.apple.AccessibilityUIServer",
  "com.apple.UniversalAccess",
  "com.apple.TextInputMenuAgent",
  "com.apple.TextInputSwitcher",
  "com.apple.PowerChime",
  "com.apple.wallpaper.agent",
  "com.apple.ViewBridgeAuxiliary",
  "com.apple.dock.extra",
  "com.apple.dock.helper",
  "com.apple.nbagent",
  "com.apple.textkit.nsattributedstringagent",
  "com.apple.studentd",
  "com.apple.SecurityAgent",
  "com.apple.FolderActionsDispatcher"
]);

const SYSTEM_CRITICAL_NAMES = new Set([
  "Finder",
  "Dock",
  "SystemUIServer",
  "ControlCenter",
  "WindowManager",
  "loginwindow",
  "Spotlight",
  "NotificationCenter",
  "AccessibilityUIServer",
  "UniversalAccess",
  "TextInputMenuAgent",
  "TextInputSwitcher",
  "PowerChime",
  "System Events",
  "osascript"
]);

// Google Chrome Bundle Identifiers and Names
const CHROME_BUNDLE_IDS = new Set([
  "com.google.Chrome",
  "com.google.Chrome.canary",
  "com.google.Chrome.beta",
  "com.google.Chrome.dev"
]);

const CHROME_NAMES = new Set([
  "Google Chrome",
  "Google Chrome Canary",
  "Google Chrome Beta",
  "Google Chrome Dev"
]);

class ApplicationManager {
  constructor() {
    this.platform = process.platform;
    this.isMacOS = this.platform === "darwin";

    // Internal State
    this.status = "inactive"; // 'inactive' | 'preparing' | 'active' | 'active_with_exceptions' | 'error'
    this.activatedAt = null;
    this.lastReport = null;
    this.isOperationInProgress = false;
  }

  /**
   * Determine whether the host system is supported.
   */
  checkPlatformSupport() {
    if (!this.isMacOS) {
      return {
        supported: false,
        platform: this.platform,
        message: `Focus Mode application management is currently supported on macOS. Running on '${this.platform}'. Support for other platforms is planned for a future update.`
      };
    }
    return {
      supported: true,
      platform: "darwin",
      message: "macOS application management service ready."
    };
  }

  /**
   * Safely identify if a process is the current Athena instance or its helpers.
   */
  isAthena(proc) {
    if (!proc) return false;

    // Check by PID
    const currentPid = process.pid;
    if (proc.pid && Number(proc.pid) === currentPid) return true;

    // Check bundle id
    const bundle = (proc.bundleId || "").toLowerCase();
    if (bundle === "org.erb.newtonathena" || bundle.includes("athena")) {
      return true;
    }

    // Check app name
    const name = (proc.name || "").toLowerCase();
    if (name === "athena" || name === "newton athena" || name === "inclassathena") {
      return true;
    }

    // In Electron development mode, check if the app name is Electron
    const electronAppName = (app && app.getName ? app.getName().toLowerCase() : "electron");
    if (name === electronAppName && proc.pid === currentPid) {
      return true;
    }

    return false;
  }

  /**
   * Safely identify if a process is Google Chrome.
   */
  isChrome(proc) {
    if (!proc) return false;
    if (proc.bundleId && CHROME_BUNDLE_IDS.has(proc.bundleId)) return true;
    if (proc.name && CHROME_NAMES.has(proc.name)) return true;
    return false;
  }

  /**
   * Safely identify if a process is an essential macOS system service.
   */
  isSystemCritical(proc) {
    if (!proc) return true;

    const bundle = proc.bundleId || "";
    const name = proc.name || "";

    if (SYSTEM_CRITICAL_BUNDLES.has(bundle)) return true;
    if (SYSTEM_CRITICAL_NAMES.has(name)) return true;

    for (const prefix of SYSTEM_SERVICE_BUNDLE_PREFIXES) {
      if (bundle.startsWith(prefix)) return true;
    }

    return false;
  }

  /**
   * Enrich and classify a process record.
   */
  classifyProcess(proc) {
    const isAthenaApp = this.isAthena(proc);
    const isChromeApp = this.isChrome(proc);
    const isSys = this.isSystemCritical(proc);

    let category = "eligible";
    let isProtected = false;
    let protectionReason = null;

    if (isAthenaApp) {
      category = "protected_athena";
      isProtected = true;
      protectionReason = "Current Athena proctoring application (Protected)";
    } else if (isChromeApp) {
      category = "protected_chrome";
      isProtected = true;
      protectionReason = "Designated examination browser (Protected)";
    } else if (isSys) {
      category = "system_excluded";
      isProtected = true;
      protectionReason = "Essential macOS desktop system service (Excluded)";
    }

    return {
      name: proc.name || "Unknown Application",
      bundleId: proc.bundleId || "",
      pid: proc.pid || null,
      category,
      isProtected,
      protectionReason,
      status: "running"
    };
  }

  /**
   * Query macOS for running GUI application processes using JavaScript for Automation (JXA).
   */
  scanRunningApplications() {
    return new Promise((resolve) => {
      const platformCheck = this.checkPlatformSupport();
      if (!platformCheck.supported) {
        return resolve({
          success: false,
          errorType: "UNSUPPORTED_PLATFORM",
          message: platformCheck.message,
          apps: [],
          summary: { total: 0, protected: 0, eligible: 0, system: 0 }
        });
      }

      // JXA script to query non-background applications
      const jxaScript = `
        const se = Application("System Events");
        const procs = se.applicationProcesses.whose({ backgroundOnly: false })();
        const result = [];
        for (let i = 0; i < procs.length; i++) {
          const p = procs[i];
          try {
            result.push({
              name: p.name(),
              bundleId: p.bundleIdentifier() || "",
              pid: p.unixId()
            });
          } catch(e) {}
        }
        JSON.stringify(result);
      `;

      execFile("osascript", ["-l", "JavaScript", "-e", jxaScript], { timeout: 5000 }, (err, stdout, stderr) => {
        if (err) {
          const errStr = (err.message || "") + (stderr || "");
          let errorType = "SCAN_ERROR";
          let userMessage = "Failed to scan running applications.";

          if (errStr.includes("-1743") || errStr.toLowerCase().includes("not authorized")) {
            errorType = "PERMISSION_DENIED";
            userMessage = "macOS Automation Permission required. Please grant Athena permission to manage System Events in macOS System Settings > Privacy & Security > Automation.";
          }

          return resolve({
            success: false,
            errorType,
            message: userMessage,
            details: errStr,
            apps: [],
            summary: { total: 0, protected: 0, eligible: 0, system: 0 }
          });
        }

        try {
          const rawProcs = JSON.parse(stdout.trim());
          const classified = rawProcs.map(p => this.classifyProcess(p));

          // Ensure Athena is in the list if not detected by System Events
          const hasAthena = classified.some(a => a.category === "protected_athena");
          if (!hasAthena) {
            classified.unshift({
              name: "Athena",
              bundleId: "org.erb.NewtonAthena",
              pid: process.pid,
              category: "protected_athena",
              isProtected: true,
              protectionReason: "Current Athena proctoring application (Protected)",
              status: "running"
            });
          }

          // Summary counts
          const summary = {
            total: classified.length,
            protected: classified.filter(a => a.category === "protected_athena" || a.category === "protected_chrome").length,
            eligible: classified.filter(a => a.category === "eligible").length,
            system: classified.filter(a => a.category === "system_excluded").length
          };

          resolve({
            success: true,
            timestamp: Date.now(),
            apps: classified,
            summary
          });
        } catch (parseErr) {
          resolve({
            success: false,
            errorType: "PARSE_ERROR",
            message: "Failed to parse application list from macOS.",
            details: parseErr.message,
            apps: [],
            summary: { total: 0, protected: 0, eligible: 0, system: 0 }
          });
        }
      });
    });
  }

  /**
   * Request graceful termination of an application using AppleScript.
   * Gives the target application the opportunity to display save dialogs or prompt.
   */
  requestAppQuit(appRecord) {
    return new Promise((resolve) => {
      // Security: Strictly verify the app is not protected
      if (appRecord.isProtected || appRecord.category !== "eligible") {
        return resolve({
          name: appRecord.name,
          requested: false,
          reason: "App is protected or system-critical. Skipped."
        });
      }

      const bundleId = (appRecord.bundleId || "").replace(/[^a-zA-Z0-9._-]/g, "");
      const appName = (appRecord.name || "").replace(/["\\]/g, "");

      let script;
      if (bundleId) {
        script = `with timeout of 3 seconds\ntell application id "${bundleId}" to quit\nend timeout`;
      } else if (appName) {
        script = `with timeout of 3 seconds\ntell application "${appName}" to quit\nend timeout`;
      } else {
        return resolve({
          name: appRecord.name,
          requested: false,
          reason: "No valid identifier for application."
        });
      }

      execFile("osascript", ["-e", script], { timeout: 4000 }, (err) => {
        if (err) {
          // Note: If an application has unsaved work and shows a dialog,
          // osascript may time out or return an error. This is expected.
          resolve({
            name: appRecord.name,
            bundleId: appRecord.bundleId,
            requested: true,
            quitError: err.message
          });
        } else {
          resolve({
            name: appRecord.name,
            bundleId: appRecord.bundleId,
            requested: true,
            quitError: null
          });
        }
      });
    });
  }

  /**
   * Activate Focus Mode.
   * 
   * 1. Scans running apps.
   * 2. Identifies eligible apps (excludes Athena, Chrome, system services).
   * 3. Sends graceful quit requests to eligible apps.
   * 4. Waits a short grace period.
   * 5. Re-scans to verify actual closed vs refused status.
   * 6. Updates internal state and returns a comprehensive report.
   */
  async activateFocusMode(options = {}) {
    if (this.isOperationInProgress) {
      return {
        success: false,
        errorType: "CONCURRENT_OPERATION",
        message: "A Focus Mode operation is already in progress. Please wait."
      };
    }

    const platformCheck = this.checkPlatformSupport();
    if (!platformCheck.supported) {
      this.status = "error";
      return {
        success: false,
        errorType: "UNSUPPORTED_PLATFORM",
        message: platformCheck.message
      };
    }

    this.isOperationInProgress = true;
    this.status = "preparing";

    try {
      // Initial scan
      const scanResult = await this.scanRunningApplications();
      if (!scanResult.success) {
        this.status = "error";
        this.isOperationInProgress = false;
        return scanResult;
      }

      // Filter eligible applications
      const eligibleApps = scanResult.apps.filter(a => a.category === "eligible");

      // Send graceful quit requests in parallel (with safe limits)
      const quitPromises = eligibleApps.map(app => this.requestAppQuit(app));
      const quitResults = await Promise.all(quitPromises);

      // Wait a grace period for macOS window server and apps to terminate/respond
      await new Promise(r => setTimeout(r, 1200));

      // Re-scan to verify actual remaining apps
      const postScan = await this.scanRunningApplications();
      const currentRunningSet = new Set(
        postScan.apps.map(a => (a.bundleId || a.name).toLowerCase())
      );

      const closedApps = [];
      const remainingApps = [];

      for (const app of eligibleApps) {
        const idKey = (app.bundleId || app.name).toLowerCase();
        if (!currentRunningSet.has(idKey)) {
          closedApps.push({
            name: app.name,
            bundleId: app.bundleId,
            status: "closed",
            message: "Application terminated normally."
          });
        } else {
          remainingApps.push({
            name: app.name,
            bundleId: app.bundleId,
            status: "refused",
            message: "Application remained open — may have unsaved changes or active dialog."
          });
        }
      }

      // Determine final status
      if (remainingApps.length === 0) {
        this.status = "active";
      } else if (closedApps.length > 0) {
        this.status = "active_with_exceptions";
      } else {
        // If there were eligible apps but none closed
        this.status = eligibleApps.length > 0 ? "active_with_exceptions" : "active";
      }

      this.activatedAt = new Date().toISOString();
      this.lastReport = {
        activatedAt: this.activatedAt,
        status: this.status,
        targetedCount: eligibleApps.length,
        closedCount: closedApps.length,
        remainingCount: remainingApps.length,
        closedApps,
        remainingApps,
        protectedApps: scanResult.apps.filter(a => a.isProtected)
      };

      this.isOperationInProgress = false;
      return {
        success: true,
        status: this.status,
        report: this.lastReport
      };
    } catch (err) {
      this.status = "error";
      this.isOperationInProgress = false;
      return {
        success: false,
        errorType: "ACTIVATION_FAILED",
        message: err.message || "Failed to activate Focus Mode."
      };
    }
  }

  /**
   * End Focus Mode.
   */
  deactivateFocusMode() {
    this.status = "inactive";
    this.activatedAt = null;
    return {
      success: true,
      status: "inactive",
      message: "Athena Focus Mode has ended. Please note that applications closed during Focus Mode will not automatically reopen."
    };
  }

  /**
   * Get current Focus Mode status.
   */
  getStatus() {
    return {
      status: this.status,
      activatedAt: this.activatedAt,
      isOperationInProgress: this.isOperationInProgress,
      lastReport: this.lastReport
    };
  }
}

module.exports = new ApplicationManager();
