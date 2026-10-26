/**
 * Athena Privacy & Permissions Service
 * 
 * Central activity registry and system permission manager for Athena desktop.
 * 
 * Guarantees:
 * 1. Single source of truth for active media/hardware usage across Athena.
 * 2. Distinguishes between macOS system permission (allowed/denied) and live activity (active/inactive).
 * 3. Auto-resets and releases all media activity on session end or application quit.
 * 4. Broadcasts reactive events to all renderer windows via IPC.
 */

const { systemPreferences, BrowserWindow } = require("electron");

class PrivacyManager {
  constructor() {
    this.platform = process.platform;
    this.isMacOS = this.platform === "darwin";

    // Live Activity Registry
    this.activities = {
      camera: false,
      microphone: false,
      screen: false
    };

    // Activity Audit History (Last 50 events)
    this.history = [];

    // Session State Tracking
    this.sessionState = "idle"; // 'idle' | 'in_progress' | 'ended' | 'error'
  }

  /**
   * Determine macOS system permission status for a media type.
   * Uses Electron's native systemPreferences.getMediaAccessStatus on macOS.
   */
  getSystemPermission(type) {
    const validTypes = ["camera", "microphone", "screen"];
    if (!validTypes.includes(type)) {
      return "unknown";
    }

    if (this.isMacOS && systemPreferences && typeof systemPreferences.getMediaAccessStatus === "function") {
      try {
        // macOS media access statuses: 'not-determined' | 'granted' | 'denied' | 'restricted' | 'unknown'
        return systemPreferences.getMediaAccessStatus(type);
      } catch (err) {
        console.warn(`[PrivacyManager] Error querying system permission for ${type}:`, err.message);
        return "unknown";
      }
    }

    // Default for dev / non-macOS platforms
    return "granted";
  }

  /**
   * Get all system permission statuses.
   */
  getAllPermissions() {
    return {
      camera: this.getSystemPermission("camera"),
      microphone: this.getSystemPermission("microphone"),
      screen: this.getSystemPermission("screen")
    };
  }

  /**
   * Get the current live activity registry state.
   */
  getActivities() {
    return { ...this.activities };
  }

  /**
   * Full privacy dashboard state.
   */
  getPrivacyState() {
    return {
      activities: this.getActivities(),
      permissions: this.getAllPermissions(),
      sessionState: this.sessionState,
      history: [...this.history]
    };
  }

  /**
   * Set the active state for a media resource (e.g. camera = true/false).
   * Validates resource type and broadcasts updates to the renderer.
   */
  setActivity(type, isActive) {
    if (!["camera", "microphone", "screen"].includes(type)) {
      throw new Error(`Invalid privacy activity type: ${type}`);
    }

    const previousState = this.activities[type];
    const newState = Boolean(isActive);

    this.activities[type] = newState;

    const eventRecord = {
      type,
      active: newState,
      timestamp: Date.now(),
      sessionState: this.sessionState
    };

    // Maintain a bounded audit trail of recent privacy state transitions
    this.history.unshift(eventRecord);
    if (this.history.length > 50) {
      this.history.pop();
    }

    // Broadcast to all open BrowserWindow webContents
    this.broadcastEvent("privacy:activity-changed", {
      type,
      active: newState,
      activities: this.getActivities(),
      timestamp: eventRecord.timestamp
    });

    console.log(`[PrivacyManager] Activity changed: ${type} = ${newState ? "ACTIVE" : "INACTIVE"}`);

    return {
      success: true,
      type,
      active: newState,
      activities: this.getActivities()
    };
  }

  /**
   * Stop all active media activities and notify renderers.
   * Used during session teardown, application quit, or emergency reset.
   */
  stopAllActivities(reason = "user_or_system_shutdown") {
    console.log(`[PrivacyManager] Stopping all media activities (reason: ${reason})`);
    
    let hadActive = false;
    for (const key of Object.keys(this.activities)) {
      if (this.activities[key]) {
        this.activities[key] = false;
        hadActive = true;
      }
    }

    const timestamp = Date.now();
    this.history.unshift({
      type: "all",
      active: false,
      reason,
      timestamp,
      sessionState: this.sessionState
    });

    this.broadcastEvent("privacy:activity-changed", {
      type: "all",
      active: false,
      reason,
      activities: this.getActivities(),
      timestamp
    });

    return {
      success: true,
      activities: this.getActivities()
    };
  }

  /**
   * Handle examination session state transitions.
   * If session transitions to 'ended' or 'error', triggers full media shutdown.
   */
  setSessionState(state) {
    const validStates = ["idle", "in_progress", "ended", "error"];
    if (!validStates.includes(state)) {
      throw new Error(`Invalid session state: ${state}`);
    }

    this.sessionState = state;
    console.log(`[PrivacyManager] Examination session state updated: ${state}`);

    if (state === "ended" || state === "error") {
      this.stopAllActivities(`session_${state}`);
      this.broadcastEvent("session:state-changed", { state });
    }

    return {
      success: true,
      sessionState: this.sessionState
    };
  }

  /**
   * Safe helper to broadcast an IPC message to all active BrowserWindow instances.
   */
  broadcastEvent(channel, data) {
    try {
      if (BrowserWindow && typeof BrowserWindow.getAllWindows === "function") {
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (win && !win.isDestroyed() && win.webContents) {
            win.webContents.send(channel, data);
          }
        }
      }
    } catch (err) {
      console.warn(`[PrivacyManager] Failed to broadcast on ${channel}:`, err.message);
    }
  }
}

module.exports = new PrivacyManager();
