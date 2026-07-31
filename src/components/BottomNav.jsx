import { NavLink } from "react-router-dom";

// Mobile bottom tab bar - the primary navigation on phones (hidden on md+,
// where the top nav takes over). Thumb-zone destinations with a raised
// "Analyze" action in the middle for the app's photo-analysis flow.
//
// Accessibility notes:
// - Each tab is a real link with a visible text label under the icon (never an
//   icon alone), and clears the 44px minimum tap-target size.
// - NavLink automatically sets aria-current="page" on the active tab.
// - Icons are aria-hidden; the label is the accessible name.
// - The bar pads for the phone's home-indicator safe area.

const MARK_GRADIENT =
  "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))";

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function tabClass({ isActive }) {
  return `flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${
    isActive ? "text-link" : "text-ink-faint hover:text-ink"
  }`;
}

export default function BottomNav({ signedIn }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-sand-50/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Signed-in users get four tabs (log out lives in the top bar); signed-out
          users get a fifth "Sign in" tab, which is mobile's login entry point. */}
      <ul
        className={`mx-auto grid max-w-md items-end px-2 ${
          signedIn ? "grid-cols-4" : "grid-cols-5"
        }`}
      >
        <li>
          <NavLink to="/" end className={tabClass}>
            <HomeIcon />
            <span>Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/search" className={tabClass}>
            <SearchIcon />
            <span>Search</span>
          </NavLink>
        </li>
        <li className="flex flex-col items-center">
          {/* Raised primary action - analyze a venue from a photo. */}
          <NavLink
            to="/analyze"
            aria-label="Analyze a venue"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-sand-50 transition-transform active:scale-95"
            style={{ background: MARK_GRADIENT }}
          >
            <CameraIcon />
          </NavLink>
          <span className="pb-1.5 text-[11px] font-semibold text-ink-faint">
            Analyze
          </span>
        </li>
        <li>
          <NavLink to="/dashboard" className={tabClass}>
            <GridIcon />
            <span>Dashboard</span>
          </NavLink>
        </li>
        {!signedIn && (
          <li>
            <NavLink to="/login" className={tabClass}>
              <UserIcon />
              <span>Sign in</span>
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}
