import { Link } from "react-router-dom";

// Fallback page for unbuilt routes and the 404 catch-all. Kept minimal so
// unfinished features and unknown URLs land somewhere navigable.
export default function StubPage({ title, owner }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-500">
        This page is planned{owner ? ` (owned by ${owner})` : ""} and not built
        yet.
      </p>
      <Link
        to="/search"
        className="mt-6 inline-block text-indigo-600 hover:underline"
      >
        Go to search →
      </Link>
    </div>
  );
}
