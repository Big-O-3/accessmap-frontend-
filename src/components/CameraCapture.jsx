import { useEffect, useRef, useState } from "react";

// A modal camera view that streams the device camera (rear-facing on phones)
// and returns a captured still as a File on confirm. Uses getUserMedia so it
// works in-page on desktop and mobile browsers without leaving the app.
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [snapshotBlob, setSnapshotBlob] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera isn't supported on this device or browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      } catch (err) {
        setError(
          err.name === "NotAllowedError"
            ? "Camera access was blocked. Enable it in your browser settings."
            : "Couldn't start the camera.",
        );
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    };
  }, [snapshotUrl]);

  function takePhoto() {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Couldn't capture the photo. Try again.");
          return;
        }
        setSnapshotBlob(blob);
        setSnapshotUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92,
    );
  }

  function retake() {
    if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    setSnapshotUrl(null);
    setSnapshotBlob(null);
  }

  function usePhoto() {
    if (!snapshotBlob) return;
    const file = new File([snapshotBlob], `capture-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    onCapture(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">
          {snapshotUrl ? "Review photo" : "Take a photo"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-1 text-sm text-white/90 hover:bg-white/10"
          aria-label="Close camera"
        >
          Cancel
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden bg-black">
        {error ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/90">
            {error}
          </div>
        ) : snapshotUrl ? (
          <img
            src={snapshotUrl}
            alt="Captured preview"
            className="h-full w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-6 bg-black/70 px-4 py-6">
        {snapshotUrl ? (
          <>
            <button
              type="button"
              onClick={retake}
              className="rounded-lg bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/20"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={usePhoto}
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Use this photo
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={takePhoto}
            disabled={!ready || !!error}
            aria-label="Capture photo"
            className="h-16 w-16 rounded-full border-4 border-white bg-white/90 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          />
        )}
      </div>
    </div>
  );
}
