# accessmap-frontend-
Frontend for AccessMap, a platform that helps wheelchair users find accessible venues. Users search and filter venues on an interactive map, view detailed accessibility scores with community-verified photos and reviews, upload photos for AI feature detection, and track their contributions on a personal dashboard. Built with React and React Router

## Deploying (SPA rewrite)

This is a client-routed single-page app (`BrowserRouter`), so nested URLs like
`/search` and `/venue/:id` are real paths the host is asked for on a hard
refresh or a direct link. The host **must** fall back to `index.html` for any
non-asset path, or refreshing anything but `/` returns the host's own 404.

- **Render** (current host): the rewrite lives in [`render.yaml`](./render.yaml)
  (`/*` → `/index.html`). If configuring by hand instead, add a Redirect/Rewrite
  rule in the static site's dashboard: Source `/*`, Destination `/index.html`,
  Action **Rewrite**. Render **ignores** `public/_redirects`.
- **Netlify / Cloudflare Pages**: handled by [`public/_redirects`](./public/_redirects)
  (`/*  /index.html  200`).
