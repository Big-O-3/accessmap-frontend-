import { NavLink, Outlet } from "react-router-dom";
import { USE_MOCK } from "../lib/api";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/search", label: "Search" },
  { to: "/analyze", label: "Analyze" },
  { to: "/add-venue", label: "Add Venue" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
];

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">♿</span>
            <span>AccessMap</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {USE_MOCK && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-center text-xs py-1.5">
          Running on mock data — set <code className="font-mono">VITE_API_URL</code> to connect the backend.
        </div>
      )}

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
