import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import ThemeToggle from "./ThemeToggle";
import CursorGlow from "./CursorGlow";

const PUBLIC_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/search", label: "Search" },
];

const AUTH_LINKS = [
  { to: "/analyze", label: "Analyze" },
  { to: "/add-venue", label: "Add Venue" },
  { to: "/dashboard", label: "Dashboard" },
];

function navLinkClass({ isActive }) {
  return `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-50 text-link"
      : "text-ink-soft hover:bg-sand-100 hover:text-ink"
  }`;
}

// Small auth control shown at the right of the header (and inside the mobile
// drawer). Reads user state from AuthContext; renders "Log in / Sign up" while
// signed out and "Hi, <username> · Log out" while signed in.
function AuthSlot({ compact = false, onNavigate }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  const wrap = compact
    ? "flex flex-col gap-1"
    : "flex items-center gap-2 text-sm";

  async function handleLogout() {
    const ok = window.confirm(
      "Are you sure you want to log out? Any unsaved progress on this page won't be saved.",
    );
    if (!ok) return;
    await logout();
    onNavigate?.();
    navigate("/");
  }

  if (user) {
    return (
      <div className={wrap}>
        <span className={compact ? "px-3 py-2 text-sm text-ink-soft" : "text-ink-soft"}>
          Hi, {user.username}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className={
            compact
              ? "rounded-lg px-3 py-3 text-left text-base font-medium text-ink-soft hover:bg-sand-100"
              : "rounded-lg px-3 py-2 font-medium text-ink-soft hover:bg-sand-100"
          }
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <NavLink
        to="/login"
        onClick={onNavigate}
        className={({ isActive }) =>
          `${compact ? "block" : "inline-block"} rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
            isActive
              ? "bg-brand-700 text-white"
              : "bg-brand-600 text-white hover:bg-brand-700"
          }`
        }
      >
        Log in
      </NavLink>
    </div>
  );
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const navLinks = user ? [...PUBLIC_LINKS, ...AUTH_LINKS] : PUBLIC_LINKS;

  return (
    <div className="min-h-full flex flex-col bg-sand-50 text-ink">
      <CursorGlow />
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-sand-50/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 group">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white text-lg shadow-sm transition-transform group-hover:scale-105">
              ◆
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              AccessMap
            </span>
          </NavLink>

          {/* Desktop nav — full row of links plus the auth slot. */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
            <div className="ml-2 flex items-center gap-1 border-l border-sand-200 pl-2">
              <ThemeToggle />
              <AuthSlot />
            </div>
          </nav>

          {/* Mobile menu toggle — a large, easy-to-tap hamburger button. */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-ink-soft hover:bg-sand-100"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {/* Simple hamburger / close icon drawn with spans. */}
            <span className="text-2xl leading-none">{menuOpen ? "×" : "≡"}</span>
          </button>
        </div>

        {/* Mobile dropdown menu — stacked, full-width tap targets. */}
        {menuOpen && (
          <nav className="md:hidden border-t border-sand-200 px-2 pb-3 pt-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-link"
                      : "text-ink-soft hover:bg-sand-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-sand-200 pt-2">
              <ThemeToggle compact />
              <AuthSlot compact onNavigate={() => setMenuOpen(false)} />
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-sand-200 bg-sand-100">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col items-center gap-2 text-center">
          <span className="font-display text-lg font-semibold text-ink">
            AccessMap
          </span>
          <p className="text-sm text-ink-soft">
            Community-powered accessibility discovery.
          </p>
        </div>
      </footer>
    </div>
  );
}
