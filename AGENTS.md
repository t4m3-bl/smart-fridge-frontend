<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Smart Fridge Frontend

Next.js 16.4.3 (App Router) + React 19 + TypeScript (strict). PWA for tracking food expiry dates. All UI copy is Russian — keep new strings Russian.

## Communication

- Think in English, but write user-facing responses in Russian.

## Commands

- `npm run dev` — dev server on `:3000`. It rewrites the block above on start.
- `npm run lint` — ESLint flat config, no args (use `npx eslint <path>` to scope).
- `npx tsc --noEmit` — the only typecheck; there is no `typecheck` script.
- `npm run build` — production build (`npm start` to serve it).

There is **no test framework or test script** installed. Do not invent test commands. Run typecheck + lint before finishing. Lint is clean apart from one warning in `app/layout.tsx` (`RegisterSW` is imported but unused while the service worker is commented out) — remove the import or re-enable the component when touching that file.

## Backend dependency

- All requests go to the relative `/api/v1` (`API_BASE_PATH` in `shared/config/constants.ts`). In production the frontend and the API share one host (Caddy routes `/api/v1/*` to the backend container), so requests are same-origin and CORS is not involved.
- Local dev is on `localhost:3000`, a different origin. Put `API_ORIGIN` into `.env.local` (see `.env.example`) and `next.config.ts` rewrites `/api/v1/:path*` to it; without the variable the API is unreachable in dev. `API_ORIGIN` is server-only — never rename it to `NEXT_PUBLIC_*`.
- Auth relies on an httpOnly `refresh_token` cookie that the backend scopes to `Path=/api/v1/auth` with `SameSite=Strict`. The browser sends it only to `/api/v1/auth/*`, never to `/fridge`, so a session check is a `POST /auth/refresh` — you cannot read or verify that cookie from a page.
- Endpoints used: `/auth/sign-up`, `/auth/sign-in`, `/auth/refresh`, `/auth/logout`, `/auth/yandex/sign-in`, `/auth/yandex/callback`. Errors are `application/problem+json` with `{ code, message }`, surfaced as `ApiError`.
- OAuth is a real browser navigation (`window.location.assign`) to `/api/v1/auth/yandex/sign-in`; the backend redirects back to `frontend_url` + `/fridge`.
- Without a reachable backend, pages render but auth resolves to `unauthenticated` (mount-time refresh fails).

## Architecture

- `app/` is routes only; pages are thin wrappers around feature components. Route groups do not affect URLs: `app/(auth)/login`, `app/(auth)/register`, `app/(app)/fridge` → `/login`, `/register`, `/fridge`.
- `features/<domain>/{api,model,ui}` — auth is the only feature so far. Cross-feature code lives in `shared/{api,config,ui}`.
- Import alias `@/*` maps to the repo root (`@/shared/api/http-client`), not `src/`.
- `app/providers.tsx` wraps the tree in `AuthProvider`; register new global providers there.
- Auth state is an access token held **in memory** plus the refresh cookie. `app/(app)/layout.tsx` always renders `{children}` — a layout that renders a different tree drops its page segment and Next cannot validate instant navigation. Protected pages guard themselves: `useAuthGuard()` (`features/auth/model/use-auth-guard.ts`) redirects to `/login` when `status === "unauthenticated"` and returns `false` until the session is confirmed, in which case the page renders `<SessionCheck />` ("Проверяем сессию…"). Auth pages redirect to `/fridge` once authenticated. There is no server-side middleware/proxy — the refresh cookie's `Path` keeps it away from `/fridge`.
- Sessions survive being offline: `features/auth/model/session-storage.ts` keeps a `sf.session.v1` marker in localStorage (userId/email decoded from the access token). Any real answer from `/auth/refresh` (400/401/403 — the backend returns 400 when the cookie is missing) ends the session; a network error or 5xx keeps the local session and sets `isOffline`, so the guard does not bounce the user to `/login`. A logout that could not reach the server leaves `sf.logout-pending.v1` and is replayed on the next launch; otherwise the still-valid cookie would silently sign the user back in.
- Offline means "no token yet": after a reload without network `accessToken` is `null` until refresh succeeds. Screens must read local data (Dexie) instead of calling the API; `requestJsonWithAuthRetry` throws the original error when refresh cannot reach the server.

## Styling

- Auth UI uses CSS Modules: shared classes in `features/auth/ui/auth.module.css`, form-specific classes in `login-form.module.css` / `register-form.module.css`, button classes in `shared/ui/button/button.module.css`. Do not add Tailwind utility classes or inline style objects.
- Colors and dimensions are CSS custom properties in `app/globals.css` (`--background`, `--foreground`, `--muted`, `--border`, `--primary`, `--danger`, `--surface`, `--disabled`, `--disabled-text`, `--yandex`, `--logo-background`). Mobile cards use `max-width: 432px`.
- Tailwind is **not** part of this project — do not add it back. `app/globals.css` contains only the design tokens and a small CSS reset. `next.config.ts` enables `cacheComponents` + `partialPrefetching`; check `node_modules/next/dist/docs/01-app/` before changing config, caching, or data-fetching behavior.

## API client conventions

- Public calls use `requestJson`; authenticated calls use `requestJsonWithAuthRetry` with `getAccessToken`/`refreshSession` from `useAuth` — it retries once after a 401 refresh.
- `AuthProvider` stores `expiresIn` from the token response and refreshes one minute before expiry, plus on `visibilitychange` if the token is about to expire. Concurrent refreshes are de-duplicated via `refreshPromiseRef`.
- The "Войти с Яндекс ID" button is a plain `<a href>` (`<Button href>`) to `/api/v1/auth/yandex/sign-in`, not an API call: the backend sets `oauth_state` and redirects to Yandex, so it has to be a top-level navigation from the same origin. Its text and logo must follow Yandex's button guidelines — don't restyle or reword it, and use `YandexMark` instead of a letter "Я".
- Forms use react-hook-form + Zod (`credentialsSchema`); map API failures to Russian messages in `features/auth/model/auth-errors.ts` rather than showing raw errors.

## PWA gotcha

- `app/register-sw.tsx` registers `public/sw.js` on every page and `app/manifest.ts` provides the manifest. The SW caches `/_next/static/*` and images, and skips `/api/*`. The component is currently commented out in `app/layout.tsx`, so no service worker is registered.
- Bump `CACHE_NAME` in `public/sw.js` when cached assets change. A stale SW can mask dev changes — unregister it or clear site data if JS/CSS looks outdated.

## Git / CI

- PRs target `main`. `.github/workflows/commit-check.yml` only validates commit message, branch, and PR title — it does **not** run build, lint, typecheck, or tests, so run them locally.
- Follow the existing Conventional Commits style (`feat: ...`).
