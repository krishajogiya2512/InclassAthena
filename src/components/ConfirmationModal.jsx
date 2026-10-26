import { useEffect, useRef } from "react";
import {
  ShieldCheckIcon,
  AppWindowIcon,
  LockIcon,
  CheckCircleIcon,
  XIcon
} from "./Icons";

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  eligibleApps = [],
  isLoading = false
}) {
  const confirmButtonRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Auto-focus the confirm button when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-focus-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <AppWindowIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-focus-title" className="text-base font-bold text-slate-900 leading-tight">
                Activate Athena Focus Mode?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prepare an isolated, distraction-free environment for your examination.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Key Explanations Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Strict Protection Guarantees</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">•</span>
                <span><strong>Athena</strong> and <strong>Google Chrome</strong> will remain open and fully available.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold shrink-0">•</span>
                <span>Other eligible desktop applications will be requested to close normally.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold shrink-0">•</span>
                <span>Applications with unsaved work may prompt you to save or cancel closing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 font-bold shrink-0">•</span>
                <span>Essential macOS services (Finder, WindowServer, Dock) will remain completely unaffected.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 font-bold shrink-0">•</span>
                <span>macOS Automation permission may be requested to send graceful quit events.</span>
              </li>
            </ul>
          </div>

          {/* List of Applications to be requested to close */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Applications to be requested to close ({eligibleApps.length})
              </span>
              <span className="text-[11px] text-slate-500">Normal termination request</span>
            </div>

            {eligibleApps.length === 0 ? (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-center text-xs text-emerald-700">
                <CheckCircleIcon className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                No non-protected user applications are currently running. Ready to activate immediately.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100 bg-white">
                {eligibleApps.map((app, index) => (
                  <div key={index} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px] shrink-0 uppercase">
                        {app.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-slate-800 truncate">{app.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {app.bundleId || `PID: ${app.pid}`}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                      Eligible to Close
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Protected Apps Strip */}
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/70 border border-emerald-200/70 rounded-lg text-xs text-emerald-800">
            <LockIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">
              <strong>Protected:</strong> Athena &amp; Google Chrome (Will NOT close)
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl shadow-2xs hover:bg-slate-50 cursor-pointer disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/30 cursor-pointer flex items-center gap-2 disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Activating Focus Mode...</span>
              </>
            ) : (
              <span>Activate Focus Mode</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
