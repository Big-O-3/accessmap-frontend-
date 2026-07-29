import { useRef, useState } from "react";
import { featureLabel } from "../lib/features";
import { deletePhoto } from "../lib/api";

// Renders a photo with ML detection bounding boxes overlaid. Bounding boxes
// from the ML service are in the original image's pixel space, so we scale them
// by the rendered-to-natural size ratio once the image loads.
//
// When `canDelete` is set (the signed-in user is the uploader), a Delete button
// overlays the photo; on success it calls onDelete(photo.id) so the parent can
// drop it from view. The backend re-checks ownership regardless.
export default function DetectionImage({ photo, canDelete = false, onDelete }) {
  const imgRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  function handleLoad() {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    setScale({
      x: img.clientWidth / img.naturalWidth,
      y: img.clientHeight / img.naturalHeight,
    });
  }

  async function handleDelete() {
    if (!window.confirm("Delete this photo? This can't be undone.")) return;
    setError(null);
    setDeleting(true);
    try {
      await deletePhoto(photo.id);
      onDelete?.(photo.id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="relative inline-block w-full">
      <img
        ref={imgRef}
        src={photo.imageUrl}
        alt="Venue accessibility photo"
        onLoad={handleLoad}
        className="w-full rounded-lg"
      />
      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-danger disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      )}
      {error && (
        <p
          role="alert"
          className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/75 px-2 py-1 text-xs text-white ring-1 ring-inset ring-danger-ring backdrop-blur-sm"
        >
          {error}
        </p>
      )}
      {(photo.detections ?? []).map((d, i) => (
        <div
          key={i}
          className="absolute border-2 border-brand-500 bg-brand-500/10 rounded"
          style={{
            left: d.boundingBox.x * scale.x,
            top: d.boundingBox.y * scale.y,
            width: d.boundingBox.width * scale.x,
            height: d.boundingBox.height * scale.y,
          }}
        >
          <span className="absolute top-0 left-0 max-w-full truncate rounded-br rounded-tl bg-brand-600 px-1.5 py-0.5 text-xs font-medium text-white">
            {featureLabel(d.accessibilityFeature)} ·{" "}
            {Math.round(d.confidence * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
