import { useState } from "react";
import {
  ShieldCheckIcon,
  AppWindowIcon,
  ChromeIcon,
  RefreshCwIcon,
  PlayIcon,
  SquareIcon,
  LockIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon,
  SearchIcon,
  CheckCircleIcon
} from "../components/Icons";
import { ConfirmationModal } from "../components/ConfirmationModal";

export function FocusModeView({
  focusStatus = "inactive",
  onActivateFocusMode,
  onDeactivateFocusMode,
  runningAppsData = null,
  onScanApps,
  isLoadingApps = false,
  isActivating = false,
  activationReport = null,
  errorMessage = null,
  platformSupport = { supported: true }
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'eligible' | 'protected' | 'system'
  const [showDeactivationNotice, setShowDeactivationNotice] = useState(false);

  const apps = runningAppsData?.apps || [];
  const summary = runningAppsData?.summary || { total: 0, protected: 0, eligible: 0, system: 0 };

  const eligibleApps = apps.filter((a) => a.category === "eligible");
  const protectedApps = apps.filter((a) => a.category === "protected_athena" || a.category === "protected_chrome");
  const athenaApp = apps.find((a) => a.category === "protected_athena");

  // Filtered applications based on active tab and search query
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.bundleId && app.bundleId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === "eligible") return app.category === "eligible";
    if (filterTab === "protected") return app.category === "protected_athena" || app.category === "protected_chrome";
    if (filterTab === "system") return app.category === "system_excluded";
    return true;
  });

  const handleActivateClick = () => {
    setShowDeactivationNotice(false);
    setIsModalOpen(true);
  };

  const handleConfirmActivation = async () => {
    setIsModalOpen(false);
    setShowDeactivationNotice(false);
    await onActivateFocusMode();
  };

  const handleEndFocusMode = async () => {
    await onDeactivateFocusMode();
    setShowDeactivationNotice(true);
  };

  // Status card visual configurations
  const statusConfig = {
    inactive: {
      title: "Focus Mode Inactive",
      description: "Desktop environment is unconstrained. Eligible third-party applications remain open.",
      badge: "Focus Mode Inactive",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
      borderClass: "border-slate-200",
      bgClass: "bg-white",
      iconBg: "bg-slate-100 text-slate-600"
    },
    preparing: {
      title: "Preparing Focus Mode",
      description: "Requesting eligible applications to close normally and verifying process states.",
      badge: "Preparing Focus Mode",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-300 animate-pulse",
      borderClass: "border-blue-200",
      bgClass: "bg-blue-50/40",
      iconBg: "bg-blue-100 text-blue-600 animate-spin"
    },
    active: {
      title: "Focus Mode Active",
      description: "All eligible desktop applications have closed normally. Your session is protected and distraction-free.",
      badge: "Focus Mode Active",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      borderClass: "border-emerald-200",
      bgClass: "bg-emerald-50/30",
      iconBg: "bg-emerald-100 text-emerald-700"
    },
    active_with_exceptions: {
      title: "Focus Mode Active (With Exceptions)",
      description: "Focus Mode is active, but one or more applications remained open due to unsaved changes or active user prompts.",
      badge: "Active With Exceptions",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      borderClass: "border-amber-200",
      bgClass: "bg-amber-50/40",
      iconBg: "bg-amber-100 text-amber-700"
    },
    error: {
      title: "Focus Mode Error",
      description: errorMessage || "An error occurred while managing applications. Please verify system permissions.",
      badge: "Focus Mode Error",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
      borderClass: "border-rose-200",
      bgClass: "bg-rose-50/40",
      iconBg: "bg-rose-100 text-rose-700"
    }
  };

  const currentConfig = statusConfig[focusStatus] || statusConfig.inactive;
  const isFocusActive = focusStatus === "active" || focusStatus === "active_with_exceptions";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Athena Focus Mode</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create a distraction-free environment for your session.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Re-Scan Button */}
          <button
            onClick={onScanApps}
            disabled={isLoadingApps || isActivating}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Scan currently running applications on macOS"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${isLoadingApps ? "animate-spin text-blue-600" : "text-slate-600"}`} />
            <span>{isLoadingApps ? "Scanning..." : "Re-Scan Applications"}</span>
          </button>

          {/* Secondary Action: End Focus Mode */}
          <button
            onClick={handleEndFocusMode}
            disabled={!isFocusActive || isActivating}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer ${
              isFocusActive
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
            } focus-visible:ring-2 focus-visible:ring-slate-500`}
            title={isFocusActive ? "End Focus Mode session" : "Focus Mode is currently inactive"}
          >
            <SquareIcon className={`w-3.5 h-3.5 ${isFocusActive ? "text-rose-400" : "text-slate-400"}`} />
            <span>End Focus Mode</span>
          </button>

          {/* Primary Action: Activate Focus Mode */}
          <button
            onClick={handleActivateClick}
            disabled={isActivating || isLoadingApps || !platformSupport.supported}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-sm shadow-blue-600/30 cursor-pointer disabled:opacity-50 ${
              isFocusActive
                ? "bg-blue-700 hover:bg-blue-800"
                : "bg-blue-600 hover:bg-blue-700"
            } focus-visible:ring-2 focus-visible:ring-blue-500`}
          >
            <PlayIcon className="w-3.5 h-3.5 fill-current" />
            <span>
              {isActivating
                ? "Preparing Focus Mode..."
                : isFocusActive
                ? "Re-activate Focus Mode"
                : "Activate Focus Mode"}
            </span>
          </button>
        </div>
      </div>

      {/* Deactivation Informative Banner */}
      {showDeactivationNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start justify-between gap-3 text-xs text-blue-900 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <InfoIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Athena Focus Mode Has Ended</div>
              <p className="mt-0.5 text-blue-800">
                The desktop environment is restored to normal status. Please note that applications closed during Focus Mode will not automatically reopen.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDeactivationNotice(false)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unsupported Platform Warning Banner (if non-macOS) */}
      {!platformSupport.supported && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-800">
          <AlertTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">macOS Application Management Notice</div>
            <p className="mt-0.5">{platformSupport.message}</p>
          </div>
        </div>
      )}

      {/* Permission / Error Warning Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">Attention Required</div>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={onScanApps}
            className="px-3 py-1 bg-white border border-rose-300 text-rose-700 rounded-md font-semibold hover:bg-rose-100 cursor-pointer text-xs"
          >
            Retry Check
          </button>
        </div>
      )}

      {/* Prominent Focus Mode Status Card */}
      <div className={`p-6 rounded-2xl border ${currentConfig.borderClass} ${currentConfig.bgClass} shadow-xs transition-all`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${currentConfig.iconBg}`}>
              {focusStatus === "active" ? (
                <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />
              ) : focusStatus === "active_with_exceptions" ? (
                <AlertTriangleIcon className="w-6 h-6 text-amber-600" />
              ) : focusStatus === "error" ? (
                <AlertCircleIcon className="w-6 h-6 text-rose-600" />
              ) : (
                <AppWindowIcon className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900">{currentConfig.title}</h3>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentConfig.badgeClass}`}>
                  {currentConfig.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">{currentConfig.description}</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 shrink-0">
            <div className="text-center px-3 py-1 border-r border-slate-100">
              <div className="text-base font-bold text-slate-900">{summary.total}</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Detected</div>
            </div>
            <div className="text-center px-3 py-1 border-r border-slate-100">
              <div className="text-base font-bold text-emerald-600">{summary.protected}</div>
              <div className="text-[10px] text-emerald-600/80 font-medium uppercase mt-0.5">Protected</div>
            </div>
            <div className="text-center px-3 py-1 border-r border-slate-100">
              <div className="text-base font-bold text-amber-600">{summary.eligible}</div>
              <div className="text-[10px] text-amber-600/80 font-medium uppercase mt-0.5">Eligible</div>
            </div>
            <div className="text-center px-3 py-1">
              <div className="text-base font-bold text-slate-500">{summary.system}</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">System</div>
            </div>
          </div>
        </div>

        {/* Post-Activation Detailed Report Card */}
        {activationReport && (
          <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>Activation Summary</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({activationReport.targetedCount} requested • {activationReport.closedCount} closed • {activationReport.remainingCount} remaining)
                </span>
              </div>
              {activationReport.remainingCount > 0 && (
                <button
                  onClick={handleConfirmActivation}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Retry Closing Remaining Applications
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Closed Applications List */}
              <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200 text-xs">
                <div className="font-semibold text-emerald-700 flex items-center gap-1.5 mb-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Closed Applications ({activationReport.closedApps?.length || 0})</span>
                </div>
                {activationReport.closedApps?.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No applications were closed in this cycle.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {activationReport.closedApps.map((app, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        <span className="font-medium text-slate-800 text-[11px] truncate">{app.name}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold shrink-0">Closed Normally</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remaining / Refused Applications List */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                <div className="font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                  <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Applications Remaining Open ({activationReport.remainingApps?.length || 0})</span>
                </div>
                {activationReport.remainingApps?.length === 0 ? (
                  <p className="text-[11px] text-emerald-700">All targeted applications closed successfully.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {activationReport.remainingApps.map((app, idx) => (
                      <div key={idx} className="bg-white/90 p-2 rounded-lg border border-amber-200/80">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800 text-[11px] truncate">{app.name}</span>
                          <span className="text-[10px] text-amber-700 font-semibold shrink-0">Refused / Open</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{app.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Protected Applications Settings & Security Policy Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
              <span>Protected Applications &amp; Focus Mode Settings</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These applications are permanently shielded by Athena and will never be terminated.
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            System Protected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Athena */}
          <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Athena Examination Application</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                  Current Host {athenaApp?.pid ? `(PID ${athenaApp.pid})` : "(Protected)"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                The primary proctoring and assessment container. Continuous execution is guaranteed.
              </p>
            </div>
          </div>

          {/* Card 2: Google Chrome */}
          <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-xs">
              <ChromeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Google Chrome</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                  Designated Browser
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Designated web portal for examination platforms, cloud assessments, and authorized web resources.
              </p>
            </div>
          </div>
        </div>

        {/* Operational Security Settings Information */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <InfoIcon className="w-4 h-4 text-blue-500 shrink-0" />
            <span>macOS Application Management Rules</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-900">Graceful Quit Request</div>
              <p className="text-slate-500 mt-0.5">Sends standard AppleEvents quit signals with a 3.0s timeout to allow apps to save unsaved documents.</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-900">System Exclusions</div>
              <p className="text-slate-500 mt-0.5">Finder, WindowServer, Dock, and core macOS system services are strictly safeguarded.</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-900">Honest Verification</div>
              <p className="text-slate-500 mt-0.5">Re-checks the process table to report refused or open applications honestly rather than assuming success.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Running Applications Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Detected Running Applications</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live inspection of active GUI processes running in your current macOS session.
            </p>
          </div>

          {/* Tabs and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFilterTab("all")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterTab === "all" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({summary.total})
              </button>
              <button
                onClick={() => setFilterTab("eligible")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterTab === "eligible" ? "bg-white text-amber-700 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Eligible ({summary.eligible})
              </button>
              <button
                onClick={() => setFilterTab("protected")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterTab === "protected" ? "bg-white text-emerald-700 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Protected ({summary.protected})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filteredApps.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <AppWindowIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              {searchQuery ? "No applications match your search query." : "No applications detected in this category."}
            </div>
          ) : (
            filteredApps.map((app, index) => {
              const isProtected = app.isProtected;
              const isEligible = app.category === "eligible";

              return (
                <div
                  key={index}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 uppercase border ${
                        app.category === "protected_athena"
                          ? "bg-blue-600 text-white border-blue-700"
                          : app.category === "protected_chrome"
                          ? "bg-white text-slate-800 border-slate-200"
                          : isEligible
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {app.category === "protected_chrome" ? (
                        <ChromeIcon className="w-5 h-5 text-blue-600" />
                      ) : app.category === "protected_athena" ? (
                        <ShieldCheckIcon className="w-5 h-5 text-white" />
                      ) : (
                        app.name.charAt(0)
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{app.name}</span>
                        {app.pid && (
                          <span className="text-[10px] text-slate-400 font-mono">PID {app.pid}</span>
                        )}
                        <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {app.status || "running"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {app.protectionReason || app.bundleId || "Third-party desktop application"}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isProtected ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <LockIcon className="w-3 h-3 text-emerald-600" />
                        <span>Protected</span>
                      </span>
                    ) : isEligible ? (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                        Eligible to Close
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                        System Excluded
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            Showing {filteredApps.length} of {apps.length} detected processes
          </span>
          <span>Automatic detection active</span>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmActivation}
        eligibleApps={eligibleApps}
        protectedApps={protectedApps}
        isLoading={isActivating}
      />
    </div>
  );
}
