import {
  ClockIcon,
  MaximizeIcon,
  MinimizeIcon,
  CameraIcon,
  CameraOffIcon,
  AppWindowIcon
} from "./Icons";

export function Header({
  assessmentTitle = "National Standard Computer Assessment 2026",
  sessionCode = "Session #ATH-8842",
  timeLeftFormatted = "58:42",
  isFullscreen = false,
  onToggleFullscreen,
  isCameraActive = false,
  focusStatus = "inactive",
  onOpenFocusMode
}) {
  return (
    <header className="h-18 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 select-none shadow-xs">
      {/* Assessment Identity */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">{assessmentTitle}</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {sessionCode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Proctored Environment Active • Secure Sandbox
          </p>
        </div>
      </div>

      {/* Right Controls & Status Indicators */}
      <div className="flex items-center gap-3.5">
        {/* Focus Mode Pill */}
        <button
          onClick={onOpenFocusMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            focusStatus === "active"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : focusStatus === "active_with_exceptions"
              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              : focusStatus === "preparing"
              ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
          title="Click to view Athena Focus Mode details"
        >
          <AppWindowIcon className="w-3.5 h-3.5" />
          <span>
            {focusStatus === "active"
              ? "Focus Mode: Active"
              : focusStatus === "active_with_exceptions"
              ? "Focus Mode: Partial"
              : focusStatus === "preparing"
              ? "Focus: Preparing..."
              : "Focus Mode: Inactive"}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              focusStatus === "active"
                ? "bg-emerald-500"
                : focusStatus === "active_with_exceptions"
                ? "bg-amber-500"
                : focusStatus === "preparing"
                ? "bg-blue-500"
                : "bg-slate-400"
            }`}
          />
        </button>

        {/* Camera Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
            isCameraActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200"
          }`}
        >
          {isCameraActive ? (
            <CameraIcon className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <CameraOffIcon className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>{isCameraActive ? "Camera Online" : "Camera Idle"}</span>
        </div>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={onToggleFullscreen}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            isFullscreen
              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <>
              <MinimizeIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Fullscreen</span>
            </>
          ) : (
            <>
              <MaximizeIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Full Screen</span>
            </>
          )}
        </button>

        {/* Live Examination Countdown Timer */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-1.5 rounded-lg shadow-xs font-mono text-xs font-semibold">
            <ClockIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Time Left:</span>
            <span className="text-amber-400">{timeLeftFormatted}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
