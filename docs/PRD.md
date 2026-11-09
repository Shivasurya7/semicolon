# Product Requirements Document (PRD) — Semicolan

**Assumed launch market**: India (INR pricing, UPI/cards via Razorpay).

## 1. Vision & Positioning
Semicolan is an affordable interview and placement preparation platform: solve coding problems in a real in-browser IDE, rehearse under timed conditions, study DevOps and Data Science theory with quizzes, work through System Design (HLD) and Low-Level Design (LLD) questions, prepare for specific companies, build portfolio projects, learn from peers' interview experiences, and see where you stand.

"Affordable" and "localized" are product requirements, not slogans:
- **Affordable** — INR pricing a student can pay out of pocket, plus a meaningful free tier.
- **Localized** — UPI/cards/netbanking checkout and content built around campus-placement coding rounds. Regional-language UI is Future.

## 2. Target Users
| Segment | Priority | Job to be done |
|---|---|---|
| **Pre-final / final-year students preparing for campus placements** | **Primary (MVP)** | Get placement-ready on a student budget: practice the question types they will face and rehearse under test conditions |
| **Early-career developers (0–2 yrs) preparing to switch jobs** | Secondary | Same loop with different content needs; nothing is built specifically for this segment until MVP metrics justify it |

- **Buyer = user** (B2C). College and placement-cell plans are out of scope.
- **Segment capture**: onboarding records segment (Student / Working professional / Other), plus college and graduation year. This data is hard to back-fill and is required to measure whether the primary segment is being reached.

## 3. Problem & Value Proposition
**Problem** (validate in pre-launch interviews): existing platforms are priced for global markets, centered on interview patterns that differ from fresher hiring rounds, and offer no low-cost way to rehearse a timed test.

| Tier | Value delivered |
|---|---|
| **Free** | A real taste of the product: a meaningful free problem set, the full Workspace, the public leaderboard, one free mock test, a free sample of every module (theory, Easy quizzes, some design questions, one project, company overviews) and the full community |
| **Premium** | The full problem catalog, unlimited timed mock tests with reports, every theory answer and quiz, every design editorial, every project brief and every company question list |

## 4. Goals & Non-Goals
**Business goals (first 90 days after launch; targets in [§9](#9-success-metrics))**
1. Prove repeat usage — students return weekly to solve problems.
2. Prove willingness to pay — free users convert to Premium at a viable rate.
3. Prove content operations — a trusted catalog can be shipped and maintained.

**Non-goals (MVP)**
- Proctoring, plagiarism detection, or certified assessment. Mock tests are timed practice; scores and leaderboard ranks must not be presented as verified credentials.
- Auto-renewing subscriptions ([§6.1](#61-plans)).
- Native mobile app. Mobile web is read-only (catalog, statements, leaderboard, results); the Workspace requires a desktop-class window (at least 768 CSS px wide; the full three-pane layout from 1024 px).
- Guest (logged-out) code execution ([§8](#8-deferred-future--with-entry-gates)).
- **SQL problems, and any problem that needs an execution engine other than Judge0** (SQL, pandas/NumPy notebooks). Judge0 runs a program against stdin and compares stdout; it cannot evaluate a query against a database. The Data Science hub ships theory and quizzes only.
- AI features: AI hints, AI assistant, AI whiteboard grading.
- Community features beyond posts, comments, upvotes and reports: direct messages, follows, reputation, notifications, image uploads, rewards for posting.
- B2B / college dashboards.
- Languages beyond the launch set (WRK-3).

## 5. User Roles & Entitlements
Role and plan are **two independent axes**:
- **Role** (authorization): `USER` or `ADMIN`.
- **Entitlement** (what the user has paid for): `FREE` or `PREMIUM`, derived from subscription state ([§6](#6-subscription--monetization-policy)) on every request — never stored as a role or trusted from a long-lived token.
- **Visitor** (logged out) is a distinct actor.

| Capability | Visitor | Free | Premium | Admin |
|---|:-:|:-:|:-:|:-:|
| Browse problem list; read free problem statements | Yes | Yes | Yes | Yes |
| Read premium problem statements | Locked | Locked | Yes | Yes |
| Run / Submit on free problems | Sign-up required | Yes (fair-use limits) | Yes (fair-use limits) | Yes |
| Run / Submit on premium problems | – | Locked | Yes | Yes |
| Mock tests | – | 1 designated free test, single attempt | All tests, unlimited attempts | Yes |
| Leaderboard | View | View + ranked | View + ranked | View |
| DevOps / Data Science hubs: theory | Free sample | Free sample | All | Yes |
| Quizzes | – | Easy level | All levels, unlimited attempts | Yes |
| System Design / LLD: statements | Free sample | Free sample | All | Yes |
| System Design / LLD: editorial solutions | – | Free sample | All | Yes |
| Company pages: overview | Yes | Yes | Yes | Yes |
| Company pages: question lists | First 2 per tab | Full list (items keep their own lock) | Full list | Yes |
| Projects | List and summaries | One free project brief | All briefs | Yes |
| Community: read | Yes | Yes | Yes | Yes |
| Community: post, comment, upvote, report | – | Yes | Yes | Yes + moderate |
| Own submission history and mock reports | – | Yes | Yes | Yes |
| Editorial (Solution tab) | Sign-up required | Free problems | All problems | Yes |
| Home dashboard, profile, activity heatmap, bookmarks | – | Yes | Yes | Yes |
| Blog: read | Yes | Yes | Yes | Yes |
| Admin panel: overview metrics, users, audit log | – | – | – | Yes |
| Manage content (problems, test cases, mock tests, hubs, design, companies, projects, blog) | – | – | – | Yes (admin panel; content packs as import) |
| Approve and publish content (four eyes: not one's own edits) | – | – | – | Yes (audit-logged) |
| Grant/revoke Premium access (admin API) | – | – | – | Yes (audit-logged) |

Role is only `USER` or `ADMIN` — the single `role` column and token claim; there is no separate admin flag — and granular admin roles are deferred ([§8](#8-deferred-future--with-entry-gates)). An admin's "Yes" for premium content is met through the admin panel, which shows every item in full; on the public pages an admin's entitlement is that of their own plan. Admin rights are granted and removed only by an audited script, never through the product. Refunds are issued from the Razorpay dashboard, not through an admin action in our system; the refund webhook revokes access ([§6.4](#64-payment-rules)).

Free-tier limits (free problem set, run/submit rate) and every "free sample" above are **configuration or a per-item `is_premium_only` flag on the content item** (set in the admin panel or the content pack), not code.

## 6. Subscription & Monetization Policy

### 6.1 Plans
- Fixed-term, **prepaid** access (e.g., 1, 3, 6 months), priced in INR, tax-inclusive. No auto-renewal in MVP.
- Plans (name, duration, price) are configuration, so pricing can be tested without a deploy.
- Buying while already Premium **extends** the expiry; purchases stack and never overlap.

Rationale: removes dunning, grace periods, recurring-payment mandate compliance, and cancellation flows while willingness-to-pay is unproven, and matches how students pay (one-off UPI).

### 6.2 Entitlement states
| State | Meaning | Premium access | Behavior |
|---|---|---|---|
| `NONE` | Never purchased | No | Free experience; paywall at premium triggers |
| `ACTIVE` | Now < expiry | Yes | Expiry reminder at 7 days and 1 day (email + in-app) |
| `EXPIRED` | Now ≥ expiry | No | Data retained ([§6.3](#63-what-happens-to-a-users-data-when-premium-ends)); renewal prompt shows the user's own stats |
| `REVOKED` | Refund, chargeback, or admin action | No, immediately | As `EXPIRED`; reason recorded |

### 6.3 What happens to a user's data when Premium ends
Nothing is deleted. Access is gated; data is retained.

| Data / capability | After expiry or revocation |
|---|---|
| Account, profile, submission history (including code submitted to premium problems) | Retained and viewable |
| Completed mock-test reports and scores | Retained and viewable (read-only) |
| Leaderboard points already earned | Retained; no new points from locked problems |
| New submissions to premium problems; new mock tests | Locked |
| Mock-test session in progress at the moment of expiry | May finish — entitlement is checked at session start |
| Re-purchase | Full access restored instantly; nothing to migrate |
| User-requested account deletion | Personal data deleted within 30 days; leaderboard rows anonymized |

### 6.4 Payment rules
- **Premium activates within 60 seconds of confirmed payment.** A reconciliation job catches missed or delayed webhooks within 15 minutes; a paid user must never need support to get access.
- Webhooks are signature-verified and idempotent (duplicate delivery changes nothing).
- Refunds and chargebacks revoke access immediately. Refund policy: 7 days, provided no mock test was attempted; it is published on the pricing page. Refunds are issued manually from the Razorpay dashboard in MVP, and the `refund.processed` webhook revokes access.
- Payments go through an external provider behind one `PaymentService` interface (TRD §2): **Razorpay** at launch (INR; UPI, cards, netbanking); **Stripe** is a second adapter behind the same interface, enabled only if international users become a segment and an Indian merchant account is available. During development a `MockPaymentServiceImpl` simulates the provider end to end; the real provider is integrated in the last phase before production (Implementation_Plan Phase 10).
- Admins can manually grant or revoke access; every action is audit-logged.
- For a platform incident or an approved accommodation (requested through the support email), an admin can extend a mock-test session by script; the action is audit-logged. There is no self-serve extension.

### 6.5 Free-tier abuse controls
- Sign-in requires an identity provider that asserts a **verified email** (Google always does; GitHub only for a verified primary email). That is the leaderboard and free-mock-test requirement too, so there is no separate email-verification step.
- Community: posting needs a signed-in account at least 24 hours old; interview experiences are pre-moderated; per-user rate limits on posts, comments and reports (COM-4).
- Per-user rate limits on Run/Submit protect execution cost.

## 7. MVP Scope
All items below ship at launch. Anything not listed is out of scope.

### 7.1 Accounts & access
| ID | Requirement |
|---|---|
| ACC-1 | **Sign in with Google or GitHub** (OAuth 2.0 / OpenID Connect; authorization-code flow with `state` and PKCE). The first sign-in creates the account; the provider's verified email is the account email. Our own stateless JWT access tokens with rotating refresh tokens are issued after sign-in. There is no password. Behind an `AuthService` interface (TRD §2): `MockAuthServiceImpl` with seeded test users in development, the real providers from the Production Readiness phase |
| ACC-2 | Role model `USER`/`ADMIN`; entitlement resolved server-side from subscription state ([§5](#5-user-roles--entitlements), [§6](#6-subscription--monetization-policy)) |
| ACC-3 | Onboarding, shown once after the first sign-in, captures segment (required) and display name (required, prefilled from the provider; shown on leaderboard, never email), plus college and graduation year (optional) |
| ACC-4 | Account deletion on request (manual process acceptable; within 30 days) |
| ACC-5 | Account settings: the user can edit display name, segment, college and graduation year. Email comes from the identity provider and changes through support |
| ACC-6 | **Connected accounts**: a user can link the other provider (Google ↔ GitHub) and unlink one as long as another remains. Signing in with a new provider whose verified email matches an existing account links to that account |
| ACC-7 | **Development sign-in**: in the `dev` and `test` profiles only, `POST /api/auth/mock-login` and the mock provider picker sign in as seeded test users with real JWTs. Neither exists in a production build (TRD §2, §5) |

### 7.2 Catalog & Workspace
| ID | Requirement |
|---|---|
| CAT-1 | Problem catalog filterable by difficulty and topic; each problem flagged free or premium; visitors can browse |
| CAT-2 | Catalog title search, plus a status filter (Solved / Attempted / Unsolved) and per-problem status for signed-in users; a grouped-by-topic view with "solved / total" per topic, and an overall progress ring. Solved is derived from the first Accepted `SUBMIT` (the leaderboard's own rows), never ticked by hand |
| CAT-3 | Bookmarks: a signed-in user can save problems and filter the catalog to saved ones |
| SOL-1 | **Solution tab (editorial)** per problem: an approach write-up, time and space complexity, and the reference solution in every launch language. Optional per problem ("No editorial yet" otherwise). Entitlement follows the problem: free problem → any signed-in user, premium problem → Premium. Behind a spoiler guard, and unavailable for a problem that is part of the caller's running mock test. Authored with the problem (admin panel or content pack), next to the reference solutions that OPS-2 already requires |
| WRK-1 | In-browser Monaco Workspace with language selector and a starter stub per language. Full three-pane layout from 1024 CSS px, a compact layout from 768 px, and a read-only fallback below 768 px |
| WRK-2 | **Run** executes against sample test cases only; it is not stored in history and never affects the leaderboard. **Submit** judges against all test cases, is stored, and counts toward the leaderboard |
| WRK-3 | Launch languages: **C, C++, Java, Python 3** |

### 7.3 Judging
| ID | Requirement |
|---|---|
| EXE-1 | Asynchronous judging via Judge0; verdicts: Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error, Compile Error, Judging Error |
| EXE-2 | Time/memory limits set per problem with per-language multipliers, so a correct Python solution is not failed by C++-tuned limits |
| EXE-3 | Per-user submission history with code and verdict |
| EXE-4 | Fair-use rate limits on Run/Submit |

### 7.4 Mock tests
| ID | Requirement |
|---|---|
| MT-1 | Curated by admins with a fixed problem set and duration; no user-created tests |
| MT-2 | Timer is backend-authoritative: submissions arriving after the server-side deadline are rejected regardless of the client clock; the session auto-closes at the deadline and resumes correctly after refresh or disconnect |
| MT-3 | Scoring: points per Accepted problem, weighted by difficulty (default Easy 1 / Medium 2 / Hard 3, configurable); all-or-nothing per problem, no partial credit |
| MT-4 | Final report: score, per-problem verdict, time taken |
| MT-5 | Entitlement: Free = one designated test, single attempt; Premium = all tests, unlimited attempts |

### 7.5 Leaderboard & personal progress
| ID | Requirement |
|---|---|
| LB-1 | One global leaderboard ranked by difficulty-weighted points (same weights as MT-3), with **This week** (default) and **All-time** views |
| LB-2 | Always shows the viewer's own rank and neighbors, even outside the top N |
| LB-3 | Verified users only; shows display name |
| HOME-1 | **Home dashboard** for signed-in users: greeting, a three-step getting-started checklist (first Accepted submission, first completed quiz, first mock test), "Continue where you left off", topic tiles with progress, an activity heatmap with current and longest streak, and cards for the mock tests, the viewer's weekly rank, and Premium (Free users only). Built only from data the platform already records |
| PRF-1 | **Profile page**: identity card, solved count by difficulty (solved / published), the activity heatmap with streaks, recent submissions, and a link to account settings and billing. Private to the user in MVP (no public profile URLs) |

### 7.6 Monetization
| ID | Requirement |
|---|---|
| PAY-1 | Paywall at defined triggers: opening a premium problem; starting a non-free mock test |
| PAY-2 | Checkout through `PaymentService`: Razorpay in production (INR; UPI, cards, netbanking), Stripe as an optional adapter, `MockPaymentServiceImpl` in development, which drives a mock checkout page and simulated webhooks (paid, failed, refunded, disputed, delayed, lost) through the same processing code |
| PAY-3 | Webhook-driven entitlement per [§6.4](#64-payment-rules), including reconciliation |
| PAY-4 | Billing page: plan, expiry date, receipts |

### 7.7 Content operations, admin panel, blog & instrumentation
| ID | Requirement |
|---|---|
| OPS-1 | Content is authored in the admin panel (ADM-2) or imported from versioned content packs (import script); both become revisions that reach users only through the review and publish workflow (ADM-3), and one publisher is the only writer of live content. Content packs remain the import, export and backup format |
| OPS-2 | Publish gate: a problem revision can be published only after its reference solution passes all of its test cases in every launch language and a trivial wrong solution is rejected (negative control). The result is bound to the exact test data, limits and solutions it ran against — any change to them means running it again — and it is run from the admin panel or the publish script |
| OPS-3 | "Report a problem" link on every problem and verdict |
| OPS-4 | Admin actions on users, roles, subscriptions, mock-test sessions and content (create, submit, review, publish, archive, import) are audit-logged |
| ADM-1 | **Admin panel** (admins only, desktop-class): an overview of signups, Weekly Active Solvers, activation, the paywall-to-payment funnel, revenue, Premium users, the Judging Error rate, work queues (content in review, moderation, problem-health flags) and published-content counts; a problem management table (status, open revision, gate result, acceptance, health flag, filters); tables and editors for every content type; the review queue; the moderation queue (COM-4); users (search, detail, Premium grant/revoke); the audit log. An environment badge on every page |
| ADM-2 | **Content authoring** for problems (Markdown statement; limits, points, Free/Premium, topics and provenance; a starter stub per launch language, pasteable as one JSON map; sample and hidden test cases with bulk import; reference solutions in every launch language; the optional editorial), mock tests, hub topics, theory questions, quizzes, design questions, companies and their sourced tags, projects and blog posts — with autosave, conflict detection and a preview as Visitor, Free and Premium |
| ADM-3 | **Review and publish**: every change is a revision (draft → in review → approved → published, or discarded); one open revision per item; a second admin who did not edit it must approve it (a single-admin deployment may allow self-review, which is flagged); a field-by-field diff against the live version; publishing is atomic, and a problem's published test data never changes in place (a fix publishes a new test set, so past verdicts stay reproducible); archive and restore without deleting history |
| ADM-4 | **Admin access**: the `ADMIN` role travels as the token's `role` claim and is re-checked against the account on every admin request, so a removed admin loses access at once; admin rights change only by an audited script; every admin endpoint answers non-admins with `403` and visitors with `401`; admin writes are rate-limited |
| BLOG-1 | **Blog**: public articles by the Semicolan team, written and published through ADM-2 and ADM-3 — a newest-first list and an article page with Markdown, code blocks and diagrams; free to everyone. No comments, uploads or inline images (an optional static cover only), newsletters or scheduled publishing in MVP |
| OPS-5 | Analytics events instrumented at launch and stored in MySQL: `signup`, `first_accepted`, `run`, `submit`, `verdict`, `paywall_view`, `checkout_started`, `payment_success`, `mock_started`, `mock_completed`, `test_finished_early`, `login` (with provider), `quiz_started`, `quiz_completed`, `design_editorial_viewed`, `post_submitted`, `post_published`, plus the client-originated `workspace_opened`, `auth_gate_view` and `editorial_view` (Solution tab opened past the spoiler guard) |

### 7.8 Learning and career modules
| ID | Requirement |
|---|---|
| HUB-1 | **DevOps and Data Science hubs**: each hub is a grid of topics (for example Docker, Kubernetes, Terraform; Statistics, Pandas, Machine Learning) with a count and the user's progress. A topic page has two tabs, **Theory** and **Quiz**. SQL and other Data Science coding problems are excluded (§4) |
| HUB-2 | **Theory**: questions grouped into sections, each with a difficulty badge and a Markdown answer behind a disclosure, external source links, a bookmark and a "mark as learned" toggle. Locked answers show the question and a lock |
| QZ-1 | **Quizzes**: per topic and per design question, multiple-choice sets by level (Easy, Medium, Hard, Mixed). One question at a time, answered once; the server grades each answer and reveals the correct option and an explanation after it is answered; a final score and an attempts history. Correct options are never sent before the question is answered |
| QZ-2 | Quiz scores are practice: they do not count toward the leaderboard or mock tests |
| DES-1 | **System Design (HLD)** and **Low-Level Design (LLD)** modules: a list of questions with difficulty, frequency order and a lock where premium; a viewer with the problem statement and requirements, a **My answer** Markdown notepad saved per user, and the editorial solution (sections with Mermaid diagrams for HLD and code in Java, Python and C++ for LLD), plus an optional quiz (QZ-1). No AI grading or whiteboard |
| CMP-1 | **Company pages**: a directory of companies and a page per company with tabs **Overview** (an original interview-process guide), **Coding**, **System Design** and **Low-Level Design** (the company-tagged questions, ordered by reported frequency), and the company's interview experiences (COM-1). Company names appear as text with a monogram, never as logos |
| CMP-2 | Every company tag carries its source (a published interview experience or an editor's note) and a last-reviewed date; untagged claims are not shown |
| PRJ-1 | **Projects**: take-home and portfolio project briefs (requirements, acceptance checklist, suggested stack, difficulty, estimated hours, an optional starter-repository link), with bookmark and "mark as done". No hosting, review or execution of the user's project |

### 7.9 Community
| ID | Requirement |
|---|---|
| COM-1 | **Interview experiences**: posts with company, level, role, rounds and outcome; sortable by popular or recent and filterable by level and company. Pre-moderated: published after an admin approves it (target within 24 h) |
| COM-2 | **Discussions**: general posts and per-problem discussion threads (linked from the Workspace), published immediately and moderated after the fact |
| COM-3 | Comments (one level of replies), upvotes on posts and comments, edit and delete of one's own content, Markdown without images or raw HTML |
| COM-4 | Safety: report a post or comment; admins hide, restore or reject through the admin API with an audit row; per-user rate limits; an account must be 24 hours old to post; links are `rel="nofollow ugc"`; a published grievance contact (§10) |

### 7.10 Launch readiness
- **Catalog**: ≥ 100 original or licensed problems (≥ 40 free), each passing OPS-2. Founder to confirm feasibility.
- **Editorials** (SOL-1): optional per problem; target an editorial for every free problem, so the Solution tab is not empty in a new user's first session. Founder to confirm.
- **Module content** (founder to confirm each target): DevOps and Data Science — ≥ 8 topics per hub with ≥ 20 theory questions and an Easy quiz each; ≥ 15 HLD and ≥ 15 LLD questions with editorials; ≥ 20 company pages with an original overview; ≥ 6 project briefs. All original or licensed, with provenance recorded.
- **Auth**: Google and GitHub OAuth apps registered for the production domain, the Google consent screen published, and the mock sign-in absent from the production build (verified by test).
- **Community**: moderation queue staffed (target review within 24 h), community guidelines and the grievance contact published.
- **Content operations**: every launch item published through the admin workflow (ADM-3), problems through OPS-2; at least two admin accounts so every publish has a second reviewer (or the single-admin setting consciously enabled and its self-reviews flagged); admin accounts use two-step verification at their identity provider.
- **Payments**: gateway merchant account activated and the real `PaymentService` adapter verified with one live purchase and refund; Terms, Privacy, and Refund policy pages live.
- **Reliability**: [§9](#9-success-metrics) guardrails met in a load test sized for a full mock-test cohort starting at the same moment.
- **Support**: a monitored support email with a defined response time.

## 8. Deferred (Future) — With Entry Gates
Deferred items are not built in MVP. Technical deferrals (Redis, object storage, message brokers, multi-instance deployment and the like) are listed with their triggers in [TRD.md](TRD.md) §7; the MVP keeps the cheap interfaces that leave those paths open.

| Item | Why not MVP | Gate to start |
|---|---|---|
| Auto-renewing subscriptions, plan changes | Dunning, grace periods, mandate compliance | Repurchase data shows demand for convenience |
| Priority code execution (as a user-visible tier) | Needs an execution broker; MVP relies on Judge0's single queue. Internally, in-session attempts are dispatched ahead of practice attempts, with no tier | P95 queue wait exceeds target at peak |
| Guest (logged-out) Run on free problems | Anonymous execution adds an abuse surface and per-device limits | Activation is below target and the auth gate is the measured drop-off |
| **SQL problems** (including the Data Science hub's SQL coding tab) | Judge0 cannot evaluate SQL: it needs a sandboxed database per job, seeded fixtures and result-set comparison | A separate execution engine is designed and load-tested behind `CodeExecutionClient` |
| Data Science coding with pandas / NumPy | Judge0's Python has no scientific stack, and output comparison of data frames needs custom checkers | Same engine decision as SQL |
| Email + password sign-in as a third option | OAuth covers the target users; passwords bring reset flows and credential risk | Sign-in drop-off traced to users without Google or GitHub accounts |
| Admin session void/reset, self-serve extension, admin UI for sessions | Incidents are rare; extension by script covers them | Support volume for session incidents justifies it |
| Granular admin roles (RBAC) | MVP has one admin role | More than one admin function or operator |
| Detailed analytics (topic strength, percentiles) | Needs data volume | ≥ 1,000 monthly active users |
| Per-mock-test and college leaderboards | Engagement add-on | Global leaderboard usage validated |
| Hints, AI hints and an AI assistant (the reference's "Get AI Hint" and assistant rail) | Hints are a second content type; AI needs an LLM vendor, cost controls and abuse limits. Editorials moved into MVP (SOL-1) | Conversion blocked by "I got stuck" feedback after SOL-1 ships |
| Solution visualizer, per-problem source links | Animation authoring per problem; source links imply third-party content | SOL-1 editorial views per solve justify the authoring cost |
| Custom test input on Run ("+ add case") | Needs a test-case-less dispatch path with output but no verdict (UI_UX_Brief §7) | Top-3 request in feedback |
| Curated problem lists ("Top 100"-style), Export PDF | Curation is editorial work; PDF rendering is a new service | Catalog > 200 problems |
| AI whiteboard and AI grading for design answers | Needs an LLM vendor and a canvas editor | DES-1 notepad usage shows demand |
| Resume review, application tracker, project review or hosting | Outside preparation content; review needs reviewers | User interviews ask for them |
| Community extras: notifications, follows, reputation, rewards for sharing experiences (free Premium days), image uploads | Notifications need a delivery service; rewards invite fake posts; images need object storage and scanning | Community weekly posters > 100 |
| Promo banner with coupon codes, notifications bell, live-chat widget | Coupons touch checkout and tax; notifications need a delivery service; chat needs a vendor and staffing | Pricing experiments need coupons; support volume justifies chat |
| Public profiles, badges, followers, reputation | Social features with privacy and abuse surface | Community features are prioritized |
| Admin content extras: scheduled publishing, content calendars, per-line review comments, bulk edits in the panel | Manual publish and file-based bulk edits (export, edit, import) suffice at launch volume | The review queue regularly holds more than a day of work |
| Blog extras: comments, image uploads, newsletters, RSS | The community module already hosts discussion; uploads need object storage | Blog traffic justifies it |
| Learning roadmaps (DAG) | Needs catalog depth and topic tagging | Week-4 retention target met |
| Customizable dashboard (drag-to-reorder and hide sections) | Layout persistence per user for little value at MVP size | Dashboard has more than six sections |
| General aptitude tests (quant, logical reasoning) | The quiz engine (QZ-1) can host them; the cost is content | Demand signal from users |
| Regional-language UI, international payments, college (B2B) plans | Each is a separate bet | Segment metrics and user interviews justify it |
| Moderation tools beyond the queue page (user bans, moderator notes, bulk actions) | The queue and the moderation API suffice at launch | More than one moderator |

## 9. Success Metrics
**North Star: Weekly Active Solvers (WAS)** — users with at least one Accepted submission in a calendar week.

| Stage | Metric | Initial target* |
|---|---|---|
| Acquisition | Weekly signups by source and segment | Tracked; no target until baseline |
| Activation | % of signups with a first Accepted submission within 24 h | ≥ 35% |
| Engagement | Accepted submissions per WAS per week; mock tests started per Premium user per month | ≥ 5; ≥ 2 |
| Retention | Week-1 and Week-4 retention of activated users | ≥ 35%; ≥ 15% |
| Conversion | Free → Premium within 30 days of signup; funnel from `paywall_view` to `checkout_started` to `payment_success` | ≥ 2%; funnel tracked |
| Revenue | Revenue per paying user; repurchase rate within 14 days of expiry | Tracked; ≥ 30% repurchase |

**Guardrails** (must hold at all times)

| Guardrail | Target |
|---|---|
| P95 time from Submit to verdict | ≤ 10 s under normal load |
| Judging Error rate | < 1% of submissions |
| Payment confirmed to access granted | P95 ≤ 60 s; zero paid users without access after 15 min |
| Late mock-test submissions accepted | 0 |
| Problem health | Any problem with < 2% acceptance after ≥ 50 attempts is auto-flagged for review |
| Moderation | Pending interview experiences and open reports reviewed within 24 h |
| Mock integrations | Zero mock sign-ins or mock payments in production (the mock beans and endpoints do not exist there) |
| Unit economics | Infrastructure cost per active user tracked monthly; gross-margin target set after 30 days of cost data |

\*Starting hypotheses; recalibrate after four weeks of real data. Report every metric for the Student segment separately from all others (ACC-3).

## 10. Risks, Assumptions & Dependencies
| Risk / assumption | Impact | Mitigation |
|---|---|---|
| Problems copied from other platforms | Takedown and legal exposure | Original or licensed content only; record the source of every problem |
| Wrong or weak test cases | Loss of trust, support load | OPS-2 publish gate, OPS-3 report link, problem-health flag |
| Leaderboards are gameable (no proctoring) | Credibility | Verified users only; positioned as motivation, not credential; revisit plagiarism detection if scores gain external value |
| Students' willingness to pay is unvalidated | Business model | Pre-launch interviews (≥ 15 target students); test two price points in beta |
| Multi-account abuse of the free tier | Cost, conversion | Email verification, rate limits |
| Load spikes (placement season, simultaneous mock-test starts) on a single Judge0 queue | Slow verdicts, failed tests | Pre-launch load test; per-user rate limits; staggered test windows |
| Gateway onboarding (KYC, policy pages) delays monetization | Revenue launch slips | Start merchant activation at project start, not at the payments phase |
| Privacy and tax compliance (India DPDP Act 2023 including under-18 users; GST invoicing) | Legal exposure | Privacy policy; deletion process (ACC-4); confirm with a legal/tax advisor |
| Launch market is India (INR, UPI, Razorpay) | Shapes payments and content | Confirm; revisit if international users appear |
| **Content volume across six modules** (problems, two hubs, HLD, LLD, companies, projects) | Launch slips, or thin modules look empty | Per-module launch targets (§7.10); hide a module whose target is not met instead of shipping it empty |
| Community abuse and intermediary obligations (India IT Rules 2021: grievance officer, acknowledgement and resolution timelines) | Legal exposure, toxic content | Pre-moderated experiences, reports, rate limits, account-age rule, published grievance contact and SLA; confirm obligations with a legal advisor |
| Company pages: trademark use and accuracy of "asked at" claims | Takedown requests, misleading users | Names as text only, no logos; every tag sourced and dated (CMP-2); original overviews |
| Identity-provider dependency (Google or GitHub outage; GitHub users without a verified email) | Users cannot sign in | Two providers; a clear error for an unverified GitHub email; email + password stays a gated future option (§8) |
| Mock auth or payments reaching production | Anyone could sign in as any user or unlock Premium | Mock beans exist only in `dev`/`test` profiles, the app refuses to start with them under `prod`, and a CI test checks the production image (TRD §5) |
| A compromised or careless admin account | Wrong or malicious content published, Premium granted, data exposed | Four-eyes review for content (ADM-3), the publish gate (OPS-2), the role re-checked on every admin request and changed only by script (ADM-4), sanitized rendering of admin content, rate limits and a full audit log (OPS-4); two-step verification at the identity provider for admin accounts |
| Moving content authoring into the product before launch | A larger MVP | The admin panel reuses the content-pack schemas, the publish gate and one publisher; content packs stay usable as import until the panel ships (Implementation_Plan 7.4–7.7) |

**Dependencies**: Razorpay merchant account (Stripe account only if enabled); Google Cloud OAuth client and GitHub OAuth app; Judge0 hosting; transactional email provider (receipts, expiry reminders, moderation notices).
