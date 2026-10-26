import {
  CameraIcon,
  CameraOffIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  InfoIcon
} from "../components/Icons";
import { useCamera } from "../hooks/useCamera";

export function CameraView({ cameraHookInstance }) {
  // Can use an external cameraHookInstance or instantiate useCamera internally
  const internalHook = useCamera();
  const camera = cameraHookInstance || internalHook;

  const {
    status,
    isCameraOn,
    isStarting,
    isOff,
    isError,
    error,
    devices,
    hasMultipleCameras,
    hasNoCameras,
    selectedDeviceId,
    videoRef,
    start,
    stop,
    switchCamera,
    enumerateDevices
  } = camera;

  const currentDevice = devices.find((d) => d.deviceId === selectedDeviceId) || devices[0];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-7 animate-fade-in select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Camera</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your camera and preview your video feed.
          </p>
        </div>

        {/* Global Controls & Re-Scan */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={enumerateDevices}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Scan for connected camera devices"
          >
            <RefreshCwIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Refresh Devices</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {isError && error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 text-xs text-rose-800 shadow-xs animate-fade-in">
          <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-sm text-rose-900">
              {error.type === "PERMISSION_DENIED"
                ? "Camera Permission Required"
                : error.type === "IN_USE"
                ? "Camera Hardware In Use"
                : error.type === "NOT_FOUND"
                ? "No Camera Detected"
                : "Camera Access Issue"}
            </div>
            <p className="mt-1 leading-relaxed text-rose-700">{error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => start()}
            className="px-3.5 py-1.5 bg-white border border-rose-300 text-rose-700 font-semibold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer text-xs shrink-0"
          >
            Retry Access
          </button>
        </div>
      )}

      {/* No Camera Warning */}
      {hasNoCameras && !isError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800 shadow-xs">
          <AlertTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-amber-900">No Video Input Devices Detected</div>
            <p className="mt-0.5 text-amber-700">
              Athena cannot detect any connected webcams. Please connect an external USB camera or enable your built-in camera in macOS System Settings.
            </p>
          </div>
        </div>
      )}

      {/* 2. Main Camera Preview & Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header & Status Badge */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isCameraOn
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : isStarting
                  ? "bg-blue-50 text-blue-600 border-blue-200 animate-pulse"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {isCameraOn ? (
                <CameraIcon className="w-5 h-5 text-emerald-600" />
              ) : (
                <CameraOffIcon className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Video Preview</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentDevice ? currentDevice.label : "Primary Video Capture Device"}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isCameraOn && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>● Camera On</span>
              </span>
            )}
            {isStarting && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Starting Camera...</span>
              </span>
            )}
            {isOff && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Camera Off</span>
              </span>
            )}
            {isError && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Error</span>
              </span>
            )}
          </div>
        </div>

        {/* Video Viewport Area */}
        <div className="p-7 bg-slate-950 flex items-center justify-center min-h-[380px] relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full max-w-2xl aspect-16/10 object-cover rounded-xl border border-slate-800 shadow-2xl transition-opacity duration-300 ${
              isCameraOn ? "opacity-100" : "opacity-0 absolute pointer-events-none"
            }`}
          />

          {/* Empty State when Off */}
          {isOff && (
            <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <CameraOffIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">
                  The camera is off. Turn it on to see a preview.
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Click the button below to request hardware camera access and verify your proctoring video stream.
                </p>
              </div>
            </div>
          )}

          {/* Loading Indicator when Starting */}
          {isStarting && (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin" />
              <p className="text-sm font-semibold text-white">Starting Camera...</p>
              <p className="text-xs text-slate-400">Negotiating media stream and resolution constraints</p>
            </div>
          )}

          {/* Error Viewport Overlay */}
          {isError && !isStarting && (
            <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <AlertCircleIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-300">Camera Unavailable</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  {error?.message || "Could not activate camera feed."}
                </p>
              </div>
            </div>
          )}

          {/* Live Proctor Watermark */}
          {isCameraOn && (
            <div className="absolute top-10 left-10 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-[11px] font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ATHENA PROCTOR FEED</span>
            </div>
          )}
        </div>

        {/* 3. Camera Selection & 4. Camera Controls Toolbar */}
        <div className="p-6 border-t border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Device Selection Section */}
          <div className="flex-1 max-w-md space-y-1.5">
            <label htmlFor="camera-device-select" className="block text-xs font-bold text-slate-800">
              Camera Device
            </label>

            {hasMultipleCameras ? (
              <div className="relative">
                <select
                  id="camera-device-select"
                  value={selectedDeviceId || ""}
                  onChange={(e) => switchCamera(e.target.value)}
                  disabled={isStarting}
                  className="w-full pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-colors disabled:opacity-50"
                >
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : devices.length === 1 ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold truncate">{devices[0].label}</span>
                <span className="text-[10px] text-slate-400 ml-auto shrink-0">(Single Camera)</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-1">
                No camera devices discovered. Connect a webcam to configure.
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            {isCameraOn ? (
              <button
                type="button"
                onClick={stop}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <CameraOffIcon className="w-4 h-4" />
                <span>Turn Camera Off</span>
              </button>
            ) : isStarting ? (
              <button
                type="button"
                disabled
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold opacity-70 cursor-not-allowed flex items-center gap-2"
              >
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Starting Camera...</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => start()}
                disabled={hasNoCameras}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-2 disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <CameraIcon className="w-4 h-4" />
                <span>Turn Camera On</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Privacy & Security Architecture Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            <span>macOS Privacy Registry</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Camera active state is tracked in real-time by Athena&apos;s Central Privacy Registry and cleared when you stop preview or quit.
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <CheckCircleIcon className="w-4 h-4 text-blue-600" />
            <span>Local Proctor Sandbox</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Video frames are processed locally inside Electron&apos;s sandboxed renderer and are never streamed to unapproved third parties.
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <InfoIcon className="w-4 h-4 text-indigo-600" />
            <span>Hot-Plug Auto-Discovery</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Plugging in an external USB webcam or Apple Continuity Camera will update your available device selector automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
