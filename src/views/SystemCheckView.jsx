import {
  CameraIcon,
  CameraOffIcon,
  MaximizeIcon,
  MinimizeIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  AppWindowIcon,
  ClockIcon
} from "../components/Icons";

export function SystemCheckView({
  videoRef,
  isCameraActive,
  onGetCamera,
  onStopCamera,
  cameraError,
  isFullscreen,
  onToggleFullscreen,
  focusStatus,
  onOpenFocusMode,
  onGoToTest,
  timeLeftFormatted
}) {
  const isCameraReady = isCameraActive;
  const isScreenReady = isFullscreen;
  const isFocusReady = focusStatus === "active" || focusStatus === "active_with_exceptions";
  const allReady = isCameraReady && isScreenReady;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-7 animate-fade-in select-none">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Verification</h2>
        <p className="text-sm text-slate-500 mt-1">
          Complete mandatory hardware and environment checks before launching your examination.
        </p>
      </div>

      {/* Main Readiness Cards Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
        {/* Section 1: Camera Configuration */}
        <div className="p-7">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Configure Camera</h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isCameraActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isCameraActive ? "Verified & Online" : "Configuration Required"}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kindly configure Camera to attempt quiz/contests. Your video stream is used exclusively for continuous local proctoring and identity verification.
              </p>

              {cameraError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                {isCameraActive ? (
                  <button
                    onClick={onStopCamera}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer border border-slate-300 shadow-2xs flex items-center gap-2"
                  >
                    <CameraOffIcon className="w-4 h-4 text-slate-500" />
                    <span>Disconnect Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={onGetCamera}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <CameraIcon className="w-4 h-4 text-blue-400" />
                    <span>Get Camera Access</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Feed Preview Card */}
            <div className="shrink-0">
              <div className="relative w-56 h-36 rounded-xl bg-slate-950 overflow-hidden border-2 border-slate-200 shadow-xs flex items-center justify-center">
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={videoRef}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraActive ? "opacity-100" : "opacity-0"}`}
                />

                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                    <CameraOffIcon className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs font-medium text-slate-400">Camera Feed Offline</span>
                    <span className="text-[10px] text-slate-600 mt-0.5">Click access button to preview</span>
                  </div>
                )}

                {isCameraActive && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-medium text-white border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>LIVE PROCTOR</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fullscreen Switch */}
        <div className="p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Switch to full screen</h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isFullscreen
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {isFullscreen ? "Fullscreen Enabled" : "Permission Needed"}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Examination rules mandate fullscreen display mode to prevent window shifting and unintentional background distractions during the test.
              </p>
            </div>

            <button
              onClick={onToggleFullscreen}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-2 ${
                isFullscreen
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30"
              }`}
            >
              {isFullscreen ? (
                <>
                  <MinimizeIcon className="w-4 h-4 text-emerald-600" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <MaximizeIcon className="w-4 h-4 text-white" />
                  <span>Give Full Screen Permissions</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 3: Focus Mode Status Strip */}
        <div className="p-7 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Athena Focus Mode</h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isFocusReady
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isFocusReady ? "Distraction-Free Active" : "Recommended for Exam"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Athena isolates your assessment session by keeping Athena and Google Chrome active while closing competing apps.
              </p>
            </div>

            <button
              onClick={onOpenFocusMode}
              className="px-4 py-2 rounded-xl bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors cursor-pointer shrink-0 flex items-center gap-2"
            >
              <AppWindowIcon className="w-4 h-4 text-blue-600" />
              <span>{isFocusReady ? "Manage Focus Mode" : "Configure Focus Mode"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Readiness Status Checklist */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Launch Readiness Checklist
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${allReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {allReady ? "Requirements Satisfied" : "Requirements Incomplete"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${isCameraReady ? "bg-white border-emerald-200 text-slate-800" : "bg-white border-slate-200 text-slate-500"}`}>
            <CheckCircleIcon className={`w-4 h-4 shrink-0 ${isCameraReady ? "text-emerald-600" : "text-slate-300"}`} />
            <span className="font-medium">Camera Configured</span>
          </div>
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${isScreenReady ? "bg-white border-emerald-200 text-slate-800" : "bg-white border-slate-200 text-slate-500"}`}>
            <CheckCircleIcon className={`w-4 h-4 shrink-0 ${isScreenReady ? "text-emerald-600" : "text-slate-300"}`} />
            <span className="font-medium">Fullscreen Active</span>
          </div>
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${isFocusReady ? "bg-white border-emerald-200 text-slate-800" : "bg-white border-slate-200 text-slate-500"}`}>
            <CheckCircleIcon className={`w-4 h-4 shrink-0 ${isFocusReady ? "text-emerald-600" : "text-slate-300"}`} />
            <span className="font-medium">Focus Mode Verified</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onGoToTest}
          className="px-7 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-2.5"
        >
          <span>Go To Test</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 font-mono">
          <ClockIcon className="w-4 h-4 text-slate-400" />
          <span>Time Left:</span>
          <span className="font-bold text-slate-800">{timeLeftFormatted}</span>
        </div>
      </div>
    </div>
  );
}
