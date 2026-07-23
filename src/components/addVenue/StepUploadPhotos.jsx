import { useRef, useState } from "react";

// Step 2 · Upload Photos.
// No manual tagging — that's the AI's job in Step 3. Photos are held locally as
// File objects (the frontend has no auth to persist them yet); each carries an
// object-URL preview. Drag-and-drop plus an explicit button path for keyboard
// and screen-reader users (the dropzone is not the only way in).
export default function StepUploadPhotos({ photos, onAdd, onRemove }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(fileList) {
    const files = Array.from(fileList ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length) onAdd(files);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Upload photos</h2>
        <p className="mt-1 text-sm text-ink-soft">
          No forms to fill out — our AI reads the photos in the next step.
        </p>
      </div>

      {/* Dropzone. The whole region is clickable, but the button below is the
          canonical keyboard path. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-brand-500 bg-brand-50"
            : "border-sand-200 bg-surface"
        }`}
      >
        <p className="font-medium text-ink">Drag &amp; drop photos here</p>
        <p className="mt-1 text-xs text-ink-soft">
          Tip: entrance, bathroom, parking, and seating photos work best.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Choose from device
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Choose venue photos to upload"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
        <p className="mt-2 text-xs text-ink-faint">JPG or PNG, up to 10MB each.</p>
      </div>

      {photos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-ink-soft">
            Uploaded ({photos.length})
          </h3>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <li
                key={photo.id}
                className="relative overflow-hidden rounded-lg border border-sand-200 bg-sand-100"
              >
                <img
                  src={photo.previewUrl}
                  alt={photo.file?.name || "Selected venue photo"}
                  className="h-28 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemove(photo.id)}
                  aria-label={`Remove ${photo.file?.name || "photo"}`}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white hover:bg-black/80"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
