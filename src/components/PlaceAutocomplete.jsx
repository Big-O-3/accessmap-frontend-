import { useEffect, useRef, useState } from "react";
import { searchPlaces } from "../lib/geocode";

// Text input that suggests real places as the user types, backed by
// Nominatim (OpenStreetMap). Picking a suggestion calls onPick(place) with the
// normalized place object from lib/geocode.js and blurs the dropdown.
//
// Props:
//   value        — current input string (parent controlled)
//   onChange     — called on every keystroke with the new string
//   onPick(p)    — called when the user picks a suggestion
//   id           — DOM id for the input, so a <label htmlFor> can pair with it
//   placeholder  — input placeholder text
//   className    — extra classes for the input
export default function PlaceAutocomplete({
  value,
  onChange,
  onPick,
  id,
  placeholder,
  className = "",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // Sentinel so a suggestion click doesn't fire mousedown-then-blur in the
  // wrong order and close the list before onPick runs.
  const suppressBlur = useRef(false);

  // Debounced search — respect Nominatim's 1 req/sec ask by waiting for the
  // user to pause typing.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(q, { signal: controller.signal });
        setSuggestions(results);
      } catch (err) {
        if (err.name !== "AbortError") setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  function handlePick(place) {
    onPick(place);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (suppressBlur.current) {
            suppressBlur.current = false;
            return;
          }
          // Small delay so a click on a suggestion can still fire.
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
      />

      {open && (loading || suggestions.length > 0) && (
        <ul
          className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-400" role="status">
              Searching…
            </li>
          )}
          {suggestions.map((p) => (
            <li key={p.id} role="option">
              <button
                type="button"
                onMouseDown={() => {
                  suppressBlur.current = true;
                }}
                onClick={() => handlePick(p)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
              >
                <span className="block font-medium text-gray-900">{p.name}</span>
                <span className="block truncate text-xs text-gray-500">
                  {p.displayName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
