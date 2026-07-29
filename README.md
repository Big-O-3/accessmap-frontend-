# accessmap-frontend-
Frontend for AccessMap, a platform that helps wheelchair users find accessible venues. Users search and filter venues on an interactive map, view detailed accessibility scores with community-verified photos and reviews, upload photos for AI feature detection, and track their contributions on a personal dashboard. Built with React and React Router

## Authentication (email confirmation)

Email/password signup goes through Supabase (`supabase.auth.signUp`). Whether a
new user must confirm their email before logging in is a **Supabase dashboard
setting**, not something in this repo: Authentication → Sign In / Providers →
Email → **Confirm email**.

- **On** (Supabase default): signup returns no session, so the user gets a
  confirmation email and must click its link before they can log in. The login
  page shows "Check your inbox — confirm your email, then come back and log in."
- **Off**: signup returns a session immediately and the user is logged straight
  in — the inbox step never appears.

The frontend handles both automatically by branching on whether `signUp` returned
a session (see `signUpWithEmail` in `src/context/AuthContext.jsx`), so flipping
the toggle needs no code change. For throwaway demo accounts, turning it off
removes signup friction (Supabase's built-in mailer can be slow or land in spam);
leave it on for real users.

## Deploying (SPA rewrite)

This is a client-routed single-page app (`BrowserRouter`), so nested URLs like
`/search` and `/venue/:id` are real paths the host is asked for on a hard
refresh or a direct link. The host **must** fall back to `index.html` for any
non-asset path, or refreshing anything but `/` returns the host's own 404.

- **Render** (current host): the rewrite lives in [`render.yaml`](./render.yaml)
  (`/*` → `/index.html`). If configuring by hand instead, add a Redirect/Rewrite
  rule in the static site's dashboard: Source `/*`, Destination `/index.html`,
  Action **Rewrite**. Render **ignores** `public/_redirects`.
- **Netlify / Cloudflare Pages**: add a `public/_redirects` file containing
  `/*  /index.html  200`. (Not committed — the current host is Render, which
  ignores it.)
