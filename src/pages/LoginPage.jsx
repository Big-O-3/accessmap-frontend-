import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectHint = location.state?.from?.pathname;

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onGoogle() {
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      // signInWithOAuth redirects the browser; nothing else to do here.
    } catch (err) {
      setError(err.message || "Couldn't start Google sign-in.");
      setSubmitting(false);
    }
  }

  async function onEmailSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError("Enter both an email and a password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        navigate(location.state?.from?.pathname ?? "/", { replace: true });
      } else {
        const { needsConfirmation } = await signUpWithEmail(email, password);
        if (needsConfirmation) {
          setInfo(
            "Check your inbox — confirm your email, then come back and log in.",
          );
          setMode("login");
        } else {
          navigate(location.state?.from?.pathname ?? "/", { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">
        {mode === "login" ? "Log in" : "Sign up"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {mode === "login"
          ? "Sign in to save analyses and contribute venues."
          : "Create an account with your email to save analyses and contribute venues."}
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
        {submitting ? "Please wait…" : "Continue with Google"}
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={onEmailSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 6 : undefined}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        {mode === "login" ? (
          <>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Log in
            </button>
          </>
        )}
      </p>

      {info && (
        <p className="mt-4 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700 ring-1 ring-indigo-600/20">
          {info}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/20">
          {error}
        </p>
      )}
    </div>
  );
}
