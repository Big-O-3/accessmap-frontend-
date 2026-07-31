import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import ThemeToggle from "./ThemeToggle";
import BottomNav from "./BottomNav";
import CursorGlow from "./CursorGlow";
import ToastViewport from "./ToastViewport";

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
  return `px-3 py-2 rounded-lg text-base font-medium transition-colors ${
    isActive
      ? "bg-brand-50 text-link"
      : "text-ink-soft hover:bg-sand-100 hover:text-ink"
  }`;
}

// Auth control at the right of the header. On desktop it greets the signed-in
// user and offers log out (or a log-in button when signed out). The `mobile`
// variant is trimmed: just a log-out button when signed in, and nothing when
// signed out (mobile log-in lives in the bottom tab bar).
function AuthSlot({ mobile = false, onNavigate }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  async function handleLogout() {
    await logout();
    onNavigate?.();
    navigate("/");
  }

  if (user) {
    if (mobile) {
      return (
        <button
          type="button"
          onClick={handleLogout}
          className={navLinkClass({ isActive: false })}
        >
          Log out
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2 text-base">
        <span className="text-ink-soft">Hi, {user.username}</span>
        <button
          type="button"
          onClick={handleLogout}
          className={navLinkClass({ isActive: false })}
        >
          Log out
        </button>
      </div>
    );
  }

  if (mobile) return null;

  return (
    <NavLink
      to="/login"
      className={({ isActive }) =>
        `inline-block rounded-lg px-4 py-2 text-base font-semibold shadow-sm transition-colors ${
          isActive
            ? "bg-brand-700 text-white"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`
      }
    >
      Log in
    </NavLink>
  );
}

export default function Layout() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navLinks = user ? [...PUBLIC_LINKS, ...AUTH_LINKS] : PUBLIC_LINKS;

  // Glass nav gains a border + shadow once the page is scrolled at all.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-full flex flex-col text-ink">
      {/* First focusable element: lets keyboard users jump past the nav. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      <CursorGlow />

      <header
        className={`sticky top-0 z-30 backdrop-blur-xl transition-all ${
          scrolled
            ? "border-b border-sand-200 bg-sand-50/90 shadow-sm"
            : "border-b border-transparent bg-sand-50/60"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center group">
            <span className="font-display text-xl font-extrabold tracking-tight text-ink">
              AccessMap
            </span>
          </NavLink>

          {/* Desktop nav — full row of links plus the auth slot. */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={navLinkClass}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="ml-2 flex items-center gap-1 border-l border-sand-200 pl-2">
              <ThemeToggle />
              <AuthSlot />
            </div>
          </nav>

          {/* Mobile top bar — theme toggle plus log out; navigation is the
              bottom tab bar. */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <AuthSlot mobile />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-sand-200 bg-sand-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8 flex flex-col items-center gap-2 text-center">
          <span className="font-display text-lg font-extrabold text-ink">
            AccessMap
          </span>
          <p className="text-base text-ink-soft">
            Created by Brandon Curo, Charles Mada, and Prateek Oblum
          </p>
        </div>
      </footer>

      {/* Mobile-only bottom navigation. */}
      <BottomNav signedIn={!!user} />

      {/* App-wide toast notifications. */}
      <ToastViewport />
    </div>
  );
}
