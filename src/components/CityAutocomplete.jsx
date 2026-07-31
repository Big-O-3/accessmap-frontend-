import { useId, useRef, useState } from "react";

// A city search input with a suggestion dropdown, used by every city search box
// (home hero, mobile home, the search-page filter). The suggestion list is an
// OVERLAY: it's absolutely positioned over the page (z-20), so opening it never
// pushes the surrounding content down. Matches the pattern in PlaceAutocomplete.
//
// Props:
//   value            — current input string (parent controlled)
//   onChange(str)    — called on every keystroke with the new string
//   onSelect(city)   — called when the user picks a suggestion (click / Enter)
//   options          — array of city-name strings to suggest from
//   id               — DOM id for the input (a <label htmlFor> can pair with it)
//   placeholder      — input placeholder text
//   className        — classes for the <input> itself
//   wrapperClassName — classes for the relative wrapper (e.g. flex sizing)
//   aria-label       — accessible name when there's no visible <label>
export default function CityAutocomplete({
  value,
  onChange,
  onSelect,
  options = [],
  id,
  placeholder,
  className = "",
  wrapperClassName = "",
  "aria-label": ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  // Index of the keyboard-highlighted suggestion; -1 means none.
  const [highlight, setHighlight] = useState(-1);
  // Sentinel so clicking a suggestion doesn't fire blur-then-close before the
  // click's onSelect runs (same guard as PlaceAutocomplete).
  const suppressBlur = useRef(false);
  const listId = useId();

  // Filter by substring as the user types; on an empty box show the first few
  // so the control also works as a plain "pick a city" dropdown on focus.
  const q = value.trim().toLowerCase();
  const matches = (
    q ? options.filter((c) => c.toLowerCase().includes(q)) : options
  ).slice(0, 8);

  const showList = open && matches.length > 0;

  function choose(city) {
    onSelect?.(city);
    setOpen(false);
    setHighlight(-1);
  }

  function handleKeyDown(e) {
    if (!showList) {
      if (e.key === "ArrowDown") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? matches.length - 1 : h - 1));
    } else if (e.key === "Enter") {
      // Only intercept Enter when a suggestion is highlighted, so hitting Enter
      // with nothing highlighted still submits the surrounding search form.
      if (highlight >= 0) {
        e.preventDefault();
        choose(matches[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (suppressBlur.current) {
            suppressBlur.current = false;
            return;
          }
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={
          highlight >= 0 ? `${listId}-opt-${highlight}` : undefined
        }
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-sand-200 bg-surface py-1 text-left shadow-lg"
        >
          {matches.map((city, i) => (
            <li key={city} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                id={`${listId}-opt-${i}`}
                onMouseDown={() => {
                  suppressBlur.current = true;
                }}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => choose(city)}
                className={`block w-full px-3 py-2 text-left text-base text-ink ${
                  i === highlight ? "bg-brand-50 text-link" : "hover:bg-brand-50"
                }`}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
