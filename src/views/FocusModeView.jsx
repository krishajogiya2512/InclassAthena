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
  SearchIcon
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

  const apps = runningAppsData?.apps || [];
  const summary = runningAppsData?.summary || { total: 0, protected: 0, eligible: 0, system: 0 };

  const eligibleApps = apps.filter((a) => a.category === "eligible");
  const protectedApps = apps.filter((a) => a.category === "protected_athena" || a.category === "protected_chrome");

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
    setIsModalOpen(true);
  };

  const handleConfirmActivation = async () => {
    setIsModalOpen(false);
    await onActivateFocusMode();
  };

  // Status card visual configurations
  const statusConfig = {
    inactive: {
      title: "Focus Mode Inactive",
      description: "Desktop environment is unconstrained. Eligible third-party applications remain open.",
      badge: "Inactive",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
      borderClass: "border-slate-200",
      bgClass: "bg-white",
      iconBg: "bg-slate-100 text-slate-600"
    },
    preparing: {
      title: "Preparing Focus Mode...",
      description: "Requesting eligible applications to close normally and verifying process states.",
      badge: "Preparing",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-300 animate-pulse",
      borderClass: "border-blue-200",
      bgClass: "bg-blue-50/40",
      iconBg: "bg-blue-100 text-blue-600 animate-spin"
    },
    active: {
      title: "Focus Mode Active",
      description: "All eligible desktop applications have been successfully closed. Environment is secured.",
      badge: "Active & Secure",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      borderClass: "border-emerald-200",
      bgClass: "bg-emerald-50/30",
      iconBg: "bg-emerald-100 text-emerald-700"
    },
    active_with_exceptions: {
      title: "Focus Mode Active (With Exceptions)",
      description: "Focus Mode is active, but one or more applications remained open (unsaved work or permissions).",
      badge: "Exceptions Reported",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      borderClass: "border-amber-200",
      bgClass: "bg-amber-50/40",
      iconBg: "bg-amber-100 text-amber-700"
    },
    error: {
      title: "Focus Mode Error",
      description: errorMessage || "An error occurred while managing applications. Please verify system permissions.",
      badge: "Error Encountered",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
      borderClass: "border-rose-200",
      bgClass: "bg-rose-50/40",
      iconBg: "bg-rose-100 text-rose-700"
    }
  };

  const currentConfig = statusConfig[focusStatus] || statusConfig.inactive;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Athena Focus Mode</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create a distraction-free environment for your examination session.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onScanApps}
            disabled={isLoadingApps || isActivating}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Scan currently running applications on macOS"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${isLoadingApps ? "animate-spin text-blue-600" : "text-slate-600"}`} />
            <span>{isLoadingApps ? "Scanning..." : "Re-Scan Applications"}</span>
          </button>

          {focusStatus === "active" || focusStatus === "active_with_exceptions" ? (
            <button
              onClick={onDeactivateFocusMode}
              disabled={isActivating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <SquareIcon className="w-3.5 h-3.5 text-rose-400" />
              <span>End Focus Mode</span>
            </button>
          ) : (
            <button
              onClick={handleActivateClick}
              disabled={isActivating || isLoadingApps || !platformSupport.supported}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              <PlayIcon className="w-3.5 h-3.5 fill-current" />
              <span>{isActivating ? "Preparing..." : "Activate Focus Mode"}</span>
            </button>
          )}
        </div>
      </div>

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

        {/* Post-Activation Exception Summary (if applications refused to close) */}
        {activationReport?.remainingApps?.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
                Applications Remaining Open ({activationReport.remainingApps.length})
              </span>
              <button
                onClick={handleConfirmActivation}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 underline cursor-pointer"
              >
                Retry Closing Open Applications
              </button>
            </div>
            <p className="text-amber-800 text-[11px] mb-2.5">
              These applications did not terminate following the quit request. They may have open unsaved documents,
              modal confirmation sheets, or require manual user response.
            </p>
            <div className="space-y-1.5">
              {activationReport.remainingApps.map((app, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200/80">
                  <span className="font-medium text-slate-800">{app.name}</span>
                  <span className="text-[10px] text-amber-700 italic">{app.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Protected Applications Policy Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
              <span>Protected Applications &amp; Security Policy</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These applications are permanently shielded and will never be requested to close.
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            System Enforced
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
                  Current Host
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

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
          <InfoIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>macOS Graceful Shutdown:</strong> Athena requests standard application termination (via AppleEvents).
            Applications are given the standard opportunity to save work or prompt the user. Critical macOS services
            (such as Finder, WindowServer, and Dock) are permanently excluded.
          </p>
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
