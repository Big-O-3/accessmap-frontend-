import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DetectionImage from "./DetectionImage";
import CameraCapture from "./CameraCapture";
import ScanningOverlay from "./ScanningOverlay";
import Button from "./Button";
import { featureLabel } from "../lib/features";
import { detectionsToFeatures } from "../lib/detect";
import {
  AuthError,
  uploadPhoto,
  analyzeUploadedPhoto,
  patchDetections,
  submitContribution,
  deletePhoto,
  getVenue,
} from "../lib/api";
import { logActivity } from "../lib/userData";
import { useAuth } from "../context/useAuth";
import { toast } from "../lib/toast";

// "Add & verify a photo" on an existing venue's page. Reuses the same server
// chain the Add-Venue stepper uses - uploadPhoto → analyzeUploadedPhoto → (user
// confirms) → patchDetections + submitContribution - so a visitor can drop a
// photo, watch the AI detect accessibility features, confirm what's right, and
// have the venue's score + evidence update in place. No new backend needed.
//
// Only the confirm/reject and the score-recompute are gated by auth (the upload
// and analyze endpoints require a signed-in user); signed-out visitors see a
// prompt to sign in, matching the reviews section.
//
// `onUpdated(venue)` receives the freshly re-fetched venue so the parent can
// refresh the score badge, feature breakdown, and photo grid without a reload.
export default function VenuePhotoContribution({ venue, onUpdated }) {
  const { user } = useAuth();
  const inputRef = useRef(null);

  // idle → analyzing → review → saving; error carries its own message.
  const [status, setStatus] = useState("idle");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoId, setPhotoId] = useState(null); // persisted Photo row id
  const [detections, setDetections] = useState([]);
  const [confirmed, setConfirmed] = useState({}); // { [detectionIndex]: true }
  const [altText, setAltText] = useState(null);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Revoke the object URL on unmount so preview blobs don't leak. We do NOT
  // delete an analyzed-but-unsaved photo here: React StrictMode double-mounts in
  // dev, so an unmount-triggered delete would wipe a photo mid-flow. Matches the
  // Add-Venue flow, which likewise only revokes URLs on unmount.
  const previewRef = useRef(previewUrl);
  previewRef.current = previewUrl;
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function toggleDetection(idx) {
    setConfirmed((prev) => {
      const next = { ...prev };
      if (next[idx]) delete next[idx];
      else next[idx] = true;
      return next;
    });
  }

  // Return to the empty state, cleaning up the current preview blob.
  function reset(clearError = true) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoId(null);
    setDetections([]);
    setConfirmed({});
    setAltText(null);
    setStatus("idle");
    if (clearError) {
      setError(null);
      setAuthError(false);
    }
  }

  // Upload the photo to this venue, then run detection on the stored image.
  async function handleFile(file) {
    if (!file || !file.type?.startsWith("image/")) return;

    // Swap in the new preview and clear any prior run's results.
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setDetections([]);
    setConfirmed({});
    setAltText(null);
    setError(null);
    setAuthError(false);
    setStatus("analyzing");

    // Track the persisted photo across the two calls so a failure after upload
    // can roll it back - a failed analysis should leave nothing on the venue.
    let uploadedId = null;
    try {
      const uploaded = await uploadPhoto(venue.id, file);
      uploadedId = uploaded.id;
      setPhotoId(uploadedId);

      const data = await analyzeUploadedPhoto(uploadedId);
      const dets = data.detections ?? [];
      // Pre-check high-confidence hits (≥0.85, the ML/backend threshold); the
      // analyze endpoint doesn't send a highConfidence flag, so derive it.
      const initial = {};
      dets.forEach((d, idx) => {
        if (d.highConfidence ?? d.confidence >= 0.85) initial[idx] = true;
      });
      setDetections(dets);
      setConfirmed(initial);
      setAltText(data.altTextSuggestion ?? null);
      setStatus("review");
    } catch (err) {
      // Roll back the uploaded photo so an abandoned/failed analysis leaves no
      // orphan row on the venue (best-effort; a dead session may block it too).
      if (uploadedId) {
        try {
          await deletePhoto(uploadedId);
        } catch {
          // ignore - the message below still informs the user
        }
        setPhotoId(null);
      }
      setError(err.message || "Couldn't analyze the photo.");
      setAuthError(err instanceof AuthError);
      setStatus("error");
    }
  }

  // Persist the user's confirm/reject decisions, then record the contribution
  // (which recomputes the venue's score), and re-fetch the venue in place.
  async function handleConfirm() {
    setStatus("saving");
    setError(null);
    setAuthError(false);
    try {
      // Mark confirmed detections verified and delete the rejected ones, by id.
      const confirmedIds = [];
      const rejectedIds = [];
      detections.forEach((d, idx) => {
        if (!d.id) return;
        if (confirmed[idx]) confirmedIds.push(d.id);
        else rejectedIds.push(d.id);
      });
      if (confirmedIds.length || rejectedIds.length) {
        await patchDetections(photoId, {
          confirmed: confirmedIds,
          rejected: rejectedIds,
        });
      }

      // Turn the confirmed detections into features and record the contribution
      // - the backend upserts them (communityVerified) and recomputes the score.
      // Skip when nothing was confirmed: the photo still stays on the venue.
      const confirmedDets = detections.filter((_, idx) => confirmed[idx]);
      const features = detectionsToFeatures(confirmedDets);
      if (features.length > 0) {
        await submitContribution({ venue, features });
        logActivity({
          type: "contributed",
          venueId: venue.id,
          venueName: venue.name,
          detail: `Verified ${features.length} feature${
            features.length === 1 ? "" : "s"
          } at ${venue.name}`,
        });
      }

      // Re-fetch so the score, features, and photo grid reflect the change.
      const updated = await getVenue(venue.id);
      onUpdated?.(updated);
      toast.success(
        features.length > 0 ? "Photo added and verified" : "Photo added",
      );
      reset();
    } catch (err) {
      // Stay on the review step so the user can retry without re-analyzing.
      setError(err.message || "Couldn't save your verification.");
      setAuthError(err instanceof AuthError);
      setStatus("review");
    }
  }

  // Discard an analyzed photo the user decided not to keep - delete the stored
  // row so it doesn't linger on the venue, then return to the empty state.
  async function handleDiscard() {
    if (photoId) {
      try {
        await deletePhoto(photoId);
      } catch {
        // ignore - reset regardless; a leftover is the user's own photo
      }
    }
    reset();
  }

  // Signed-out visitors can't upload (the endpoints require auth) - prompt them.
  if (!user) {
    return (
      <section className="mt-8">
        <SectionHeading />
        <p className="rounded-2xl border border-sand-200 bg-sand-100 px-4 py-3 text-base text-ink-soft">
          <Link to="/login" className="font-medium text-link hover:underline">
            Sign in
          </Link>{" "}
          to add a photo and help verify this venue&apos;s accessibility.
        </p>
      </section>
    );
  }

  const confirmedDetections = detections.filter((_, idx) => confirmed[idx]);
  const confirmedCount = confirmedDetections.length;

  return (
    <section className="mt-8">
      <SectionHeading />

      {status === "idle" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget)) return;
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "border-brand-500 bg-brand-50" : "border-sand-200 bg-surface"
          }`}
        >
          <p className="font-medium text-ink">Drag &amp; drop a photo here</p>
          <p className="mt-1 text-sm text-ink-soft">
            An entrance, restroom, parking, or seating shot works best.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" onClick={() => inputRef.current?.click()}>
              Choose from device
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCameraOpen(true)}
            >
              Take a photo
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Choose a venue photo to analyze"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = ""; // allow re-selecting the same file
            }}
          />
          <p className="mt-3 text-sm text-ink-faint">JPG or PNG, up to 10MB.</p>
        </div>
      )}

      {status === "analyzing" && (
        <ScanningOverlay
          imageUrl={previewUrl}
          label="Analyzing photo… this can take a few seconds."
        />
      )}

      {status === "error" && (
        <div
          role="alert"
          className="rounded-2xl bg-danger-soft p-6 text-center text-base text-danger ring-1 ring-inset ring-danger-ring"
        >
          <p className="font-semibold">Couldn&apos;t analyze this photo.</p>
          <p className="mt-1">{error}</p>
          {authError ? (
            <Button as={Link} to="/login" size="sm" className="mt-3">
              Sign in again
            </Button>
          ) : (
            <>
              <p className="mt-1 text-sm opacity-80">
                This photo wasn&apos;t saved to the venue. Make sure the backend
                and ML service are reachable, then try again.
              </p>
              <Button type="button" onClick={() => reset()} size="sm" className="mt-3">
                Try another photo
              </Button>
            </>
          )}
        </div>
      )}

      {(status === "review" || status === "saving") && (
        <div className="space-y-4">
          {/* The photo with boxes over only the features the user has confirmed -
              unchecking one removes its box, so the overlay tracks the decision. */}
          <DetectionImage
            photo={{ imageUrl: previewUrl, detections: confirmedDetections }}
          />

          <p className="sr-only" role="status">
            {detections.length === 0
              ? "Analysis complete. No accessibility features detected in this photo."
              : `Analysis complete. ${detections.length} accessibility feature${
                  detections.length === 1 ? "" : "s"
                } detected - confirm below.`}
          </p>

          {detections.length === 0 ? (
            <p className="rounded-xl bg-surface px-4 py-6 text-center text-base text-ink-soft ring-1 ring-sand-200">
              No accessibility features detected in this photo. Try a clearer
              shot of the entrance, restroom, parking, or seating.
            </p>
          ) : (
            <fieldset>
              <legend className="mb-2 text-base text-ink-soft">
                Uncheck anything the AI got wrong - only confirmed features count
                toward this venue&apos;s score.
              </legend>
              <ul className="divide-y divide-sand-100 rounded-xl bg-surface ring-1 ring-sand-200">
                {detections.map((d, idx) => {
                  const pct = Math.round((d.confidence ?? 0) * 100);
                  const id = `venue-det-${idx}`;
                  return (
                    <li key={d.id ?? idx}>
                      <label
                        htmlFor={id}
                        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
                      >
                        <span className="flex items-center gap-3">
                          <input
                            id={id}
                            type="checkbox"
                            checked={!!confirmed[idx]}
                            onChange={() => toggleDetection(idx)}
                            className="h-4 w-4 rounded border-sand-200 text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-base font-medium text-ink">
                            {featureLabel(d.accessibilityFeature)}
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-ink-soft">
                          {pct}% confidence
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          {altText && (
            <p className="text-sm text-ink-faint">Suggested alt text: {altText}</p>
          )}

          {error && (
            <p role="alert" className="text-base text-danger">
              {error}
              {authError && (
                <>
                  {" "}
                  <Link to="/login" className="font-medium underline">
                    Sign in again
                  </Link>
                  .
                </>
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleConfirm}
              loading={status === "saving"}
            >
              {confirmedCount > 0
                ? `Confirm ${confirmedCount} & add photo`
                : "Add photo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDiscard}
              disabled={status === "saving"}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(file) => {
            setCameraOpen(false);
            handleFile(file);
          }}
        />
      )}
    </section>
  );
}

function SectionHeading() {
  return (
    <>
      <h2 className="mb-1 font-display text-2xl font-extrabold text-ink">
        Add &amp; verify a photo
      </h2>
      <p className="mb-4 text-base text-ink-soft">
        Upload a photo and our AI will detect accessibility features - confirm
        what&apos;s right and it counts toward this venue&apos;s score.
      </p>
    </>
  );
}
