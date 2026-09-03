# Task Management Dashboard

A task management dashboard built with Angular 20 for the Senior Front End (Angular) assignment. It implements the Figma design with a kanban board, summary statistics, analytics charts, a recent activity feed, a team directory, and full create, edit, and delete flows against a JSON Server mock API.

- **Stack**: Angular 20 (standalone, signals, zoneless), Angular Material, Tailwind CSS 4, Chart.js, JSON Server
- **Quality gates**: ESLint, Prettier, Husky pre-commit, Karma + Jasmine with coverage above 90%

## Contents

1. [Getting started](#getting-started)
2. [Scripts](#scripts)
3. [Environment configuration](#environment-configuration)
4. [Architecture](#architecture)
5. [State management](#state-management)
6. [Data layer](#data-layer)
7. [Forms](#forms)
8. [Design system](#design-system)
9. [Testing strategy](#testing-strategy)
10. [Performance](#performance)
11. [Accessibility](#accessibility)
12. [Decisions and trade-offs](#decisions-and-trade-offs)
13. [Known limitations and future work](#known-limitations-and-future-work)

## Getting started

Requirements: Node.js 22 and npm 10.

```bash
npm install
npm run generate:data   # writes mock-api/db.json with dates relative to today
npm run mock:api        # JSON Server on http://localhost:3000
npm start               # Angular dev server on http://localhost:4200
```

Run the mock API and the dev server in two terminals. The app redirects `/` to `/dashboard`.

## Scripts

| Script                  | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `npm start`             | Dev server with live reload on port 4200                           |
| `npm run mock:api`      | JSON Server serving `mock-api/db.json` on port 3000                |
| `npm run generate:data` | Regenerates `mock-api/db.json` with fresh relative dates           |
| `npm run build`         | Production build to `dist/task-management-dashboard`               |
| `npm test`              | Karma in watch mode                                                |
| `npm run test:ci`       | Karma once, headless Chrome, with a coverage report in `coverage/` |
| `npm run lint`          | ESLint over TypeScript and templates                               |
| `npm run format`        | Prettier over the repository (`format:check` only reports)         |

Husky runs `lint-staged` on every commit: ESLint with autofix and Prettier on staged TypeScript, HTML, SCSS, JSON, and Markdown files.

## Environment configuration

| File                                          | `apiUrl`                | Used by                  |
| --------------------------------------------- | ----------------------- | ------------------------ |
| `src/environments/environment.development.ts` | `http://localhost:3000` | `ng serve` and `ng test` |
| `src/environments/environment.ts`             | `/api`                  | `ng build` (production)  |

The production build expects the API under the same origin at `/api`. Put a reverse proxy in front of the static files that forwards `/api/*` to the backend, or change `apiUrl` before building.

## Architecture

```
src/app
├── core/                      Cross-cutting, feature-agnostic code
│   ├── auth/                  Current user (fixed, there is no login)
│   ├── http/                  Cache service, caching and retry interceptors
│   ├── layout/main-layout     Sidebar, header search, routed outlet
│   └── ui/                    Icon component, confirm dialog
├── features/
│   ├── dashboard/             Stats cards, charts, activity feed, kanban board
│   ├── tasks/                 Task domain: models, store, API, card, filters, form dialog
│   └── team/                  Users directory and Team page
└── app.routes.ts              Lazy feature routes under the layout shell
```

Each feature follows the same internal layout:

- `data-access/` — HTTP resources and the signal store. The only place that talks to the API.
- `models/` — TypeScript types shared by the feature.
- `pages/` — routed, smart components. They inject stores and services and pass plain data down.
- `ui/` — presentational, dumb components. Inputs and outputs only, no injection of application state.
- `utils/`, `validators/` — pure functions with their own specs.
- `testing/` — fixtures shared by specs, kept out of production code.

**Smart vs presentational.** `DashboardPage`, `TasksPage`, and `TeamPage` are the smart components. `TaskCard`, `TaskFilters`, `StatCard`, `DistributionChart`, `ActivityFeed`, and `ConfirmDialog` are presentational and can be rendered in a test with `setInput` alone.

**Routing.** Every feature is lazy loaded with `loadChildren`, so the initial bundle contains the shell and the dashboard route loads its own chunk. Chart.js and the task form dialog are loaded with dynamic `import()` on first use, which keeps them out of the shell as well.

**Dependency injection.** Services are `providedIn: 'root'` and use `inject()`. Tunables such as the cache time-to-live and the retry base delay are `InjectionToken`s with defaults, which lets tests override them without mocking.

## State management

State lives in signal-based stores rather than a global NgRx store. The domain is small and signals give fine-grained reactivity with much less ceremony.

`TaskStore` is the centre of the task feature:

- Source of truth is an `httpResource` in `TaskApi`. The store exposes `tasks`, `isLoading`, and `error` from it.
- Filters (`searchTerm`, `statusFilter`, `priorityFilter`, `assigneeFilter`) are writable signals. `filteredTasks`, `tasksByStatus`, and `stats` are `computed` and update automatically.
- Mutations (`createTask`, `updateTask`, `deleteTask`) resolve the assignee, manage timestamps and `completedAt`, call the API, record an activity entry, and reload the list. An `isSaving` flag covers the in-flight period.

Components never mutate signals directly; they call store methods. This keeps the write paths in one place and easy to test.

## Data layer

**Resources.** Every read uses `httpResource`, which gives loading and error state as signals and reloads on demand. Collections: `/tasks`, `/users`, `/statistics`, `/activities`.

**Caching.** `HttpCacheService` keeps successful GET responses in memory for 60 seconds. The `cachingInterceptor` serves repeats from it and invalidates the affected collection whenever a POST, PUT, PATCH, or DELETE touches it, so a saved task is followed by a fresh list. Manual refreshes drop the cache entry first.

**Retry.** The `retryInterceptor` retries failed GETs twice with exponential backoff (400 ms then 800 ms), only for network errors and 5xx responses. Client errors surface immediately and writes are never retried because they may not be idempotent. Interceptors are ordered so a cache hit never reaches retry or the network.

**Error handling.** Pages render an error state with a retry action when a resource fails. Mutations report success or failure in a snackbar, and a failed activity log never fails the change it describes.

**Statistics.** The `/statistics` endpoint supplies each card's title, icon, colour, and trend text. The numbers shown are the live counts from the store, so the cards always agree with the board. If the endpoint fails the cards fall back to built-in definitions.

## Forms

The task form is a reactive form with a custom `noWhitespaceValidator`, a dynamic `FormArray` for tags with add and remove, and errors shown on touch. Submitting a valid form trims values and closes the dialog with a typed `TaskFormValue`. The same dialog serves create and edit.

`TaskDialogService` owns every dialog flow: it opens the form, saves the result through the store, asks for confirmation before deleting, and reports outcomes in a snackbar. Pages call one method and stay free of orchestration.

## Design system

Design tokens from the Figma file live in `src/styles.scss` inside Tailwind's `@theme`:

- `brand-50` to `brand-800` with `brand-600` as the main colour `#1976D2`, also applied to Material's primary
- `grey-13` (`#212121`) for primary text, `grey-88` (`#E0E0E0`) for borders and dividers, `slate-500` redefined to `#757575` for secondary text
- `black-5` for neutral hover overlays, `brand-700` for hovers on primary surfaces
- `trend-positive`, `trend-negative`, and the Low priority pill colours

Content glyphs in the design are emoji, rendered as text. Control icons are inline SVG paths in the `Icon` component. Two glyphs that Figma exported as bitmaps, the logo clipboard and the notification bell, are shipped as PNGs in `public/icons`.

## Testing strategy

Karma and Jasmine with headless Chrome, running zoneless. Coverage on the last run:

| Metric     | Coverage |
| ---------- | -------- |
| Statements | 93.51%   |
| Branches   | 87.39%   |
| Functions  | 89.6%    |
| Lines      | 92.96%   |

What is tested and how:

- **Pure logic** (`task-status.utils`, `relative-time`, `http-cache.service`) with plain unit tests.
- **Stores and APIs** with `HttpTestingController`. Requests are asserted on method, URL, and body, then flushed. No service is mocked; the HTTP boundary is the only fake.
- **Interceptors** through a real `HttpClient` wired with `withInterceptors`, asserting on which requests reach the backend.
- **Presentational components** by rendering them with `setInput` and asserting on DOM text and attributes.
- **Smart components and flows** as integration tests: the dashboard is rendered with real store, dialog service, and Material dialogs, and specs click through menus and confirm dialogs.

Fixtures live in `testing/` folders. Zoneless testing has two conventions worth knowing: every spec provides `provideZonelessChangeDetection()`, and specs wait for a macrotask plus change detection rather than `whenStable()` when an unrelated resource is still pending.

## Performance

- `ChangeDetectionStrategy.OnPush` on every component and zoneless change detection for the app.
- `track` expressions on every `@for` loop.
- Lazy routes per feature, plus dynamic imports for Chart.js and the task form dialog. Initial bundle is about 486 kB raw, under the 500 kB budget.
- GET caching with invalidation, so navigating between pages does not refetch unchanged collections.
- Promises with `firstValueFrom` for one-shot HTTP calls and resources for streams, so there are no long-lived subscriptions to leak. The one Observable subscription, on dialog close, completes on its own.
- Optimistic insertion for the activity feed avoids a refetch after every change.

## Accessibility

- Semantic landmarks: `nav`, `header`, `main`, `section` with labels, and a heading hierarchy per page.
- Status tabs use `role="tablist"` with `aria-selected`. Column counts and card menus have text or `aria-label`s.
- Decorative glyphs are `aria-hidden` or have empty `alt`. Charts pair the canvas with a visible breakdown list.
- Visible focus rings on all interactive controls, keyboard-operable Material menus and dialogs, and `prefers-reduced-motion` respected globally.
- Loading regions are marked `aria-busy`; errors use `role="alert"`.

## Decisions and trade-offs

- **Signals over NgRx.** The state is a single list plus filters. A signal store is simpler to read, test, and extend at this size, and still separates reads, derived state, and writes.
- **Live counts on statistics cards.** The mock endpoint's snapshot values (156 tasks) would contradict a board of 17. The endpoint drives presentation and trend text; the store drives numbers.
- **Karma over Jest.** Karma is the CLI default for this Angular version and runs in real Chrome, which matters for Material overlays and canvas. Coverage is produced by the standard builder.
- **Tailwind alongside Material.** Material provides form fields, dialogs, menus, and snackbars with accessibility built in. Tailwind handles layout and the design tokens from Figma.
- **Chart.js directly.** A thin component wraps Chart.js rather than adding a wrapper library, keeping the dependency surface small and the import lazy.

## Known limitations and future work

- No authentication. The signed-in user is a constant, and activity entries are attributed to it.
- Production builds expect the API at `/api`; a reverse proxy or a build-time `apiUrl` change is needed to deploy.
- The mock `/activities` collection starts empty. Entries appear as tasks change.
- Sub-routes for Calendar, Analytics, and Settings exist in the design but are shown as disabled navigation items.
- Card status can be changed by dragging a card between board columns. Reordering within a column is visual only; task ordering is not persisted.
- No CI pipeline, Docker image, or i18n yet. A GitHub Actions workflow running lint, tests, and build is the natural next step.
- Responsive behaviour uses Tailwind breakpoints but has only been verified at desktop widths.
