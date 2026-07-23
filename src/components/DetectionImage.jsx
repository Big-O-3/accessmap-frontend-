import { useRef, useState } from "react";
import { featureLabel } from "../lib/features";

// Renders a photo with ML detection bounding boxes overlaid. Bounding boxes
// from the ML service are in the original image's pixel space, so we scale them
// by the rendered-to-natural size ratio once the image loads.
export default function DetectionImage({ photo }) {
  const imgRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  function handleLoad() {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    setScale({
      x: img.clientWidth / img.naturalWidth,
      y: img.clientHeight / img.naturalHeight,
    });
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
