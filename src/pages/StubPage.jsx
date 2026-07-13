import { Link } from "react-router-dom";

// Placeholder for pages owned by other teammates (Brandon: upload, dashboard,
// add-venue; Charles/shared: about). Keeps routing complete without stepping on
// their work.
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
