import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const PUBLIC_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/search", label: "Search" },
  { to: "/about", label: "About" },
];

const AUTH_LINKS = [
  { to: "/analyze", label: "Analyze" },
  { to: "/add-venue", label: "Add Venue" },
  { to: "/dashboard", label: "Dashboard" },
];

function navLinkClass({ isActive }) {
  return `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
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
        <span className={compact ? "px-3 py-2 text-sm text-gray-600" : "text-gray-600"}>
          Hi, {user.username}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className={
            compact
              ? "rounded-md px-3 py-3 text-left text-base font-medium text-gray-700 hover:bg-gray-100"
              : "rounded-md px-3 py-2 font-medium text-gray-700 hover:bg-gray-100"
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
          `${compact ? "block" : "inline-block"} rounded-md px-3 py-2 text-sm font-medium ${
            isActive
              ? "bg-indigo-700 text-white"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
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
    <div className="min-h-full flex flex-col bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-lg">
            <span>AccessMap</span>
          </NavLink>

          {/* Desktop nav — full row of links plus the auth slot. */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
            <div className="ml-2 border-l border-gray-200 pl-2">
              <AuthSlot />
            </div>
          </nav>

          {/* Mobile menu toggle — a large, easy-to-tap hamburger button. */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100"
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
          <nav className="md:hidden border-t border-gray-100 px-2 pb-3 pt-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <AuthSlot compact onNavigate={() => setMenuOpen(false)} />
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 text-center">
          AccessMap — community-powered accessibility discovery.
        </div>
      </footer>
    </div>
  );
}
