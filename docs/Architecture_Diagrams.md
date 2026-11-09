# Architecture Diagrams — Semicolan

Diagrams of the MVP, drawn from the specification documents. They are views, not a second source of truth: when a diagram and a spec disagree, the spec wins and the diagram is fixed.

| Diagram | Source of truth |
|---|---|
| §1 Entity-relationship | [Backend_Schema.md](Backend_Schema.md) (45 tables) |
| §2 System architecture | [TRD.md](TRD.md) §1–§3, §5 |
| §3 Application flow | [App_Flow.md](App_Flow.md) §1–§2, §7 |
| §4 Class diagram (Dependency Inversion) | [TRD.md](TRD.md) §2, [Dev_to_Prod_Strategy.md](Dev_to_Prod_Strategy.md) |

All blocks are standard Mermaid (`erDiagram`, `flowchart`, `sequenceDiagram`, `classDiagram`) and render on GitHub, GitLab and in VS Code with a Mermaid preview.

---

## 1. Entity-Relationship Diagrams

A single diagram of 45 tables is unreadable, so the schema is drawn as five domain views (§1.1–§1.4 and §1.6). `users` and `problems` appear in several views; that is where the domains join. Each entity lists its keys and the columns that explain the relationship, not every column.

**Notation**: `||--o{` one to zero-or-more · `||--|{` one to one-or-more · `|o--o{` optional parent (nullable foreign key) · `||--o|` one to zero-or-one · dotted lines (`..`) are logical links with **no** foreign key.

### 1.1 Identity, billing and operations

```mermaid
erDiagram
    users ||--o{ user_identities : "signs in with (one per provider)"
    users ||--o{ auth_tokens : "holds refresh / exchange tokens"
    users ||--o{ payments : "pays"
    plans ||--o{ payments : "priced by"
    payments ||..o{ payment_events : "matched by provider + order id (no FK)"
    users ||--o{ subscription_reminders : "is reminded"
    users ||--o{ admin_audit_log : "acts as admin"
    users |o--o{ admin_audit_log : "is target of"
    users |o..o{ analytics_events : "user_id, no FK"

    users {
        bigint id PK
        varchar email UK "verified provider email"
        varchar display_name
        enum role "USER | ADMIN"
        enum subscription_status "NONE | ACTIVE | EXPIRED | REVOKED"
        datetime subscription_expires_at
        enum segment "nullable until onboarding"
        datetime onboarded_at
        datetime deleted_at
    }
    user_identities {
        bigint id PK
        bigint user_id FK
        enum provider "GOOGLE | GITHUB"
        varchar provider_subject "sub or numeric id; mock- prefix in dev"
        varchar email
    }
    auth_tokens {
        bigint id PK
        bigint user_id FK
        enum type "REFRESH | OAUTH_EXCHANGE"
        binary token_hash UK "SHA-256"
        datetime expires_at
        datetime used_at
    }
    plans {
        bigint id PK
        varchar code UK
        smallint duration_days
        int price_paise
    }
    payments {
        bigint id PK
        bigint user_id FK
        bigint plan_id FK
        enum provider "RAZORPAY | STRIPE | MOCK"
        varchar gateway_order_id "UK with provider"
        varchar gateway_payment_id "UK with provider"
        enum status "CREATED | PAID | FAILED | REFUNDED | DISPUTED"
    }
    payment_events {
        bigint id PK
        enum provider
        varchar gateway_event_id "UK with provider"
        json payload
        datetime processed_at
    }
    subscription_reminders {
        bigint user_id PK, FK
        datetime expires_at PK
        tinyint days_before PK
    }
    admin_audit_log {
        bigint id PK
        bigint admin_user_id FK
        bigint target_user_id FK
        varchar action
        json details
    }
    analytics_events {
        bigint id PK
        varchar name
        bigint user_id "no FK: events outlive accounts"
        json properties
    }
```

### 1.2 Practice, execution and mock tests

```mermaid
erDiagram
    problems ||--o{ test_cases : "has"
    problems ||--o{ problem_code_stubs : "starts from (per language)"
    problems ||--o| problem_editorials : "explained by"
    problem_editorials ||--o{ problem_editorial_code : "per language"
    problems ||--o{ problem_topics : "tagged"
    topics ||--o{ problem_topics : "groups"
    users ||--o{ user_problem_bookmarks : "bookmarks"
    problems ||--o{ user_problem_bookmarks : "is bookmarked"
    users ||--o{ submissions : "submits"
    problems ||--o{ submissions : "receives"
    mock_test_sessions |o--o{ submissions : "in-test attempts (FK id + user_id)"
    submissions ||--|{ submission_test_results : "fans out to one job per test"
    test_cases ||--o{ submission_test_results : "judged by"
    users ||--o{ user_problem_solves : "first solve (read model)"
    problems ||--o{ user_problem_solves : "solved"
    submissions |o--o| user_problem_solves : "first accepted SUBMIT"
    mock_tests ||--|{ mock_test_problems : "contains"
    problems ||--o{ mock_test_problems : "appears in"
    users ||--o{ mock_test_sessions : "takes"
    mock_tests ||--o{ mock_test_sessions : "instantiated as"

    users {
        bigint id PK
    }
    problems {
        bigint id PK
        varchar slug UK
        enum difficulty "EASY | MEDIUM | HARD"
        boolean is_premium_only
        enum status "DRAFT | PUBLISHED | ARCHIVED"
        smallint live_test_set "test set used by new attempts"
    }
    topics {
        bigint id PK
        varchar slug UK
    }
    problem_topics {
        bigint problem_id PK, FK
        bigint topic_id PK, FK
    }
    test_cases {
        bigint id PK
        bigint problem_id FK
        smallint test_set "UK with problem_id, display_order; frozen once live"
        boolean is_sample
        int display_order
        binary input_sha256
    }
    problem_code_stubs {
        bigint problem_id PK, FK
        enum language PK "c | cpp | java | python"
    }
    problem_editorials {
        bigint problem_id PK, FK
        text approach_markdown
    }
    problem_editorial_code {
        bigint problem_id PK, FK
        enum language PK
    }
    user_problem_bookmarks {
        bigint user_id PK, FK
        bigint problem_id PK, FK
    }
    submissions {
        bigint id PK
        bigint user_id FK
        bigint problem_id FK
        bigint test_session_id FK "nullable"
        varchar client_request_id "UK with user_id"
        enum mode "RUN | SUBMIT | VALIDATE"
        int time_limit_ms "base limits copied at creation"
        enum status "PENDING ... ACCEPTED ... JUDGING_ERROR"
    }
    submission_test_results {
        bigint id PK
        bigint submission_id FK
        bigint test_case_id FK
        enum status
        varchar judge0_token UK
        datetime next_dispatch_at "queue lease"
    }
    user_problem_solves {
        bigint user_id PK, FK
        bigint problem_id PK, FK
        bigint submission_id FK "SET NULL on purge"
        smallint points
        datetime first_accepted_at
    }
    mock_tests {
        bigint id PK
        smallint duration_minutes
        boolean is_premium_only
    }
    mock_test_problems {
        bigint mock_test_id PK, FK
        bigint problem_id PK, FK
        smallint display_order
    }
    mock_test_sessions {
        bigint id PK
        bigint user_id FK
        bigint mock_test_id FK
        datetime start_time
        datetime end_time "deadline, server-owned"
        enum status "IN_PROGRESS | COMPLETED"
        bigint active_user_id UK "generated: one live session per user"
    }
```

### 1.3 Learning modules: hubs, quizzes, design, companies, projects

```mermaid
erDiagram
    hub_topics ||--o{ theory_questions : "has"
    hub_topics |o--o{ quizzes : "owns (XOR)"
    design_questions |o--o{ quizzes : "owns (XOR)"
    quizzes ||--|{ quiz_questions : "has"
    users ||--o{ quiz_attempts : "attempts"
    quizzes ||--o{ quiz_attempts : "attempted as"
    quiz_attempts ||--o{ quiz_attempt_answers : "records (final)"
    quiz_questions ||--o{ quiz_attempt_answers : "answered in"
    users ||--o{ design_answers : "writes notes"
    design_questions ||--o{ design_answers : "has notes"
    companies ||--o{ problem_companies : "asks"
    problems ||--o{ problem_companies : "asked at"
    companies ||--o{ design_question_companies : "asks"
    design_questions ||--o{ design_question_companies : "asked at"
    users ||--o{ user_content_progress : "bookmarks / completes"
    theory_questions ||..o{ user_content_progress : "content_type THEORY (no FK)"
    design_questions ||..o{ user_content_progress : "content_type DESIGN (no FK)"
    projects ||..o{ user_content_progress : "content_type PROJECT (no FK)"

    users {
        bigint id PK
    }
    problems {
        bigint id PK
    }
    hub_topics {
        bigint id PK
        enum hub "DEVOPS | DATA_SCIENCE"
        varchar slug "UK with hub"
    }
    theory_questions {
        bigint id PK
        bigint hub_topic_id FK
        text answer_markdown
        json sources "array of https links"
        boolean is_premium_only
    }
    design_questions {
        bigint id PK
        enum kind "HLD | LLD"
        varchar slug UK
        json requirements
        json solution "editorial, read whole"
        boolean is_premium_only
    }
    design_answers {
        bigint user_id PK, FK
        bigint design_question_id PK, FK
        text answer_markdown "64 KB cap"
        int revision "optimistic concurrency"
    }
    quizzes {
        bigint id PK
        varchar slug UK
        bigint hub_topic_id FK "XOR design_question_id"
        bigint design_question_id FK
        enum level "EASY | MEDIUM | HARD | MIXED"
    }
    quiz_questions {
        bigint id PK
        bigint quiz_id FK
        json options "2 to 6"
        tinyint correct_option "never sent before answering"
    }
    quiz_attempts {
        bigint id PK
        bigint user_id FK
        bigint quiz_id FK
        enum status "IN_PROGRESS | COMPLETED"
        smallint answered_count
        smallint correct_count
        bigint active_quiz_id "generated: UK with user_id"
    }
    quiz_attempt_answers {
        bigint attempt_id PK, FK "FK with quiz_id"
        bigint question_id PK, FK "FK with quiz_id"
        bigint quiz_id FK
        tinyint selected_option
        boolean is_correct
    }
    companies {
        bigint id PK
        varchar slug UK
        varchar name UK "monogram only, no logo"
    }
    problem_companies {
        bigint company_id PK, FK
        bigint problem_id PK, FK
        smallint frequency_rank
        varchar source_note "required"
    }
    design_question_companies {
        bigint company_id PK, FK
        bigint design_question_id PK, FK
        smallint frequency_rank
        varchar source_note "required"
    }
    projects {
        bigint id PK
        enum kind "TAKE_HOME | PORTFOLIO"
        varchar slug UK
        json checklist
        json tech_stack
    }
    user_content_progress {
        bigint user_id PK, FK
        enum content_type PK "THEORY | DESIGN | PROJECT"
        bigint content_id PK "polymorphic, checked in the service"
        datetime bookmarked_at
        datetime completed_at
    }
```

`quizzes` has exactly one owner, a hub topic **or** a design question (`chk_quizzes_owner`). `quiz_attempt_answers` carries `quiz_id` in both composite foreign keys, so the database itself refuses an answer to a question from another quiz. `user_content_progress` is the schema's one deliberate polymorphic reference (Backend_Schema §36).

### 1.4 Community

```mermaid
erDiagram
    users ||--o{ community_posts : "authors"
    users |o--o{ community_posts : "moderates"
    companies |o--o{ community_posts : "experience about"
    problems |o--o{ community_posts : "discussion about"
    community_posts ||--o{ community_comments : "has"
    users ||--o{ community_comments : "writes"
    community_comments |o--o{ community_comments : "reply to (one level, FK id + post_id)"
    users ||--o{ community_post_votes : "upvotes"
    community_posts ||--o{ community_post_votes : "receives"
    users ||--o{ community_comment_votes : "upvotes"
    community_comments ||--o{ community_comment_votes : "receives"
    users ||--o{ community_reports : "reports"
    users |o--o{ community_reports : "resolves"
    community_posts |o--o{ community_reports : "target (XOR)"
    community_comments |o--o{ community_reports : "target (XOR)"

    users {
        bigint id PK
    }
    companies {
        bigint id PK
    }
    problems {
        bigint id PK
    }
    community_posts {
        bigint id PK
        bigint author_id FK
        enum category "INTERVIEW_EXPERIENCE | DISCUSSION"
        bigint company_id FK "required for experiences"
        bigint problem_id FK "discussions only"
        enum status "PENDING_REVIEW | PUBLISHED | REJECTED | HIDDEN | DELETED"
        int upvote_count "denormalized"
        int comment_count "denormalized"
        bigint moderated_by FK
    }
    community_comments {
        bigint id PK
        bigint post_id FK
        bigint author_id FK
        bigint parent_comment_id FK "nullable"
        enum status "PUBLISHED | HIDDEN | DELETED"
        int upvote_count
    }
    community_post_votes {
        bigint user_id PK, FK
        bigint post_id PK, FK
    }
    community_comment_votes {
        bigint user_id PK, FK
        bigint comment_id PK, FK
    }
    community_reports {
        bigint id PK
        bigint reporter_id FK
        bigint post_id FK "XOR comment_id"
        bigint comment_id FK
        enum reason
        enum status "OPEN | ACTIONED | DISMISSED"
        varchar target_ref "generated: UK with reporter_id"
    }
```

### 1.5 Many-to-many relationships

| M:N relationship | Junction table | Extra columns on the link |
|---|---|---|
| Problems ↔ Topics | `problem_topics` | — |
| Mock tests ↔ Problems | `mock_test_problems` | `display_order` |
| Companies ↔ Problems | `problem_companies` | `frequency_rank`, `source_note`, `reviewed_at` |
| Companies ↔ Design questions | `design_question_companies` | `frequency_rank`, `source_note`, `reviewed_at` |
| Users ↔ Problems (bookmarks) | `user_problem_bookmarks` | `created_at` |
| Users ↔ Problems (first solves) | `user_problem_solves` | `points`, `first_accepted_at`, `submission_id` |
| Users ↔ Design questions (notes) | `design_answers` | `answer_markdown`, `revision` |
| Users ↔ Posts / Comments (votes) | `community_post_votes`, `community_comment_votes` | `created_at` |
| Users ↔ Theory / Design / Projects (progress) | `user_content_progress` | `bookmarked_at`, `completed_at` (polymorphic, no FK to content) |
| Test cases ↔ Submissions (judging) | `submission_test_results` | verdict, time, memory, `judge0_token`, queue lease |
| Users ↔ Content revisions (editors) | `content_revision_editors` | `first_edited_at` |

### 1.6 Content operations and blog

The admin panel's workflow ([Admin_Panel_Strategy.md](Admin_Panel_Strategy.md); Backend_Schema §42–§45). A revision points at its live item with no foreign key (`content_type` + `content_id`), like `user_content_progress`; only `ContentPublisher` writes the live tables.

```mermaid
erDiagram
    users ||--o{ content_revisions : "authors"
    users |o--o{ content_revisions : "reviews"
    content_revisions ||--o{ content_revision_editors : "edited by"
    users ||--o{ content_revision_editors : "edits"
    content_revisions ||--o{ problem_validation_attempts : "latest gate run"
    submissions ||--o| problem_validation_attempts : "VALIDATE attempt"
    content_revisions |o..o| problems : "content_id, no FK (also hub topics, quizzes, design, companies, projects, mock tests, blog)"
    content_revisions |o..o{ test_cases : "owns its draft test set (problems)"
    content_revisions |o..o| blog_posts : "published as"

    users {
        bigint id PK
        enum role "USER | ADMIN"
    }
    content_revisions {
        bigint id PK
        enum content_type "PROBLEM, MOCK_TEST, … BLOG_POST"
        bigint content_id "no FK; NULL until a new item is first published"
        smallint revision_no "UK with type, content_id"
        enum status "DRAFT | IN_REVIEW | APPROVED | PUBLISHED | DISCARDED"
        json document "the item in content-pack form"
        int version "optimistic concurrency"
        smallint test_set "problems: the draft set"
        enum gate_status "problems only: NOT_RUN, RUNNING, PASSED, FAILED, ERROR"
        binary gate_fingerprint "SHA-256 of limits, solutions, test digests"
        bigint author_id FK
        bigint reviewer_id FK
        varchar open_item_ref UK "generated: one open revision per item"
    }
    content_revision_editors {
        bigint revision_id PK, FK
        bigint user_id PK, FK
    }
    problem_validation_attempts {
        bigint revision_id PK, FK
        enum kind PK "REFERENCE | NEGATIVE_CONTROL"
        enum language PK
        bigint submission_id UK, FK
    }
    submissions {
        bigint id PK
        enum mode "VALIDATE for gate attempts"
    }
    problems {
        bigint id PK
        smallint live_test_set
    }
    test_cases {
        bigint id PK
        smallint test_set
    }
    blog_posts {
        bigint id PK
        varchar slug UK
        enum status "PUBLISHED | ARCHIVED"
        datetime published_at
    }
```

---

## 2. System Architecture

### 2.1 Components and trust zones

```mermaid
flowchart LR
    subgraph Internet["Public internet"]
        SPA["React SPA<br/>Monaco, Tailwind, lucide-react<br/>(static files)"]
        IDP["Identity providers<br/>Google OIDC · GitHub OAuth<br/>(dev: SPA page /dev/mock-oauth)"]
        PAY["Payment provider<br/>Razorpay · Stripe optional<br/>(dev: SPA page /dev/mock-checkout)"]
    end

    subgraph AppZone["Private application network"]
        PX["Reverse proxy<br/>TLS, SPA fallback, body limits<br/>denies /api/internal/** from the internet"]
        subgraph API["Spring Boot (single instance)"]
            CTRL["REST controllers<br/>/api/**"]
            SVC["Command and query services<br/>entitlement, CQRS-lite"]
            PORTS[["Ports: AuthService · PaymentService<br/>CodeExecutionClient · EmailSender<br/>RateLimiter · AnalyticsPublisher"]]
            JOBS["Scheduled jobs<br/>judge dispatcher · reconciler<br/>mock-test closer · payment reconciliation<br/>subscription sweeper · purges"]
            HOOK["Webhook controllers<br/>/api/webhooks/razorpay · /stripe<br/>/api/internal/judge0/callback"]
        end
        DB[("MySQL 8.4<br/>45 tables, UTC<br/>also the judge queue")]
        MAIL["SMTP provider<br/>(dev: Mailpit)"]
    end

    subgraph JudgeZone["Judge0 zone (untrusted execution)"]
        J0["Judge0 API + workers<br/>isolate sandbox, no network"]
        J0DB[("Judge0 PostgreSQL + Redis<br/>internal to Judge0")]
    end

    SPA -->|"HTTPS JSON, Bearer JWT"| PX --> CTRL
    CTRL --> SVC --> DB
    SVC --> PORTS
    JOBS --> DB
    PORTS -->|"server-to-server code exchange"| IDP
    SPA -.->|"browser redirect / popup"| IDP
    PORTS -->|"create order, fetch order"| PAY
    SPA -.->|"provider checkout"| PAY
    PAY -->|"signed webhook"| PX --> HOOK
    PORTS -->|"POST /submissions/batch<br/>GET /submissions/batch<br/>(AUTHN_TOKEN)"| J0
    J0 -->|"PUT signed callback (hint only)<br/>private path, allowlisted IPs"| HOOK
    J0 --- J0DB
    PORTS --> MAIL
    HOOK --> SVC
```

- The SPA talks only to the REST API. The only browser-to-third-party traffic is the provider sign-in page and the provider checkout.
- Judge0 is an untrusted boundary. It has no route to MySQL or the internet, and the backend never trusts a callback body: a callback only prompts an authenticated read (TRD §3, §5).
- MySQL is both the system of record and the judge queue: there is no message broker in the MVP (TRD §7).

### 2.2 Asynchronous judging (database as queue, callbacks as hints)

```mermaid
sequenceDiagram
    autonumber
    participant SPA as React SPA
    participant API as Spring Boot API
    participant DB as MySQL
    participant DSP as Judge dispatcher (job)
    participant J0 as Judge0
    participant CB as Callback endpoint (/api/internal)
    participant REC as Reconciler (job, every 10 s)

    SPA->>API: POST /api/submissions {problemId, language, sourceCode, mode, clientRequestId}
    API->>API: auth, rate limit, in-flight cap, entitlement or session
    API->>DB: INSERT submissions (PENDING) + N submission_test_results (PENDING), one transaction
    API-->>SPA: 202 Accepted {submissionId}
    loop every 1 s and on commit
        DSP->>DB: claim PENDING rows (priority, lease, SKIP LOCKED)
        DSP->>J0: POST /submissions/batch?base64_encoded=true (wait=false, callback_url per job)
        J0-->>DSP: tokens
        DSP->>DB: store judge0_token, attempt → JUDGING
    end
    J0->>CB: PUT callback?resultId&exp&kid&sig
    CB->>CB: verify HMAC + exp (403 on failure), ignore the body
    CB->>J0: GET /submissions/{stored token} (authoritative read)
    CB->>DB: JudgeResultApplier: lock parent, conditional update, finalize if last
    REC->>J0: GET /submissions/batch for overdue jobs (lost callbacks)
    REC->>DB: apply via the same JudgeResultApplier, or re-dispatch
    loop poll with backoff (1 s, 2 s, 5 s)
        SPA->>API: GET /api/submissions/{id}
        API->>DB: primary-key read
        API-->>SPA: status, per-test results (samples only in detail)
    end
```

---

## 3. Application Flow

The main journey from sign-in through the dashboard and Workspace to a verdict. Hubs, design, companies, projects and community branch off the dashboard and are detailed in App_Flow §10–§14.

```mermaid
flowchart TD
    START(["Open semicolan"]) --> SESS{"Valid session?<br/>silent refresh + GET /api/me"}
    SESS -->|Yes| HOME
    SESS -->|No| LAND["Landing page"]
    LAND -->|"Try a problem now"| WSV["Workspace as visitor<br/>statement + starter code"]
    LAND -->|"Sign in"| DLG

    WSV -->|"Run / Submit"| GATE["Auth gate modal<br/>pending action kept, draft autosaved"]
    GATE --> DLG["Sign-in dialog<br/>Continue with Google · Continue with GitHub"]
    DLG --> POP{"Popup allowed?"}
    POP -->|Yes| PROV["Provider in popup"]
    POP -->|No| REDIR["Full-page redirect with returnTo"]
    REDIR --> PROV
    PROV -->|"dev / test"| MOCK["/dev/mock-oauth: pick a test user"]
    PROV -->|"staging / prod"| CONSENT["Google or GitHub consent"]
    MOCK --> CALLBACK
    CONSENT --> CALLBACK["Backend callback<br/>state check, identity verified"]
    CALLBACK --> VER{"Verified email?"}
    VER -->|No| ERR["Dialog error: verify email on GitHub or use Google"] --> DLG
    VER -->|Yes| RESOLVE["Find identity → link by verified email → create account"]
    RESOLVE --> JWT["One-time code → POST /api/auth/oauth/exchange<br/>JWT access + refresh issued"]
    JWT --> NEW{"needsOnboarding?"}
    NEW -->|Yes| ONB["Onboarding step<br/>display name, segment, college"] --> BACK
    NEW -->|No| BACK{"Pending action?"}
    BACK -->|Yes| RESUME["Back in the Workspace, draft intact<br/>pending Run / Submit resumes"]
    BACK -->|No| HOME

    HOME["Home dashboard<br/>checklist · continue · explore · activity · Premium"] --> CAT["Problem catalog<br/>filters, search, bookmarks"]
    HOME --> OTHER["Hubs · Design · Companies · Projects · Community<br/>(App_Flow §10–§14)"]
    HOME --> MT["Mock test lobby → runner<br/>server-owned deadline"]
    CAT --> ACCESS{"Premium problem<br/>and no entitlement?"}
    ACCESS -->|Yes| PAYWALL["Inline paywall → checkout<br/>(App_Flow §4)"]
    PAYWALL -->|"PAID"| WS
    ACCESS -->|No| WS["Workspace<br/>Description · Solution · Submissions<br/>Monaco + language selector"]
    MT --> WS
    RESUME --> RUNSUB

    WS --> RUNSUB{"Run or Submit"}
    RUNSUB -->|"Run: sample tests"| POST["POST /api/submissions<br/>202 Accepted"]
    RUNSUB -->|"Submit: all tests"| POST
    POST --> POLL["Result panel: Judging…<br/>poll GET /api/submissions/{id}"]
    POLL --> TERM{"Terminal verdict"}
    TERM -->|ACCEPTED| AC["Accepted: time, memory<br/>first Submit solve → points + leaderboard"]
    TERM -->|"WRONG_ANSWER / TLE / RUNTIME_ERROR"| FAIL["Failing test N<br/>sample detail, hidden tests status only"]
    TERM -->|COMPILE_ERROR| CE["Compiler output"]
    TERM -->|JUDGING_ERROR| JE["Our fault: retry, never counts against the user"]
    AC --> NEXT["Next-problem suggestion · Discuss · back to catalog"]
    FAIL --> WS
    CE --> WS
    JE --> WS
    NEXT --> HOME
```

---

## 4. Class Diagram — Dependency Inversion for Authentication and Payments

The domain owns two ports, `AuthService` and `PaymentService`. Controllers and services depend only on those interfaces. Implementations are chosen by configuration (`semicolan.auth.mode`, `semicolan.payments.provider`), and the mock implementations exist only in the `dev` and `test` profiles.

**Naming**: the request called the real adapters `OAuth2ServiceImpl` and `RazorpayServiceImpl`. The specification splits OAuth into one adapter per provider, because Google (OpenID Connect, ID token) and GitHub (plain OAuth 2.0 plus REST calls) verify identity differently. The names follow TRD §2, which the plan's working agreement 6 makes binding:

| Requested name | Name in the spec |
|---|---|
| `OAuth2ServiceImpl` | `GoogleAuthServiceImpl` and `GitHubAuthServiceImpl` |
| `RazorpayServiceImpl` | `RazorpayPaymentServiceImpl` |

### 4.1 Authentication

```mermaid
classDiagram
    direction LR

    class AuthService {
        <<interface>>
        +provider() AuthProvider
        +authorizationUrl(OAuthStart start) URI
        +exchange(String code, OAuthStart start) VerifiedIdentity
    }
    class AuthProvider {
        <<enumeration>>
        GOOGLE
        GITHUB
    }
    class OAuthStart {
        <<record>>
        +String state
        +String pkceVerifier
        +String nonce
        +URI redirectUri
        +String returnTo
        +boolean popup
        +Intent intent
    }
    class VerifiedIdentity {
        <<record>>
        +AuthProvider provider
        +String subject
        +String email
        +boolean emailVerified
        +String displayName
        +URI avatarUrl
    }

    class GoogleAuthServiceImpl {
        -JwksCache googleJwks
        -RestClient http
        +exchange(code, start) VerifiedIdentity
        -validateIdToken(idToken, nonce)
    }
    class GitHubAuthServiceImpl {
        -RestClient http
        +exchange(code, start) VerifiedIdentity
        -primaryVerifiedEmail(accessToken) String
    }
    class MockAuthServiceImpl {
        <<DevOnly>>
        -AuthProvider impersonates
        -MockUserCatalog users
        +exchange(code, start) VerifiedIdentity
        +identityFor(String userKey) VerifiedIdentity
    }

    class AuthController {
        -List~AuthService~ authServices
        +start(provider, returnTo, popup)
        +callback(provider, code, state)
        +exchange(ExchangeRequest)
        +refresh(RefreshRequest)
        +logout(RefreshRequest)
    }
    class MockLoginController {
        <<DevOnly>>
        +mockLogin(MockLoginRequest)
        +mockUsers()
    }
    class UserAccountService {
        +resolve(VerifiedIdentity) User
        +link(User, VerifiedIdentity)
        +unlink(User, AuthProvider)
    }
    class TokenService {
        +issuePair(User) TokenPair
        +issueExchangeCode(User) String
        +redeemExchangeCode(String) TokenPair
        +rotate(String refreshToken) TokenPair
        +revoke(String refreshToken)
    }
    class MockUserSeeder {
        <<DevOnly>>
        +run(ApplicationArguments)
        +reseed()
    }

    AuthService <|.. GoogleAuthServiceImpl : staging, prod
    AuthService <|.. GitHubAuthServiceImpl : staging, prod
    AuthService <|.. MockAuthServiceImpl : dev, test (one per provider)
    AuthService ..> OAuthStart
    AuthService ..> VerifiedIdentity
    VerifiedIdentity --> AuthProvider

    AuthController --> AuthService : depends on the port
    AuthController --> UserAccountService
    AuthController --> TokenService
    MockLoginController --> MockAuthServiceImpl
    MockLoginController --> UserAccountService
    MockLoginController --> TokenService
    MockUserSeeder ..> MockAuthServiceImpl : seeds the same user catalog
```

`TokenService` and `UserAccountService` are never mocked. A mock sign-in produces a real, signed JWT through the same code as production (Dev_to_Prod_Strategy §1.5).

### 4.2 Payments

```mermaid
classDiagram
    direction LR

    class PaymentService {
        <<interface>>
        +provider() PaymentProvider
        +createOrder(Plan plan, Payment payment) GatewayOrder
        +verifyAndParse(byte[] rawBody, Map headers) PaymentEvent
        +fetchOrder(String providerOrderId) GatewayOrderStatus
    }
    class PaymentProvider {
        <<enumeration>>
        RAZORPAY
        STRIPE
        MOCK
    }
    class GatewayOrder {
        <<record>>
        +String providerOrderId
        +Map checkoutPayload
    }
    class PaymentEvent {
        <<record>>
        +PaymentProvider provider
        +String providerEventId
        +PaymentEventType type
        +String providerOrderId
        +String providerPaymentId
        +long amountPaise
        +String currency
    }
    class PaymentEventType {
        <<enumeration>>
        PAID
        FAILED
        REFUNDED
        DISPUTED
        IGNORED
    }
    class GatewayOrderStatus {
        <<record>>
        +PaymentEventType state
        +String providerPaymentId
        +long amountPaid
    }

    class RazorpayPaymentServiceImpl {
        -RazorpayClient client
        -WebhookSecrets secrets
        +verifyAndParse(rawBody, headers) PaymentEvent
    }
    class StripePaymentServiceImpl {
        <<optional>>
        -StripeClient client
        +verifyAndParse(rawBody, headers) PaymentEvent
    }
    class MockPaymentServiceImpl {
        <<DevOnly>>
        -MockOrderStore orders
        -byte[] devWebhookSecret
        +simulate(orderId, outcome, delay, deliver, duplicate)
    }

    class CheckoutService {
        +checkout(User, String planCode) GatewayOrder
    }
    class PaymentWebhookController {
        +razorpay(byte[] body, headers)
        +stripe(byte[] body, headers)
    }
    class PaymentEventProcessor {
        +apply(PaymentEvent event)
    }
    class PaymentReconciliationJob {
        +reconcileCreatedOrders()
    }
    class DevPaymentController {
        <<DevOnly>>
        +simulate(orderId, SimulateRequest)
    }
    class EntitlementService {
        +isPremium(User, Instant now) boolean
    }

    PaymentService <|.. RazorpayPaymentServiceImpl : staging, prod
    PaymentService <|.. StripePaymentServiceImpl : if enabled
    PaymentService <|.. MockPaymentServiceImpl : dev, test
    PaymentService ..> GatewayOrder
    PaymentService ..> PaymentEvent
    PaymentService ..> GatewayOrderStatus
    PaymentEvent --> PaymentEventType

    CheckoutService --> PaymentService : createOrder
    PaymentWebhookController --> PaymentService : verifyAndParse
    PaymentWebhookController --> PaymentEventProcessor
    PaymentReconciliationJob --> PaymentService : fetchOrder
    PaymentReconciliationJob --> PaymentEventProcessor
    DevPaymentController --> MockPaymentServiceImpl
    MockPaymentServiceImpl ..> PaymentEventProcessor : signed simulated event
    PaymentEventProcessor ..> EntitlementService : users row ACTIVE / REVOKED
```

`PaymentEventProcessor` is the only writer of payment state and entitlement. It receives events that `verifyAndParse` has already verified, from the webhook, from reconciliation or from the mock simulator, and applies the same guarded transitions in every case.

### 4.3 Wiring and the production guard

```mermaid
flowchart TD
    CFG["application-{profile}.yml<br/>semicolan.auth.mode · semicolan.payments.provider"] --> COND{"@ConditionalOnProperty"}
    COND -->|"auth.mode = mock<br/>(profiles dev, test)"| MA["MockAuthServiceImpl ×2 (google, github)<br/>MockLoginController · MockUserSeeder"]
    COND -->|"auth.mode = oauth"| RA["GoogleAuthServiceImpl<br/>GitHubAuthServiceImpl"]
    COND -->|"payments.provider = mock<br/>(profiles dev, test)"| MP["MockPaymentServiceImpl<br/>DevPaymentController"]
    COND -->|"payments.provider = razorpay"| RP["RazorpayPaymentServiceImpl"]
    COND -->|"payments.provider = stripe"| SP["StripePaymentServiceImpl"]
    GUARD["ApplicationContextInitializer guard"] -->|"profile staging or prod<br/>and any mock setting or @DevOnly bean"| FAIL(["Startup refused"])
    GUARD -->|"profile staging or prod<br/>and mock- identities, @semicolan.test users<br/>or MOCK payments in the database"| FAIL
    VITE["Frontend build<br/>VITE_ENABLE_DEV_TOOLS=false"] --> TREE["/dev/mock-oauth and /dev/mock-checkout<br/>tree-shaken from the bundle"]
```
