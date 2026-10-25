import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { SystemCheckView } from "./views/SystemCheckView";
import { FocusModeView } from "./views/FocusModeView";
import { ExamEnvironmentView } from "./views/ExamEnvironmentView";
import { GuidelinesView } from "./views/GuidelinesView";
import { athenaClient } from "./services/athenaClient";

function App() {
  const [currentView, setCurrentView] = useState("system-check"); // 'system-check' | 'focus-mode' | 'examination' | 'guidelines'

  // Focus Mode State
  const [focusStatus, setFocusStatus] = useState("inactive"); // 'inactive' | 'preparing' | 'active' | 'active_with_exceptions' | 'error'
  const [runningAppsData, setRunningAppsData] = useState(null);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationReport, setActivationReport] = useState(null);
  const [focusErrorMessage, setFocusErrorMessage] = useState(null);
  const [platformSupport, setPlatformSupport] = useState({ supported: true });

  // Camera State
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Examination Countdown Timer (Default 60 minutes = 3600 seconds)
  const [timeLeft, setTimeLeft] = useState(3585); // 59m 45s

  // Format Time Left as MM:SS
  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Initial Scan of Running Applications on Startup
  useEffect(() => {
    scanApplications();

    // Listen to focus status events from Electron main process
    const unsubscribe = athenaClient.onFocusStatusChanged((data) => {
      if (data?.status) {
        setFocusStatus(data.status);
      }
      if (data?.report) {
        setActivationReport(data.report);
      }
    });

    return () => unsubscribe();
  }, []);

  // Scan Running Apps
  async function scanApplications() {
    setIsLoadingApps(true);
    setFocusErrorMessage(null);
    try {
      const res = await athenaClient.getRunningApps();
      if (res.success) {
        setRunningAppsData(res);
      } else {
        if (res.errorType === "UNSUPPORTED_PLATFORM") {
          setPlatformSupport({ supported: false, message: res.message });
        } else {
          setFocusErrorMessage(res.message || "Failed to scan running applications.");
        }
      }
    } catch {
      setFocusErrorMessage("Application scan encountered an unexpected error.");
    } finally {
      setIsLoadingApps(false);
    }
  }

  // Activate Focus Mode
  async function handleActivateFocusMode() {
    setIsActivating(true);
    setFocusStatus("preparing");
    setFocusErrorMessage(null);

    try {
      const result = await athenaClient.activateFocusMode();
      if (result.success) {
        setFocusStatus(result.status);
        setActivationReport(result.report);
        // Refresh running applications list to show updated process state
        await scanApplications();
      } else {
        setFocusStatus("error");
        setFocusErrorMessage(result.message || "Failed to activate Focus Mode.");
      }
    } catch {
      setFocusStatus("error");
      setFocusErrorMessage("Focus Mode activation failed. Please check macOS permissions.");
    } finally {
      setIsActivating(false);
    }
  }

  // End Focus Mode
  async function handleDeactivateFocusMode() {
    try {
      const result = await athenaClient.deactivateFocusMode();
      if (result.success) {
        setFocusStatus("inactive");
        setActivationReport(null);
        await scanApplications();
      }
    } catch (err) {
      console.error("Failed to deactivate Focus Mode:", err);
    }
  }

  // Camera Access Handler (Preserves existing working feature + enhancements)
  async function getCamera() {
    setCameraError(null);
    try {
      const videoData = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      mediaStreamRef.current = videoData;
      if (videoRef.current) {
        videoRef.current.srcObject = videoData;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setIsCameraActive(false);
      setCameraError("Camera access denied or device not found. Please verify camera permissions.");
    }
  }

  // Disconnect Camera Handler
  function stopCamera() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }

  // Re-attach video stream if user navigates between views
  useEffect(() => {
    if (isCameraActive && mediaStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [currentView, isCameraActive]);

  // Fullscreen Handler (Preserves existing working feature + enhancements)
  async function toggleFullscreen() {
    try {
      await athenaClient.toggleFullscreen();
    } catch {
      // Fallback
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
      } else {
        await document.exitFullscreen().catch(() => {});
      }
    }
  }

  // Navigate to Test Room
  function handleGoToTest() {
    setCurrentView("examination");
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        focusStatus={focusStatus}
        isCameraActive={isCameraActive}
        isFullscreen={isFullscreen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Consistent Application Header */}
        <Header
          assessmentTitle="National Standard Examination 2026"
          sessionCode="Session #ATH-8842"
          timeLeftFormatted={formatTimeLeft(timeLeft)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isCameraActive={isCameraActive}
          focusStatus={focusStatus}
          onOpenFocusMode={() => setCurrentView("focus-mode")}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70">
          {currentView === "system-check" && (
            <SystemCheckView
              videoRef={videoRef}
              isCameraActive={isCameraActive}
              onGetCamera={getCamera}
              onStopCamera={stopCamera}
              cameraError={cameraError}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              focusStatus={focusStatus}
              onOpenFocusMode={() => setCurrentView("focus-mode")}
              onGoToTest={handleGoToTest}
              timeLeftFormatted={formatTimeLeft(timeLeft)}
            />
          )}

          {currentView === "focus-mode" && (
            <FocusModeView
              focusStatus={focusStatus}
              onActivateFocusMode={handleActivateFocusMode}
              onDeactivateFocusMode={handleDeactivateFocusMode}
              runningAppsData={runningAppsData}
              onScanApps={scanApplications}
              isLoadingApps={isLoadingApps}
              isActivating={isActivating}
              activationReport={activationReport}
              errorMessage={focusErrorMessage}
              platformSupport={platformSupport}
            />
          )}

          {currentView === "examination" && (
            <ExamEnvironmentView
              videoRef={videoRef}
              isCameraActive={isCameraActive}
              timeLeftFormatted={formatTimeLeft(timeLeft)}
              focusStatus={focusStatus}
              onReturnToSetup={() => setCurrentView("system-check")}
            />
          )}

          {currentView === "guidelines" && <GuidelinesView />}
        </main>
      </div>
    </div>
  );
}

export default App;
