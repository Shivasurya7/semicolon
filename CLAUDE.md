# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

**Semicolan** is a subscription coding-practice platform (problems judged by Judge0, mock tests, leaderboard, DevOps/Data Science theory and quiz hubs, HLD/LLD design modules, company pages, projects, community, blog, and an admin panel for authoring all of it). Right now the repository holds **only specifications**: no application code, build files or tests exist yet.

- `docs/`: the specs. They are binding.
- `system_prompt.md`: the project's master directives for AI agents. The parts that matter are summarized below.
- `UI Ref/`: reference screenshots (PNGs) of another product. Use them for layout only; `docs/UI_UX_Brief.md` §0 says what ships and what is stripped. (`UI Ref/info:-` is also a PNG, despite its name.)

## The golden rule: docs first

Read the relevant doc before you write or change code, and do not depart from it without the user's explicit permission. If a request conflicts with the API contract or the schema, say so before writing any code.

| Concern | Source of truth |
|---|---|
| Tables, columns, constraints, triggers, query patterns | `docs/Backend_Schema.md` |
| Endpoints, payloads, error codes, pagination, rate limits | `docs/API_Contract.md` |
| Build order, phases, acceptance criteria, config keys | `docs/Implementation_Plan.md` |
| Backend/frontend architecture, execution flow, security | `docs/TRD.md` |
| Mock vs real OAuth/payments, test users, safety rails | `docs/Dev_to_Prod_Strategy.md` |
| User journeys and edge cases | `docs/App_Flow.md` |
| Tokens, components, layouts, Monaco rules, a11y | `docs/UI_UX_Brief.md` |
| Requirement IDs (`ACC-1`, `MT-2`, …), scope, deferred features | `docs/PRD.md` §7–§8 |
| ER, system and class diagrams | `docs/Architecture_Diagrams.md` |
| Prompts for AI UI generators (presentational components only; the brief wins on conflict) | `docs/UI_Generation_Prompts.md` |
| Admin panel, content workflow (draft → review → publish), problem authoring, admin access control | `docs/Admin_Panel_Strategy.md` |
| Test harness, test commands, E2E stack, faking Judge0, rules for running tests | `docs/Agent_Testing_Environment.md` |
| Component inventory, motion classes, loading/empty/error states, Stitch design references and what to strip from them (the brief wins on conflict) | `docs/UI_Component_Spec.md`, `design-system/reference-images/` |

When asked to build a feature, first work out which phase of `Implementation_Plan.md` it belongs to. A milestone starts only after the previous one's acceptance criteria pass. Within a phase, the backend milestone is finished before its frontend milestone. No endpoint is built until it appears in `API_Contract.md`; if one is missing, propose the contract change and wait for approval.

**Where docs disagree**: `system_prompt.md` is older than the docs and is less precise in places. It describes Judge0 integration as "webhooks, poll or SSE", it lists Razorpay and Stripe as equals, and its interface names are only examples (`MySQLTestCaseStorageImpl`, `LeaderboardService`). Follow the TRD and the Implementation Plan instead: the database is the job queue and callbacks are only hints; Razorpay is primary and Stripe is optional; the TRD's interface names win.

## Tech stack (MVP, fixed)

- **Frontend**: React (Vite), Tailwind, `@monaco-editor/react`.
- **Backend**: Java 17+, Spring Boot 3, Spring Security with stateless JWT, layered Controller → Service → Repository. Flyway handles migrations; do not add Liquibase.
- **Database**: MySQL 8.4 (pinned) for everything, including Markdown and JSON content.
- **Execution**: Judge0, always async (`wait=false` plus a signed `callback_url` per job).
- **Payments**: Razorpay; Stripe is optional.
- **Do not introduce** Redis, Kafka, RabbitMQ, MongoDB or S3 in the MVP.

## Planned layout and commands

These come from Implementation_Plan 0.1 and 0.4 and Agent_Testing_Environment §8. They don't exist yet and get created in Phase 0.

- Monorepo: `backend/`, `frontend/`, `infra/`, `content/` (versioned content packs: problems, `hubs/`, `design/`, `companies/`, `projects/`), `scripts/`.
- `docker compose up --wait` starts MySQL 8.4 (UTC, utf8mb4, `log_bin_trust_function_creators=1`) and Mailpit. `--profile judge0` adds Judge0; without it, a fake executor is the default.
- Entry points are `make` targets: `make doctor`, `make test-unit`, `make test-it`, `make e2e` (compose stack + Playwright, fake executor), `make e2e-judge0` (Linux only), `make verify` (everything CI runs).
- One test: `./mvnw -pl backend test -Dtest='Class#method'` (unit), `./mvnw -pl backend verify -DskipUTs -Dit.test='SomeIT'` (integration), `npm --prefix frontend exec vitest run <file> -t "<name>"`, `(cd e2e && npx playwright test <file>:<line>)`.
- Integration tests use Testcontainers MySQL 8.4 (never H2), MockMvc and WireMock; scheduling is off in the `test` profile and tests drive jobs with `runOnce()` and move the `MutableClock`. E2E specs that change state sign in as ephemeral `e2e-…` users (`mock-login` with a `template`).
- `scripts/judge0-smoke.sh` is the Judge0 integration spike; its captured JSON is committed as test fixtures.
- Every new config key goes into `.env.example` and the configuration inventory in Implementation_Plan. The app must fail at startup, naming the key, when a required one is missing.

## Architecture: what you need several docs to see

**Dependency inversion at every external edge.** Define the interface before any implementation, using the TRD's names: `AuthService`, `TokenService`, `PaymentService`, `CodeExecutionClient`, `LeaderboardQueryService`, `RateLimiter`, `EmailSender`, `AnalyticsPublisher`. MVP implementations must be swappable later (S3, Redis, a message broker) without touching controllers.

**Mock the edge, never the core.** Phases 1–9 run on `MockAuthServiceImpl` and `MockPaymentServiceImpl`. Real Google/GitHub OAuth and Razorpay arrive only in Phase 10, as new adapters plus configuration.
- `TokenService`, `UserAccountService`, the JWT filter chain, entitlement checks, `PaymentEventProcessor` and reconciliation are real in every environment.
- Mocks carry `@DevOnly` (`@Profile({"dev","test"})`). Beans are selected by `semicolan.auth.mode` (`mock`|`oauth`), `semicolan.payments.provider` (`mock`|`razorpay`|`stripe`) and `semicolan.execution.client` (`fake`|`judge0`; the fake picks verdicts from `semicolan-fake:` comments in E2E).
- A startup guard refuses to boot under `staging`/`prod` if any mock is configured or present. Dev-only routes (`/api/auth/mock-login`, `/api/dev/**`, the SPA's `/dev/*`) return 404 outside dev/test. `VITE_ENABLE_DEV_TOOLS=false` tree-shakes them from the bundle.
- Mock parity: if a test passes with the mock but would need code outside the adapter to pass with the real provider, that is a defect.

**Test users.** `MockUserSeeder` seeds `free`, `premium-active`, `premium-expired`, `revoked` and `admin` with `Clock`-relative dates. `new-user` and `github-unverified` are never seeded. Tests sign in with `POST /api/auth/mock-login` and call `MockUserSeeder.reseed()` in setup (E2E: `POST /api/dev/mock-users/reseed`). Keys `e2e-…` with a `template` create ephemeral users, which is also how four-eyes tests get a second admin.

**Code execution** (TRD §3) never blocks a request thread:
1. `POST /api/submissions` writes a `submissions` row (with the problem's base limits copied onto it) plus one `submission_test_results` row per test case of the problem's **live test set**, all `PENDING`, and returns `202`.
2. A dispatcher claims rows (`FOR UPDATE SKIP LOCKED`, lease via `next_dispatch_at`; order: in-session, then SUBMIT, then RUN, then publish-gate `VALIDATE` jobs at priority 3 in their own budget) and sends Judge0 batches of at most 20.
3. Judge0 callbacks are authenticated **hints**. The controller re-reads the job from Judge0 and never trusts the callback body.
4. A reconciler (every 10 s) recovers lost or overdue jobs.
5. `JudgeResultApplier` is the **only** writer of verdicts. It is idempotent: it locks the parent row first, then does a conditional update on `status='PENDING' AND judge0_token=…`.
6. The client polls `GET /api/submissions/{id}`.

Unknown or ambiguous outcomes become a retry or `JUDGING_ERROR`, never `ACCEPTED`. Every job must include `expected_output`. Hidden test data is never returned by a user-facing endpoint or logged; only the admin API shows it, to admins.

**Content workflow** (Admin_Panel_Strategy.md): every content change is a revision (`content_revisions`, JSON document, optimistic `version`, one open revision per item) that goes draft → in review → approved → published. `ContentPublisher` is the **only** writer of live content tables; the admin panel, `scripts/content-import` and the dev seed all go through it. Problems publish only after the OPS-2 gate (`VALIDATE` attempts: reference solutions in all four languages plus a negative control) passed for the revision's current fingerprint, and a second admin who did not edit the revision approved it. Published test sets are frozen: a test fix publishes a new set (`problems.live_test_set`).

**Admin access**: the only admin marker is `users.role = 'ADMIN'`, carried as the JWT `role` claim. `/api/admin/**` also re-reads the role from the DB on every request. Roles change only via `scripts/set-user-role`, never through an endpoint.

**Lightweight CQRS**: command services (`SubmissionCommandService`, `CheckoutService`, `PaymentEventProcessor`, `CommunityCommandService`) are kept separate from query services (`ProblemQueryService`, `LeaderboardQueryService`, `HubQueryService`, …) over the same MySQL. The leaderboard reads only the `user_problem_solves` read model, which the finalizing transaction writes, through a 15–30 s in-process snapshot. Domain events are Spring after-commit events with idempotent subscribers.

**Entitlement** is computed on every gated request from the user row: `subscription_status='ACTIVE' AND subscription_expires_at > :now`. The plan never appears in the JWT, which carries only `sub`, `role` and registered claims. Premium content is stripped server-side. A mock-test session is authorized once, when it starts.

**Time (strict)**: everything is UTC. All temporal columns are `DATETIME(3)`. One injectable `Clock` (`Clock.tickMillis(ZoneOffset.UTC)`). Ad-hoc SQL uses `UTC_TIMESTAMP(3)`, never `NOW()`. Use half-open ranges on raw columns. Only the weekly leaderboard window and the heatmap convert to Asia/Kolkata. Tests move the `Clock` and never sleep. Mock-test `start_time` can't be back-dated (a trigger enforces it), so expiry is simulated by shortening `end_time`.

**Schema rules** (Backend_Schema §0):
- Never edit an applied Flyway migration; add a new one.
- History-bearing foreign keys are `ON DELETE RESTRICT`. Users are anonymized and content is archived, never hard-deleted.
- `ENUM` values are only ever appended.
- `JSON` columns hold only opaque documents that are never filtered on.
- Money is integer paise.
- Denormalized columns each have a single writer, listed in §0.4.

**Single backend instance** in the MVP, with recreate deploys. `@Scheduled` jobs (dispatcher, reconciler, mock-test closer, payment reconciliation, subscription sweeper, purges) need no distributed lock.

## UI rules that are easy to miss

- Semicolan's identity only: the `;` wordmark in the accent color. No reference logos, company logos, fabricated social proof or payment-brand marks.
- No raw hex values in components; use the tokens from UI_UX_Brief §1. Dark theme only in the MVP.
- Every status gets an icon and a label. Focus rings stay visible. Target WCAG 2.2 AA. Search opens with Ctrl/Cmd+K, not `/`.
- Monaco editor state (language, buffer) is separate from problem state. Drafts are debounce-saved to local storage, keyed by user, problem and language, and cleared on logout.

## Code standard

Write complete, working files. Do not leave `// TODO` stubs unless the user asks for scaffolding.
