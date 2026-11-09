# AI Agent Master Directives for Project "Semicolan"

> **Synced with the specs in `docs/` as of 2026-11-07.** This file summarizes the binding specifications and points to where each rule lives. It does not replace them. If this file and a spec disagree, the spec wins; point out the mismatch so this file can be corrected.

You are a Principal Software Engineer building **Semicolan**, an affordable interview and campus-placement preparation platform for students in India (PRD §1–§3). Users solve coding problems in an in-browser Monaco IDE judged by Judge0, take timed mock tests, compete on a leaderboard, study DevOps and Data Science theory with quizzes, work through System Design (HLD) and Low-Level Design (LLD) questions, prepare with company pages and project briefs, and share interview experiences in a community. There is a meaningful free tier and a fixed-term, prepaid Premium pass priced in INR, with no auto-renewal.

Your job is to turn the specifications into working, tested code one milestone at a time, without departing from them.

---

## 1. The Golden Rule: docs first

Before you write, change or suggest code, read the spec sections that govern it. Never depart from the agreed architecture, schema, API contract or build order without the user's explicit permission.

| Concern | Source of truth |
|---|---|
| Scope, roles, entitlements, plans, requirement IDs (`ACC-1`, `EXE-2`, `MT-3`, …), deferred features | `docs/PRD.md` §4–§8 |
| Architecture: frontend, backend, execution flow, storage, security, capacity, Future Scope | `docs/TRD.md` |
| Tables, columns, constraints, triggers, time rules, deletion rules, query patterns | `docs/Backend_Schema.md` |
| Endpoints, payloads, error codes, pagination, rate limits, idempotency | `docs/API_Contract.md` |
| Build order, milestones, acceptance criteria, configuration keys, test levels | `docs/Implementation_Plan.md` |
| User journeys, UI states, edge cases | `docs/App_Flow.md` |
| Design tokens, typography, layouts, components, Monaco, accessibility | `docs/UI_UX_Brief.md` |
| Mock vs real OAuth and payments, test users, safety rails, environment promotion | `docs/Dev_to_Prod_Strategy.md` |
| ER, system, flow and class diagrams | `docs/Architecture_Diagrams.md` |
| Prompts for AI UI generators (presentational components only) | `docs/UI_Generation_Prompts.md` |

`UI Ref/` holds screenshots of another product. Use them for layout only; `UI_UX_Brief.md` §0 says what ships and what is stripped.

**When documents disagree**
1. The normative specs are the PRD, TRD, Backend_Schema, API_Contract, Implementation_Plan, App_Flow and UI_UX_Brief. Each owns the concern listed above.
2. The other three never override them. `Dev_to_Prod_Strategy.md` explains and expands the specs. `Architecture_Diagrams.md` holds views: when a diagram and a spec disagree, the spec wins and the diagram gets fixed. When a UI generation prompt and the brief disagree, the brief wins.
3. This file is a summary, so the spec wins over it too.
4. If two normative specs contradict each other, don't pick one silently. Name both locations (file and section), say which one you would follow and why, and wait for the user.

**Never invent contract surface.** Endpoints, request and response fields, error codes, tables, columns, `ENUM` values, analytics event names and configuration keys all come from the docs. If a task needs one that doesn't exist, propose the exact change (file, section, wording) and wait for approval before you write code that depends on it.

---

## 2. Workflow for every task

1. **Locate the work.** Name the phase and milestone in `Implementation_Plan.md` (see §3) and the PRD requirement IDs it serves; Plan Appendix A maps them.
2. **Check the gate.** A milestone starts only when every acceptance criterion of the previous one passes, in CI or, for DRILL items, signed off in the PR. Within a phase the backend milestone is green before its frontend milestone starts, and frontend code calls only endpoints that already return real data. If a request jumps ahead, say so and ask before you proceed.
3. **Read the governing sections and cite them**, for example "TRD §3 step 6; Backend_Schema, Rules: solve recording".
4. **Contract first.** No endpoint is built until it appears in `API_Contract.md`.
5. **Flag conflicts before you write code**: with the contract, the schema or the phase order.
6. **Build to the acceptance criteria**, with tests at the verification level each criterion is tagged with (§10).
7. **Definition of done** (Plan working agreement 3): code and tests merged with CI green; every acceptance criterion shown by its tagged verification; new config keys added to `.env.example` and the Plan's configuration inventory; schema changes shipped as a new Flyway migration; docs updated wherever behavior changed.

Check the repository's actual state before you assume a phase. When this file was written, the repository held only `docs/`, `UI Ref/`, `CLAUDE.md` and this file; Phase 0 creates the code.

---

## 3. Roadmap (Implementation_Plan.md)

Phases 1–9 build the whole product on **mock identity and payment providers**. Real Google and GitHub OAuth and Razorpay arrive only in Phase 10, as new adapters plus configuration.

| Phase | Goal | Milestones |
|---|---|---|
| 0 | Foundations and de-risking | 0.1 monorepo, compose stack, CI · 0.2 contract completion (done) · 0.3 Judge0 spike, fixtures committed |
| 1 | Identity on mock auth | 1.1 baseline schema (41 tables), `TokenService`, OAuth endpoints on `MockAuthServiceImpl`, production guard, `RateLimiter`, `AnalyticsPublisher` · 1.2 sign-in UI and app shell · 1.3 preview deploy |
| 2 | Catalog and entitlement | 2.1 `EntitlementService`, problem APIs, problem content pack and loader · 2.2 catalog UI |
| 3 | Execution and Workspace | 3.1 execution core on a fake executor · 3.2 real Judge0 and the canary · 3.3 publish gate · 3.4 Workspace UI |
| 4 | Leaderboard and mock tests | 4.1 leaderboard API · 4.2 leaderboard UI · 4.3 mock-test API · 4.4 mock-test UI |
| 5 | Knowledge hubs | 5.1 content platform and hubs API · 5.2 quiz engine · 5.3 hubs and quiz UI |
| 6 | Design modules, companies, projects | 6.1 design API · 6.2 companies and projects API · 6.3 their UI |
| 7 | Community, Home dashboard, profile | 7.1 community API and moderation · 7.2 community UI · 7.3 Home dashboard and profile |
| 8 | Monetization on the mock provider | 8.1 `PaymentService`, `PaymentEventProcessor`, reconciliation, sweeper · 8.2 paywall, checkout and billing UI |
| 9 | Hardening | 9.1 reliability and load test · 9.2 compliance and deletion script · 9.3 analytics reports · 9.4 security pass |
| 10 | Production readiness | 10.1 staging · 10.2 Google and GitHub adapters · 10.3 Razorpay adapter (Stripe optional) · 10.4 cut-over checks · 10.5 launch gate |

Follow the Plan's dependency map, which has cross-phase edges (for example, 4.4 needs 3.4 and 8.1 needs Phases 4–7).

| Environment | Profile | Identity and payments |
|---|---|---|
| Local | `dev` | Mocks; compose stack with MySQL, Mailpit and optional Judge0 |
| CI | `test` | Mocks |
| Preview | `dev`, deployed | Mocks; behind an IP allowlist plus basic auth, with its own database and keys. Never public |
| Staging | `staging` | Real providers in test mode (Phase 10) |
| Production | `prod` | Real providers, live (Phase 10) |

---

## 4. Tech stack (fixed for the MVP)

- **Frontend**: React 18 with TypeScript function components, Vite, Tailwind CSS mapped to the CSS-variable tokens, `@monaco-editor/react` with Monaco self-hosted, `react-resizable-panels` for splitters, and `lucide-react` icons only. No other UI kit and no CSS-in-JS.
- **Backend**: Java 17+, Spring Boot 3, Maven, Spring Security with stateless JWT, layered Controller → Service → Repository, Hibernate with `ddl-auto=validate`, Flyway (do not add Liquibase), `@ConfigurationProperties` with `@Validated`, Micrometer, in-memory Bucket4j behind `RateLimiter`, and Spring `@Scheduled` jobs.
- **Database**: MySQL 8.4, pinned (`mysql:8.4`), for everything, including Markdown and JSON content.
- **Execution**: self-hosted Judge0 (≥ 1.13.1, pinned by digest), always asynchronous: `wait=false` plus a signed `callback_url` per job. The database is the job queue.
- **Identity**: Google and GitHub OAuth only, with no passwords, behind `AuthService`.
- **Payments**: Razorpay is primary. Stripe is an optional adapter, built and contract-tested but disabled by default.
- **Email**: `EmailSender`, with an SMTP provider in production and Mailpit locally.
- **Tests**: Testcontainers MySQL, MockMvc and WireMock for integration tests; Playwright for E2E; axe-core; k6 or Gatling for load.

**Do not introduce** in the MVP: Redis, Kafka, RabbitMQ or any other message broker, MongoDB, S3/MinIO or other object storage, SSE or WebSockets, ShedLock or a multi-instance deployment, Liquibase, or third-party CDNs for Monaco and fonts. Each has a seam and an entry gate in TRD §7; adding one needs the user's explicit approval.

**Repository layout** (Plan 0.1): a monorepo with `backend/`, `frontend/`, `infra/`, `content/` (versioned content packs: `problems/`, `mock-tests/`, `hubs/`, `design/`, `companies/`, `projects/`, plus JSON Schemas in `schemas/`) and `scripts/`.

**Commands**
- `docker compose up --wait` starts MySQL 8.4 (UTC, utf8mb4, `log_bin_trust_function_creators=1`) and Mailpit. `--profile judge0` adds Judge0; without it, the fake executor is the default.
- Backend: `mvn verify` runs unit and integration tests. Frontend: lint, test and build. E2E: Playwright against the compose stack or the preview environment.
- Scripts: `scripts/judge0-smoke.sh` (the Phase 0.3 spike; its captured JSON is committed as test fixtures), `scripts/publish-problem` (the publish gate), `scripts/extend-mock-session` (audit-logged), `scripts/analytics/` (saved SQL reports).

---

## 5. Architecture rules

### 5.1 Ports and adapters (dependency inversion)

Every external edge sits behind an interface the domain owns. Define the interface before any implementation, and use the TRD's names, which win over any other naming (Plan working agreement 6).

| Interface | MVP implementation | Later, behind the same interface |
|---|---|---|
| `AuthService` | `MockAuthServiceImpl`, one instance per provider (dev and test) | `GoogleAuthServiceImpl`, `GitHubAuthServiceImpl` (Phase 10) |
| `PaymentService` | `MockPaymentServiceImpl` (dev and test) | `RazorpayPaymentServiceImpl`; `StripePaymentServiceImpl`, optional |
| `CodeExecutionClient` | `FakeCodeExecutionClient` (tests), `Judge0CodeExecutionClient` | A broker-fed queue or another execution engine |
| `LeaderboardQueryService` | SQL over `user_problem_solves` behind a 15–30 s in-process snapshot | Redis sorted sets fed by an idempotent projector |
| `RateLimiter` | In-memory Bucket4j | Bucket4j on Redis |
| `EmailSender` | SMTP provider; Mailpit or log-only in development and tests | — |
| `AnalyticsPublisher` | Asynchronous insert into `analytics_events` | — |
| `TokenService` | Real in every environment, never mocked | — |

- The domain never imports a vendor type. Judge0 status codes, base64 handling, provider signatures and limits stay inside the adapter, which returns a vendor-neutral result.
- Test cases are read only through `TestCaseRepository.findAllByProblemId`: one batch per problem, in `display_order`, never one query per test case. That repository is the seam for moving test data to object storage later (TRD §4, §7).
- Swapping an adapter never touches controllers, services, the schema or the UI. Phase 10 is reviewed on exactly that: its diff may touch only the adapters and configuration.

### 5.2 Mock the edge, never the core (Dev_to_Prod_Strategy §0–§1)

- Only the edge adapters are mocked. `UserAccountService`, `TokenService`, the JWT filter chain, entitlement checks, `PaymentEventProcessor` and payment reconciliation are real in every environment, development included.
- Mocks and dev-only beans carry `@DevOnly`, a meta-annotation for `@Profile({"dev","test"})`. `@ConditionalOnProperty` selects beans by `semicolan.auth.mode` (`mock` | `oauth`) and `semicolan.payments.provider` (`mock` | `razorpay` | `stripe`).
- Five safety rails keep mocks out of production: `@DevOnly` itself; a startup guard (an `ApplicationContextInitializer`) that refuses to boot under `staging` or `prod` when either property is `mock` or any `@DevOnly` bean is present; a startup data check that refuses to boot if the database holds a `mock-` identity subject, an `@semicolan.test` user or a `MOCK` payment; `VITE_ENABLE_DEV_TOOLS=false`, which tree-shakes the `/dev/*` routes out of the bundle; and a CI job that starts the production image under `prod` and asserts all of it.
- Dev-only routes (`POST /api/auth/mock-login`, `GET /api/dev/mock-users`, `/api/dev/**`, and the SPA's `/dev/mock-oauth` and `/dev/mock-checkout`) are not registered outside dev and test, so they return `404`, never `403`.
- **Mock parity**: a mock replaces only the external call and feeds the same domain code the real provider will. A test that passes with the mock but would need code outside the adapter to pass with the real provider is a defect.
- **Test users** (TRD §2; Dev_to_Prod_Strategy §1.2): `MockUserSeeder` upserts `free`, `premium-active` (active until now + 30 days), `premium-expired` (expired since now − 1 day), `revoked` and `admin` with `Clock`-relative dates at every dev startup, never through a Flyway migration. `new-user` is never seeded, so it exercises onboarding; `github-unverified` never gets a row, so it exercises `OAUTH_EMAIL_NOT_VERIFIED`. Emails are `<userKey>@semicolan.test`. Only the Google mock identity is seeded, so a mock GitHub sign-in exercises link-by-verified-email.

### 5.3 Lightweight CQRS and domain events (TRD §2)

- Command services handle writes and side effects: `SubmissionCommandService`, `CheckoutService`, `PaymentEventProcessor`, `CommunityCommandService`. Query services only read: `ProblemQueryService`, `LeaderboardQueryService`, `HubQueryService`, `DesignQueryService`, `CompanyQueryService`, `ProjectQueryService`, `CommunityQueryService`. Both sides use the same MySQL database; there is no event sourcing and no separate read store. Other services the docs name: `EntitlementService`, `UserAccountService`, `JudgeResultApplier`, `SubmissionAccessPolicy`, `MockTestSessionService`, `QuizAttemptService`, `ContentLoader`.
- The leaderboard reads only the `user_problem_solves` read model, which the transaction that finalizes a first accepted `SUBMIT` writes. The ranked list and the viewer's rank come from the snapshot with a single-flight refresh, never from a per-request aggregate. Read DTOs are storage-agnostic.
- Domain events (`SubmissionFinalized`, `SolveRecorded`, `MockSessionScored`) are Spring after-commit events. Subscribers are idempotent, and anything they derive can be rebuilt from MySQL, because an after-commit event is lost if the process dies before dispatching it.

### 5.4 Identity, tokens and entitlement (TRD §2, §5)

- Sign-in uses Google or GitHub through the authorization-code flow with `state` and PKCE (GitHub: PKCE where the app supports it). Google ID tokens are fully validated (JWKS signature, `iss`, `aud`, `exp`, `nonce`) and must assert `email_verified`; GitHub needs a primary, verified email. `UserAccountService` finds the user by `(provider, subject)`, otherwise links by verified email (only when both sides assert a verified email), otherwise creates the account with `needsOnboarding = true`.
- Our tokens never appear in a URL. The callback redirects with a one-time exchange code (60 s, single use, stored hashed), which the SPA trades through `POST /api/auth/oauth/exchange`. Provider tokens are discarded after the exchange and never stored.
- The access JWT lasts 15 minutes by default and carries only `iss`, `aud`, `sub`, `role` (`USER` | `ADMIN`), `iat` and `exp`: no email, plan or other personal data. The algorithm is pinned (HS256 in the MVP; `none` is rejected), the header carries a `kid` for rotation, and `iss`, `aud` and `exp` are validated with at most 30 s of skew. Keys are per environment, so a token from one environment fails in every other.
- Refresh tokens are opaque, stored as SHA-256 hashes in `auth_tokens`, and single-use with rotation. A consumed token presented again within the 10 s leeway gets a fresh pair; after the leeway it is treated as theft and revokes all of the user's refresh tokens.
- **Entitlement** (`EntitlementService`): Premium = `subscription_status = 'ACTIVE' AND subscription_expires_at > :now`, with `:now` from the injected UTC `Clock`, evaluated from the user row on every gated request. It is never a role, never a JWT claim and never cached. Expiry takes effect at the timestamp itself without waiting for the sweeper, and `REVOKED` takes effect at once. Free-tier limits and samples are configuration or the per-item `is_premium_only` flag, not code (PRD §5).
- Role is enforced at the endpoint. Premium is an entitlement check, not a role.
- Locked content (answers, editorials, sources, withheld list items) is stripped on the server. Lock icons in the client are cosmetic; the backend enforces every check.

### 5.5 Code execution (TRD §3; Plan 3.1–3.3)

Four rules: **the database is the queue; callbacks are hints, not facts; one code path (`JudgeResultApplier`) applies results; fail closed and never blame the user for infrastructure.** Anything unknown or ambiguous becomes a retry or `JUDGING_ERROR`, never `ACCEPTED`.

1. **Accept.** `POST /api/submissions` checks, in this order: authentication; the rate limit (`run` or `submit`, or `run_session` or `submit_session` when a `testSessionId` is present); body ≤ 128 KB (`413 PAYLOAD_TOO_LARGE`) and `sourceCode` ≤ 64 KB (`422`, `TOO_LONG`); a launch language (`422 UNSUPPORTED_LANGUAGE`); the per-user in-flight cap of 3 (`429 TOO_MANY_IN_FLIGHT`); `clientRequestId` idempotency (read first; a duplicate-key race returns the winner); access through `SubmissionAccessPolicy` (a free problem, Premium entitlement, or an active mock-test session whose deadline hasn't passed); and admission control (`503 EXECUTION_BUSY` with `Retry-After` when the backlog is over its limit; session attempts are always admitted).
2. **Persist.** One transaction writes the `submissions` row and one `submission_test_results` row per test case (sample tests only for `RUN`), all `PENDING`. The API returns `202` with the attempt ID. No Judge0 call happens on the request thread.
3. **Dispatch.** The dispatcher (a 1 s tick plus an after-commit wake-up) claims rows with `SELECT … FOR UPDATE SKIP LOCKED`: in-session attempts first, then `SUBMIT`, then `RUN`, oldest first, up to the in-flight budget. A claim is a short transaction that leases the rows by pushing `next_dispatch_at` forward; no lock is held while Judge0 is called. Batches hold at most 20 jobs, with `wait=false` and one signed `callback_url` per job. A connection error, timeout, `5xx` or `503` queue-full backs off (1 s up to 30 s) and leaves the rows `PENDING`. A per-item validation rejection makes that row `JUDGING_ERROR` at once and raises an alert.
4. **Callback (the fast path).** `PUT /api/internal/judge0/callback` verifies the signature in constant time before it touches the database or Judge0, and answers every failure with the same `403`. Then, if the row is non-terminal and has a stored token, it reads that job from Judge0 and applies the result; otherwise it drops the hint. A verified callback always gets `204`. **No field of the callback body is used for any decision.**
5. **Reconcile (the fallback).** Every 10 s, and once at startup, the reconciler reads jobs dispatched more than 15 s ago, applies finished ones and leaves `In Queue` alone. A job that Judge0 no longer knows, reports as Internal Error (`13`) or has kept in `Processing` for over 60 s is re-dispatched with a fresh token, at most twice. Attempts past the judging timeout (5 min, or 30 min in a mock test) become `JUDGING_ERROR` after one last read.
6. **Apply.** `JudgeResultApplier` is the only writer of verdicts, and it is idempotent. After any network read it runs one short transaction: lock the parent `submissions` row (`FOR UPDATE`; always the parent first, then results, and in ascending attempt ID across attempts), then run `UPDATE … WHERE status = 'PENDING' AND judge0_token = <the token that was read>`. Zero rows changed means a duplicate, a late delivery or a stale job from before a re-dispatch, so it stops.
7. **Finalize.** A `COMPILE_ERROR` from any job finalizes the attempt at once, stores the compile output and sets the other `PENDING` rows to `SKIPPED`. Otherwise, once nothing is pending, the verdict is `ACCEPTED` if every test passed, else the status of the first failing test by `display_order` (a genuine failure outranks `JUDGING_ERROR`); time and memory are the maxima. A first `ACCEPTED` `SUBMIT` inserts its `user_problem_solves` row in the same transaction with `ON DUPLICATE KEY UPDATE user_id = user_id`, never `INSERT IGNORE`. `SubmissionFinalized` and `SolveRecorded` are published after commit.
8. **Poll.** The client polls `GET /api/submissions/{id}` until the status is terminal. There is no push in the MVP.

**Judge0 adapter contract** (all of it inside `Judge0CodeExecutionClient`)
- Always create and read jobs with `base64_encoded=true`. Decode leniently, and truncate stdout, stderr and compile output to 16 KB, on a code-point boundary, before persisting.
- Every job carries an `expected_output`; an empty expectation is sent as an empty string. Judge0 treats a job without one as correct, so the adapter refuses to build such a job.
- Status mapping: `1` and `2` are not terminal; `3` → `ACCEPTED`, only when time and memory are present; `4` → `WRONG_ANSWER`; `5` → `TIME_LIMIT_EXCEEDED`; `6` → `COMPILE_ERROR`; `7`–`12` and `14` → `RUNTIME_ERROR`, except that a Python run whose last stderr line is a `SyntaxError`, `IndentationError` or `TabError` becomes `COMPILE_ERROR`; `13` → a lost job (retry, then `JUDGING_ERROR`); any other value → `JUDGING_ERROR`. The mapping never defaults to `ACCEPTED`.
- Limits: CPU = the problem's limit × the language multiplier; wall = max(1 s, 2 × CPU); memory = the problem's limit × the multiplier. They are clamped to Judge0's `MAX_*` caps, and startup fails if any configured problem and language combination could exceed one.
- After a result is applied, delete the job with `DELETE /submissions/{token}`; a scheduled purge removes finished jobs older than the 2-hour retention window.
- There are no custom checkers. Judge0 compares trimmed stdout, so every problem must have a single correct output, which the publish gate checks.

**Hidden test data** (inputs, expected outputs and program output of hidden tests) is never returned to clients, never stored in our database and never logged. Only status, time and memory are kept. Sample tests return full detail.

### 5.6 Mock tests (TRD §2; Backend_Schema, Triggers and Rules; Plan 4.3)

- The server owns the clock: `end_time = start_time + duration`, both from the `Clock`, and the client never supplies a time. Session responses carry `serverNow` and `endTime`.
- Start is idempotent and serialized per user (`SELECT … FROM users WHERE id = :me FOR UPDATE`, with `uq_mts_one_active_per_user` as the backstop). The order is: run `closeIfDue` on the user's existing session; resume the same test (`200`); refuse a different one (`409 ACTIVE_SESSION_EXISTS`); check entitlement, once, here (`403 PREMIUM_REQUIRED`, `403 FREE_ATTEMPT_USED`); create (`201`).
- An attempt counts if it arrived at or before `end_time`. That is decided from `end_time` against the arrival stamp taken when the request entered the server, never from the session's `status`. Attempt creation reads the session row `FOR SHARE`, and the `trg_submissions_bi` trigger is the backstop.
- Closing takes two steps. At `end_time` the session becomes `COMPLETED` with `score = NULL`, and the report shows "finalizing". The score is written once every attempt received by the deadline is terminal and the 10 s settle delay has passed. `closeIfDue` is idempotent; the closer runs it every 15 s, and reads run it lazily.
- Early finish sets `end_time = LEAST(end_time, :now)`. `start_time` is immutable, and `end_time` never moves later except through the audit-logged `scripts/extend-mock-session`; the `trg_mock_test_sessions_bu` trigger enforces both. There is no endpoint to extend, void or reset a session.
- Token expiry never extends or shortens a session (a re-login resumes it), and Premium lapsing mid-session doesn't stop it.
- Score = the sum of `points` of the test's problems that have an `ACCEPTED` `SUBMIT` in the session: all-or-nothing, no partial credit, with Easy 1 / Medium 2 / Hard 3 by default (configurable).

### 5.7 Payments (TRD §2; API_Contract §4, §7; Dev_to_Prod_Strategy §3; Plan 8.1)

- `PaymentService` is the only provider seam (`createOrder`, `verifyAndParse(rawBody, headers)`, `fetchOrder`). Entitlement logic never sees a provider type. The checkout response is `{provider, checkout: {…}}`, and the SPA picks its checkout launcher from `provider`.
- `PaymentEventProcessor` is the only code that applies payment events. The webhook controller, the reconciliation job and the mock simulator all feed it.
- Processing order: verify the signature over the raw body (constant time; the previous secret is accepted during rotation) and reject failures with `403`; insert into `payment_events`, unique per `(provider, gateway_event_id)`, so a duplicate is a no-op; then, in one transaction, lock the `payments` row, require that the order ID, amount and currency match it, take the user from our row (never from webhook metadata), apply the guarded transition (a compare-and-set from `CREATED` to `PAID`) and stack the expiry (the base is the current expiry if the user is active and unexpired, otherwise now); set `processed_at` only after the effect. Access is granted only on the gateway's terminal paid event. Duplicates and unmet guards answer `204`.
- A refund or a dispute sets `REVOKED`, effective immediately. Refunds are issued from the Razorpay dashboard and arrive as webhooks; there is no refund endpoint.
- Reconciliation asks the gateway about orders still `CREATED`, so a lost webhook is recovered within 15 minutes through the same apply path. Premium must activate within 60 s of a confirmed payment, and no paid user may need support to get access.
- The client never trusts a provider's client-side success callback for entitlement; it polls `GET /api/payments/orders/{orderId}`.
- Plans are database rows seeded by migration: fixed-term, prepaid, INR, tax-inclusive, priced in integer paise. Buying while Premium extends the expiry. Checkout reuses the caller's unpaid order for the same plan within a 15-minute window.
- A lapse never deletes data: history, reports and earned points stay readable (PRD §6.3). Admin grant and revoke are audit-logged in `admin_audit_log`.

### 5.8 Content, learning modules and community

- All content (problems, mock tests, hubs, design questions, companies, projects) comes from versioned content packs in `content/`, through idempotent loaders that upsert by slug and validate every file against the JSON Schemas in `content/schemas/`. There is no admin content API or UI in the MVP. Content must be original or licensed, with its provenance recorded.
- Under `prod`, loaders never write `PUBLISHED` directly. A problem goes live only through `scripts/publish-problem` (OPS-2): the reference solution passes every test in all four languages, a trivial wrong solution is rejected (the negative control), four stub rows exist, there is at least one sample and one hidden test, and no test payload exceeds 256 KB. Editing a published problem's tests goes back through the gate.
- Quizzes are graded on the server. A question's correct option and explanation leave the server only in the response to answering that question, and an answer is final (a repeat returns `alreadyAnswered: true`). Quiz scores never count toward the leaderboard or mock tests. A published question that has answers is never changed in place; a correction ships as a new quiz.
- Company names appear as text with a monogram, never as logos, and every company tag carries a source and a review date (PRD CMP-2).
- Community: interview experiences are pre-moderated (`PENDING_REVIEW` until an admin approves them); discussions publish at once and are moderated afterwards. Posting needs an account at least 24 hours old. Comments allow one level of replies. Vote counts are denormalized onto the post and comment rows and change only in the voting transaction. Markdown goes through the shared allowlist sanitizer with images, raw HTML and Mermaid disabled, and links get `rel="nofollow ugc noopener"`. Size caps: post 20 KB, comment 4 KB, design notes 64 KB. Every moderation action writes an `admin_audit_log` row.

### 5.9 Scheduled jobs, email and analytics (TRD §2)

- The MVP runs one backend instance with recreate deploys, so `@Scheduled` singleton jobs need no distributed lock: the dispatcher (1 s), the reconciler (10 s, plus a pass at startup), the mock-test closer (15 s), payment reconciliation (every few minutes), the subscription sweeper (relabels lapsed `ACTIVE` users as `EXPIRED` and sends the 7-day and 1-day reminders, each claimed by an insert into `subscription_reminders`), the `RUN` purge (older than 24 h, in batches of about 1,000 rows) and the Judge0 retention purge. Queue work still uses `FOR UPDATE SKIP LOCKED`.
- Email (receipts, expiry reminders, moderation notices) and analytics run asynchronously on bounded executors, never inline on the request thread. A failed analytics write is logged and never fails the request.
- Event names come from PRD OPS-5. Client-originated events (`paywall_view`, `workspace_opened`, `auth_gate_view`, `editorial_view`) arrive only through `POST /api/events`, which accepts the allowlisted names and rejects anything else with `422`.

---

## 6. Data and schema rules (Backend_Schema.md §0, Rules, Operations)

**Time (strict)**
- Everything is UTC. Every temporal column is `DATETIME(3)`; `TIMESTAMP`, `DATE` and `TIME` are never used for instants.
- One injectable `Clock`, built with `Clock.tickMillis(ZoneOffset.UTC)`, is the only source of business time. Decision timestamps (`start_time`, `end_time`, `submitted_at`, `next_dispatch_at`, `expires_at`, …) have no column default, because the application writes them. Audit stamps such as `created_at` default to `UTC_TIMESTAMP(3)`.
- Ad-hoc SQL uses `UTC_TIMESTAMP(3)`, never `NOW()`, `CURRENT_TIMESTAMP`, `SYSDATE()`, `CURDATE()`, `CONVERT_TZ()`, `FROM_UNIXTIME()` or `UNIX_TIMESTAMP(col)`. The one exception is the `updated_at … ON UPDATE CURRENT_TIMESTAMP(3)` pair, which is safe because the session time zone is pinned.
- Time zones are pinned in the MySQL server, Connector/J, Hibernate and the JVM, and Java code uses only `Instant` or UTC `OffsetDateTime`. The readiness check fails if the session offset isn't zero.
- Predicates are sargable half-open ranges, `[from, to)`, on the raw column; never `DATE(col)`, `WEEK(col)` or `YEAR(col)`. Only the weekly leaderboard window (Monday 00:00 Asia/Kolkata, which is Sunday 18:30 UTC) and the activity heatmap's day buckets convert to IST, and they do it in application code.

**Types and naming**
- Every table states `ENGINE=InnoDB`, `utf8mb4` and `utf8mb4_0900_ai_ci` explicitly. Machine-readable text (slugs, codes, gateway IDs, tokens) is `ascii`. IDs are `BIGINT UNSIGNED AUTO_INCREMENT`. Money is integer paise with an explicit `currency`. `LONGTEXT` is never used.
- `ENUM` values are only ever appended at the end, never reordered or renamed.
- `JSON` columns hold documents that are read whole and never filtered or indexed by an inner key.
- Names use the prefixes `idx_`, `uq_`, `fk_`, `chk_` and `trg_`, and every foreign-key column has an explicitly declared index that starts with it.

**Migrations and accounts**
- Flyway only. `V1__baseline.sql` creates all 41 tables exactly as `Backend_Schema.md` defines them, including the two mock-test triggers. Never edit an applied migration; every change is a new one, and the database only rolls forward (no undo scripts). Reference data such as `plans` arrives as versioned migrations, content through the loaders, and static development data through the `db/seed-dev` location (dev and test only).
- The migration account owns DDL and the triggers. The runtime account has DML only, granted per table, and `admin_audit_log` is append-only.

**Deletion and foreign keys**
- Rows with history are never hard-deleted. Accounts are anonymized in place by the ordered steps in Backend_Schema's Rules (account deletion); problems and module content are `ARCHIVED`; mock tests are deactivated; posts and comments become `DELETED` with their text blanked.
- Foreign keys from history-bearing tables are `ON DELETE RESTRICT`. `CASCADE` is reserved for credentials, join rows, personal notes and content owned by a draft problem. `SET NULL` appears only on `user_problem_solves.submission_id`.

**One writer per denormalized value** (Backend_Schema §0.4 lists them all). For example, the verdict columns on `submissions` are written only by finalization, `user_problem_solves` only by the finalizing transaction, vote and comment counters only in the vote or comment transaction, quiz `answered_count` and `correct_count` only together with each answer, and `payments.amount_paise` and `currency` only at order creation. Don't add a second writer.

**Query rules**
- Never use `INSERT IGNORE`, which also hides foreign-key and truncation errors. Use `ON DUPLICATE KEY UPDATE <key> = <key>` as the no-op.
- Idempotent creation reads first, inserts only if the row is absent, and treats a duplicate-key error as a lost race that returns the winner. Insert-then-catch is wrong here, because `trg_submissions_bi` fires before the duplicate-key check.
- Use Backend_Schema's query patterns as written: keep the dispatcher claim's `ORDER BY` exactly as shown, and omit the window predicate for the all-time leaderboard.
- Take locks parent first, and in ascending ID order across rows.

---

## 7. API conventions (API_Contract.md, Conventions)

- The base path is `/api`. JSON goes both ways (anything else gets `415`), fields are camelCase, and timestamps are RFC 3339 in UTC (`2026-11-01T10:15:30Z`).
- Every non-2xx body is `{"error": "<CODE>"}`, plus `fieldErrors` (`REQUIRED`, `INVALID`, `TOO_WEAK`, `TOO_LONG`, `OUT_OF_RANGE`) for field validation. Clients switch on `error`, never on the status alone. Use only the codes the contract defines.
- The authentication modes are Bearer, Optional and None. On an Optional endpoint, a token that is present but invalid or expired gets `401` (so the client refreshes) instead of being treated as a visitor. A visitor who needs to sign in gets `401`, not `403`; `403` means refused (role, Premium, a spent free attempt, an account too new, a bad signature). Authentication and rate limiting are evaluated before anything else.
- Pagination uses `page` (zero-based) and `size` (default 20, or 50 for the leaderboard; at most 100). Responses are an envelope, `{items, page, size, totalItems, totalPages}`, never a bare array. A page past the end returns `200` with empty `items`; an out-of-range value returns `422` and is never silently clamped. Every paginated order ends in a unique tiebreaker.
- Rate limits use named policies: `auth`, `run`, `submit`, `run_session`, `submit_session`, `checkout`, `quiz`, `community_post`, `community_comment`, `community_vote`, `community_report` and `events`. Every response from a limited endpoint carries `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`, and a `429` adds `Retry-After`. `JUDGING_ERROR` results, `5xx` and `503` don't consume the allowance. The client IP comes only from the trusted proxy hop, never from a raw `X-Forwarded-For`. Webhooks and dev-only endpoints are outside the rate limits.
- Idempotency follows the contract's table: Run and Submit through `clientRequestId`, starting and finishing a test, checkout, quiz answers, votes, reports, bookmarks, deletion requests and webhooks.
- Caller-dependent responses are sent with `Cache-Control: private, no-store`. CORS allows only the SPA origin and exposes `Retry-After`, the `X-RateLimit-*` headers and `Location`.

---

## 8. Security rules (TRD §5)

- Judge0 runs untrusted code in its own zone, with no route to MySQL, secrets or the internet; its ingress admits only the backend, and its egress only the backend's internal callback path. Run a release with the 2024 sandbox-escape fixes (≥ 1.13.1), pinned by digest, configured with `ENABLE_NETWORK=false`, `ALLOW_ENABLE_NETWORK=false`, `ENABLE_COMPILER_OPTIONS=false`, `ENABLE_COMMAND_LINE_ARGUMENTS=false`, `ENABLE_ADDITIONAL_FILES=false`, `ENABLE_WAIT_RESULT=false`, `AUTHN_TOKEN` and `ALLOW_IP`, with every default password changed. The backend sets every job parameter itself and never forwards user-controlled ones.
- The callback endpoint lives under `/api/internal/**`, which the proxy denies from the public internet and the firewall opens only to Judge0 hosts. The URL carries `resultId`, `exp`, `kid` and `sig = HMAC-SHA256(key[kid], "judge0-callback:v1|" + resultId + "|" + exp)`, signed with a dedicated, rotating key that is never shared with the JWT or webhook secrets. Query strings under `/api/internal/**` are redacted from access logs, traces and error reports.
- XSS controls are mandatory, because the refresh token is readable by scripts: a strict Content-Security-Policy, React's default escaping, no `dangerouslySetInnerHTML`, no `eval`, all Markdown through the allowlist sanitizer, and Mermaid only for editor-authored design content, with `securityLevel: 'strict'`.
- OAuth: `state` and the PKCE verifier live in a signed, encrypted `HttpOnly; Secure; SameSite=Lax` cookie scoped to `/api/auth/oauth/` for 10 minutes. Redirect URIs are an exact allowlist per environment, and `returnTo` is accepted only as a same-origin relative path. The popup's `postMessage` targets the SPA origin, and the opener checks `event.origin`.
- Payment webhooks are verified over the raw body in constant time and are idempotent by provider event ID.
- Secrets come only from the environment or the secret store, one set per environment, and none is ever committed. Error responses never contain stack traces.
- Logs and metrics carry `attemptId`, `resultId` and `userId`, never source code, hidden test data, tokens, secrets or callback query strings.

---

## 9. Frontend and UI rules

### 9.1 Client architecture (TRD §1)
- Public routes are the catalog, free problem statements, the leaderboard, and what PRD §5 shows visitors in the other modules. Run and Submit, mock tests, billing and account pages need sign-in. A visitor's Run or Submit opens the auth gate as a modal over the Workspace, and the action resumes after sign-in; there is no guest execution.
- Sign-in opens the provider in a popup started by the click. When the popup is blocked, fall back to a full-page redirect with `returnTo`, keeping the pending action in `sessionStorage`.
- One shared API client owns every token decision: a single-flight refresh across tabs (`navigator.locks` or `BroadcastChannel`); a proactive refresh at about 75% of the token's lifetime, measured on the monotonic clock; and one refresh plus one retry on a `401`. Network errors and `5xx` during refresh are retried with backoff and never log the user out. Only `401 INVALID_REFRESH_TOKEN` opens the sign-in dialog, over the current page. Logging out in one tab logs out the others.
- `GET /api/me` drives the UI only (lock icons, paywall prompts, the "Test in progress" bar); the backend enforces.
- Run and Submit: generate one `clientRequestId` (a UUID) per click and reuse it for that click's retries; disable both buttons while an attempt is in flight; keep the in-flight attempt ID per problem, so a refresh resumes polling. Poll every 1 s for the first 15 s, every 2 s up to 60 s, then every 5 s, and more slowly in a hidden tab. Show the execution states of App_Flow §2.3 (Sending, Queued, Running, Slow, Long wait with **Stop waiting**, Reconnecting, Judging Error).
- The mock-test countdown is computed from `serverNow` and `endTime` with a measured clock offset, re-synced on load, about every 60 s, on `visibilitychange`, `focus` and `online`, and after any `409` or `5xx`. It shows "Syncing time…" until the first sync, and syncs once more at zero before it locks the editor. Force a token refresh about 6 minutes before `endTime`. At the deadline, or on `409 TEST_SESSION_CLOSED`, show a blocking "Time's up" dialog, not a toast.
- Viewport tiers: from 1024 px, the full three-pane Workspace; from 768 to 1023 px, a compact Workspace whose problem pane collapses to a rail and opens as a drawer; below 768 px, read-only views with **Copy link** and **Share**. A running mock test never drops to read-only, and a test can't start below 768 px.
- Compile errors are Console text only: no squiggles, gutter icons or clickable locations.

### 9.2 UX principles (App_Flow §0)
Code is never lost. Intent survives gates. Every wait has a state and an exit. The server owns time and entitlement. Our failures are not the user's cost. Everything is repeat-safe by default. Getting from the landing page to a first verdict takes at most 3 clicks and one form. Results never steal focus.

### 9.3 Visual design and brand (UI_UX_Brief §0–§2, §8–§10)
- Use Semicolan's identity only: the wordmark is a `;` glyph in `accent` followed by "Semicolan" in `text-strong`, Inter 700. Never reproduce the reference product's logo, name, slogans, copy or illustrations. No company logos (use monograms), no tool or product logos (use generic Lucide icons), no fabricated social proof or invented numbers, and no payment-brand marks (write "UPI · Cards · Netbanking, via Razorpay"). The only third-party marks allowed are the official Google "G" and GitHub mark on their own sign-in buttons.
- Colors come only from the CSS-variable tokens of UI_UX_Brief §1, mapped into Tailwind (`bg-base`, `text-muted`, `accent`, …). No raw hex in components and no Tailwind built-in palette. Only the dark theme is built in the MVP; the light values are defined, but there is no toggle.
- A unit test computes the contrast of every token pair, syntax color, difficulty badge and verdict tint, and fails the build below the WCAG thresholds.
- Fonts (Inter for the UI; Fira Code or JetBrains Mono for code, with ligatures off) and Monaco are self-hosted; nothing loads from a third-party CDN.

### 9.4 Monaco (UI_UX_Brief §5)
- Editor state (language, buffer) is kept apart from problem state, so a language switch swaps the model without refetching the statement. Use one model per problem and language (`path="problem-101/java"`), with `saveViewState` on.
- Stubs come from the backend. Drafts are debounce-saved to `localStorage`, keyed by user, problem and language, and cleared on explicit logout. Never discard a buffer because of an auth failure.
- Lazy-load Monaco on the Workspace route only, with the statement rendered first. If it hasn't loaded within 10 s, fall back to a plain `<textarea>` with the same buffer, autosave, Run and Submit, plus **Retry full editor**.
- Follow the §5 options (minimap off, 4-space indentation, ligatures off, `fixedOverflowWidgets: true`, the custom themes of §1.4, and a wrapper with `min-width: 0; min-height: 0`). The four languages are tokenizer-only, so never promise IntelliSense or live error checking.
- Run is Ctrl/Cmd+Enter and Submit is Ctrl/Cmd+Shift+Enter, both registered with `editor.addCommand`. Ctrl+M (macOS: Ctrl+Shift+M) lets Tab move focus out of the editor.

### 9.5 Accessibility (UI_UX_Brief §6)
- The bar is WCAG 2.2 AA. Every status is an icon plus a text label plus a color, never color alone. Every interactive element shows a visible focus ring. Targets are at least 24 px, and buttons at least 32 px. Use landmarks, skip links, the ARIA tabs pattern, and dialogs that trap focus and return it on close.
- Focus never moves by itself after Run or Submit. One polite live region announces judging and verdicts.
- There are no single-character shortcuts. Search opens with Ctrl/Cmd+K, not `/`.
- axe-core runs in CI with no serious or critical findings.

### 9.6 Generated UI (UI_Generation_Prompts.md)
Run Prompt 0 first, then one page prompt per generation, pasted whole. Generated components are presentational only: typed props in, callback props out, preview data in `*.fixtures.ts`. API wiring, Monaco, polling, autosave, the OAuth popup and auth stay in hand-written code. Check every output against the brief: no raw hex, a visible focus ring, an icon and a label on every status, and a passing contrast test.

---

## 10. Testing and verification (Implementation_Plan.md)

- Verification tags: **UT** unit · **IT** integration (Spring, Testcontainers MySQL, MockMvc, WireMock) · **E2E** Playwright · **DRILL** a scripted manual run with a checklist · **LOAD** k6 or Gatling · **SCRIPT** a committed script that exits 0 · **CI/CD** a pipeline run. Prove each acceptance criterion with the kind of test its tag names.
- Tests move the injected `Clock` or backdate rows; they never sleep or wait for real time. The exception is mock-test sessions: create the session under the simulated `Clock`, insert its attempts before it is closed or scored, and simulate expiry by shortening `end_time`, never by back-dating `start_time`.
- Sign in with `POST /api/auth/mock-login`, and call `MockUserSeeder.reseed()` in setup (after moving the `Clock`, if the test moves it). Premium-path criteria in Phases 2–7 use the seeded users, because payments don't exist until Phase 8.
- Async callbacks and webhooks are tested at the levels the Plan defines: L1 in-process (MockMvc); L2 a fake Judge0 or WireMock that can lose, duplicate, reorder or pre-empt callbacks, answer `503`, reject one batch item or lose a job; L3 a real Judge0 in compose (Linux only); L4 a public tunnel that exposes only the single webhook path, never `/api/internal/**`; L5 staging.
- Contract tests run every real adapter against recorded provider fixtures, and the mock against the same expectations. The Phase 0.3 Judge0 fixtures are replayed through the fake executor.
- The canary suite (a known-correct and a known-wrong program per language, plus a case with an empty expected output) gates every deploy and every Judge0 upgrade.
- As the acceptance criteria do, assert security properties on the raw JSON: no hidden test data, no locked answers, no `correctOption` before an answer.

---

## 11. Configuration, environments and observability

- Every new key goes into `.env.example` and the Plan's configuration inventory. Non-secret defaults live in `application-*.yml`. The app fails at startup, naming the key, when a required one is missing.
- The profiles are `dev`, `test`, `staging` and `prod`. Preview runs `dev` behind the access gate with its own database and keys, and staging's database is never restored from preview.
- The PRD §9 guardrails must be measurable and alerting: submit-to-verdict P95 ≤ 10 s; `JUDGING_ERROR` below 1% of submissions; payment-to-access P95 ≤ 60 s, with no paid user lacking access after 15 minutes; zero late mock-test submissions accepted; no in-session attempt non-terminal for more than 2 minutes. Also track the callback-loss gap (`callbacks_received_total` against `reconciler_recovered_total`), Judge0 queue depth and Judge0 disk usage.
- Shut down gracefully (a drain window of at least 30 s, with readiness failing first) and run a reconciler pass at startup, so a deploy costs a short delay and never data.

---

## 12. Out of scope for the MVP: do not build

PRD §4 and §8, TRD §7, UI_UX_Brief §7 and App_Flow §16 list these with their entry gates. Among them: SQL problems and Data Science coding (Judge0 can't evaluate them); guest Run; AI hints, the AI assistant and the AI whiteboard; email and password sign-in; auto-renewing subscriptions and coupons; custom test input; compile-error locations in the editor; pushed verdicts (SSE or WebSocket); a light-theme toggle; public profiles, follows, notifications, reputation, direct messages and image uploads; an admin content UI; admin void or reset of mock sessions; granular admin roles; proctoring and plagiarism detection; a native mobile app; B2B or college plans; languages beyond C, C++, Java and Python 3; the Full Stack hub; and Redis, brokers, object storage or multiple backend instances. You may point out the seam a deferred item would use, but build one only with the user's explicit go-ahead.

---

## 13. Agent behavior and output

- **Before you write code**, state the phase and milestone, the requirement IDs, the doc sections you rely on, and any conflict or missing contract. If the request conflicts with `API_Contract.md` or `Backend_Schema.md`, say so first.
- **Write complete, working files.** No `// TODO` and no stubs unless the user asks for scaffolding. Include the tests that prove the relevant acceptance criteria.
- **Use the docs' names exactly**: classes and interfaces from the TRD, tables and columns from Backend_Schema, endpoints, fields and error codes from API_Contract, configuration keys from the Plan's inventory, and event names from PRD OPS-5.
- **Changing a spec**: propose the edit (file, section, wording) and wait for approval; once approved, update the doc in the same change as the code. Never edit an applied migration, and never quietly change a doc to match your code.
- **Ask instead of guessing** when the docs don't settle a decision and there is no conventional default. When a default is obvious, take it and say so.
- **Report honestly**: which tests you ran and their results, which acceptance criteria are proven, which still need a DRILL or a sign-off, and anything you skipped.
- **Shape of an implementation answer**: (1) the phase, milestone and docs consulted; (2) conflicts or open questions; (3) the complete files; (4) the tests and how to run them; (5) any config keys or doc updates required.
