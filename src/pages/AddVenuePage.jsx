import { useEffect, useReducer, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { detectionsToFeatures } from "../lib/detect";
import { calculateAccessibilityScore } from "../lib/score";
import {
  AuthError,
  submitContribution,
  uploadPhoto,
  analyzeUploadedPhoto,
  patchDetections,
} from "../lib/api";
import { logActivity } from "../lib/userData";
import Stepper from "../components/addVenue/Stepper";
import StepFindVenue from "../components/addVenue/StepFindVenue";
import StepUploadPhotos from "../components/addVenue/StepUploadPhotos";
import StepReviewDetections from "../components/addVenue/StepReviewDetections";
import StepManualChecklist from "../components/addVenue/StepManualChecklist";
import StepPreviewSubmit from "../components/addVenue/StepPreviewSubmit";

// Add Venue — the contributor flow (planning: add_venue_wireframe.md).
// A four-step guided stepper (Venue → Photos → AI Review → Submit) driven by a
// single local reducer; only the final Submit talks to the server. AI detection
// runs directly against the Python ML service (see lib/detect.js) because photo
// persistence on the Node backend requires auth the frontend doesn't have yet.

// The stepper has two shapes. The photo path runs the AI detection flow; the
// manual path (only offered when adding to a venue that already exists) skips
// photos entirely and confirms features from a checklist. Both share steps 1
// and 2, so switching mode on step 2 keeps the current step valid.
const STEP_FLOWS = {
  photos: ["find", "upload", "review", "submit"],
  manual: ["find", "checklist", "submit"],
};
const STEP_LABELS = {
  find: "Venue",
  upload: "Photos",
  review: "AI Review",
  checklist: "Checklist",
  submit: "Submit",
};

// Key that uniquely identifies one detection within one photo.
const detKey = (photoId, idx) => `${photoId}:${idx}`;

const initialState = {
  step: 1,
  venue: null,
  venueExisting: false, // true when the venue was chosen from search
  // "photos": upload photos and let the AI detect features (the default, and the
  // only path for a brand-new venue). "manual": for a venue that already exists,
  // skip photos and confirm features from a quick checklist instead.
  mode: "photos",
  photos: [], // { id, file, previewUrl, status, detections, altText, error }
  confirmed: {}, // { [detKey]: true }
  manualFeatures: {}, // { [featureKey]: true } — checklist selections in manual mode
  note: "",
  submitState: "idle", // idle | submitting | done | error
  submitError: null,
  result: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_VENUE":
      // Changing the venue resets the contribution path, so a manual checklist
      // picked for one venue doesn't carry over to another. `existing` is true
      // when the venue was chosen from search (already in the system) — only
      // then do we offer the skip-photos / manual-checklist path.
      return {
        ...state,
        venue: action.venue,
        venueExisting: !!action.existing,
        mode: "photos",
        manualFeatures: {},
      };

    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "TOGGLE_MANUAL_FEATURE": {
      const manualFeatures = { ...state.manualFeatures };
      if (manualFeatures[action.key]) delete manualFeatures[action.key];
      else manualFeatures[action.key] = true;
      return { ...state, manualFeatures };
    }

    case "ADD_PHOTOS":
      return { ...state, photos: [...state.photos, ...action.photos] };

    case "REMOVE_PHOTO": {
      const confirmed = { ...state.confirmed };
      // Drop any confirmed keys belonging to the removed photo.
      for (const key of Object.keys(confirmed)) {
        if (key.startsWith(`${action.id}:`)) delete confirmed[key];
      }
      return {
        ...state,
        photos: state.photos.filter((p) => p.id !== action.id),
        confirmed,
      };
    }

    case "ANALYZE_START":
      return {
        ...state,
        photos: state.photos.map((p) =>
          p.id === action.id ? { ...p, status: "analyzing", error: null } : p,
        ),
      };

    case "PHOTO_UPLOADED":
      // Record the backend photo id as soon as upload succeeds, so a later
      // analyze failure + retry re-analyzes the SAME photo instead of
      // re-uploading it (which would duplicate the Cloudinary asset + row).
      return {
        ...state,
        photos: state.photos.map((p) =>
          p.id === action.id ? { ...p, backendPhotoId: action.backendPhotoId } : p,
        ),
      };

    case "ANALYZE_SUCCESS": {
      // Pre-confirm high-confidence detections (≥0.85, matching the ML/backend
      // threshold); lower-confidence ones are shown but left unchecked.
      const confirmed = { ...state.confirmed };
      action.detections.forEach((d, idx) => {
        const high = d.highConfidence ?? d.confidence >= 0.85;
        if (high) confirmed[detKey(action.id, idx)] = true;
      });
      return {
        ...state,
        confirmed,
        photos: state.photos.map((p) =>
          p.id === action.id
            ? {
                ...p,
                status: "done",
                detections: action.detections,
                altText: action.altText,
                // Set in real mode so submit can PATCH detections by photo id.
                backendPhotoId: action.backendPhotoId ?? p.backendPhotoId ?? null,
              }
            : p,
        ),
      };
    }

    case "ANALYZE_ERROR":
      return {
        ...state,
        photos: state.photos.map((p) =>
          p.id === action.id
            ? {
                ...p,
                status: "error",
                error: action.error,
                // A dead session is a different problem from an unreachable
                // service, and needs different advice — flag it so the step can
                // say "sign in again" instead of "check the ML service".
                authError: action.authError,
                detections: [],
              }
            : p,
        ),
      };

    case "TOGGLE_DETECTION": {
      const key = detKey(action.photoId, action.idx);
      const confirmed = { ...state.confirmed };
      if (confirmed[key]) delete confirmed[key];
      else confirmed[key] = true;
      return { ...state, confirmed };
    }

    case "SET_NOTE":
      return { ...state, note: action.note };

    case "NEXT":
      return {
        ...state,
        step: Math.min(state.step + 1, STEP_FLOWS[state.mode].length),
      };

    case "BACK":
      return { ...state, step: Math.max(state.step - 1, 1) };

    case "SUBMIT_START":
      return { ...state, submitState: "submitting", submitError: null };

    case "SUBMIT_SUCCESS":
      return { ...state, submitState: "done", result: action.result };

    case "SUBMIT_ERROR":
      return { ...state, submitState: "error", submitError: action.error };

    default:
      return state;
  }
}

// Collect every confirmed detection across all photos, as raw detection objects
// (the shape detectionsToFeatures/score expect).
function confirmedDetections(state) {
  const out = [];
  for (const photo of state.photos) {
    (photo.detections ?? []).forEach((d, idx) => {
      if (state.confirmed[detKey(photo.id, idx)]) out.push(d);
    });
  }
  return out;
}

export default function AddVenuePage() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const photoSeq = useRef(0);

  // Revoke object URLs on unmount to avoid leaking blob memory.
  const photosRef = useRef(state.photos);
  photosRef.current = state.photos;
  useEffect(() => {
    return () => {
      for (const p of photosRef.current) {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      }
    };
  }, []);

  function addPhotos(files) {
    const photos = files.map((file) => {
      photoSeq.current += 1;
      return {
        id: `p${photoSeq.current}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
        detections: [],
        altText: null,
        error: null,
        backendPhotoId: null, // set after upload succeeds
      };
    });
    dispatch({ type: "ADD_PHOTOS", photos });
  }

  function removePhoto(id) {
    const photo = state.photos.find((p) => p.id === id);
    if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    dispatch({ type: "REMOVE_PHOTO", id });
  }

  async function analyzePhoto(id) {
    const photo = state.photos.find((p) => p.id === id);
    if (!photo || !photo.file) return;
    dispatch({ type: "ANALYZE_START", id });
    try {
      // Upload to Cloudinary (once), then analyze the stored photo so Photo +
      // Detection rows persist and detections carry DB ids.
      let backendPhotoId = photo.backendPhotoId;
      if (!backendPhotoId) {
        const uploaded = await uploadPhoto(state.venue.id, photo.file);
        backendPhotoId = uploaded.id;
        // Persist the id immediately so a subsequent analyze failure + retry
        // does not upload the same photo a second time.
        dispatch({ type: "PHOTO_UPLOADED", id, backendPhotoId });
      }
      const data = await analyzeUploadedPhoto(backendPhotoId);
      dispatch({
        type: "ANALYZE_SUCCESS",
        id,
        backendPhotoId,
        detections: data.detections ?? [],
        altText: data.altTextSuggestion ?? null,
      });
    } catch (err) {
      dispatch({
        type: "ANALYZE_ERROR",
        id,
        error: err.message || "Analysis failed.",
        authError: err instanceof AuthError,
      });
    }
  }

  const manual = state.mode === "manual";

  // Features feeding the preview + submission come from whichever path is
  // active: confirmed AI detections (photo mode) or the checklist (manual mode).
  const detections = confirmedDetections(state);
  const features = manual
    ? Object.keys(state.manualFeatures).map((type) => ({
        type,
        mlDetected: false, // contributor-confirmed, not ML — trusted at full weight
        verifiedCount: 0,
      }))
    : detectionsToFeatures(detections);
  const previewScore = calculateAccessibilityScore(features);

  async function handleSubmit() {
    dispatch({ type: "SUBMIT_START" });
    try {
      // Photo mode only: persist the contributor's confirm/reject decisions on
      // the already-stored detections (by DB id) before recording the
      // contribution. Confirmed detections are marked verified; rejected ones
      // are deleted, so only confirmed features feed the score and photo
      // evidence. Manual mode has no photos/detections, so this is skipped.
      if (!manual) {
        await Promise.all(
          state.photos
            .filter((p) => p.backendPhotoId && p.detections.length > 0)
            .map((p) => {
              const confirmedIds = [];
              const rejectedIds = [];
              p.detections.forEach((d, idx) => {
                if (!d.id) return;
                if (state.confirmed[detKey(p.id, idx)]) confirmedIds.push(d.id);
                else rejectedIds.push(d.id);
              });
              return patchDetections(p.backendPhotoId, {
                confirmed: confirmedIds,
                rejected: rejectedIds,
              });
            }),
        );
      }

      const result = await submitContribution({
        venue: state.venue,
        features,
        previewScore,
        note: state.note,
      });
      // Record the contribution in this browser's activity feed so it shows on
      // the dashboard (and counts toward the local contribution stat). A
      // note-only contribution (no features) gets its own wording.
      logActivity({
        type: "contributed",
        venueId: state.venue.id,
        venueName: state.venue.name,
        detail:
          features.length > 0
            ? `Contributed ${features.length} feature${
                features.length === 1 ? "" : "s"
              } to ${state.venue.name}`
            : `Added a note to ${state.venue.name}`,
      });
      dispatch({ type: "SUBMIT_SUCCESS", result });
    } catch (err) {
      dispatch({
        type: "SUBMIT_ERROR",
        error: err.message || "Submission failed.",
      });
    }
  }

  // The step names for the active flow, and the name of the current step —
  // used to pick which component to render and to gate the "next" action.
  const flow = STEP_FLOWS[state.mode];
  const stepName = flow[state.step - 1];
  const totalSteps = flow.length;

  // Per-step gate for the primary "next" action.
  const canAdvance = {
    find: !!state.venue,
    upload: state.photos.length > 0,
    review: state.photos.some((p) => p.status === "done"),
    checklist: features.length > 0 || state.note.trim().length > 0,
    submit: features.length > 0 || state.note.trim().length > 0,
  }[stepName];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-semibold text-ink">Add a Venue</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Upload a few photos and let AI detect the accessibility features — no
        tedious forms.
      </p>

      <div className="mt-6">
        <Stepper current={state.step} labels={flow.map((s) => STEP_LABELS[s])} />
      </div>

      <div className="mt-8">
        {stepName === "find" && (
          <StepFindVenue
            initialVenue={state.venue}
            onVenue={(venue, existing) => {
              dispatch({ type: "SET_VENUE", venue, existing });
              dispatch({ type: "NEXT" });
            }}
          />
        )}

        {stepName === "upload" && (
          <StepUploadPhotos
            photos={state.photos}
            onAdd={addPhotos}
            onRemove={removePhoto}
            // Only an existing venue can skip photos — a brand-new venue needs a
            // photo to seed its first detections.
            canSkip={state.venueExisting}
            onSkip={() => dispatch({ type: "SET_MODE", mode: "manual" })}
          />
        )}

        {stepName === "review" && (
          <StepReviewDetections
            photos={state.photos}
            confirmed={state.confirmed}
            detKey={detKey}
            onAnalyze={analyzePhoto}
            onToggle={(photoId, idx) =>
              dispatch({ type: "TOGGLE_DETECTION", photoId, idx })
            }
          />
        )}

        {stepName === "checklist" && (
          <StepManualChecklist
            venue={state.venue}
            selected={state.manualFeatures}
            onToggle={(key) =>
              dispatch({ type: "TOGGLE_MANUAL_FEATURE", key })
            }
            onSwitchToPhotos={() =>
              dispatch({ type: "SET_MODE", mode: "photos" })
            }
          />
        )}

        {stepName === "submit" && (
          <StepPreviewSubmit
            venue={state.venue}
            features={features}
            previewScore={previewScore}
            note={state.note}
            onNoteChange={(note) => dispatch({ type: "SET_NOTE", note })}
            submitState={state.submitState}
            submitError={state.submitError}
            result={state.result}
            onSubmit={handleSubmit}
            onViewVenue={() =>
              state.venue && navigate(`/venue/${state.venue.id}`)
            }
          />
        )}
      </div>

      {/* Step navigation. Step 1 advances on venue-select; the final submit
          lives inside the submit step, so the shared footer hides on those. */}
      {state.step > 1 &&
        !(stepName === "submit" && state.submitState === "done") && (
          <div className="mt-8 flex items-center justify-between border-t border-sand-200 pt-6">
            <button
              type="button"
              onClick={() => dispatch({ type: "BACK" })}
              className="rounded-xl border border-sand-200 bg-surface px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-sand-100"
            >
              ← Back
            </button>

            {state.step < totalSteps && (
              <button
                type="button"
                onClick={() => dispatch({ type: "NEXT" })}
                disabled={!canAdvance}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-sand-200 disabled:text-ink-faint disabled:shadow-none"
              >
                {stepName === "upload"
                  ? "Analyze with AI →"
                  : stepName === "review"
                    ? "Next: Review →"
                    : "Next →"}
              </button>
            )}
          </div>
        )}
    </div>
  );
}
