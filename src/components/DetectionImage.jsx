import { useEffect, useRef, useState } from "react";
import { featureLabel } from "../lib/features";
import { deletePhoto } from "../lib/api";
import { toast } from "../lib/toast";
import ConfirmDialog from "./ConfirmDialog";

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
  const [confirming, setConfirming] = useState(false);

  function measure() {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    setScale({
      x: img.clientWidth / img.naturalWidth,
      y: img.clientHeight / img.naturalHeight,
    });
  }

  // Recompute the box scale whenever the image's rendered size changes, not just
  // on first load - otherwise boxes drift after a responsive reflow (window
  // resize, device rotation, sidebar collapse).
  useEffect(() => {
    const img = imgRef.current;
    if (!img || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(img);
    return () => ro.disconnect();
  }, []);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePhoto(photo.id);
      toast.success("Photo deleted");
      onDelete?.(photo.id); // parent drops it from view (unmounts this)
    } catch (err) {
      toast.error(err.message || "Couldn't delete photo");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="relative inline-block w-full">
      <img
        ref={imgRef}
        src={photo.imageUrl}
        alt="Venue accessibility photo"
        onLoad={measure}
        className="w-full rounded-lg"
      />
      {canDelete && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={deleting}
          className="absolute top-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-danger disabled:opacity-50"
        >
          Delete
        </button>
      )}
      <ConfirmDialog
        open={confirming}
        title="Delete this photo?"
        body="This can't be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
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
