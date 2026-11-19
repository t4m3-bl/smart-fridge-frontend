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
- `npm run typecheck` — `tsc --noEmit`; the only typecheck.
- `npm run build` — production build (`npm start` to serve it).

There is **no test framework or test script** installed. Do not invent test commands. Run typecheck + lint before finishing. Lint is clean apart from one warning in `app/layout.tsx` (`RegisterSW` is imported but unused while the service worker is commented out) — remove the import or re-enable the component when touching that file.

## Backend dependency

- All requests go to the relative `/api/v1` (`API_BASE_PATH` in `shared/config/constants.ts`). In production the frontend and the API share one host (Caddy routes `/api/v1/*` to the backend container), so requests are same-origin and CORS is not involved.
- Local dev is on `localhost:3000`, a different origin. Put `API_ORIGIN` into `.env.local` (see `.env.example`) and `next.config.ts` rewrites `/api/v1/:path*` to it; without the variable the API is unreachable in dev. `API_ORIGIN` is server-only — never rename it to `NEXT_PUBLIC_*`.
- Auth relies on an httpOnly `refresh_token` cookie that the backend scopes to `Path=/api/v1/auth` with `SameSite=Strict`. The browser sends it only to `/api/v1/auth/*`, never to `/fridge`, so a session check is a `POST /auth/refresh` — you cannot read or verify that cookie from a page.
- Endpoints used: `/auth/sign-up`, `/auth/sign-in`, `/auth/refresh`, `/auth/logout`, `/auth/yandex/sign-in`, `/auth/yandex/callback`. Errors are `application/problem+json` with `{ code, message }`, surfaced as `ApiError`.
- Products contract (`features/fridge/api/fridge-api.ts`, spec at `GET /api/v1/openapi.json`): `GET /products` returns the full state (`{ items: ProductDto[] }`, no pagination) and `POST /products/batch` applies up to 100 `create` / `update` / `delete` operations, each with a client `operationId`; `update`/`delete` carry `expectedVersion`, create does not. Results come back per operation (`version_conflict` / `not_found` / `already_exists`); success and conflict both carry `product` — the sync takes `version` and the fresh presigned `imageUrl` straight from it, so no follow-up `GET` is needed. There is no `PUT /product/{id}`. JSON is **camelCase**, dates are `format: date`, `version` is readOnly, `id` is generated client-side (`crypto.randomUUID()`), and `ProductFields` requires `name`, `categoryId`, `expiresAt`, `imageKey` (nullable). Update replaces all writable fields, so empty values are omitted rather than sent as null.
- Categories are static: the backend list is seeded and never changes, so the frontend does not call `GET /categories`. `features/fridge/model/categories.ts` keeps Russian labels plus the server ids (`Dairy` = 1 … `Other` = 6) and maps `LocalCategoryId` ↔ numeric id locally. A product without a category is sent as `Other`.
- Images: `POST /products/images/batch` takes up to 20 `{ operationId, contentType }` and returns `{ uploads }` with `uploadUrl`, `objectId`, `requiredHeaders`, and the ready `imageKey` — there is no separate `/complete` call on this backend version. The client PUTs the bytes to `uploadUrl` with exactly `requiredHeaders` (200 = ok, anything else shows «Ошибка загрузки фото»), then sends `imageKey` inside the product batch. `features/fridge/model/product-images.ts` compresses a shot to webp (max side 1280, quality 0.82) and falls back to the browser's actual blob type; `imageUrl` is a presigned GET valid ~15 minutes, stored on the Dexie row and refreshed by pull/batch responses.
- OAuth is a real browser navigation (`window.location.assign`) to `/api/v1/auth/yandex/sign-in`; the backend redirects back to `frontend_url` + `/fridge`.
- Without a reachable backend, pages render but auth resolves to `unauthenticated` (mount-time refresh fails).

## Architecture

- `app/` is routes only; pages are thin wrappers around feature components. Route groups do not affect URLs: `app/(auth)/login`, `app/(auth)/register`, `app/(app)/fridge`, `app/(app)/fridge/[id]` → `/login`, `/register`, `/fridge`, `/fridge/{id}`.
- `features/<domain>/{api,model,ui}` — auth and fridge each have an API; cross-feature code lives in `shared/{api,config,lib,ui}` (`shared/lib/format` holds the Russian pluralisation helpers).
- Import alias `@/*` maps to the repo root (`@/shared/api/http-client`), not `src/`.
- `app/providers.tsx` wraps the tree in `AuthProvider`; register new global providers there.
- Auth state is an access token held **in memory** plus the refresh cookie. `app/(app)/layout.tsx` always renders `{children}` — a layout that renders a different tree drops its page segment and Next cannot validate instant navigation. Protected pages guard themselves: `useAuthGuard()` (`features/auth/model/use-auth-guard.ts`) redirects to `/login` when `status === "unauthenticated"` and returns `false` until the session is confirmed, in which case the page renders `<SessionCheck />` ("Проверяем сессию…"). Auth pages redirect to `/fridge` once authenticated. There is no server-side middleware/proxy — the refresh cookie's `Path` keeps it away from `/fridge`.
- Sessions survive being offline: `features/auth/model/session-storage.ts` keeps a `sf.session.v1` marker in localStorage (userId/email decoded from the access token). Any real answer from `/auth/refresh` (400/401/403 — the backend returns 400 when the cookie is missing) ends the session; a network error or 5xx keeps the local session and sets `isOffline`, so the guard does not bounce the user to `/login`. A logout that could not reach the server leaves `sf.logout-pending.v1` and is replayed on the next launch; otherwise the still-valid cookie would silently sign the user back in.
- Offline means "no token yet": after a reload without network `accessToken` is `null` until refresh succeeds. Screens must read local data (Dexie) instead of calling the API; `requestJsonWithAuthRetry` throws the original error when refresh cannot reach the server.

## Fridge data layer (local-first)

- The source of truth is Dexie (`smart-fridge` DB, `products` / `outbox` / `photos` tables, `features/fridge/model/db.ts`); the server catches up. Screens read it through `useProducts(userId)` (`useLiveQuery`), so a mutation re-renders the list without refetching. `undefined` means "query not resolved yet", `[]` means "fridge is empty".
- The schema is declared once, as `version(1)`. Any further change to tables or indexes must be a new `version(2)` with `.upgrade()`: editing the existing version does nothing for databases that are already created (there is no `onupgradeneeded` without a version bump).
- Every row carries `userId` (decoded from the access token, `useAuth().userId`) so two accounts on one device do not see each other's shelf. Rows are filtered by `userId` everywhere.
- Dates in Dexie are `yyyy-mm-dd` (`format: date`), matching the backend; `dates.ts` owns parsing (`parseDateValue` treats it as local midnight) and `toDateOnly` normalises legacy rows.
- Sync markers live in the `outbox` table, not on the product: each row is one pending operation (`create` / `update` / `delete`) with a client `operationId`, a full `fields` snapshot, `expectedVersion`, `status` (`pending` | `conflict`), the server `conflict` snapshot, and `rev` to detect edits made while a batch is in flight. One row per product: repeated offline edits collapse into it, so the fridge never sends a pile of stale updates. `version` on the product is the last server version (`0` = never created).
- All mutations go through `features/fridge/model/products-repository.ts`; it writes the product and the outbox row in one Dexie transaction, then calls `requestSync()`. Do not write to `db.products` or `db.outbox` directly from components.
- Deletion is soft: `deletedAt` hides the row immediately, the physical row is removed after the server confirms the delete; products with `version === 0` are dropped locally unless their create may already be in flight (then a `delete` is queued).
- `features/fridge/model/sync-engine.ts` pushes the outbox first. Push sends up to 100 operations per `POST /products/batch` (several rounds until empty); an online mutation is sent immediately, offline ones are batched on `online`. A successful create/update bumps the local `version` optimistically (`1`, or `expectedVersion + 1`), so an ordinary edit costs a single `POST` — no follow-up `GET`. Pull (full `GET /products`) runs at sign-in, on `online`/`visibilitychange`, and when the server answers `already_exists`: rows without an outbox operation are replaced by the server, rows with one keep local fields but take the server `version`, and rows missing from the response are deleted unless they still have a pending operation.
- Reconcile after pull: a `create` that reached the server becomes an `update`; an `update` for a product deleted elsewhere becomes a new `create`; a delete for an absent product is dropped. `already_exists` means the create landed but the response was lost — it is converted to an update on the next pass.
- Conflicts do not auto-rebase: `version_conflict` stores the server product in the outbox row and shows `ui/conflict-sheet`, where the user compares fields and chooses «Оставить моё» (resubmit against the server version) or «Взять серверное» (drop the local edit). On `not_found` the sheet offers «Восстановить» or «Удалить у меня»; a delete conflict offers «Удалить всё равно» / «Оставить серверный». A banner above the list opens the sheet.
- Triggers: immediate flush after a mutation, `online`, `visibilitychange`, and once at sign-in (always, otherwise a fresh device with an empty Dexie would never pull). No fixed interval. Failures retry with exponential backoff 2 s → ×2 up to 5 min plus ±25 % jitter; 400/401/403/422 are not retried. Pending operations changed during a request are re-sent after 0.5 s. `useSyncStatus()` exposes `{ status, pending, conflicts, lastSyncedAt }` for the chip in the screen header.
- Statuses (`fresh` / `expiring` / `ending` / `expired`) are computed from `expiresAt` in `features/fridge/model/product-status.ts`; an opened package shortens the deadline to `openedAt + shelfLifeAfterOpening`. Never store status strings.
- Screens: `ui/fridge-screen` (`/fridge`) owns search, status chips and the filters bottom sheet (`ui/filter-sheet`, state in `model/filters.ts`; local, not persisted). A card is a link to `/fridge/[id]` (`ui/product-details`), which reads the same `useProducts` list — no extra request. `useParams` there sits inside `<Suspense>` because `cacheComponents` suspends on dynamic params not covered by `generateStaticParams`. Cards and the details header render the shot through `ui/product-photo`: cache first, then one download by the presigned `imageUrl` (the link itself is the fallback), then the placeholder. Deletion uses `removeProduct` + a centred `ui/confirm-dialog`, then returns to `/fridge`.
- Product create and edit share `ui/product-form` (RHF + Zod, `product-schema.ts`): create is opened by `ui/add-product-button` (choice bottom sheet → full-screen `ui/full-screen-sheet`), edit passes `product` and writes through `updateProduct`. Category (`model/categories.ts`) is edited in the «Дополнительно» row.
- Photo flow: `ui/add-product-button` → `ui/photo-capture` (full-screen dark camera, `getUserMedia` with `facingMode: environment`, no torch): шаг 1 — лицо упаковки, шаг 2 — место с датой (рамка 320×170), затем экран «Читаем упаковку…». The same component has a `mode="single"` variant with one shutter and a close button: the camera button in `ui/product-form` opens it (create and edit) and the captured frame is uploaded immediately. The button is disabled without network (`useOnlineStatus`), and its thumbnail shows the existing `imageUrl` or the local object URL. Кадры живут как webp-блобы, превью — `URL.createObjectURL`; распознавание мокается в `model/recognition-mock.ts`, его результат открывает ту же форму с `initialValues` — тогда шит называется «Проверьте данные», а сверху формы висит info-плашка. Без камеры (или без разрешения) экран показывает заглушку, снимок становится `null`; гашение потока — при размонтировании и на экране распознавания.
- Photo bytes are cached locally in the `photos` table (`imageKey` = the product's `imageKey`, plus `userId`, `blob`, `cachedAt`, `size`), so a shot opens with no network and after the presigned link expires. `model/photo-cache.ts` owns the lifecycle: `uploadProductPhoto` caches the webp it just PUT; `ui/product-photo` reads the cache first and, on a miss, downloads the bytes once by the presigned `imageUrl` and renders the blob — the link itself is only a fallback when the download fails (no network, or the bucket does not answer CORS on GET), so a previously failed image recovers as soon as the download succeeds; `product-form` previews the cached shot in edit. `dropPhotoIfUnused` removes bytes after a physical delete or an `imageKey` change only when no row references the key; soft-deleted products keep their photo so «Восстановить» still shows it. `collectOrphanPhotos` runs at sign-in and after each pull and skips blobs younger than 15 minutes, so a photo cached by an open form is not collected before the product is saved; quota/CORS failures never block saving a product. The batch contract is untouched: the server still only sees `imageKey`.

## Styling

- Auth UI uses CSS Modules: shared classes in `features/auth/ui/auth.module.css`, form-specific classes in `login-form.module.css` / `register-form.module.css`, button classes in `shared/ui/button/button.module.css`. Do not add Tailwind utility classes or inline style objects.
- Colors and dimensions are CSS custom properties in `app/globals.css` (`--background`, `--foreground`, `--muted`, `--border`, `--primary`, `--accent-tint`, `--accent-pressed`, `--success`, `--warning`, `--warning-strong`, `--danger`, `--surface`, `--disabled`, `--disabled-text`, `--yandex`, `--logo-background`, а также `--camera-*` для тёмного экрана съёмки). Mobile screens use `max-width: 432px`.
- Icons are inline Lucide paths in `shared/ui/icon` (`<Icon name="…" size={…} />`, stroke 1.75, `currentColor`) — no icon package is installed. Add a name there rather than dropping a one-off `<svg>` into a feature; the source of truth is the Icons frame on the Components page in Planar.
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

- PRs target `main`. `.github/workflows/ci.yml` runs lint, typecheck and build on PRs and on pushes to `main`; `.github/workflows/commit-check.yml` validates commit message, branch, and PR title. Neither installs a test suite — there is none.
- Follow the existing Conventional Commits style (`feat: ...`).
