import { Link } from "react-router-dom";
import { useSavedVenues, useActivity, useStats } from "../hooks/useUserData";
import Button from "../components/Button";
import StatsGrid from "../components/dashboard/StatsGrid";
import RecentActivity from "../components/dashboard/RecentActivity";
import Recommendations from "../components/dashboard/Recommendations";
import SavedVenues from "../components/dashboard/SavedVenues";

// User Dashboard (planning: user_dashboard_wireframe.md).
//
// The app has no auth yet, so "your" data is this browser's data, persisted to
// localStorage (see lib/userData.js): saved venues, an activity feed, and
// stats derived from them. Recommendations reuse the live venue-search API.
// This is the swap-point for a real per-user backend once sign-in exists.
export default function DashboardPage() {
  const saved = useSavedVenues();
  const activity = useActivity();
  const stats = useStats();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-sand-200 bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Your dashboard
          </h1>
          <p className="mt-1 text-base text-ink-soft">
            Your saved places, recent activity, and venues we recommend.
          </p>
        </div>
        <Button as={Link} to="/add-venue" className="w-full sm:w-auto">
          + Add a venue
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-6">
        <StatsGrid stats={stats} />
      </div>

      {/* Activity + Recommendations, two columns on desktop */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity activity={activity} />
        <Recommendations />
      </div>

      {/* Saved venues */}
      <div className="mt-8">
        <SavedVenues saved={saved} />
      </div>
    </div>
  );
}
