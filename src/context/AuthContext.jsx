import { createContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

// Source of truth for "is the user signed in" across the UI. Supabase's JS
// client owns the session (stored in localStorage) — this context just mirrors
// it into React so components can react to changes.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

// Shape a Supabase user for the rest of the app. Uses google-provided
// user_metadata (full_name, avatar_url, email) plus the Supabase-issued uuid.
function shapeUser(sbUser) {
  if (!sbUser) return null;
  const meta = sbUser.user_metadata ?? {};
  return {
    id: sbUser.id,
    email: sbUser.email ?? meta.email ?? null,
    username: meta.full_name ?? meta.name ?? sbUser.email?.split("@")[0] ?? "there",
    avatarUrl: meta.avatar_url ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(shapeUser(data.session?.user));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(shapeUser(session?.user));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  // Returns { needsConfirmation: boolean }. If Supabase has email confirmation
  // turned on, signUp returns no session and the user must click a link in the
  // confirmation email before they can sign in.
  const signUpWithEmail = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return { needsConfirmation: !data.session };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
