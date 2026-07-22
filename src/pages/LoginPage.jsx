import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const location = useLocation();
  const redirectHint = location.state?.from?.pathname;
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      // signInWithOAuth redirects the browser; nothing else to do here.
    } catch (err) {
      setError(err.message || "Couldn't start Google sign-in.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Log in</h1>
      <p className="mt-1 text-sm text-gray-500">
        Sign in with Google to save analyses and contribute venues.
      </p>

      {redirectHint && (
        <p className="mt-4 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700 ring-1 ring-indigo-600/20">
          Sign in to continue to <span className="font-medium">{redirectHint}</span>.
        </p>
      )}

      <button
        type="button"
        onClick={onGoogle}
        disabled={submitting}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.24 1.44-1.72 4.23-5.5 4.23-3.31 0-6-2.74-6-6.13s2.69-6.13 6-6.13c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.83 3.5 14.66 2.5 12 2.5 6.98 2.5 2.9 6.58 2.9 11.6S6.98 20.7 12 20.7c6.93 0 9.15-4.87 9.15-7.36 0-.49-.05-.87-.12-1.24H12z"
          />
        </svg>
        {submitting ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/20">
          {error}
        </p>
      )}
    </div>
  );
}
