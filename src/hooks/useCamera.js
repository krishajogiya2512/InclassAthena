import { useState, useEffect, useRef, useCallback } from "react";
import { athenaClient } from "../services/athenaClient";

/**
 * useCamera — Reusable React Hook for Athena Desktop Camera Management
 * 
 * Features:
 * - Status lifecycle: 'off' | 'starting' | 'on' | 'error'
 * - Friendly error messages for macOS permissions and hardware contention
 * - Device discovery with dynamic label resolution and `devicechange` listener
 * - Single-stream enforcement (stops existing stream before switching)
 * - Track `ended` detection for graceful disconnection handling
 * - Integration with central Athena Privacy & Permission Registry (window.athenaPrivacy)
 * - Safe unmount cleanup and application quit / session termination integration
 */
export function useCamera(options = {}) {
  const {
    initialDeviceId = null,
    autoEnumerate = true
  } = options;

  // Camera State
  const [status, setStatus] = useState("off"); // 'off' | 'starting' | 'on' | 'error'
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(initialDeviceId);
  const [currentStream, setCurrentStream] = useState(null);

  // Video element DOM ref
  const videoRef = useRef(null);

  // Stream ref to ensure synchronous access in callbacks and unmount cleanup
  const streamRef = useRef(null);
  const trackEndedHandlerRef = useRef(null);
  const isStartingRef = useRef(false);

  /**
   * Helper to notify Athena's Privacy Activity Registry
   */
  const reportPrivacyActivity = useCallback(async (isActive) => {
    try {
      if (typeof window !== "undefined" && window.athenaPrivacy?.setActivity) {
        await window.athenaPrivacy.setActivity("camera", isActive);
      } else {
        await athenaClient.setPrivacyActivity("camera", isActive);
      }
    } catch (err) {
      console.warn("[useCamera] Failed to report privacy activity:", err);
    }
  }, []);

  /**
   * Enumerate available videoinput devices
   */
  const enumerateDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");

      const mapped = videoDevices.map((d, index) => {
        let label = d.label;
        if (!label || label.trim() === "") {
          label = index === 0 ? "Default Camera" : `Camera ${index + 1}`;
        }
        return {
          deviceId: d.deviceId,
          label,
          groupId: d.groupId
        };
      });

      setDevices(mapped);

      // Default selected device if none selected or previously selected is gone
      setSelectedDeviceId((prev) => {
        if (prev && mapped.some((d) => d.deviceId === prev)) {
          return prev;
        }
        return mapped.length > 0 ? mapped[0].deviceId : null;
      });

      return mapped;
    } catch (err) {
      console.warn("[useCamera] Failed to enumerate camera devices:", err);
      return [];
    }
  }, []);

  /**
   * Parse user-friendly error message
   */
  const parseCameraError = useCallback((err) => {
    const errorName = err?.name || "";
    const errorMessage = err?.message || "";

    if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
      return {
        type: "PERMISSION_DENIED",
        message: "Camera access was denied. Please allow Athena to access your camera in macOS System Settings > Privacy & Security > Camera."
      };
    }

    if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
      return {
        type: "NOT_FOUND",
        message: "No camera was found on this system. Please connect an external webcam or verify your built-in camera."
      };
    }

    if (errorName === "NotReadableError" || errorName === "TrackStartError") {
      return {
        type: "IN_USE",
        message: "The camera is currently in use by another application (e.g. FaceTime, Zoom) or could not be initialized."
      };
    }

    if (errorName === "OverconstrainedError" || errorName === "ConstraintNotSatisfiedError") {
      return {
        type: "OVERCONSTRAINED",
        message: "The selected camera is unavailable or does not support the requested video constraints."
      };
    }

    return {
      type: "UNKNOWN",
      message: errorMessage || "An unexpected error occurred while accessing the camera. Please check your camera connection."
    };
  }, []);

  /**
   * Internal track release & DOM cleanup
   */
  const cleanupStream = useCallback(() => {
    const activeStream = streamRef.current;
    if (activeStream) {
      try {
        activeStream.getTracks().forEach((track) => {
          if (trackEndedHandlerRef.current) {
            track.removeEventListener("ended", trackEndedHandlerRef.current);
          }
          track.stop();
        });
      } catch (err) {
        console.warn("[useCamera] Error while stopping media tracks:", err);
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCurrentStream(null);
  }, []);

  /**
   * Stop Camera Function
   */
  const stop = useCallback(async () => {
    cleanupStream();
    isStartingRef.current = false;
    setStatus("off");
    setError(null);
    await reportPrivacyActivity(false);
  }, [cleanupStream, reportPrivacyActivity]);

  /**
   * Handle unexpected track termination (e.g. webcam unplugged)
   */
  const handleTrackEnded = useCallback(async () => {
    console.warn("[useCamera] Video track ended unexpectedly (device disconnected).");
    cleanupStream();
    setStatus("error");
    setError({
      type: "DISCONNECTED",
      message: "Camera was disconnected or its video stream ended unexpectedly."
    });
    await reportPrivacyActivity(false);
    enumerateDevices();
  }, [cleanupStream, reportPrivacyActivity, enumerateDevices]);

  // Keep ref up to date
  useEffect(() => {
    trackEndedHandlerRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  /**
   * Start Camera Function
   */
  const start = useCallback(async (requestedDeviceId = null) => {
    // Prevent overlapping activations
    if (isStartingRef.current) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError({
        type: "UNSUPPORTED",
        message: "Media devices API is unavailable in this environment."
      });
      return;
    }

    isStartingRef.current = true;
    setStatus("starting");
    setError(null);

    // Stop any existing stream first
    cleanupStream();

    const targetDeviceId = requestedDeviceId || selectedDeviceId;

    const constraints = {
      video: targetDeviceId
        ? { deviceId: { exact: targetDeviceId } }
        : true,
      audio: false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Verify the component or user did not cancel while waiting for userMedia
      if (!isStartingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      setCurrentStream(stream);

      // Listen for unexpected track disconnect
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener("ended", handleTrackEnded);
      }

      // Attach to video preview element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.play().catch((playErr) => {
          console.warn("[useCamera] Video play() failed or interrupted:", playErr.message);
        });
      }

      setStatus("on");
      setError(null);
      isStartingRef.current = false;

      // Report active to Privacy Activity Registry
      await reportPrivacyActivity(true);

      // Re-enumerate devices now that camera permission has been granted (reveals true labels)
      enumerateDevices();

      return stream;
    } catch (err) {
      console.error("[useCamera] getUserMedia failed:", err);
      cleanupStream();
      isStartingRef.current = false;
      setStatus("error");
      const parsed = parseCameraError(err);
      setError(parsed);

      // Ensure privacy registry reflects inactive
      await reportPrivacyActivity(false);
    }
  }, [selectedDeviceId, cleanupStream, handleTrackEnded, reportPrivacyActivity, enumerateDevices, parseCameraError]);

  /**
   * Switch selected camera device
   */
  const switchCamera = useCallback(async (newDeviceId) => {
    if (!newDeviceId || newDeviceId === selectedDeviceId) {
      return;
    }

    setSelectedDeviceId(newDeviceId);

    // If camera is currently active or starting, restart with the new device
    if (status === "on" || status === "starting") {
      await start(newDeviceId);
    }
  }, [selectedDeviceId, status, start]);

  // Initial Device Enumeration
  useEffect(() => {
    if (autoEnumerate) {
      enumerateDevices();
    }
  }, [autoEnumerate, enumerateDevices]);

  // Listen for device changes (e.g. plugging/unplugging webcam)
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.addEventListener) {
      return;
    }

    const onDeviceChange = () => {
      console.log("[useCamera] devicechange event detected — updating camera device list.");
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
    };
  }, [enumerateDevices]);

  // Listen for session end and application quit to shut down camera
  useEffect(() => {
    const unsubQuit = athenaClient.onBeforeQuit(() => {
      console.log("[useCamera] Application before-quit signal received — stopping camera.");
      stop();
    });

    const unsubSession = athenaClient.onSessionEnded((data) => {
      if (data?.state === "ended" || data?.state === "error") {
        console.log("[useCamera] Examination session ended — stopping camera.");
        stop();
      }
    });

    return () => {
      unsubQuit();
      unsubSession();
    };
  }, [stop]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      isStartingRef.current = false;
      cleanupStream();
      reportPrivacyActivity(false);
    };
  }, [cleanupStream, reportPrivacyActivity]);

  return {
    status,
    isCameraOn: status === "on",
    isStarting: status === "starting",
    isOff: status === "off",
    isError: status === "error",
    error,
    devices,
    hasMultipleCameras: devices.length > 1,
    hasNoCameras: devices.length === 0,
    selectedDeviceId,
    stream: currentStream,
    videoRef,
    start,
    stop,
    switchCamera,
    enumerateDevices
  };
}
