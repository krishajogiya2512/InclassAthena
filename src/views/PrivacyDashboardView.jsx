import { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  CameraIcon,
  CameraOffIcon,
  LockIcon,
  RefreshCwIcon,
  InfoIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertCircleIcon
} from "../components/Icons";
import { athenaClient } from "../services/athenaClient";

export function PrivacyDashboardView({ onNavigateToCamera }) {
  const [privacyState, setPrivacyState] = useState({
    activities: { camera: false, microphone: false, screen: false },
    permissions: { camera: "granted", microphone: "granted", screen: "granted" },
    history: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrivacyState = async () => {
    setIsLoading(true);
    try {
      const state = await athenaClient.getPrivacyState();
      if (state) {
        setPrivacyState(state);
      }
    } catch (err) {
      console.warn("Failed to fetch privacy state:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivacyState();

    // Listen to real-time privacy activity changes from main process
    const unsubscribe = athenaClient.onPrivacyActivityChanged((data) => {
      setPrivacyState((prev) => ({
        ...prev,
        activities: data.activities || {
          ...prev.activities,
          [data.type]: data.active
        },
        history: [
          {
            type: data.type,
            active: data.active,
            timestamp: data.timestamp || Date.now()
          },
          ...prev.history
        ].slice(0, 50)
      }));
    });

    return () => unsubscribe();
  }, []);

  const { activities, permissions, history } = privacyState;

  // Format permission label
  const formatPermission = (status) => {
    switch (status) {
      case "granted":
        return { label: "Allowed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircleIcon };
      case "denied":
        return { label: "Denied", color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertCircleIcon };
      case "restricted":
        return { label: "Restricted", color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangleIcon };
      case "not-determined":
        return { label: "Prompt on Use", color: "bg-blue-50 text-blue-700 border-blue-200", icon: InfoIcon };
      default:
        return { label: "Available", color: "bg-slate-100 text-slate-700 border-slate-200", icon: CheckCircleIcon };
    }
  };

  const cameraPerm = formatPermission(permissions.camera);
  const isCameraActive = Boolean(activities.camera);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-7 animate-fade-in select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Permissions &amp; Privacy Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time verification of macOS system permissions and live hardware access status.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPrivacyState}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCwIcon className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : "text-slate-600"}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Primary Overview Notice */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3.5 text-xs text-blue-900 shadow-xs">
        <InfoIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Understanding Permission vs. Live Activity: </span>
          <span>
            <strong>System Permission</strong> indicates whether macOS allows Athena to access a device.
            <strong> Live Activity</strong> indicates whether Athena is actively streaming or capturing hardware right now.
            Even when permission is Allowed, media devices remain completely dormant and unpowered until explicitly started.
          </span>
        </div>
      </div>

      {/* Main Hardware Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Resource 1: Camera Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isCameraActive
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {isCameraActive ? (
                  <CameraIcon className="w-6 h-6 text-emerald-600" />
                ) : (
                  <CameraOffIcon className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Video Camera</h3>
                <p className="text-xs text-slate-500">Live proctor verification &amp; candidate stream</p>
              </div>
            </div>

            {/* Live Activity Indicator */}
            {isCameraActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Inactive</span>
              </span>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Permission</div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${cameraPerm.color}`}>
                  {cameraPerm.label}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Athena Activity</div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pt-0.5">
                {isCameraActive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700">Capturing Live Stream</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-slate-500">Idle / Hardware Off</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-400">Controlled via useCamera Hook</span>
            {onNavigateToCamera && (
              <button
                type="button"
                onClick={onNavigateToCamera}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Open Camera Page →
              </button>
            )}
          </div>
        </div>

        {/* Resource 2: Screen & Display Sandbox Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <LockIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Screen &amp; Window Sandbox</h3>
                <p className="text-xs text-slate-500">Proctored examination isolation</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Sandbox Enforced</span>
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fullscreen Mode</div>
              <div className="text-xs font-bold text-slate-800 pt-0.5">Enforced / Mandatory</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Screen Recording</div>
              <div className="text-xs font-bold text-slate-600 pt-0.5">Restricted to Sandbox</div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-400">Context Isolation: Enabled</span>
            <span className="text-xs font-semibold text-emerald-600">Secure</span>
          </div>
        </div>
      </div>

      {/* Central Privacy Activity Registry History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Privacy Activity Audit Trail</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live chronological log emitted by the Electron main-process central registry.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
            Registry Active
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No state changes recorded yet in this session.
            </div>
          ) : (
            history.map((item, index) => (
              <div key={index} className="px-6 py-3 flex items-center justify-between text-xs hover:bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    {item.type}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    item.active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {item.active ? "STARTED / ACTIVE" : "STOPPED / INACTIVE"}
                  </span>
                  {item.reason && (
                    <span className="text-[11px] text-slate-400">({item.reason})</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* macOS Privacy & Security Instructions */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
          <span>Managing macOS Permissions</span>
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          If you denied camera access previously, macOS remembers your choice. To grant access:
        </p>
        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1">
          <li>Open <strong>System Settings</strong> on your Mac.</li>
          <li>Navigate to <strong>Privacy &amp; Security</strong> &gt; <strong>Camera</strong>.</li>
          <li>Find <strong>Athena</strong> (or Electron during development) in the list and toggle the switch to <strong>On</strong>.</li>
          <li>Return to Athena and click <strong>Turn Camera On</strong>.</li>
        </ol>
      </div>
    </div>
  );
}
