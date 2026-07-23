import { useSaveVenue } from "../hooks/useUserData";

// Toggle a venue in the browser's saved list. Used on venue cards and the
// venue detail page. A real <button> with an accessible label and aria-pressed
// so screen-reader users hear the saved/not-saved state (not color/icon only).
export default function SaveButton({ venue, size = "md" }) {
  const { saved, toggle } = useSaveVenue(venue);

  const sizes = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        // Cards wrap the button in a link; don't navigate when saving.
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${venue.name} from saved` : `Save ${venue.name}`}
      className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset transition-colors ${
        sizes[size]
      } ${
        saved
          ? "bg-accent-500 text-white ring-accent-500 hover:bg-accent-600"
          : "bg-surface text-ink-soft ring-sand-200 hover:bg-sand-100"
      }`}
    >
      <span aria-hidden="true">{saved ? "★" : "☆"}</span>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
