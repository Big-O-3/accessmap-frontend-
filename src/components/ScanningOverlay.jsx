// Loading state shown while the ML service analyzes a photo. Instead of a
// generic spinner, we show the contributor's actual photo with an AI "scan"
// sweeping over it — a line travelling top→bottom plus a framing reticle — so
// it reads as "the AI is examining THIS image," not "something is loading."
//
// Used by the Analyze page and the Add-Venue detection-review step; both
// already hold a preview URL for the photo being analyzed.
//
// Motion is announced to sighted users only; the accessible status is carried
// by a role="status" text label (visible below, and mirrored sr-only), and the
// animation itself is disabled under prefers-reduced-motion (see index.css).
export default function ScanningOverlay({
  imageUrl,
  label = "Analyzing photo…",
}) {
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-black/5 ring-1 ring-sand-200">
        {imageUrl ? (
          // The photo, dimmed so the scan graphics stay legible over any image.
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="block max-h-96 w-full object-contain opacity-70"
          />
        ) : (
          // No preview available (rare) — fall back to a neutral panel so the
          // scan line still has something to sweep across.
          <div className="h-56 w-full bg-gradient-to-b from-sand-100 to-sand-200" />
        )}

        {/* Scan graphics. Purely decorative; the text label carries meaning. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          {/* Corner reticle — a framing bracket in each corner. */}
          <span className="absolute left-3 top-3 h-6 w-6 rounded-tl border-l-2 border-t-2 border-white/80 shadow-[0_0_6px_rgba(0,0,0,0.4)]" />
          <span className="absolute right-3 top-3 h-6 w-6 rounded-tr border-r-2 border-t-2 border-white/80 shadow-[0_0_6px_rgba(0,0,0,0.4)]" />
          <span className="absolute bottom-3 left-3 h-6 w-6 rounded-bl border-b-2 border-l-2 border-white/80 shadow-[0_0_6px_rgba(0,0,0,0.4)]" />
          <span className="absolute bottom-3 right-3 h-6 w-6 rounded-br border-b-2 border-r-2 border-white/80 shadow-[0_0_6px_rgba(0,0,0,0.4)]" />

          {/* The sweeping scan line: a thin bright bar with a soft glow trail. */}
          <span className="animate-scan-sweep absolute inset-x-0 h-0.5 bg-white shadow-[0_0_12px_4px_rgba(255,255,255,0.7)]">
            <span className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-white/25" />
          </span>
        </div>
      </div>

      {/* Accessible status — announced to screen readers, visible to everyone.
          The dots pulse for sighted users; the text is what actually conveys
          state (and stays put under reduced-motion). */}
      <p
        role="status"
        className="flex items-center justify-center gap-1.5 text-center text-sm text-ink-soft"
      >
        <span>{label}</span>
        <span className="flex gap-0.5" aria-hidden="true">
          <span className="animate-scan-pulse h-1.5 w-1.5 rounded-full bg-ink-soft [animation-delay:0ms]" />
          <span className="animate-scan-pulse h-1.5 w-1.5 rounded-full bg-ink-soft [animation-delay:200ms]" />
          <span className="animate-scan-pulse h-1.5 w-1.5 rounded-full bg-ink-soft [animation-delay:400ms]" />
        </span>
      </p>
    </div>
  );
}
