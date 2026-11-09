# Backend Schema Document — Semicolan (MySQL)

**Target engine**: MySQL 8.4 LTS. The DDL needs 8.0.16+ (CHECK constraints) and 8.0.13+ (expression defaults), so it also runs on 8.0; MySQL 8.0 reached end of life in April 2026 under Oracle's lifecycle policy, so the Plan pins `mysql:8.4`.

**Validation status**: reviewed by inspection only — this DDL has not been executed against a live server. The first run of `V1__baseline.sql` on a fresh Testcontainers MySQL (Plan 1.1: migrate, `flyway validate`, Hibernate `validate`) is the real test; fold any finding back into this document.

## 0. Conventions

### 0.1 Engine, types, keys

- Every table is `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`, stated explicitly so a server default can never change it.
- Machine-readable text — slugs, plan codes, gateway IDs, tokens, currency, password hashes — is `ascii` (`ascii_bin` for case-sensitive IDs, `ascii_general_ci` for slugs, so `Two-Sum` and `two-sum` cannot coexist). Digests are `BINARY(32)`. ASCII does not shrink stored bytes (utf8mb4 already stores ASCII in one byte); it caps worst-case key width and temp-table width, avoids Unicode collation surprises, and compares faster.
- `users.email` uses `utf8mb4_0900_as_ci`: case-insensitive, accent-sensitive and NO PAD, so `müller@…` and `muller@…` never collide and a trailing space is never ignored.
- IDs are `BIGINT UNSIGNED AUTO_INCREMENT`. Money is integer paise plus an explicit `currency`. Flags are `BOOLEAN`.
- Large text: `TEXT` (64 KB) only where the application caps far below it (stubs, and stdout/stderr/compile output after the 16 KB truncation in TRD §3). `MEDIUMTEXT` (16 MB) where the cap is 64 KB or more (statements, source code, test payloads). Never `LONGTEXT`. The API caps `sourceCode` at 64 KB (TRD §5) and `TEXT` holds at most 65,535 bytes, so a source exactly at the cap would be rejected by `TEXT`. Strict mode also rejects invalid UTF-8, so truncation must cut on a code-point boundary.
- `ENUM` is for small, closed sets. Values are only ever appended at the end (appending is an in-place metadata change; reordering or renaming rebuilds the table, and `submissions` is the largest table).
- `JSON` only for opaque, append-only documents that are never filtered by an inner key: `payment_events.payload`, `admin_audit_log.details` and `analytics_events.properties`. One more column follows the same read-whole, never-filtered rule: `content_revisions.document` (§42), the draft of one content item. Unlike the three above, it may be rewritten in place, but only while its revision is a `DRAFT`, and is frozen from submission on.
- Names: `idx_` index, `uq_` unique, `fk_` foreign key, `chk_` check, `trg_` trigger. Every foreign-key column has an explicitly declared index with that column first, so no index is created implicitly behind the document's back.

### 0.2 Time: UTC only

The v1 schema mixed `TIMESTAMP` (`submitted_at`) with `DATETIME` (`end_time`). MySQL converts `TIMESTAMP` through the session time zone on every read and write and leaves `DATETIME` untouched, so the mock-test deadline check `submitted_at <= end_time` was off by the session offset (5 h 30 m for IST) whenever the application and the session disagreed. The rules below make that impossible to repeat.

| # | Rule |
|---|---|
| R1 | **One type.** Every temporal column is `DATETIME(3)` holding UTC. `TIMESTAMP` (session-time-zone conversion, overflows in 2038), `DATE`, and `TIME` are not used for instants. |
| R2 | **One clock.** The application's injectable UTC `Clock` is the only source of business time (Plan working agreement 4; TRD §2). Build it with `Clock.tickMillis(ZoneOffset.UTC)` so the application never produces sub-millisecond values, which MySQL would round. The database never invents business time. |
| R3 | **Decision timestamps have no default.** `start_time`, `end_time`, `submitted_at`, `next_dispatch_at`, `first_accepted_at`, `expires_at`, and the like are written by the application from the `Clock`; a forgotten write fails loudly instead of recording the wrong instant (and a simulated test `Clock` stays consistent). Pure audit stamps (`created_at`, `received_at`, `sent_at`) default to `UTC_TIMESTAMP(3)`; the application normally overwrites them with the `Clock` value, so the default only protects raw SQL and seed scripts. |
| R4 | **Ad-hoc SQL uses `UTC_TIMESTAMP(3)`** — never `NOW()`, `CURRENT_TIMESTAMP`, `SYSDATE()`, `CURDATE()`, `CONVERT_TZ()`, `FROM_UNIXTIME()` or `UNIX_TIMESTAMP(column)`, all of which read the session time zone. The single exception is the `updated_at` pair in §1, §4 and §20, `DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`: `ON UPDATE` accepts only the `CURRENT_TIMESTAMP` family, so the default is kept symmetrical; it is safe because of R5. |
| R5 | **Time zones are pinned, not assumed.** Server `default-time-zone = '+00:00'` and `log_timestamps = UTC`; Connector/J `connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true`; Hibernate `hibernate.jdbc.time_zone=UTC`; JVM `-Duser.timezone=UTC`; Java types `Instant` or UTC `OffsetDateTime` only. The app fails its readiness check if the session offset is not zero (verification query 2 below). |
| R6 | **Predicates are sargable.** Use half-open ranges `[from, to)` on the column itself; never `DATE(col)`, `WEEK(col)` or `YEAR(col)`. Local-time bucketing happens in the application and is passed in as UTC instants: the weekly leaderboard window starts at Monday 00:00 Asia/Kolkata = **Sunday 18:30:00.000 UTC**. Day arithmetic (`+ INTERVAL n DAY`) is done in UTC, where a day is always 24 hours. |
| R7 | **The database enforces relations between timestamps, not wall-clock time**: `end_time >= start_time`, `start_time` immutable, `end_time` never later without the admin flag, a session-bound attempt's `submitted_at <= end_time` (triggers). Cross-column time `CHECK`s are used only when both values come from the same statement; otherwise clock skew or a simulated test `Clock` would reject legitimate writes. |

**Verification** (run in CI against the migrated schema, at application start, and from monitoring):

```sql
-- 1. Schema lint: must return zero rows (no TIMESTAMP/DATE/TIME, every DATETIME has precision 3).
SELECT table_name, column_name, column_type
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND (data_type IN ('timestamp', 'date', 'time')
       OR (data_type = 'datetime' AND datetime_precision <> 3));

-- 2. Session clock assertion: must return 0 (the session offset is zero), plus both zones must read '+00:00'.
SELECT TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), NOW()) AS session_offset_seconds,
       @@global.time_zone AS global_tz, @@session.time_zone AS session_tz;

-- 3. Future-timestamp tripwire (production monitoring only; a simulated test Clock legitimately fails it).
--    Must return 0; an IST-as-UTC bug writes values 5 h 30 m ahead and shows up here within minutes.
SELECT (SELECT COUNT(*) FROM submissions WHERE submitted_at > UTC_TIMESTAMP(3) + INTERVAL 5 MINUTE)
     + (SELECT COUNT(*) FROM payments    WHERE created_at   > UTC_TIMESTAMP(3) + INTERVAL 5 MINUTE)
     + (SELECT COUNT(*) FROM auth_tokens WHERE created_at   > UTC_TIMESTAMP(3) + INTERVAL 5 MINUTE) AS future_rows;
```

### 0.3 Delete and cascade policy

- **Users and problems are never hard-deleted once they have history.** Accounts are soft-deleted by anonymizing the row in place (§1 and Rules); problems are retired with `status = 'ARCHIVED'`; mock tests with `is_active = FALSE`.
- Every foreign key that points at `users`, `problems`, `mock_tests`, `mock_test_sessions` or `test_cases` from a table that records history is **`ON DELETE RESTRICT`**. A stray `DELETE` (an ORM `deleteById`, a cleanup script) fails with error 1451 instead of silently erasing submissions, solves, leaderboard points and sessions. v1 cascaded all of that from `users` — and only paying users were accidentally protected, because `payments` was already `RESTRICT`.
- `ON DELETE CASCADE` is kept only for rows that have no meaning without their parent and are not history: credentials (`auth_tokens`), reminder ledger rows, join rows (bookmarks §22, company tags §33–§34, votes §39–§40), credentials and personal notes (`user_identities` §23, `design_answers` §27, `user_content_progress` §36), content owned by a draft problem (topics, stubs, test cases, the editorial and its code, §20–§21), and per-test results of a deleted attempt or answers of a deleted quiz attempt (§31).
- Content of the learning modules (§24–§26, §28–§29, §32, §35), blog posts (§45), content revisions (§42) and community content (§37–§38) is never hard-deleted either: content is `ARCHIVED`, revisions become `DISCARDED` or stay `PUBLISHED` as history, posts and comments become `DELETED` with their text blanked, so attempts, answers, votes and reports keep their parents (`RESTRICT`).
- `ON DELETE SET NULL` is kept in exactly one place: `user_problem_solves.submission_id`, so earned points outlive a purged or erased attempt.
- A hard `DELETE FROM users` therefore succeeds only for an account with no history at all — which is what a purge of never-verified signups needs.

### 0.4 Denormalization register

Everything not listed here is in third normal form. Each exception is deliberate and has one writer.

| Where | Duplicates | Why | Kept correct by |
|---|---|---|---|
| `users.subscription_status`, `subscription_expires_at` | The outcome of `payments` plus admin grants | Entitlement is read on every gated request; admin grants have no payment row, so this is the source of truth, not a cache | The apply-payment rule below; `chk_users_subscription` |
| `submissions.status`, `failed_test_index`, `execution_time_ms`, `memory_kb`, `judged_at` | Aggregate of `submission_test_results` | History lists show them for every attempt without joining N result rows | One writer: finalization (TRD §3 step 7); `chk_submissions_judged` |
| `submissions.user_id` next to `test_session_id` | The session's owner | Makes the composite foreign key possible, so an attempt can only join its own user's session | `fk_submissions_session` |
| `submission_test_results.dispatch_priority` | The parent's `mode` and `test_session_id` | Lets the dispatcher claim in priority order from one index, with no join and no filesort under a locking read | Set once at insert; `chk_str_priority` |
| `user_problem_solves` (whole table, `points`) | `submissions` plus `problems.points` at solve time | The leaderboard read model (TRD §2 CQRS); `points` is a snapshot so re-weighting never rewrites history | One writer: the finalizing transaction |
| `payments.amount_paise`, `currency` | `plans` at purchase time | A receipt must not change when a plan is re-priced | Written at order creation |
| `quiz_attempts.answered_count`, `correct_count` | Count of `quiz_attempt_answers` rows (all / correct) | The attempt list and score show without a join | Written in the same transaction as each answer |
| `community_posts.upvote_count`, `comment_count`; `community_comments.upvote_count` | Rows in §38–§40 | Feeds sort by popularity and show counts without aggregating | Changed only in the vote/comment transaction, and only when a row was actually inserted or deleted |
| `mock_test_sessions.end_time` | `start_time` + the test's duration | The deadline is materialized so later edits to the test cannot move it; early finish and admin extension update it | Set at session creation; see Rules |
| `submissions.time_limit_ms`, `memory_limit_kb` | The problem's base limits (for a `VALIDATE` attempt, the revision's) when the attempt is created | A limit change published mid-flight cannot alter an attempt that is already queued, and the gate tests the limits a revision proposes, not the live ones | Written once at attempt creation |
| `test_cases.input_sha256`, `expected_output_sha256` | SHA-256 of the two payloads | The gate fingerprint, the review diff and duplicate detection compare digests instead of re-reading 256 KB payloads | Written in the same statement as the payload; payload rows of published sets are never updated (§6) |

### 0.5 Evolution rules

- This document is the source of `V1__baseline.sql` until V1 is applied anywhere. After that, every change is a new Flyway migration — never edit an applied one (Plan working agreement 3).
- Adding a language means appending it to the `language` `ENUM` in §10, §17 and §21 in one migration, plus the configuration entries. Adding a status value is an append to its `ENUM`.

## 1. Users

```sql
CREATE TABLE users (
    id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email                   VARCHAR(254) COLLATE utf8mb4_0900_as_ci NOT NULL,
    display_name            VARCHAR(50) NOT NULL,
    avatar_url              VARCHAR(500) CHARACTER SET ascii COLLATE ascii_bin NULL,
    segment                 ENUM('STUDENT', 'PROFESSIONAL', 'OTHER') NULL,
    college                 VARCHAR(255) NULL,
    graduation_year         SMALLINT UNSIGNED NULL,
    role                    ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    subscription_status     ENUM('NONE', 'ACTIVE', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'NONE',
    subscription_expires_at DATETIME(3) NULL,
    email_verified_at       DATETIME(3) NULL,
    onboarded_at            DATETIME(3) NULL,
    deletion_requested_at   DATETIME(3) NULL,
    deleted_at              DATETIME(3) NULL,
    created_at              DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    updated_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_subscription_expiry (subscription_status, subscription_expires_at),
    CONSTRAINT chk_users_display_name CHECK (CHAR_LENGTH(TRIM(display_name)) > 0),
    CONSTRAINT chk_users_graduation_year CHECK (graduation_year IS NULL OR graduation_year BETWEEN 1950 AND 2100),
    CONSTRAINT chk_users_subscription CHECK (
        (subscription_status = 'NONE' AND subscription_expires_at IS NULL)
        OR (subscription_status IN ('ACTIVE', 'EXPIRED') AND subscription_expires_at IS NOT NULL)
        OR subscription_status = 'REVOKED'
    ),
    CONSTRAINT chk_users_onboarded CHECK (onboarded_at IS NULL OR segment IS NOT NULL),
    CONSTRAINT chk_users_erased_pii CHECK (
        deleted_at IS NULL
        OR (avatar_url IS NULL AND college IS NULL AND graduation_year IS NULL
            AND display_name = 'Deleted user' AND email LIKE 'deleted-%@deleted.invalid')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

`role` is authorization only. The plan is never a role: **Premium access = `subscription_status = 'ACTIVE' AND subscription_expires_at > :now`**, evaluated server-side on every gated request. Expiry takes effect at the timestamp itself; a scheduled sweeper only relabels lapsed `ACTIVE` rows as `EXPIRED` for reporting and reminders. `REVOKED` (refund, chargeback, admin action) denies access immediately.

`role` is copied into the access token's `role` claim, but for `/api/admin/**` the API re-reads this column on every request, so a demotion takes effect at once rather than when the token expires (TRD §5; Admin_Panel_Strategy §4.3). The role changes only through `scripts/set-user-role`, which writes a `SET_ROLE` audit row and revokes the user's refresh tokens in the same transaction; no endpoint writes it. There is no separate `is_admin` flag: `role = 'ADMIN'` is the one source.

`display_name` is what the leaderboard shows — never the email. `segment`, `college` and `graduation_year` come from onboarding and drive the Student split in the PRD metrics.

**Sign-in is OAuth only** (PRD ACC-1): there is no password. A user signs in through one or more rows in `user_identities` (§23). `email` is the provider's verified email at account creation, and `email_verified_at` is set in the same statement (a provider that does not assert a verified email cannot create an account, TRD §2), so every non-erased account is verified. `display_name` and `avatar_url` are prefilled from the provider and editable. `segment` stays `NULL` until onboarding, which sets it together with `onboarded_at` (`chk_users_onboarded`); the client shows onboarding while `onboarded_at IS NULL`.

** changes**
- `password_hash` is gone with email + password sign-in. "An active account has at least one identity" spans two tables, so the service enforces it (unlinking the last identity is refused, API_Contract §1).
- `chk_users_erased_pii` makes a half-done anonymization impossible: a row with `deleted_at` set must already have no avatar, college or graduation year, the fixed display name and a `deleted-…@deleted.invalid` email. `email_verified_at` is intentionally not cleared, so the anonymized row stays on the leaderboard as "Deleted user" (App_Flow §5, PRD §6.3).
- `chk_users_subscription` encodes the state table in PRD §6.2 and the API contract (`expiresAt` is `null` only if the user never purchased).
- Index review: the leaderboard joins by primary key and the deletion script is rare, so no further index is justified at this size.

## 2. AuthTokens

```sql
CREATE TABLE auth_tokens (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    type       ENUM('REFRESH', 'OAUTH_EXCHANGE') NOT NULL,
    token_hash BINARY(32) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    used_at    DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    PRIMARY KEY (id),
    UNIQUE KEY uq_auth_tokens_hash (token_hash),
    KEY idx_auth_tokens_user_type (user_id, type),
    KEY idx_auth_tokens_expiry (expires_at),
    CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Both token types are opaque random values stored only as a SHA-256 digest, and each is single-use (`used_at`). `OAUTH_EXCHANGE` is the one-time code the OAuth callback hands the SPA (60-second `expires_at`), traded once for the JWT pair (TRD §5). Refresh tokens rotate on every refresh. Reuse of a consumed refresh token inside the leeway (10 s by default, TRD §2) returns a fresh pair; reuse outside it revokes all of that user's refresh tokens.

** changes**
- `token_hash` is `BINARY(32)`, the raw digest (`MessageDigest.digest()` with no hex step). The v1 `CHAR(64)` index entry was twice the size, and MySQL budgets `CHAR` columns at four bytes per character in key-length and temp-table calculations.
- `idx_auth_tokens_expiry` supports the purge. Refresh rotation creates a row per refresh, so this table churns fastest of all. Consumed rows must be kept until their own `expires_at`, because reuse detection and the leeway read them; purge by `expires_at`, never by `used_at`.

## 3. Topics

```sql
CREATE TABLE topics (
    id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug VARCHAR(60) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_topics_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Topics back the catalog's topic filter (PRD CAT-1) and are the natural node set if learning roadmaps are added later. The slug is ASCII and shorter than v1's 100 characters; it is a URL key, not display text.

## 4. Problems

```sql
CREATE TABLE problems (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug                 VARCHAR(120) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    title                VARCHAR(255) NOT NULL,
    description_markdown MEDIUMTEXT NOT NULL,
    difficulty           ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    points               SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    time_limit_ms        INT UNSIGNED NOT NULL DEFAULT 2000,
    memory_limit_kb      INT UNSIGNED NOT NULL DEFAULT 131072,
    is_premium_only      BOOLEAN NOT NULL DEFAULT FALSE,
    status               ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    live_test_set        SMALLINT UNSIGNED NULL,
    content_source       VARCHAR(255) NOT NULL DEFAULT 'ORIGINAL',
    created_at           DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_problems_slug (slug),
    KEY idx_problems_catalog (status, difficulty),
    CONSTRAINT chk_problems_points CHECK (points > 0),
    CONSTRAINT chk_problems_limits CHECK (time_limit_ms > 0 AND memory_limit_kb > 0),
    CONSTRAINT chk_problems_live_set CHECK (status = 'DRAFT' OR live_test_set IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

- `points` is what one solve is worth on the leaderboard and in mock tests: set at authoring from the difficulty (Easy 1 / Medium 2 / Hard 3) and adjustable per problem.
- `time_limit_ms` and `memory_limit_kb` are base limits; the effective limit for a job is the base times the per-language multiplier from configuration (PRD EXE-2), clamped to Judge0's caps (TRD §3). Each attempt copies the base limits when it is created (§10), so the dispatcher never reads them from here.
- Only `PUBLISHED` problems are visible. A problem leaves `DRAFT` only through `ContentPublisher`, when a revision that passed the publish gate (PRD OPS-2) and review (ADM-3) is published (§42; Admin_Panel_Strategy §2.7). The gate also verifies what the schema cannot: a stub row for every launch language in §17 and at least one sample and one hidden test case in the test set.
- `live_test_set` names the test set (§6) that new `RUN` and `SUBMIT` attempts use. It is `NULL` only while the problem has never been published (`chk_problems_live_set`). Publishing a revision sets it to that revision's set in the same transaction, so users switch from the old tests to the new ones atomically.
- A `DRAFT` row is the problem's **anchor**: created with the first revision (`POST /api/admin/problems`) to reserve the slug and to give the revision's test data and its validation attempts a problem to reference. It starts with the slug, title and difficulty of the create request, an empty statement and the default limits; everything else is written at the first publish, and every public read filters on `status = 'PUBLISHED'`.
- `content_source` records provenance (`ORIGINAL`, or the licence/source reference).
- Problems with history are archived, never deleted (§0.3).

** changes**
- `base_code_stubs JSON` moved to §17. It was a repeating group keyed by language (a first-normal-form violation) that could not be validated, joined or partially updated.
- `description_markdown` is `MEDIUMTEXT`, not `LONGTEXT` (4 GB). `slug` is ASCII and 120 characters instead of 255 `utf8mb4`.
- `memory_limit_kb` defaults to 128 MB. TRD §3 points out that the old default of 262,144 KB times a ×2 language multiplier exceeds Judge0's default 512,000 KB cap.
- `CHECK`s reject non-positive points and limits.

## 5. ProblemTopics

```sql
CREATE TABLE problem_topics (
    problem_id BIGINT UNSIGNED NOT NULL,
    topic_id   BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (problem_id, topic_id),
    KEY idx_problem_topics_topic (topic_id),
    CONSTRAINT fk_problem_topics_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE,
    CONSTRAINT fk_problem_topics_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The primary key answers "topics of a problem"; `idx_problem_topics_topic` (which carries `problem_id` as the implicit primary-key suffix) answers "problems of a topic" without touching the base table.

## 6. TestCases

```sql
CREATE TABLE test_cases (
    id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    problem_id              BIGINT UNSIGNED NOT NULL,
    test_set                SMALLINT UNSIGNED NOT NULL,
    input_payload           MEDIUMTEXT NOT NULL,
    expected_output_payload MEDIUMTEXT NOT NULL,
    input_sha256            BINARY(32) NOT NULL,
    expected_output_sha256  BINARY(32) NOT NULL,
    is_sample               BOOLEAN NOT NULL DEFAULT FALSE,
    display_order           INT UNSIGNED NOT NULL,
    created_at              DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    PRIMARY KEY (id),
    UNIQUE KEY uq_test_cases_set_order (problem_id, test_set, display_order),
    KEY idx_test_cases_set_sample (problem_id, test_set, is_sample, display_order),
    CONSTRAINT fk_test_cases_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE,
    CONSTRAINT chk_test_cases_set CHECK (test_set > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Both payload columns hold the raw content as `MEDIUMTEXT`. Ingestion — the admin API and the content-pack importer alike (Admin_Panel_Strategy §2.3) — accepts valid UTF-8 without NUL or other control characters except tab, line feed and carriage return, normalizes CRLF and lone CR to LF, changes nothing else, and caps each input and expected output at 256 KB (`TEST_PAYLOAD_MAX_BYTES`) after normalization, far below the column limit, because every Judge0 job carries them inline. The two digests are written with the payloads. Hidden test cases (`is_sample = FALSE`) are never exposed through any user-facing API; only the admin content API returns them, to admins (TRD §5). Samples back Run and the examples on the problem page.

**Test sets.** A problem's tests are versioned as numbered sets. `problems.live_test_set` names the set that new attempts use; a revision of the problem owns one draft set, numbered `MAX(test_set) + 1` for that problem when the revision is opened and filled with a copy of the live set's rows (Admin_Panel_Strategy §2.8). Every read of tests names its set: the judge reads `WHERE problem_id = :p AND test_set = :set ORDER BY display_order` (`uq_test_cases_set_order`), and the problem page reads the live set's samples (`idx_test_cases_set_sample`). **A set whose number is at or below `live_test_set` is frozen**: `ContentPublisher` and the admin API never update or delete its rows. That is how published test data does not change in place (TRD §4) — a fixed expected output is a new set, and every past verdict stays reproducible against the rows it was judged on. A draft set's rows are edited freely until its revision is published; discarding the revision deletes them (its validation attempts are deleted first, §44).

** changes**
- Payloads are `MEDIUMTEXT`. `TEXT` stops at 65,535 bytes, so a stress test with a 10⁵-element array would have been rejected (or truncated, in a non-strict session) by v1.
- `uq_test_cases_set_order` makes `display_order` unique per problem and set. "The first failing test by `display_order`" and `failed_test_index` are otherwise ambiguous, and ties would make verdicts non-deterministic. It also serves ordered reads of all tests of a set (the judge) and replaces v1's redundant `idx_test_cases_problem (problem_id)`.
- `idx_test_cases_set_sample` ends with `display_order`, so the sample fetch comes back ordered without a sort.
- A test case that has been judged cannot be deleted, because `submission_test_results.test_case_id` is `RESTRICT` (§11). Frozen sets never need to be: superseded sets stay as history. A superseded set that no remaining result row references (its `RUN`s purged, no `SUBMIT` against it) may be deleted by an operator as a storage clean-up.

## 7. MockTests

```sql
CREATE TABLE mock_tests (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title            VARCHAR(255) NOT NULL,
    duration_minutes SMALLINT UNSIGNED NOT NULL,
    is_premium_only  BOOLEAN NOT NULL DEFAULT TRUE,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    active_free_slot TINYINT GENERATED ALWAYS AS (IF(is_active AND NOT is_premium_only, 1, NULL)) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mock_tests_one_free (active_free_slot),
    CONSTRAINT chk_mock_tests_duration CHECK (duration_minutes > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The single designated free test (PRD MT-5) is the one active row with `is_premium_only = FALSE`; every other test is Premium-only.

** changes**
- `uq_mock_tests_one_free` enforces "at most one active free test". The generated column is `NULL` for every other row and a unique index allows any number of `NULL`s, so a second free test (a revenue leak) is rejected by the database. Drop it if the product ever offers more than one.
- `is_active` is the retire switch. Tests with sessions can no longer be deleted (`RESTRICT` in §9), because PRD §6.3 says completed reports are retained. `duration_minutes` is `SMALLINT UNSIGNED` with a positive-value check.

## 8. MockTestProblems

```sql
CREATE TABLE mock_test_problems (
    mock_test_id  BIGINT UNSIGNED NOT NULL,
    problem_id    BIGINT UNSIGNED NOT NULL,
    display_order SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (mock_test_id, problem_id),
    UNIQUE KEY uq_mtp_order (mock_test_id, display_order),
    KEY idx_mtp_problem (problem_id),
    CONSTRAINT fk_mtp_mock_test FOREIGN KEY (mock_test_id) REFERENCES mock_tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_mtp_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

A problem that belongs to a mock test cannot be deleted (`RESTRICT`); archive it. Publish a new test instead of editing the problem set of one that already has sessions, so past reports stay reproducible. `uq_mtp_order` gives the runner's problem switcher a deterministic order.

## 9. MockTestSessions

```sql
CREATE TABLE mock_test_sessions (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id        BIGINT UNSIGNED NOT NULL,
    mock_test_id   BIGINT UNSIGNED NOT NULL,
    start_time     DATETIME(3) NOT NULL,
    end_time       DATETIME(3) NOT NULL,
    status         ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
    score          SMALLINT UNSIGNED NULL,
    active_user_id BIGINT UNSIGNED GENERATED ALWAYS AS (IF(status = 'IN_PROGRESS', user_id, NULL)) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mts_id_user (id, user_id),
    UNIQUE KEY uq_mts_one_active_per_user (active_user_id),
    KEY idx_mts_user_test (user_id, mock_test_id, status),
    KEY idx_mts_mock_test (mock_test_id),
    KEY idx_mts_due (status, end_time),
    CONSTRAINT fk_mts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_mts_mock_test FOREIGN KEY (mock_test_id) REFERENCES mock_tests (id) ON DELETE RESTRICT,
    CONSTRAINT chk_mts_window CHECK (end_time >= start_time),
    CONSTRAINT chk_mts_score CHECK (score IS NULL OR status = 'COMPLETED')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

`start_time` and `end_time` are UTC, written by the service from the `Clock` — `end_time = start_time + mock_tests.duration_minutes` — and never supplied by the client (R2, R3). This is the authoritative deadline behind the backend-timer rule in PRD MT-2 and App_Flow §3. Entitlement is checked once, when the session is created, so a session in progress can finish even if Premium lapses.

`COMPLETED` with `score IS NULL` is the "finalizing" state in TRD §2: the score is written once, after every attempt received at or before `end_time` is terminal. `chk_mts_score` forbids a score on a session that is still running.

** changes**
- `uq_mts_one_active_per_user` is a database backstop for "start is idempotent and one-at-a-time" (TRD §2, App_Flow §3.1). The generated column equals `user_id` only while the session is `IN_PROGRESS`, so a user can hold at most one running session; double-clicks and parallel requests cannot create two clocks, even if the service-level user lock is ever skipped. Look up the active session with `WHERE active_user_id = :me` — the index is only used when the query names that column.
- `uq_mts_id_user (id, user_id)` exists solely so `submissions` can reference the pair (§10). It is redundant for uniqueness.
- `trg_mock_test_sessions_bu` (see Triggers) freezes `user_id`, `mock_test_id` and `start_time` and refuses to move `end_time` later unless an admin extension sets its flag: no ordinary code path can reset a running clock, whichever end of it it touches.
- `score` is `SMALLINT UNSIGNED` (an integer point total), not `DECIMAL(5,2)`. v1's own text defines it as a sum of integer points.
- `created_at` is dropped: a session is born at `start_time`, and two timestamps for one event can only disagree. The Mock Tests list is served by `idx_mts_user_test`; the due-session closer by `idx_mts_due`.
- `end_time` stays a plain, writable column on purpose: early finish (App_Flow §3.2) shortens it, and the audit-logged admin extension script can lengthen it behind the trigger's explicit flag.

## 10. Submissions

```sql
CREATE TABLE submissions (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id           BIGINT UNSIGNED NOT NULL,
    problem_id        BIGINT UNSIGNED NOT NULL,
    test_session_id   BIGINT UNSIGNED NULL,
    client_request_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
    mode              ENUM('RUN', 'SUBMIT', 'VALIDATE') NOT NULL DEFAULT 'SUBMIT',
    language          ENUM('c', 'cpp', 'java', 'python') NOT NULL,
    source_code       MEDIUMTEXT NOT NULL,
    time_limit_ms     INT UNSIGNED NOT NULL,
    memory_limit_kb   INT UNSIGNED NOT NULL,
    status            ENUM('PENDING', 'JUDGING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED',
                           'RUNTIME_ERROR', 'COMPILE_ERROR', 'JUDGING_ERROR') NOT NULL DEFAULT 'PENDING',
    failed_test_index SMALLINT UNSIGNED NULL,
    execution_time_ms INT UNSIGNED NULL,
    memory_kb         INT UNSIGNED NULL,
    compile_output    TEXT NULL,
    submitted_at      DATETIME(3) NOT NULL,
    judged_at         DATETIME(3) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_submissions_client_request (user_id, client_request_id),
    KEY idx_submissions_user_history (user_id, mode, submitted_at),
    KEY idx_submissions_user_problem (user_id, problem_id, mode, submitted_at),
    KEY idx_submissions_user_status (user_id, status, mode),
    KEY idx_submissions_problem (problem_id, mode, status),
    KEY idx_submissions_session (test_session_id, user_id, problem_id, status),
    KEY idx_submissions_stuck (status, submitted_at),
    KEY idx_submissions_run_purge (mode, submitted_at),
    CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_submissions_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE RESTRICT,
    CONSTRAINT fk_submissions_session FOREIGN KEY (test_session_id, user_id)
        REFERENCES mock_test_sessions (id, user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_submissions_failed_index CHECK (failed_test_index IS NULL OR failed_test_index >= 1),
    CONSTRAINT chk_submissions_judged CHECK ((status IN ('PENDING', 'JUDGING')) = (judged_at IS NULL)),
    CONSTRAINT chk_submissions_limits CHECK (time_limit_ms > 0 AND memory_limit_kb > 0),
    CONSTRAINT chk_submissions_validate CHECK (mode <> 'VALIDATE' OR (test_session_id IS NULL AND client_request_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

One row is one attempt. `mode = 'RUN'` executes the sample test cases only; it is temporary (purged after 24 hours) and never appears in history or the leaderboard. `mode = 'SUBMIT'` judges every test case and is permanent history. `mode = 'VALIDATE'` is a publish-gate attempt (PRD OPS-2; Admin_Panel_Strategy §2.6): created only by `PublishGateService`, never through `POST /api/submissions`, for an admin as `user_id`, against a problem revision's draft test set and with the revision's limits. It records no solve, emits no analytics, is invisible to `/api/submissions` (`404`), is not counted by the in-flight cap or the problem-health report, and is linked to its revision through §44, which deletes it when the revision starts a new gate run or is discarded.

Which tests an attempt runs is fixed when it is created: its result rows reference the test cases of the problem's live set (for `VALIDATE`, the revision's set), so publishing a new set never changes an attempt already in flight. `time_limit_ms` and `memory_limit_kb` are the base limits copied in the same insert — from the problem, or from the revision for `VALIDATE` — and the dispatcher multiplies them per language (TRD §3). `status` is the aggregated verdict derived from the per-test rows in §11; `failed_test_index` is the 1-based position (by `display_order`) of the first failing test, and time and memory are the maximum across tests. Source code and verdicts stay readable after a subscription lapses (PRD §6.3).

`submitted_at` is the **arrival time**: stamped when the request enters the server, before any queueing or retry, and passed explicitly (TRD §2). It has no default (R3). `client_request_id` is the idempotency key from TRD §3 step 1 / App_Flow §2.6; it is `NULL` for attempts created without one, and the unique key guarantees a repeated `(user_id, client_request_id)` can never create a second attempt (see the idempotent-creation rule).

`language` stores the stable launch-language slug — the same key as `baseCodeStubs` in the API — instead of v1's Judge0 `language_id`. The API contract says Judge0 IDs come from configuration and differ per deployed Judge0 version; persisting them would leave old history pointing at IDs the next `GET /api/languages` no longer lists. The service maps slug ↔ Judge0 ID at the boundary (`LANGUAGE_IDS` in the Plan's configuration inventory), so `languageId` in the API is unchanged.

** changes**
- All foreign keys that point at history are `RESTRICT` (§0.3); v1 cascaded from `users` and `problems`, so one `DELETE` could erase a user's history, results and leaderboard points.
- `fk_submissions_session` is composite: an attempt can only join a session owned by the same user, so a session ID from another user cannot be attached even if the service check has a bug. A `NULL` `test_session_id` skips the check (practice attempts).
- `source_code` is `MEDIUMTEXT` (see §0.1 for the 64 KB cap cliff of `TEXT`). `failed_test_index`, time and memory are unsigned.
- `chk_submissions_judged`: an attempt has a verdict time exactly when it is terminal. The sweeper, the reconciler and every failure path must set `judged_at` when they set a final status; the "submit → verdict" latency guardrail (PRD §9) is computed from it.
- `trg_submissions_bi` (see Triggers) backs the PRD guardrail "late mock-test submissions accepted = 0" at the database.
- Indexes (the table takes the most writes after §11, so each exists for a named access path):
  - `idx_submissions_user_history` — `GET /api/submissions` for a user, `SUBMIT` only, newest first. Equality on `user_id` and `mode`, then the index order *is* the sort order (the implicit primary-key suffix breaks `submitted_at` ties), so there is no filesort and the cost is the page size.
  - `idx_submissions_user_problem` — the same list filtered by `problemId`, which is the Workspace History tab (App_Flow §2.5) and so hot. v1 would have scanned all of the user's attempts and fetched each row to filter by problem.
  - `idx_submissions_user_status` — the per-user in-flight cap (TRD §5), evaluated on every Run/Submit; `mode` is its last column so the cap, which counts only `RUN` and `SUBMIT`, stays index-only for an admin who also has gate attempts in flight.
  - `idx_submissions_problem` — the foreign key to `problems` (v1 relied on an implicit, undeclared index) and the problem-health report (PRD §9: acceptance below 2% after at least 50 attempts), which it covers without touching the table.
  - `idx_submissions_session` — the composite foreign key, the runner's per-problem status, and scoring; all of its columns are in the index.
  - `idx_submissions_stuck` — the stuck-attempt sweep. `idx_submissions_run_purge` — the batched 24-hour `RUN` purge.
  - `uq_submissions_client_request` — idempotent creation.

## 11. SubmissionTestResults

```sql
CREATE TABLE submission_test_results (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    submission_id     BIGINT UNSIGNED NOT NULL,
    test_case_id      BIGINT UNSIGNED NOT NULL,
    status            ENUM('PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED',
                           'RUNTIME_ERROR', 'COMPILE_ERROR', 'JUDGING_ERROR', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    dispatch_priority TINYINT UNSIGNED NOT NULL,
    dispatch_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    next_dispatch_at  DATETIME(3) NOT NULL,
    dispatched_at     DATETIME(3) NULL,
    judge0_token      VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
    execution_time_ms INT UNSIGNED NULL,
    memory_kb         INT UNSIGNED NULL,
    stdout            TEXT NULL,
    stderr            TEXT NULL,
    judged_at         DATETIME(3) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_str_attempt_case (submission_id, test_case_id),
    UNIQUE KEY uq_str_judge0_token (judge0_token),
    KEY idx_str_dispatch (status, dispatch_priority, next_dispatch_at),
    KEY idx_str_reconcile (status, dispatched_at, dispatch_priority),
    KEY idx_str_test_case (test_case_id),
    CONSTRAINT fk_str_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_str_test_case FOREIGN KEY (test_case_id) REFERENCES test_cases (id) ON DELETE RESTRICT,
    CONSTRAINT chk_str_priority CHECK (dispatch_priority IN (0, 1, 2, 3)),
    CONSTRAINT chk_str_judged CHECK ((status = 'PENDING') = (judged_at IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Judge0 evaluates one stdin/expected-output pair per job, so an attempt fans out into one row per test case, and **this table is the dispatch queue** (TRD §3: the database is the queue). `resultId` in the signed `callback_url` is this row's `id`. `judge0_token` is written by the dispatcher from the batch response only — never from a callback (TRD §5) — and replaced on re-dispatch, which is why it is unique and nullable. `stdout` and `stderr` are stored only for sample test cases; for hidden cases only status, time and memory are kept, so hidden data cannot leak through the API. The one exception is a `VALIDATE` attempt (§10), which keeps truncated output for every test so the gate report can show expected against actual; it is readable only through the admin API.

Queue columns:
- `dispatch_priority`: `0` in-session attempt, `1` `SUBMIT`, `2` `RUN`, `3` `VALIDATE` — copied from the parent at insert so the claim query needs no join (§0.4). Gate attempts are therefore always dispatched after every user attempt, within their own in-flight budget (`VALIDATION_MAX_INFLIGHT_JOBS`), and the backlog count behind `503 EXECUTION_BUSY` excludes them (Query Patterns), so publishing content never slows or refuses a student.
- `next_dispatch_at`: the one "claimable at" time. Now for a fresh row; pushed into the future as a lease on claim, as exponential backoff after a transient failure, and as the reconcile horizon after a successful dispatch.
- `dispatch_attempts`: re-dispatches so far (at most two re-dispatches per job, TRD §3). `dispatched_at`: when the stored token was acknowledged, read by the reconciler.

** changes**
- `next_dispatch_at` is `DATETIME(3)` with **no default**: `DEFAULT CURRENT_TIMESTAMP` would read the session clock (breaking R1 and R4) and, under a simulated test `Clock`, would stamp real time that is never "due". The application writes it.
- `idx_str_dispatch` serves the claim query exactly (see Query Patterns): equality on `status`, then the index order is the priority order, so `SELECT … FOR UPDATE SKIP LOCKED … LIMIT n` stops after `n` rows and locks only those. A claim that needs a filesort (for example an `ORDER BY` on a join expression) locks every row it examined and stalls the callbacks that are trying to apply results.
- `idx_str_reconcile` serves the reconciler's overdue read and, being index-only, the in-flight and backlog counts behind admission control (TRD §6); `dispatch_priority` is its last column so those counts can separate gate jobs from user jobs without touching the table.
- `fk_str_test_case` is `RESTRICT` (a judged test case cannot be deleted, so history stays reproducible); `idx_str_test_case` exists only to support that foreign key and is the first index to drop if write cost on this table ever matters more than the guarantee.
- `judge0_token` stays `VARCHAR(64)` but is ASCII, which removes the 256-byte worst-case key width. `chk_str_judged` mirrors `chk_submissions_judged`.
- `SKIPPED` is the terminal status for result rows that never needed to run. When an attempt finalizes early on `COMPILE_ERROR` (TRD §3 step 7), the finalizing transaction sets its still-`PENDING` rows to `SKIPPED` and stamps `judged_at`, so the dispatcher and reconciler never see them and `chk_str_judged` holds. A late Judge0 result for such a row matches no `PENDING` row in the conditional update and is dropped. `SKIPPED` was appended at the end of the `ENUM` (an in-place change), and the API omits these rows from `testResults`.

## 12. UserProblemSolves

```sql
CREATE TABLE user_problem_solves (
    user_id           BIGINT UNSIGNED NOT NULL,
    problem_id        BIGINT UNSIGNED NOT NULL,
    submission_id     BIGINT UNSIGNED NULL,
    points            SMALLINT UNSIGNED NOT NULL,
    first_accepted_at DATETIME(3) NOT NULL,
    PRIMARY KEY (user_id, problem_id),
    KEY idx_ups_window (first_accepted_at, user_id, points),
    KEY idx_ups_problem (problem_id),
    KEY idx_ups_submission (submission_id),
    CONSTRAINT fk_ups_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ups_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ups_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE SET NULL,
    CONSTRAINT chk_ups_points CHECK (points > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The leaderboard read model (CQRS, TRD §2): one row per user and problem, inserted in the same transaction that finalizes a first `ACCEPTED` `SUBMIT`. `points` snapshots `problems.points` at solve time, so re-weighting never rewrites history. The weekly board counts rows whose `first_accepted_at` falls in the window, so re-solving never double-counts, and leaderboard reads never scan `submissions`.

** changes**
- `INSERT IGNORE` is replaced by a duplicate-key no-op (Rules): `INSERT IGNORE` also swallows foreign-key and truncation errors and would silently drop a solve.
- Foreign keys to `users` and `problems` are `RESTRICT`: points earned must not vanish with a deleted problem or account. The only `SET NULL` is `submission_id`, so points outlive a purged attempt.
- `idx_ups_window (first_accepted_at, user_id, points)` is kept: with the implicit `(user_id, problem_id)` suffix it covers the weekly aggregate completely (index-only). `idx_ups_problem` and `idx_ups_submission` are the previously implicit foreign-key indexes, now declared.
- `first_accepted_at` has no default (R3); the finalizing transaction passes it. A future Redis projector would read the same table (Future Scope, TRD §7).

## 13. Plans

```sql
CREATE TABLE plans (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code          VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    name          VARCHAR(100) NOT NULL,
    duration_days SMALLINT UNSIGNED NOT NULL,
    price_paise   INT UNSIGNED NOT NULL,
    currency      CHAR(3) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'INR',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    PRIMARY KEY (id),
    UNIQUE KEY uq_plans_code (code),
    CONSTRAINT chk_plans_duration CHECK (duration_days > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Plans are rows, not code (PRD §6.1), so pricing can change without a deploy. Deactivate (`is_active = FALSE`) rather than delete — `payments` reference plans. Amounts are integer paise with an explicit `currency`.

## 14. Payments

```sql
CREATE TABLE payments (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id            BIGINT UNSIGNED NOT NULL,
    plan_id            BIGINT UNSIGNED NOT NULL,
    provider           ENUM('RAZORPAY', 'STRIPE', 'MOCK') NOT NULL,
    gateway_order_id   VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    gateway_payment_id VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NULL,
    amount_paise       INT UNSIGNED NOT NULL,
    currency           CHAR(3) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'INR',
    status             ENUM('CREATED', 'PAID', 'FAILED', 'REFUNDED', 'DISPUTED') NOT NULL DEFAULT 'CREATED',
    created_at         DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    paid_at            DATETIME(3) NULL,
    refunded_at        DATETIME(3) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payments_gateway_order (provider, gateway_order_id),
    UNIQUE KEY uq_payments_gateway_payment (provider, gateway_payment_id),
    KEY idx_payments_user (user_id, created_at),
    KEY idx_payments_plan (plan_id),
    KEY idx_payments_reconcile (status, created_at),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE RESTRICT,
    CONSTRAINT chk_payments_amount CHECK (amount_paise > 0),
    CONSTRAINT chk_payments_paid CHECK (
        status IN ('CREATED', 'FAILED') OR (paid_at IS NOT NULL AND gateway_payment_id IS NOT NULL)
    ),
    CONSTRAINT chk_payments_refunded CHECK (status <> 'REFUNDED' OR refunded_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

One row per checkout attempt. `provider` names the `PaymentService` implementation that created the order (TRD §2): `RAZORPAY` in production, `STRIPE` if enabled, `MOCK` only in development databases (a `staging`/`prod` startup check fails if any `MOCK` row exists); gateway identifiers are unique per provider. `PAID` grants or extends Premium (apply-payment rule below); `REFUNDED` and `DISPUTED` (chargeback) set the user to `REVOKED`. The reconciliation job asks the gateway about rows still `CREATED` after a few minutes, so a missed webhook is recovered within 15 minutes (PRD §6.4). Rows double as the receipts on the billing page.

** changes**: gateway identifiers are ASCII (case-sensitive) with the same 100-character bound; `idx_payments_plan` is the previously implicit foreign-key index; the `CHECK`s keep the state, `paid_at`, `gateway_payment_id` and `refunded_at` consistent. `created_at` is read by reconciliation and by "reuse a recent unpaid order" (App_Flow §4; 15-minute window), so the application writes it from the `Clock`.

## 15. PaymentEvents

```sql
CREATE TABLE payment_events (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider         ENUM('RAZORPAY', 'STRIPE', 'MOCK') NOT NULL,
    gateway_event_id VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    event_type       VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    payload          JSON NOT NULL,
    received_at      DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    processed_at     DATETIME(3) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_events_event (provider, gateway_event_id),
    KEY idx_payment_events_pending (processed_at, received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Append-only log of provider webhook events, including the mock provider's simulated ones in development. The unique `(provider, gateway_event_id)` makes duplicate deliveries a no-op; `processed_at` stays `NULL` until the event's effect has been applied, so a crash between receiving and applying is retried safely. `JSON` is the right type here: the payload is stored once, read whole, and never filtered by an inner key. If a key is ever needed for lookups, promote it to a column rather than querying into the document.

** changes**: `idx_payment_events_pending` finds unprocessed events (`processed_at IS NULL`, oldest first) without scanning the log; identifiers are ASCII.

## 16. AdminAuditLog

```sql
CREATE TABLE admin_audit_log (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_user_id  BIGINT UNSIGNED NOT NULL,
    target_user_id BIGINT UNSIGNED NULL,
    action         VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    details        JSON NULL,
    created_at     DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    PRIMARY KEY (id),
    KEY idx_audit_admin (admin_user_id, created_at),
    KEY idx_audit_target (target_user_id, created_at),
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_target FOREIGN KEY (target_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Every admin action on users, roles, subscriptions, sessions or content (PRD OPS-4): `GRANT_ACCESS`, `REVOKE_ACCESS`, `PROCESS_DELETION`, `EXTEND_MOCK_SESSION` (an audit-logged admin script), `REJUDGE_ATTEMPT` (the audit-logged re-judge script, TRD §2), `SET_ROLE` (`scripts/set-user-role`), the moderation actions of §41, and the content workflow — `CONTENT_CREATE`, `CONTENT_SUBMIT`, `CONTENT_REVIEW`, `CONTENT_REOPEN`, `CONTENT_PUBLISH`, `CONTENT_DISCARD`, `CONTENT_ARCHIVE`, `CONTENT_RESTORE`, `CONTENT_IMPORT` (Admin_Panel_Strategy §3.2) — with a JSON `details` payload (reason, old and new values; for content, the content type, content ID and revision ID). Content actions have no `target_user_id`; "what happened to this item" is answered from `content_revisions` (§42), which is indexed by item, never by filtering `details`. `action` is free text by design, so a new action needs no migration.

** changes**: `target_user_id` is `RESTRICT`, not `SET NULL`: a log entry that loses its subject is nearly useless, and users are never hard-deleted. `idx_audit_admin` is the previously implicit foreign-key index and answers "what did this admin do". The table is append-only; enforce it with privileges (Operations).

## 17. ProblemCodeStubs

```sql
CREATE TABLE problem_code_stubs (
    problem_id BIGINT UNSIGNED NOT NULL,
    language   ENUM('c', 'cpp', 'java', 'python') NOT NULL,
    stub_code  TEXT NOT NULL,
    PRIMARY KEY (problem_id, language),
    CONSTRAINT fk_problem_code_stubs_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

One boilerplate stub per problem and launch language, seeded into Monaco when the problem loads (TRD §1). `language` values are the API's `baseCodeStubs` keys, so `GET /api/problems/{id}` assembles the same map from `SELECT language, stub_code FROM problem_code_stubs WHERE problem_id = :id` (a primary-key range read) and the contract is unchanged. Admins author stubs as that same JSON map in a revision (Admin_Panel_Strategy §2.1); `ContentPublisher` writes it out as these rows when the revision is published, capped at `STUB_MAX_BYTES` (16 KB) each.

Replaces `problems.base_code_stubs JSON`: the keyed map was a repeating group the database could not validate (a typo'd language key, a missing language), join, or update one language at a time without rewriting the whole document. As rows, the primary key makes a duplicate stub impossible, the `ENUM` makes an unsupported language impossible, and the publish gate can count rows per problem.

## 18. SubscriptionReminders

```sql
CREATE TABLE subscription_reminders (
    user_id     BIGINT UNSIGNED NOT NULL,
    expires_at  DATETIME(3) NOT NULL,
    days_before TINYINT UNSIGNED NOT NULL,
    sent_at     DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    PRIMARY KEY (user_id, expires_at, days_before),
    CONSTRAINT fk_subscription_reminders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_subscription_reminders_days CHECK (days_before > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Makes "reminders go out once per term at 7 and 1 days, however often the job runs" (Plan 5.1) a primary-key guarantee. A row means "the `days_before` reminder for the term ending at `expires_at` has been claimed". Because the term is identified by its expiry, a renewal that moves `subscription_expires_at` starts a fresh set automatically. The job claims with a plain `INSERT` and treats a duplicate-key error as "already sent". Purge rows whose `expires_at` is more than 90 days old.

## 19. AnalyticsEvents

```sql
CREATE TABLE analytics_events (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name         VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    user_id      BIGINT UNSIGNED NULL,
    anonymous_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
    segment      ENUM('STUDENT', 'PROFESSIONAL', 'OTHER') NULL,
    properties   JSON NULL,
    occurred_at  DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_analytics_name_time (name, occurred_at),
    KEY idx_analytics_user_time (user_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Append-only event log behind `AnalyticsPublisher` (PRD OPS-5): server events from the services and client events from `POST /api/events` (API_Contract §8). Writes happen asynchronously on a bounded executor, so a failed insert is logged and never fails a request. `occurred_at` is written from the `Clock` and has no default (R3). `segment` is copied from the user at write time, so the Student split in PRD §9 needs no join and survives later profile edits; `anonymous_id` ties a visitor's pre-sign-up events together.

`user_id` deliberately has no foreign key: analytics must never block, or be blocked by, user rows, and account erasure sets `user_id` and `anonymous_id` to `NULL` instead of deleting events (Rules). `properties` is `JSON` because it is stored once and read whole by offline reports. Weekly Active Solvers comes from `submissions`; funnels and activation come from this table. Retention is a product decision; aggregate or purge after about 13 months.

## 20. ProblemEditorials

```sql
CREATE TABLE problem_editorials (
    problem_id        BIGINT UNSIGNED NOT NULL,
    approach_markdown MEDIUMTEXT NOT NULL,
    time_complexity   VARCHAR(100) NOT NULL,
    space_complexity  VARCHAR(100) NOT NULL,
    created_at        DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (problem_id),
    CONSTRAINT fk_problem_editorials_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE,
    CONSTRAINT chk_problem_editorials_complexity
        CHECK (CHAR_LENGTH(TRIM(time_complexity)) > 0 AND CHAR_LENGTH(TRIM(space_complexity)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The Solution tab (PRD SOL-1; API_Contract §2). At most one editorial per problem (the primary key), and it is optional: a problem with no row has no editorial and the API answers `404 EDITORIAL_NOT_FOUND`. Written only by `ContentPublisher` when a problem revision is published — authored in the admin panel or imported from a content pack, like statements and test cases (PRD OPS-1) — never by a direct admin write.

- `approach_markdown` is rendered through the same sanitizer as `problems.description_markdown`; `MEDIUMTEXT` for the same reason (§0.1). Revisions cap it at 64 KB.
- `time_complexity` and `space_complexity` are display strings ("O(n)", "O(n log n) time after sorting"), not parsed values.
- Entitlement is not stored here: it follows `problems.is_premium_only`, so re-flagging a problem re-gates its editorial with nothing to migrate.

## 21. ProblemEditorialCode

```sql
CREATE TABLE problem_editorial_code (
    problem_id BIGINT UNSIGNED NOT NULL,
    language   ENUM('c', 'cpp', 'java', 'python') NOT NULL,
    code       MEDIUMTEXT NOT NULL,
    PRIMARY KEY (problem_id, language),
    CONSTRAINT fk_pec_editorial FOREIGN KEY (problem_id) REFERENCES problem_editorials (problem_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The editorial's code, one row per launch language. It **is** the reference solution that the OPS-2 publish gate has just run against every test case: `ContentPublisher` writes these rows from the reference solutions of the revision whose gate passed for its current fingerprint (Admin_Panel_Strategy §2.7), so the editorial can never show code that fails the problem's tests. The gate also checks what the schema cannot — a row for every launch language whenever §20 has a row. A problem without an editorial still has reference solutions; they live in its published revision's document (§42).

- The foreign key points at `problem_editorials`, not `problems`, so code cannot exist without its write-up, and deleting an editorial removes its code.
- `language` uses the same slugs as §10 and §17 (the API's `baseCodeStubs` keys). `code` is `MEDIUMTEXT` because reference solutions are held to the 64 KB source cap and `TEXT` cannot store a value exactly at it (§0.1).

## 22. UserProblemBookmarks

```sql
CREATE TABLE user_problem_bookmarks (
    user_id    BIGINT UNSIGNED NOT NULL,
    problem_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    PRIMARY KEY (user_id, problem_id),
    KEY idx_upb_problem (problem_id),
    CONSTRAINT fk_upb_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_upb_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Saved problems (PRD CAT-3). A pure join row: the primary key makes "save" idempotent (`INSERT … ON DUPLICATE KEY UPDATE user_id = user_id`) and serves "is this problem saved" and "my saved problems" for one user; `idx_upb_problem` is the declared foreign-key index.

- Bookmarks are preferences, not history, so `CASCADE` is correct here (§0.3). Account erasure deletes them explicitly anyway (Rules), because users are anonymized, never deleted.
- A bookmark on a problem that is later archived stays in the table but drops out of every API response, because the catalog only lists `PUBLISHED` problems.
- The service caps a user at 1,000 bookmarks (`422 BOOKMARK_LIMIT_REACHED`), which keeps the saved filter bounded.
- `created_at` is display-only (sorting a future "Saved" page), so the audit-stamp default of R3 applies.

## 23. UserIdentities

```sql
CREATE TABLE user_identities (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id          BIGINT UNSIGNED NOT NULL,
    provider         ENUM('GOOGLE', 'GITHUB') NOT NULL,
    provider_subject VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    email            VARCHAR(254) COLLATE utf8mb4_0900_as_ci NOT NULL,
    linked_at        DATETIME(3) NOT NULL,
    last_login_at    DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_identities_subject (provider, provider_subject),
    UNIQUE KEY uq_user_identities_user_provider (user_id, provider),
    CONSTRAINT fk_user_identities_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

One row per linked sign-in provider (PRD ACC-1, ACC-6). `provider_subject` is the provider's stable user ID — Google's `sub`, GitHub's numeric user ID, never the GitHub login, which the user can rename. `email` is what the provider asserted as verified at the last sign-in; it is informational, because the account email lives on `users`.

- Sign-in looks up `uq_user_identities_subject`; if absent, the service links by verified email to an existing user (both sides verified, TRD §5) or creates a user and its first identity in one transaction.
- `uq_user_identities_user_provider` allows one Google and one GitHub identity per user and is the foreign-key index.
- Mock sign-in (`MockAuthServiceImpl`, TRD §2) writes ordinary `GOOGLE` and `GITHUB` rows whose `provider_subject` is `mock-<provider>-<userKey>` (real subjects are numeric), so a mock user can link both providers under the one-per-provider key exactly as a real user does. They exist only in development and test databases; a `staging`/`prod` startup check fails if any `mock-` subject exists.
- Credentials are not history, so `CASCADE`; erasure deletes the rows explicitly (Rules), so a returning person starts a fresh account.

## 24. HubTopics

```sql
CREATE TABLE hub_topics (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    hub           ENUM('DEVOPS', 'DATA_SCIENCE') NOT NULL,
    slug          VARCHAR(60) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    name          VARCHAR(100) NOT NULL,
    icon          VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    summary       VARCHAR(300) NULL,
    display_order SMALLINT UNSIGNED NOT NULL,
    status        ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    updated_at    DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_hub_topics_slug (hub, slug),
    UNIQUE KEY uq_hub_topics_order (hub, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The tiles of the DevOps and Data Science hubs (PRD HUB-1). `icon` is a Lucide icon name, not a product logo (UI_UX_Brief §0.2). Topics are a separate table from §3 `topics`: those tag coding problems, these own theory and quizzes, and the two never need to join. Adding a hub is an `ENUM` append (§0.5).

`updated_at` here and in the other content tables below is written by `ContentPublisher` from the `Clock` (R2); it has no `ON UPDATE` clause, so R4's exception list does not grow. These tables are written only when a revision (§42) is published, so a row exists from its first publish on and holds `PUBLISHED` or `ARCHIVED`; drafts live in the revision, and `DRAFT` rows occur only as problem anchors (§4).

## 25. TheoryQuestions

```sql
CREATE TABLE theory_questions (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    hub_topic_id      BIGINT UNSIGNED NOT NULL,
    section           VARCHAR(100) NOT NULL,
    question_markdown TEXT NOT NULL,
    answer_markdown   MEDIUMTEXT NOT NULL,
    sources           JSON NOT NULL,
    difficulty        ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    is_premium_only   BOOLEAN NOT NULL DEFAULT TRUE,
    display_order     SMALLINT UNSIGNED NOT NULL,
    status            ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    content_source    VARCHAR(255) NOT NULL DEFAULT 'ORIGINAL',
    updated_at        DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_theory_order (hub_topic_id, display_order),
    CONSTRAINT fk_theory_topic FOREIGN KEY (hub_topic_id) REFERENCES hub_topics (id) ON DELETE RESTRICT,
    CONSTRAINT chk_theory_sources CHECK (JSON_TYPE(sources) = 'ARRAY' AND JSON_LENGTH(sources) <= 60)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The Theory tab (PRD HUB-2). `section` is the display group within a topic ("Modules & Plugins"); renaming one is a content edit, published like any other. `sources` is a JSON array of `{"title": "...", "url": "https://..."}`, read whole and never filtered (§0.1); every URL is validated as `https` when the revision is saved and again at publish. A locked question (`is_premium_only` and no entitlement) is served without `answer_markdown` or `sources` — the service strips them; the client never receives them. `uq_theory_order` also serves the foreign key and the per-topic listing in display order.

## 26. DesignQuestions

```sql
CREATE TABLE design_questions (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    kind               ENUM('HLD', 'LLD') NOT NULL,
    slug               VARCHAR(120) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    title              VARCHAR(255) NOT NULL,
    summary            VARCHAR(300) NOT NULL,
    icon               VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    difficulty         ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    statement_markdown MEDIUMTEXT NOT NULL,
    requirements       JSON NOT NULL,
    solution           JSON NULL,
    is_premium_only    BOOLEAN NOT NULL DEFAULT TRUE,
    display_order      SMALLINT UNSIGNED NOT NULL,
    status             ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    content_source     VARCHAR(255) NOT NULL DEFAULT 'ORIGINAL',
    updated_at         DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_design_questions_slug (slug),
    UNIQUE KEY uq_design_questions_order (kind, display_order),
    CONSTRAINT chk_design_requirements CHECK (JSON_TYPE(requirements) = 'OBJECT'),
    CONSTRAINT chk_design_solution CHECK (solution IS NULL OR JSON_TYPE(solution) = 'OBJECT')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

System Design (`HLD`) and Low-Level Design (`LLD`) questions in one table (PRD DES-1): they share every column and differ only in what the solution sections contain. `display_order` is the "most frequently asked" order per kind.

- `requirements`: `{"functional": [...], "nonFunctional": [...], "outOfScope": [...]}` — arrays of short Markdown strings.
- `solution` (the editorial; `NULL` until written): `{"sections": [{"heading": "High-level design", "markdown": "...", "mermaid": "flowchart LR ...", "code": {"java": "...", "python": "...", "cpp": "..."}}]}`. `mermaid` (HLD diagrams) and `code` (LLD classes) are optional per section. JSON is MySQL's binary `JSON` type — the equivalent of PostgreSQL `JSONB` — and the document is stored once and read whole, so it stays JSON rather than becoming tables (§0.1). It is validated against the JSON Schema in `content/schemas/` and capped at 256 KB (`DESIGN_SOLUTION_MAX_BYTES`) on every save of its revision and again at publish.
- One flag gates the whole question: a locked question returns only `title`, `summary`, `difficulty` and the lock (API_Contract §10).

## 27. DesignAnswers

```sql
CREATE TABLE design_answers (
    user_id            BIGINT UNSIGNED NOT NULL,
    design_question_id BIGINT UNSIGNED NOT NULL,
    answer_markdown    MEDIUMTEXT NOT NULL,
    revision           INT UNSIGNED NOT NULL DEFAULT 1,
    updated_at         DATETIME(3) NOT NULL,
    PRIMARY KEY (user_id, design_question_id),
    KEY idx_design_answers_question (design_question_id),
    CONSTRAINT fk_design_answers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_design_answers_question FOREIGN KEY (design_question_id) REFERENCES design_questions (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The **My answer** notepad (PRD DES-1): one private Markdown document per user and question, capped at 64 KB by the service. `revision` is an optimistic-concurrency counter: a save carries the revision it was based on and `UPDATE … WHERE revision = :base` changes zero rows when another tab saved first, which the API reports as `409 REVISION_CONFLICT` instead of silently overwriting (the same rule as the editor drafts, App_Flow §2.2). Personal data, not history: `CASCADE` from users, and erasure deletes it explicitly.

## 28. Quizzes

```sql
CREATE TABLE quizzes (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug               VARCHAR(120) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    title              VARCHAR(255) NOT NULL,
    hub_topic_id       BIGINT UNSIGNED NULL,
    design_question_id BIGINT UNSIGNED NULL,
    level              ENUM('EASY', 'MEDIUM', 'HARD', 'MIXED') NOT NULL,
    is_premium_only    BOOLEAN NOT NULL,
    status             ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    updated_at         DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_quizzes_slug (slug),
    UNIQUE KEY uq_quizzes_topic_level (hub_topic_id, level),
    UNIQUE KEY uq_quizzes_design_level (design_question_id, level),
    CONSTRAINT fk_quizzes_topic FOREIGN KEY (hub_topic_id) REFERENCES hub_topics (id) ON DELETE RESTRICT,
    CONSTRAINT fk_quizzes_design FOREIGN KEY (design_question_id) REFERENCES design_questions (id) ON DELETE RESTRICT,
    CONSTRAINT chk_quizzes_owner CHECK ((hub_topic_id IS NULL) <> (design_question_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

A quiz belongs to exactly one hub topic **or** one design question (`chk_quizzes_owner`). Two nullable foreign keys keep referential integrity, which a polymorphic `(owner_type, owner_id)` pair would give up. The unique keys allow one quiz per owner and level and, because `NULL`s never collide, any number of quizzes for the other owner type. The revision sets `is_premium_only` (default: `EASY` free, the rest Premium; PRD §5).

**Published quizzes are immutable** once anyone has answered them, because answers store the chosen option's position: `ContentPublisher` refuses to change a question that has answers. A correction ships as a new quiz (new slug), and the old one is archived in the same publish transaction; past attempts stay readable. The admin panel opens such an edit as a revision that must take a new slug (Admin_Panel_Strategy §3.3).

## 29. QuizQuestions

```sql
CREATE TABLE quiz_questions (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    quiz_id              BIGINT UNSIGNED NOT NULL,
    display_order        SMALLINT UNSIGNED NOT NULL,
    prompt_markdown      TEXT NOT NULL,
    options              JSON NOT NULL,
    correct_option       TINYINT UNSIGNED NOT NULL,
    explanation_markdown TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_quiz_questions_order (quiz_id, display_order),
    UNIQUE KEY uq_quiz_questions_id_quiz (id, quiz_id),
    CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE RESTRICT,
    CONSTRAINT chk_quiz_questions_options CHECK (JSON_TYPE(options) = 'ARRAY' AND JSON_LENGTH(options) BETWEEN 2 AND 6),
    CONSTRAINT chk_quiz_questions_correct CHECK (correct_option < JSON_LENGTH(options))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

`options` is a JSON array of option texts in display order (2 to 6, Markdown allowed); `correct_option` is the 0-based index of the right one. The array is read whole and never filtered by content (§0.1). `correct_option` and `explanation_markdown` leave the server only in the response to that question's answer (TRD §2). `uq_quiz_questions_id_quiz` exists only so §31 can reference the pair, as `submissions` does for sessions.

## 30. QuizAttempts

```sql
CREATE TABLE quiz_attempts (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id        BIGINT UNSIGNED NOT NULL,
    quiz_id        BIGINT UNSIGNED NOT NULL,
    status         ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
    question_count SMALLINT UNSIGNED NOT NULL,
    answered_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    correct_count  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    started_at     DATETIME(3) NOT NULL,
    completed_at   DATETIME(3) NULL,
    active_quiz_id BIGINT UNSIGNED GENERATED ALWAYS AS (IF(status = 'IN_PROGRESS', quiz_id, NULL)) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uq_quiz_attempts_id_quiz (id, quiz_id),
    UNIQUE KEY uq_quiz_attempts_one_active (user_id, active_quiz_id),
    KEY idx_quiz_attempts_user_quiz (user_id, quiz_id, started_at),
    KEY idx_quiz_attempts_user_completed (user_id, completed_at),
    KEY idx_quiz_attempts_quiz (quiz_id),
    CONSTRAINT fk_quiz_attempts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_quiz_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE RESTRICT,
    CONSTRAINT chk_quiz_attempts_counts CHECK (correct_count <= answered_count AND answered_count <= question_count),
    CONSTRAINT chk_quiz_attempts_completed CHECK ((status = 'COMPLETED') = (completed_at IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

One row per run through a quiz (PRD QZ-1). `uq_quiz_attempts_one_active` makes "start" idempotent — a user holds at most one `IN_PROGRESS` attempt per quiz, and starting again returns it — with the same generated-column technique as `uq_mts_one_active_per_user` (§9). `question_count` is a snapshot at start. `answered_count` and `correct_count` are denormalized from §31 and written in the same transaction as each answer (§0.4). An attempt completes when the last question is answered or the user finishes early; unanswered questions then count as wrong. `idx_quiz_attempts_user_completed` feeds the activity heatmap (Query Patterns).

## 31. QuizAttemptAnswers

```sql
CREATE TABLE quiz_attempt_answers (
    attempt_id      BIGINT UNSIGNED NOT NULL,
    quiz_id         BIGINT UNSIGNED NOT NULL,
    question_id     BIGINT UNSIGNED NOT NULL,
    selected_option TINYINT UNSIGNED NULL,
    is_correct      BOOLEAN NOT NULL,
    answered_at     DATETIME(3) NOT NULL,
    PRIMARY KEY (attempt_id, question_id),
    KEY idx_qaa_attempt_quiz (attempt_id, quiz_id),
    KEY idx_qaa_question_quiz (question_id, quiz_id),
    CONSTRAINT fk_qaa_attempt FOREIGN KEY (attempt_id, quiz_id) REFERENCES quiz_attempts (id, quiz_id) ON DELETE CASCADE,
    CONSTRAINT fk_qaa_question FOREIGN KEY (question_id, quiz_id) REFERENCES quiz_questions (id, quiz_id) ON DELETE RESTRICT,
    CONSTRAINT chk_qaa_dont_know CHECK (selected_option IS NOT NULL OR is_correct = FALSE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

- The primary key makes an answer **final**: a second answer to the same question is a duplicate key, which the API returns as the original result (`200`, not a regrade) — so retrying after a dropped response is safe and changing an answer after seeing the explanation is impossible.
- The two composite foreign keys share `quiz_id`, so the database guarantees that the question belongs to the attempt's quiz.
- `selected_option IS NULL` is **Don't know**: always wrong (`chk_qaa_dont_know`).

## 32. Companies

```sql
CREATE TABLE companies (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug                 VARCHAR(80) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    name                 VARCHAR(120) NOT NULL,
    overview_markdown    MEDIUMTEXT NULL,
    overview_reviewed_at DATETIME(3) NULL,
    status               ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    updated_at           DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_companies_slug (slug),
    UNIQUE KEY uq_companies_name (name),
    CONSTRAINT chk_companies_overview CHECK (overview_markdown IS NULL OR overview_reviewed_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Company pages (PRD CMP-1). There is deliberately **no logo column**: companies appear as their name with a generated monogram (UI_UX_Brief §0.2, PRD §10). The overview is an original interview-process guide; `chk_companies_overview` requires a review date whenever one exists, and the page shows it ("Reviewed Oct 2026").

## 33. ProblemCompanies and 34. DesignQuestionCompanies

```sql
CREATE TABLE problem_companies (
    company_id     BIGINT UNSIGNED NOT NULL,
    problem_id     BIGINT UNSIGNED NOT NULL,
    frequency_rank SMALLINT UNSIGNED NOT NULL,
    source_note    VARCHAR(255) NOT NULL,
    reviewed_at    DATETIME(3) NOT NULL,
    PRIMARY KEY (company_id, problem_id),
    UNIQUE KEY uq_problem_companies_rank (company_id, frequency_rank),
    KEY idx_problem_companies_problem (problem_id),
    CONSTRAINT fk_pc_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT fk_pc_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE design_question_companies (
    company_id         BIGINT UNSIGNED NOT NULL,
    design_question_id BIGINT UNSIGNED NOT NULL,
    frequency_rank     SMALLINT UNSIGNED NOT NULL,
    source_note        VARCHAR(255) NOT NULL,
    reviewed_at        DATETIME(3) NOT NULL,
    PRIMARY KEY (company_id, design_question_id),
    UNIQUE KEY uq_dqc_rank (company_id, frequency_rank),
    KEY idx_dqc_question (design_question_id),
    CONSTRAINT fk_dqc_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT fk_dqc_question FOREIGN KEY (design_question_id) REFERENCES design_questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Company tags (PRD CMP-1, CMP-2): the company page's Coding tab reads `problem_companies`; its System Design and Low-Level Design tabs read `design_question_companies` filtered by `kind`. Two join tables with real foreign keys, rather than one polymorphic tag table. `frequency_rank` is the order "by most frequently reported" inside the company (unique, so the order is total). `source_note` is mandatory: a published interview experience (`community:post-812`) or an editor's note. A tag without a source cannot be published, so the API never shows an unsourced "asked at" claim. Pure join rows, so `CASCADE`.

## 35. Projects

```sql
CREATE TABLE projects (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    kind             ENUM('TAKE_HOME', 'PORTFOLIO') NOT NULL,
    slug             VARCHAR(120) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    title            VARCHAR(255) NOT NULL,
    summary          VARCHAR(300) NOT NULL,
    brief_markdown   MEDIUMTEXT NOT NULL,
    checklist        JSON NOT NULL,
    tech_stack       JSON NOT NULL,
    difficulty       ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    estimated_hours  SMALLINT UNSIGNED NOT NULL,
    starter_repo_url VARCHAR(500) CHARACTER SET ascii COLLATE ascii_bin NULL,
    cover_asset      VARCHAR(200) CHARACTER SET ascii COLLATE ascii_bin NULL,
    is_premium_only  BOOLEAN NOT NULL DEFAULT TRUE,
    display_order    SMALLINT UNSIGNED NOT NULL,
    status           ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    content_source   VARCHAR(255) NOT NULL DEFAULT 'ORIGINAL',
    updated_at       DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_projects_slug (slug),
    UNIQUE KEY uq_projects_order (kind, display_order),
    CONSTRAINT chk_projects_lists CHECK (JSON_TYPE(checklist) = 'ARRAY' AND JSON_TYPE(tech_stack) = 'ARRAY'),
    CONSTRAINT chk_projects_repo CHECK (starter_repo_url IS NULL OR starter_repo_url LIKE 'https://%'),
    CONSTRAINT chk_projects_hours CHECK (estimated_hours BETWEEN 1 AND 200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Project briefs (PRD PRJ-1). `checklist` is the acceptance checklist (a JSON array of Markdown strings) and `tech_stack` a JSON array of display names; both are read whole. `cover_asset` is the path of a static image shipped with the SPA build (no object storage in MVP, TRD §7). A locked project returns everything but `brief_markdown`, `checklist` and `starter_repo_url`.

## 36. UserContentProgress

```sql
CREATE TABLE user_content_progress (
    user_id       BIGINT UNSIGNED NOT NULL,
    content_type  ENUM('THEORY', 'DESIGN', 'PROJECT') NOT NULL,
    content_id    BIGINT UNSIGNED NOT NULL,
    bookmarked_at DATETIME(3) NULL,
    completed_at  DATETIME(3) NULL,
    PRIMARY KEY (user_id, content_type, content_id),
    KEY idx_ucp_content (content_type, content_id),
    CONSTRAINT fk_ucp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_ucp_not_empty CHECK (bookmarked_at IS NOT NULL OR completed_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The bookmark and "mark as learned / done" toggles on theory questions, design questions and projects (the flag and check icons of the reference). **The one deliberate polymorphic reference in the schema**: `content_id` points at §25, §26 or §35 depending on `content_type`, with no foreign key. It is acceptable here because the rows are per-user preferences, every target table archives instead of deleting (§0.3), the service validates that the target exists and is published before writing, and every read joins the target table, so a row for archived content simply drops out. Three join tables would add nothing but DDL. A row is deleted when both flags are cleared (`chk_ucp_not_empty`). Problems keep their own `user_problem_bookmarks` (§22), because problem progress is derived from solves, not toggled.

## 37. CommunityPosts

```sql
CREATE TABLE community_posts (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    author_id       BIGINT UNSIGNED NOT NULL,
    category        ENUM('INTERVIEW_EXPERIENCE', 'DISCUSSION') NOT NULL,
    title           VARCHAR(200) NOT NULL,
    body_markdown   MEDIUMTEXT NOT NULL,
    company_id      BIGINT UNSIGNED NULL,
    problem_id      BIGINT UNSIGNED NULL,
    level           ENUM('INTERN', 'NEW_GRAD', 'JUNIOR', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL') NULL,
    role_title      VARCHAR(100) NULL,
    outcome         ENUM('OFFER', 'REJECTED', 'PENDING', 'WITHDREW') NULL,
    status          ENUM('PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'HIDDEN', 'DELETED') NOT NULL,
    upvote_count    INT UNSIGNED NOT NULL DEFAULT 0,
    comment_count   INT UNSIGNED NOT NULL DEFAULT 0,
    created_at      DATETIME(3) NOT NULL,
    published_at    DATETIME(3) NULL,
    edited_at       DATETIME(3) NULL,
    moderated_by    BIGINT UNSIGNED NULL,
    moderated_at    DATETIME(3) NULL,
    moderation_note VARCHAR(500) NULL,
    PRIMARY KEY (id),
    KEY idx_posts_recent (category, status, published_at),
    KEY idx_posts_popular (category, status, upvote_count, published_at),
    KEY idx_posts_company (company_id, category, status, published_at),
    KEY idx_posts_problem (problem_id, status, published_at),
    KEY idx_posts_author (author_id, created_at),
    KEY idx_posts_review (status, created_at),
    KEY idx_posts_moderator (moderated_by),
    CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_posts_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
    CONSTRAINT fk_posts_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE RESTRICT,
    CONSTRAINT fk_posts_moderator FOREIGN KEY (moderated_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_posts_experience CHECK (
        (category = 'INTERVIEW_EXPERIENCE' AND company_id IS NOT NULL AND level IS NOT NULL AND problem_id IS NULL)
        OR (category = 'DISCUSSION' AND level IS NULL AND outcome IS NULL AND role_title IS NULL)
    ),
    CONSTRAINT chk_posts_published CHECK (status NOT IN ('PUBLISHED', 'HIDDEN') OR published_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Community posts (PRD COM-1, COM-2). Interview experiences are created `PENDING_REVIEW` and published by a moderator (or `REJECTED` with a note the author can read); discussions are created `PUBLISHED`. `HIDDEN` is a moderator action after a report; `DELETED` is the author's delete or account erasure, which also blanks the title and body. Nothing is hard-deleted, so comments and reports keep their parents.

- `problem_id` makes a discussion the thread of one coding problem (linked from the Workspace).
- `upvote_count` and `comment_count` are denormalized (§0.4) and changed in the same transaction as the vote or comment, so feeds sort and display without aggregating.
- Indexes serve one access path each: the two feed orders per category (`recent`, `popular`; equality on `category` and `status`, then the index order is the sort order), a company's experiences, a problem's discussions, "my posts", and the moderation queue (`status = 'PENDING_REVIEW'` oldest first).

## 38. CommunityComments

```sql
CREATE TABLE community_comments (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    post_id           BIGINT UNSIGNED NOT NULL,
    author_id         BIGINT UNSIGNED NOT NULL,
    parent_comment_id BIGINT UNSIGNED NULL,
    body_markdown     TEXT NOT NULL,
    status            ENUM('PUBLISHED', 'HIDDEN', 'DELETED') NOT NULL DEFAULT 'PUBLISHED',
    upvote_count      INT UNSIGNED NOT NULL DEFAULT 0,
    created_at        DATETIME(3) NOT NULL,
    edited_at         DATETIME(3) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comments_id_post (id, post_id),
    KEY idx_comments_post (post_id, created_at),
    KEY idx_comments_parent (parent_comment_id, post_id),
    KEY idx_comments_author (author_id, created_at),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES community_posts (id) ON DELETE RESTRICT,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id, post_id) REFERENCES community_comments (id, post_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Comments with one level of replies (PRD COM-3). The composite `fk_comments_parent` guarantees that a reply belongs to the same post as its parent. "Replies are one level deep" (the parent's own `parent_comment_id` is `NULL`) is checked by the service. Bodies are capped at 4 KB, under `TEXT`'s 64 KB. A `DELETED` comment keeps its row and shows "[deleted]", so its replies keep their context.

## 39. CommunityPostVotes and 40. CommunityCommentVotes

```sql
CREATE TABLE community_post_votes (
    user_id    BIGINT UNSIGNED NOT NULL,
    post_id    BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    PRIMARY KEY (user_id, post_id),
    KEY idx_cpv_post (post_id),
    CONSTRAINT fk_cpv_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cpv_post FOREIGN KEY (post_id) REFERENCES community_posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE community_comment_votes (
    user_id    BIGINT UNSIGNED NOT NULL,
    comment_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    PRIMARY KEY (user_id, comment_id),
    KEY idx_ccv_comment (comment_id),
    CONSTRAINT fk_ccv_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ccv_comment FOREIGN KEY (comment_id) REFERENCES community_comments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Upvotes only, as in the reference (PRD COM-3). The primary key makes a vote idempotent: the vote transaction inserts with `ON DUPLICATE KEY UPDATE user_id = user_id` and increments `upvote_count` only when a row was actually inserted (`useAffectedRows=true`, Rules); un-voting deletes the row and decrements only when one was deleted. That keeps the counter equal to the row count without a recount. Users and posts are never hard-deleted, so the `CASCADE`s only matter for development data; erasure deletes a user's votes explicitly, with the matching decrements.

## 41. CommunityReports

```sql
CREATE TABLE community_reports (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reporter_id BIGINT UNSIGNED NOT NULL,
    post_id     BIGINT UNSIGNED NULL,
    comment_id  BIGINT UNSIGNED NULL,
    reason      ENUM('SPAM', 'ABUSE', 'PERSONAL_INFO', 'COPYRIGHT', 'LEAKED_CONTENT', 'OFF_TOPIC', 'OTHER') NOT NULL,
    details     VARCHAR(1000) NULL,
    status      ENUM('OPEN', 'ACTIONED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    created_at  DATETIME(3) NOT NULL,
    resolved_by BIGINT UNSIGNED NULL,
    resolved_at DATETIME(3) NULL,
    target_ref  VARCHAR(24) CHARACTER SET ascii COLLATE ascii_bin
                GENERATED ALWAYS AS (IF(post_id IS NOT NULL, CONCAT('p', post_id), CONCAT('c', comment_id))) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uq_reports_once (reporter_id, target_ref),
    KEY idx_reports_queue (status, created_at),
    KEY idx_reports_post (post_id),
    KEY idx_reports_comment (comment_id),
    KEY idx_reports_resolver (resolved_by),
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reports_post FOREIGN KEY (post_id) REFERENCES community_posts (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reports_comment FOREIGN KEY (comment_id) REFERENCES community_comments (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reports_resolver FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_reports_target CHECK ((post_id IS NULL) <> (comment_id IS NULL)),
    CONSTRAINT chk_reports_resolved CHECK ((status = 'OPEN') = (resolved_at IS NULL AND resolved_by IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Reports (PRD COM-4). A report targets exactly one post or comment (`chk_reports_target`). `uq_reports_once` lets a user report a target once — `target_ref` folds the two nullable columns into one value a unique key can see (two `NULL`s would never collide). `LEAKED_CONTENT` covers posts that reproduce a company's confidential questions verbatim. Resolving a report and every moderation action on a post or comment writes an `admin_audit_log` row (`MODERATE_POST`, `MODERATE_COMMENT`, `RESOLVE_REPORT`, with the author as `target_user_id`; PRD OPS-4).

## 42. ContentRevisions

```sql
CREATE TABLE content_revisions (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    content_type     ENUM('PROBLEM', 'MOCK_TEST', 'HUB_TOPIC', 'THEORY_QUESTION', 'QUIZ',
                          'DESIGN_QUESTION', 'COMPANY', 'PROJECT', 'BLOG_POST') NOT NULL,
    content_id       BIGINT UNSIGNED NULL,
    revision_no      SMALLINT UNSIGNED NOT NULL,
    status           ENUM('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'DISCARDED') NOT NULL DEFAULT 'DRAFT',
    source           ENUM('ADMIN_PANEL', 'CONTENT_PACK') NOT NULL DEFAULT 'ADMIN_PANEL',
    document         JSON NOT NULL,
    version          INT UNSIGNED NOT NULL DEFAULT 1,
    test_set         SMALLINT UNSIGNED NULL,
    gate_status      ENUM('NOT_RUN', 'RUNNING', 'PASSED', 'FAILED', 'ERROR') NULL,
    gate_fingerprint BINARY(32) NULL,
    gate_finished_at DATETIME(3) NULL,
    author_id        BIGINT UNSIGNED NOT NULL,
    reviewer_id      BIGINT UNSIGNED NULL,
    review_note      VARCHAR(2000) NULL,
    self_reviewed    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       DATETIME(3) NOT NULL,
    updated_at       DATETIME(3) NOT NULL,
    submitted_at     DATETIME(3) NULL,
    reviewed_at      DATETIME(3) NULL,
    published_at     DATETIME(3) NULL,
    open_item_ref    VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin
                     GENERATED ALWAYS AS (IF(status IN ('DRAFT', 'IN_REVIEW', 'APPROVED') AND content_id IS NOT NULL,
                                             CONCAT(content_type, ':', content_id), NULL)) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uq_revisions_one_open (open_item_ref),
    UNIQUE KEY uq_revisions_number (content_type, content_id, revision_no),
    KEY idx_revisions_queue (status, submitted_at),
    KEY idx_revisions_author (author_id, updated_at),
    KEY idx_revisions_reviewer (reviewer_id),
    CONSTRAINT fk_revisions_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_revisions_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_revisions_document CHECK (JSON_TYPE(document) = 'OBJECT'),
    CONSTRAINT chk_revisions_problem CHECK (content_type <> 'PROBLEM'
        OR (content_id IS NOT NULL AND test_set IS NOT NULL AND gate_status IS NOT NULL)),
    CONSTRAINT chk_revisions_not_problem CHECK (content_type = 'PROBLEM'
        OR (test_set IS NULL AND gate_status IS NULL AND gate_fingerprint IS NULL)),
    CONSTRAINT chk_revisions_reviewed CHECK (status NOT IN ('APPROVED', 'PUBLISHED')
        OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL)),
    CONSTRAINT chk_revisions_published CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL AND content_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The content workflow of PRD ADM-2 and ADM-3 (Admin_Panel_Strategy §3): every change to any content item is made in a revision and reaches the live tables only when `ContentPublisher` publishes it. `document` is the whole proposed item in its content-pack JSON form, validated by the same schema in `content/schemas/`; it is rewritten by `PATCH` (a JSON merge patch) only while `status = 'DRAFT'`, guarded by `version` (`UPDATE … WHERE id = :id AND status = 'DRAFT' AND version = :base`, zero rows → `409 REVISION_CONFLICT` or `REVISION_NOT_EDITABLE`), and frozen from `IN_REVIEW` on. A problem document holds everything except the test data, which is the revision's own `test_set` in §6.

- **The one other polymorphic reference.** Like `user_content_progress.content_id` (§36), `content_id` points at the live table named by `content_type` with no foreign key, for the same reasons: every target archives instead of deleting (§0.3), the service validates the target, and nine typed revision tables would add only DDL. It is `NULL` until a new item's first publish writes it back, except for problems, whose anchor row (§4) exists from creation (`chk_revisions_problem`).
- `uq_revisions_one_open` allows at most one `DRAFT`, `IN_REVIEW` or `APPROVED` revision per item, with the generated-column technique of §9 and §30, so two admins can never fork one item; "open revision" returns the existing one. A new item's first revision has no `content_id` and needs no slot.
- `revision_no` counts the item's revisions from 1; `uq_revisions_number` makes it unique per item.
- **Gate columns** (problems only, PRD OPS-2): `gate_status` is the latest run's result, `gate_fingerprint` the SHA-256 over the effective limits, the reference solutions and the ordered test digests at the moment that run started (Admin_Panel_Strategy §2.6). Submit and publish recompute the fingerprint and require `PASSED` for the same value; "stale" is that comparison failing, so it is derived, never stored.
- **Review columns**: `reviewer_id` and `reviewed_at` are set by Approve and kept as the record (`chk_revisions_reviewed`); Request changes sets `review_note` and returns the revision to `DRAFT`. The approver must not appear in §43 unless `CONTENT_SELF_REVIEW_ALLOWED` is on, in which case `self_reviewed` records it.
- **History**: revisions are never deleted. `DISCARDED` keeps the row and frees the open slot; `PUBLISHED` rows are the item's history, and the newest by `published_at` is its live version. Publishing writes `published_at` and `content_id` (`chk_revisions_published`).
- `idx_revisions_queue` serves the review queue (`status = 'IN_REVIEW'`, oldest first) and the "approved, unpublished" count; `idx_revisions_author` the "my drafts" list and the foreign key; `idx_revisions_reviewer` the reviewer foreign key. The item page lists revisions through `uq_revisions_number`.
- `created_at`, `updated_at` and the workflow timestamps have no defaults: the service writes them from the `Clock` (R3).

## 43. ContentRevisionEditors

```sql
CREATE TABLE content_revision_editors (
    revision_id     BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    first_edited_at DATETIME(3) NOT NULL,
    PRIMARY KEY (revision_id, user_id),
    KEY idx_cre_user (user_id),
    CONSTRAINT fk_cre_revision FOREIGN KEY (revision_id) REFERENCES content_revisions (id) ON DELETE CASCADE,
    CONSTRAINT fk_cre_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Everyone who changed a revision: its creator, every admin whose save changed the document or its test set, and the importing admin for a content-pack revision. Written with `INSERT … ON DUPLICATE KEY UPDATE user_id = user_id` in the same transaction as the save. The four-eyes rule (PRD ADM-3) is one primary-key lookup: the approver must have no row here. A join table rather than a JSON array on the revision, because the rule is checked by key and the foreign key keeps every editor a real user.

## 44. ProblemValidationAttempts

```sql
CREATE TABLE problem_validation_attempts (
    revision_id   BIGINT UNSIGNED NOT NULL,
    kind          ENUM('REFERENCE', 'NEGATIVE_CONTROL') NOT NULL,
    language      ENUM('c', 'cpp', 'java', 'python') NOT NULL,
    submission_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (revision_id, kind, language),
    UNIQUE KEY uq_pva_submission (submission_id),
    CONSTRAINT fk_pva_revision FOREIGN KEY (revision_id) REFERENCES content_revisions (id) ON DELETE CASCADE,
    CONSTRAINT fk_pva_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The latest publish-gate run of a problem revision: one `REFERENCE` attempt per launch language and one `NEGATIVE_CONTROL` (Python 3), each a `VALIDATE` submission (§10) whose per-test rows in §11 hold the verdicts the report shows. The primary key allows exactly one attempt per kind and language, so only the latest run is kept: starting a new run deletes the revision's `VALIDATE` submissions (their results cascade, and so do these rows) and inserts fresh ones in one transaction. A run cannot start while the previous one is still in flight (`RUNNING`), so no deleted attempt is ever mid-dispatch. Discarding a revision deletes its attempts the same way before its draft test set (§6).

## 45. BlogPosts

```sql
CREATE TABLE blog_posts (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug           VARCHAR(120) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    title          VARCHAR(200) NOT NULL,
    summary        VARCHAR(300) NOT NULL,
    body_markdown  MEDIUMTEXT NOT NULL,
    byline         VARCHAR(100) NOT NULL DEFAULT 'Semicolan Team',
    cover_asset    VARCHAR(200) CHARACTER SET ascii COLLATE ascii_bin NULL,
    status         ENUM('PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
    content_source VARCHAR(255) NOT NULL DEFAULT 'ORIGINAL',
    published_at   DATETIME(3) NOT NULL,
    updated_at     DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_blog_posts_slug (slug),
    KEY idx_blog_posts_feed (status, published_at),
    CONSTRAINT chk_blog_posts_cover CHECK (cover_asset IS NULL OR cover_asset LIKE '/assets/blog/%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The blog (PRD BLOG-1): articles by the Semicolan team, free to everyone. A row is inserted at a post's first publish — drafts live in §42 — so the status is only `PUBLISHED` or `ARCHIVED`. `published_at` is the first publish and never moves; `updated_at` shows "Updated {date}" after a later publish. `body_markdown` is capped at `BLOG_BODY_MAX_BYTES` (128 KB) and rendered with the statement sanitizer (no raw HTML, no inline images; Mermaid and code blocks allowed, TRD §5). `cover_asset` is a static file shipped with the SPA build, as for projects (§35): there are no uploads in the MVP. `idx_blog_posts_feed` serves the newest-first list with no sort. `byline` is display text, not a user reference; who wrote and approved a post is in its revisions.

## Triggers

Two triggers enforce the mock-test timer where application bugs and retries cannot bypass it. Both read only the rows being written and the session/test rows they reference — never the wall clock — so a simulated test `Clock` behaves exactly like production. Errors use SQLSTATE `45000` (MySQL error 1644) with a fixed `MESSAGE_TEXT`; the data layer maps the text to the API errors named below. Flyway handles the `DELIMITER` lines in MySQL scripts.

```sql
DELIMITER $$

CREATE TRIGGER trg_mock_test_sessions_bu
BEFORE UPDATE ON mock_test_sessions
FOR EACH ROW
BEGIN
    IF NEW.user_id <> OLD.user_id
       OR NEW.mock_test_id <> OLD.mock_test_id
       OR NEW.start_time <> OLD.start_time THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SESSION_IDENTITY_IMMUTABLE';
    END IF;
    IF NEW.end_time > OLD.end_time AND COALESCE(@semicolan_allow_extension, 0) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SESSION_EXTENSION_NOT_ALLOWED';
    END IF;
END$$

CREATE TRIGGER trg_submissions_bi
BEFORE INSERT ON submissions
FOR EACH ROW
BEGIN
    DECLARE v_mock_test_id BIGINT UNSIGNED;
    DECLARE v_end_time     DATETIME(3);
    DECLARE v_score        SMALLINT UNSIGNED;
    DECLARE v_found        TINYINT DEFAULT 1;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_found = 0;

    IF NEW.test_session_id IS NOT NULL THEN
        SELECT mock_test_id, end_time, score
          INTO v_mock_test_id, v_end_time, v_score
          FROM mock_test_sessions
         WHERE id = NEW.test_session_id;

        IF v_found = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TEST_SESSION_NOT_FOUND';
        ELSEIF NEW.submitted_at > v_end_time OR v_score IS NOT NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TEST_SESSION_CLOSED';
        ELSEIF NOT EXISTS (SELECT 1
                             FROM mock_test_problems
                            WHERE mock_test_id = v_mock_test_id
                              AND problem_id = NEW.problem_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PROBLEM_NOT_IN_TEST';
        END IF;
    END IF;
END$$

DELIMITER ;
```

| Trigger | Rejects | Maps to |
|---|---|---|
| `trg_mock_test_sessions_bu` | Any change to a session's `user_id`, `mock_test_id` or `start_time`, and any move of `end_time` to a *later* instant unless the admin-extension flag is set — a code path that "resumes" by resetting either end of the clock would otherwise hand a user fresh time | `500` (a bug, never user-reachable) |
| `trg_submissions_bi` | A session-bound attempt whose arrival time is after `end_time`; one for a session whose `score` is already written (the session is sealed); one for a problem outside the session's test; one for an unknown session | `409 TEST_SESSION_CLOSED`, `422 PROBLEM_NOT_IN_TEST`, `404 TEST_SESSION_NOT_FOUND` |

Design notes:
- The deadline is decided from `end_time` against the attempt's own arrival time, **never from `status`** (TRD §2): an attempt that entered the server at or before `end_time` is accepted even if the closer has already marked the session `COMPLETED` while the request waited in a queue. After an early finish (App_Flow §3.2) `end_time` is the finish instant, so later arrivals are rejected by the same rule. Once `score` is written the session is sealed, so nothing can attach a backdated attempt to a scored report.
- The trigger's read is a plain consistent read; the service already takes the session row `FOR SHARE` when it creates an attempt (TRD §2), so the trigger adds no lock and no lock wait. It is a backstop for the service check, not a replacement; the API still answers from the service in the normal case.
- Triggers run with their definer's privileges: create them with the migration account and keep that account (or set `DEFINER` explicitly) for the life of the schema. On managed MySQL with binary logging on, creating triggers requires `log_bin_trust_function_creators = 1` (or `SET_USER_ID`/`SUPER`) for the migration account.
- `end_time` may always move earlier (early finish, simulated expiry) but moves later only inside an explicit admin extension: `SET @semicolan_allow_extension = 1;`, the `UPDATE`, then `SET @semicolan_allow_extension = NULL;` in the same transaction, with an `EXTEND_MOCK_SESSION` audit row. The flag is a session variable, so reset it before the connection returns to the pool. It guards against bugs and mistakes, not against someone who already has SQL access — that is what the privilege model is for.
- Test fixtures: create a session under the simulated `Clock` and insert its attempts before the session is closed or scored; `start_time` cannot be back-dated afterwards. Simulate expiry by shortening `end_time`; extend only through the flag above.

## Rules the Schema Relies On

- **Entitlement**: Premium access is `ACTIVE` and unexpired — `subscription_expires_at > :now` with `:now` from the application's UTC `Clock` (ad-hoc SQL: `UTC_TIMESTAMP(3)`) — evaluated per request (§1); never a role, never a JWT claim.
- **Apply a payment exactly once, and stack purchases.** In one transaction: (1) compare-and-set `UPDATE payments SET status = 'PAID', paid_at = :now, gateway_payment_id = :pid WHERE id = :id AND status = 'CREATED'` and continue only if one row changed — the webhook and the reconciliation job can race, and the loser must change nothing; (2) `UPDATE users SET subscription_status = 'ACTIVE', subscription_expires_at = :base + INTERVAL :duration_days DAY`, where `:base` is the current expiry if the user is `ACTIVE` and unexpired, otherwise `:now`. A `REFUNDED` or `DISPUTED` payment sets the user to `REVOKED` (immediate denial).
- **Lapse never deletes data** (PRD §6.3): expiry or revocation changes entitlement only. Submissions, mock-test sessions and `user_problem_solves` are untouched, so history, reports and earned points stay viewable, and re-purchase restores access with nothing to migrate.
- **Account deletion is a soft delete** (PRD ACC-4, within 30 days of `deletion_requested_at`). In one transaction, in this order — `RESTRICT` makes any other order fail: delete the user's `auth_tokens`, `user_identities`, `subscription_reminders`, `user_problem_bookmarks`, `user_content_progress` and `design_answers`; delete their `community_post_votes` and `community_comment_votes`, decrementing each target's `upvote_count`; set their `community_posts` and `community_comments` to `DELETED` with `title = '[deleted]'` and `body_markdown = ''` (others' replies stay, shown under "[deleted]"); delete their `quiz_attempts` (answers cascade); delete their `submissions` (their results cascade; `user_problem_solves.submission_id` becomes `NULL`); delete their `mock_test_sessions`; null their `analytics_events` identifiers (`UPDATE analytics_events SET user_id = NULL, anonymous_id = NULL WHERE user_id = :me`; there is no foreign key, so the position in the order is free); anonymize the `users` row in place (`email` → `deleted-<id>@deleted.invalid`, `display_name` → `Deleted user`, `avatar_url`, `college`, `graduation_year` → `NULL`, `deleted_at` set); write a `PROCESS_DELETION` audit row. `email_verified_at` is kept, `user_problem_solves` and `payments` stay, so the leaderboard shows "Deleted user" and financial records survive. `chk_users_erased_pii` rejects a half-finished anonymization. What happens if someone runs `DELETE FROM users` instead: it fails with error 1451 for any account with history, by design.
- **Mock-test clock** (TRD §2, App_Flow §3):
  - *Start* is serialized per user under `SELECT … FROM users WHERE id = :me FOR UPDATE`; `uq_mts_one_active_per_user` is the backstop if the lock is ever skipped. Before inserting, run `closeIfDue` on the user's existing `IN_PROGRESS` session: a session past `end_time` reads as `COMPLETED` immediately, but until it is closed it still occupies the unique slot.
  - `start_time` is the `Clock` instant; `end_time = start_time + mock_tests.duration_minutes`, computed in UTC. The client never supplies a time.
  - *Arrival*: `submissions.submitted_at` is stamped once when the request enters the server and passed explicitly. `trg_submissions_bi` enforces the deadline against it.
  - `end_time` changes only through *Finish test* (`end_time = LEAST(end_time, :now)`, so a late finish can never lengthen it) or an audit-logged admin extension that sets `@semicolan_allow_extension` for its transaction (see Triggers). *Finish test* is a service operation; the extension is a script an admin runs after a support request.
  - *Closing is two steps*: at `end_time` the session becomes `COMPLETED` with `score IS NULL`; the score is written once every attempt received at or before `end_time` is terminal and the settle delay has passed.
  - *Score* = the sum of `problems.points` over the problems **of the session's test** that have an `ACCEPTED` `SUBMIT` in the session (query below): all-or-nothing, no partial credit (PRD MT-3), computed when the session closes and then stored.
  - Entitlement is checked once, at start. The free test's single attempt is enforced in the service under the same user lock.
- **Solve recording**: inside the finalizing transaction, `INSERT INTO user_problem_solves (…) VALUES (…) ON DUPLICATE KEY UPDATE user_id = user_id`. A duplicate is a no-op; any other error surfaces, which `INSERT IGNORE` would hide. Connector/J reports "found" rows by default, so the no-op reports `1`; use `useAffectedRows=true` (a duplicate then reports `0`) or re-read the row if the code must know whether the solve was new (for example to publish `SolveRecorded` once).
- **Idempotent attempt creation**: read first (`SELECT … WHERE user_id = :me AND client_request_id = :req`), insert only if absent, and treat a duplicate-key error on `uq_submissions_client_request` as a lost race that returns the winner. Do not insert-then-catch: `trg_submissions_bi` fires *before* the duplicate-key check, so a client retry that arrives after the deadline would be rejected as `TEST_SESSION_CLOSED` instead of getting the original attempt back.
- **The result queue** (TRD §3): a row is claimable when `status = 'PENDING'` and `next_dispatch_at <= :now`. The dispatcher claims in a short transaction with the query below and moves `next_dispatch_at` into the future (lease). After a successful dispatch it stores the token, sets `dispatched_at`, and moves `next_dispatch_at` to the reconcile horizon, so the claim scan meets only claimable rows. Keep the claim's `ORDER BY` exactly as shown.
- **Reminders**: claim by `INSERT` into §18; a duplicate-key error means that reminder for that term was already sent.
- **One writer of live content.** `ContentPublisher` is the only code that writes published content — §3–§5, §7–§8, §17, §20–§21, §24–§26, §28–§29, §32–§35, §45, the live columns of §4 and `live_test_set` — and the admin API, the content-pack importer and the development seed all reach those tables through it (PRD OPS-1). The revision service writes only revisions (§42–§44), draft test sets (§6) and a new problem's anchor row (§4).
- **Publishing a revision** (Admin_Panel_Strategy §2.7), in one transaction, locks taken in this order: the revision row `FOR UPDATE` (require `APPROVED`; for a problem, recompute the gate fingerprint and require `gate_status = 'PASSED'` for it), then the live item's row `FOR UPDATE`; apply the document to the live tables; for a problem, set `live_test_set` to the revision's set and `status = 'PUBLISHED'`, and rewrite the editorial code from the reference solutions; for a quiz that has answers, insert the new quiz and archive the old one; mark the revision `PUBLISHED` with `published_at` and `content_id`; write one `CONTENT_PUBLISH` audit row. A `ContentPublished` event after commit evicts the in-process caches that hold the item. Parents publish before children (`409 PARENT_NOT_PUBLISHED`), and unique keys on the live tables are the final word on slugs (`409 SLUG_TAKEN`).
- **Test sets** (§6): a revision's draft set is `MAX(test_set) + 1` for the problem, allocated under the problem row lock when the revision opens; a set at or below `live_test_set` is frozen; attempts reference the set that was live, or the revision's set for `VALIDATE`, when they were created.

## Foreign Keys & Cascades

| Relationship | Action | Why |
|---|---|---|
| `auth_tokens.user_id → users` | `CASCADE` | Credentials are meaningless without their user |
| `subscription_reminders.user_id → users` | `CASCADE` | A transient notification ledger, not history |
| `problem_topics.problem_id → problems`, `.topic_id → topics` | `CASCADE` | Pure join rows |
| `problem_code_stubs.problem_id → problems` | `CASCADE` | Content owned by the problem; a problem with submissions cannot be deleted anyway |
| `problem_editorials.problem_id → problems` | `CASCADE` | Content owned by the problem, like its stubs |
| `problem_editorial_code.problem_id → problem_editorials` | `CASCADE` | Code has no meaning without its write-up |
| `user_problem_bookmarks.user_id → users`, `.problem_id → problems` | `CASCADE` | Preferences, not history; erasure deletes them explicitly (Rules) |
| `user_identities.user_id → users` | `CASCADE` | Credentials; erasure deletes them explicitly |
| `theory_questions.hub_topic_id → hub_topics`; `quizzes.hub_topic_id`, `.design_question_id`; `quiz_questions.quiz_id → quizzes` | `RESTRICT` | Content with attempts behind it is archived, never deleted |
| `design_answers.user_id → users` · `.design_question_id → design_questions` | `CASCADE` · `RESTRICT` | Personal notes · their question is archived, not deleted |
| `quiz_attempts.user_id → users`, `.quiz_id → quizzes` | `RESTRICT` | Attempts are history; erasure deletes them explicitly |
| `quiz_attempt_answers.(attempt_id, quiz_id) → quiz_attempts` · `.(question_id, quiz_id) → quiz_questions` | `CASCADE` · `RESTRICT` | Answers belong to one attempt; a question with answers cannot be deleted |
| `problem_companies`, `design_question_companies` → `companies`, `problems`, `design_questions` | `CASCADE` | Join rows |
| `user_content_progress.user_id → users` (`content_id` has no foreign key, §36) | `CASCADE` | Preferences |
| `community_posts.author_id`, `.moderated_by → users`; `.company_id → companies`; `.problem_id → problems` | `RESTRICT` | Posts are kept as `DELETED`; their author row is anonymized, never deleted |
| `community_comments.post_id → community_posts`, `.author_id → users`, `.(parent_comment_id, post_id) → community_comments` | `RESTRICT` | Same; the composite key keeps replies on their parent's post |
| `community_post_votes`, `community_comment_votes` → `users` and their target | `CASCADE` | Join rows; erasure deletes them explicitly with the counter decrements |
| `community_reports.reporter_id`, `.resolved_by → users`; `.post_id`, `.comment_id` → their target | `RESTRICT` | Moderation records are kept |
| `test_cases.problem_id → problems` | `CASCADE` | Content owned by the problem; once judged, `submission_test_results` blocks the delete |
| `mock_test_problems.mock_test_id → mock_tests` | `CASCADE` | Join rows (a test with sessions cannot be deleted) |
| `mock_test_problems.problem_id → problems` | `RESTRICT` | A problem used by a test is archived, not deleted |
| `mock_test_sessions.user_id → users`, `.mock_test_id → mock_tests` | `RESTRICT` | Sessions and reports are history (PRD §6.3) |
| `submissions.user_id → users`, `.problem_id → problems` | `RESTRICT` | Attempts are history; erasure deletes them explicitly (Rules) |
| `submissions.(test_session_id, user_id) → mock_test_sessions.(id, user_id)` | `RESTRICT` | Attempts can only join their own user's session; sessions are never deleted while attempts reference them |
| `submission_test_results.submission_id → submissions` | `CASCADE` | A result belongs to exactly one attempt (RUN purge, erasure) |
| `submission_test_results.test_case_id → test_cases` | `RESTRICT` | Judged tests are immutable history |
| `user_problem_solves.user_id → users`, `.problem_id → problems` | `RESTRICT` | Earned points must not vanish with a delete |
| `user_problem_solves.submission_id → submissions` | `SET NULL` | Points outlive a purged or erased attempt |
| `payments.user_id → users`, `.plan_id → plans` | `RESTRICT` | Financial records are retained; accounts are anonymized and plans deactivated |
| `admin_audit_log.admin_user_id`, `.target_user_id → users` | `RESTRICT` | The audit trail must outlive any account change and keep its subject |
| `content_revisions.author_id`, `.reviewer_id → users` | `RESTRICT` | Who wrote and approved content is part of its history; users are anonymized, never deleted |
| `content_revisions.content_id` | none | The deliberate polymorphic reference of §42, like §36 |
| `content_revision_editors.revision_id → content_revisions` · `.user_id → users` | `CASCADE` · `RESTRICT` | Editor rows belong to one revision (revisions are never deleted, so the cascade matters only for development data) · editors stay real users |
| `problem_validation_attempts.revision_id → content_revisions`, `.submission_id → submissions` | `CASCADE` | Links of the latest gate run; deleting a `VALIDATE` submission removes its link |
| `analytics_events.user_id` | none | Deliberately no foreign key (§19): analytics never blocks user rows, and erasure `NULL`s the column |

MySQL does not allow `CASCADE`, `SET NULL` or `SET DEFAULT` on a foreign key whose column feeds a stored generated column or a `CHECK`; the `RESTRICT` choices on `mock_test_sessions.user_id` (feeds `active_user_id`) are consistent with that, and no `CHECK` or generated column uses a column with a non-`RESTRICT` action.

## Query Patterns

`:window_start` is Sunday 18:30:00.000 UTC (Monday 00:00 Asia/Kolkata) for `WEEKLY`; for `ALL_TIME` **omit the predicate** rather than passing `'1970-01-01'`: a predicate matching every row invites a range scan over the secondary index plus a temp table, where no predicate lets the optimizer stream the aggregate in primary-key order or scan the covering index. A user's points are the sum of `points` over first solves inside the window; ties go to the user who reached the score first, then to the lower `user_id` so pagination is stable. Only verified users are ranked. Per TRD §2 (Leaderboard reads) these queries run behind a 15–30 s in-process snapshot, so they execute a few times a minute, not per request.

**Ranked list** (aggregate first, then join `users` once per user rather than once per solve):

```sql
SELECT u.display_name, t.points, t.solved_count, t.reached_at
FROM (
    SELECT s.user_id,
           SUM(s.points)            AS points,
           COUNT(*)                 AS solved_count,
           MAX(s.first_accepted_at) AS reached_at
    FROM user_problem_solves s
    WHERE s.first_accepted_at >= :window_start      -- omit for ALL_TIME
    GROUP BY s.user_id
) AS t
JOIN users u ON u.id = t.user_id
WHERE u.email_verified_at IS NOT NULL
ORDER BY t.points DESC, t.reached_at ASC, t.user_id ASC
LIMIT :limit;
```

**Viewer's own rank and neighbors** (two ranks above and below, even outside the top N). `RANK()` returns an unsigned `BIGINT`, so the neighbor window is written with additions only: v1's `user_rank - 2` underflows (error 1690, "BIGINT UNSIGNED value is out of range") for the viewer at rank 1.

```sql
WITH totals AS (
    SELECT s.user_id,
           SUM(s.points)            AS points,
           COUNT(*)                 AS solved_count,
           MAX(s.first_accepted_at) AS reached_at
    FROM user_problem_solves s
    WHERE s.first_accepted_at >= :window_start      -- omit for ALL_TIME
    GROUP BY s.user_id
),
ranked AS (
    SELECT t.user_id, u.display_name, t.points, t.solved_count,
           RANK() OVER (ORDER BY t.points DESC, t.reached_at ASC) AS user_rank
    FROM totals t
    JOIN users u ON u.id = t.user_id
    WHERE u.email_verified_at IS NOT NULL
)
SELECT r.user_rank, r.display_name, r.points, r.solved_count, (r.user_id = :me) AS is_me
FROM ranked r
JOIN (SELECT user_rank AS my_rank FROM ranked WHERE user_id = :me) m
  ON r.user_rank <= m.my_rank + 2
 AND r.user_rank + 2 >= m.my_rank
ORDER BY r.user_rank, r.user_id;
```

If the viewer has no row in the window (no solves, or an unverified email), the inner select returns nothing and the API reports no rank. Per-mock-test leaderboards are deferred (PRD §8); the sessions table deliberately carries no leaderboard index in the MVP.

**Submission history** (`GET /api/submissions`; `SUBMIT` only; `problemId` optional). Without the problem filter the plan is `idx_submissions_user_history`; with it, `idx_submissions_user_problem`; both return rows in index order with no sort. If deep pages are ever needed, switch from `OFFSET` to a keyset on `(submitted_at, id)` — the same indexes serve it.

```sql
SELECT s.id, s.problem_id, p.title, s.language, s.status, s.execution_time_ms, s.memory_kb, s.submitted_at
FROM submissions s
JOIN problems p ON p.id = s.problem_id
WHERE s.user_id = :me
  AND s.mode = 'SUBMIT'
  AND s.problem_id = :problem_id                    -- only when the filter is present
ORDER BY s.submitted_at DESC, s.id DESC
LIMIT :limit OFFSET :offset;
```

**Per-user in-flight cap** (every Run/Submit; index-only on `idx_submissions_user_status`; gate attempts never count):

```sql
SELECT COUNT(*) FROM submissions
WHERE user_id = :me AND status IN ('PENDING', 'JUDGING') AND mode IN ('RUN', 'SUBMIT');
```

**Dispatcher claim** (a short transaction; `idx_str_dispatch` provides the order, so only the returned rows are locked):

```sql
SELECT id
FROM submission_test_results
WHERE status = 'PENDING' AND next_dispatch_at <= :now
ORDER BY dispatch_priority, next_dispatch_at, id
LIMIT :n
FOR UPDATE SKIP LOCKED;
```

**Reconciler, in-flight and backlog counts** (`idx_str_reconcile`; the counts are index-only):

```sql
SELECT id, judge0_token FROM submission_test_results
WHERE status = 'PENDING' AND dispatched_at <= :overdue_before;      -- :now minus the reconcile age (15 s)

SELECT COUNT(*) FROM submission_test_results WHERE status = 'PENDING' AND dispatched_at IS NOT NULL;  -- in flight (all)
SELECT COUNT(*) FROM submission_test_results
WHERE status = 'PENDING' AND dispatched_at IS NOT NULL AND dispatch_priority = 3;                     -- gate jobs in flight
SELECT COUNT(*) FROM submission_test_results
WHERE status = 'PENDING' AND dispatched_at IS NULL AND dispatch_priority < 3;                         -- user backlog (503 rule)
```

**Gate claim** (priority `3` only, after the user claim above, up to `VALIDATION_MAX_INFLIGHT_JOBS` minus the gate jobs in flight; equality on both leading columns of `idx_str_dispatch`, so the index order is the claim order):

```sql
SELECT id
FROM submission_test_results
WHERE status = 'PENDING' AND dispatch_priority = 3 AND next_dispatch_at <= :now
ORDER BY next_dispatch_at, id
LIMIT :m
FOR UPDATE SKIP LOCKED;
```

**Mock-test score** (written once when the session closes; only problems of the session's test count, and `trg_submissions_bi` has already rejected any attempt that arrived after the deadline):

```sql
SELECT COALESCE(SUM(p.points), 0) AS score
FROM (
    SELECT DISTINCT s.problem_id
    FROM submissions s
    WHERE s.test_session_id = :session_id
      AND s.mode = 'SUBMIT'
      AND s.status = 'ACCEPTED'
) solved
JOIN mock_test_problems mtp ON mtp.mock_test_id = :mock_test_id AND mtp.problem_id = solved.problem_id
JOIN problems p ON p.id = solved.problem_id;
```

**Batched purges** (small transactions, repeated until zero rows; the cascade removes each `RUN`'s result rows):

```sql
DELETE FROM submissions WHERE mode = 'RUN' AND submitted_at < :cutoff ORDER BY submitted_at LIMIT 1000;
DELETE FROM auth_tokens WHERE expires_at < :cutoff ORDER BY expires_at LIMIT 1000;
```

**Active mock session of a user** (`GET /api/me`): `SELECT … FROM mock_test_sessions WHERE active_user_id = :me` — name the generated column so its unique index is used.

**Catalog page with the caller's progress** (`GET /api/problems`, PRD CAT-2 / CAT-3). Two steps, so the page query is the same for visitors and users and only the optional predicates change:

```sql
-- 1. The page. Each AND line is present only when its filter is.
SELECT p.id, p.slug, p.title, p.difficulty, p.is_premium_only
FROM problems p
WHERE p.status = 'PUBLISHED'
  AND p.difficulty = :difficulty
  AND EXISTS (SELECT 1 FROM problem_topics pt JOIN topics t ON t.id = pt.topic_id
              WHERE pt.problem_id = p.id AND t.slug = :topic)
  AND p.title LIKE CONCAT('%', :q_escaped, '%') ESCAPE '\\'
  -- status = SOLVED
  AND EXISTS (SELECT 1 FROM user_problem_solves s WHERE s.user_id = :me AND s.problem_id = p.id)
  -- status = ATTEMPTED (a SUBMIT, but no solve)
  AND EXISTS (SELECT 1 FROM submissions x WHERE x.user_id = :me AND x.problem_id = p.id AND x.mode = 'SUBMIT')
  AND NOT EXISTS (SELECT 1 FROM user_problem_solves s WHERE s.user_id = :me AND s.problem_id = p.id)
  -- status = UNSOLVED: only the NOT EXISTS line
  -- bookmarked = true
  AND EXISTS (SELECT 1 FROM user_problem_bookmarks b WHERE b.user_id = :me AND b.problem_id = p.id)
ORDER BY p.id
LIMIT :limit OFFSET :offset;

-- 2. Decorate the page (at most 100 ids) for a signed-in caller: three primary-key or index range reads.
SELECT problem_id FROM user_problem_solves    WHERE user_id = :me AND problem_id IN (:ids);
SELECT DISTINCT problem_id FROM submissions   WHERE user_id = :me AND problem_id IN (:ids) AND mode = 'SUBMIT';
SELECT problem_id FROM user_problem_bookmarks WHERE user_id = :me AND problem_id IN (:ids);
```

- Every per-user subquery is a point lookup on a primary key (`user_problem_solves`, `user_problem_bookmarks`) or on `idx_submissions_user_problem`.
- Title search is a leading-wildcard `LIKE`, so it scans the published problems; at a catalog of a few hundred to a few thousand rows that is a small, cheap scan (confirm with `EXPLAIN ANALYZE` in the Plan 6.1 load test), and `q` is capped at 100 characters. `%`, `_` and `\` in `q` are escaped by the service. Switch to a `FULLTEXT` index with the `ngram` parser if the catalog passes about 5,000 problems.
- `ORDER BY p.id` is the API's documented order and the primary key, so there is no sort.

**Topic counts** (`GET /api/topics`; topics with no published problem are omitted):

```sql
SELECT t.slug, t.name, COUNT(*) AS problem_count
FROM topics t
JOIN problem_topics pt ON pt.topic_id = t.id
JOIN problems p ON p.id = pt.problem_id AND p.status = 'PUBLISHED'
GROUP BY t.id, t.slug, t.name
ORDER BY t.name;

-- Signed in: the caller's solved count per topic.
SELECT pt.topic_id, COUNT(*) AS solved_count
FROM user_problem_solves s
JOIN problems p ON p.id = s.problem_id AND p.status = 'PUBLISHED'
JOIN problem_topics pt ON pt.problem_id = s.problem_id
WHERE s.user_id = :me
GROUP BY pt.topic_id;
```

The public half is identical for every caller, so it shares the catalog's in-process cache; the per-user half reads only the caller's own solves.

**Solved by difficulty** (`GET /api/me/stats`, PRD PRF-1). `byDifficulty` counts solves of problems that are *currently* published, so "solved / published" can never pass 100% after a problem is archived; the all-time `solvedCount` keeps counting every first solve, like the leaderboard.

```sql
SELECT difficulty, COUNT(*) AS published FROM problems WHERE status = 'PUBLISHED' GROUP BY difficulty;   -- cached

SELECT p.difficulty, COUNT(*) AS solved
FROM user_problem_solves s
JOIN problems p ON p.id = s.problem_id AND p.status = 'PUBLISHED'
WHERE s.user_id = :me
GROUP BY p.difficulty;
```

**Activity heatmap** (`GET /api/me/activity`): index-only on `idx_submissions_user_history`, then bucketed into Asia/Kolkata days in the application (R6 — no `DATE()` in SQL). The window is at most 366 days, so the read is bounded by one user's `SUBMIT`s in a year.

```sql
SELECT s.submitted_at
FROM submissions s
WHERE s.user_id = :me AND s.mode = 'SUBMIT'
  AND s.submitted_at >= :from AND s.submitted_at < :to      -- UTC instants of IST midnights
ORDER BY s.submitted_at;
```

**Editorial access during a running test** (`GET /api/problems/{id}/editorial` refuses with `409` when this returns a row):

```sql
SELECT 1
FROM mock_test_sessions s
JOIN mock_test_problems mtp ON mtp.mock_test_id = s.mock_test_id AND mtp.problem_id = :problem_id
WHERE s.active_user_id = :me AND s.end_time > :now;
```

It uses `uq_mts_one_active_per_user` and the `mock_test_problems` primary key. The `end_time > :now` predicate matches the API rule that a session past its deadline already reads as closed.

**Hub topic grid with progress** (`GET /api/hubs/{hub}/topics`): published topics in `display_order` (`uq_hub_topics_order`), each with its published theory count and, for a signed-in caller, the learned count:

```sql
SELECT t.id, t.slug, t.name, t.icon,
       COUNT(q.id)              AS theory_count,
       COUNT(p.content_id)      AS learned_count          -- signed-in only; the LEFT JOIN is omitted for visitors
FROM hub_topics t
LEFT JOIN theory_questions q ON q.hub_topic_id = t.id AND q.status = 'PUBLISHED'
LEFT JOIN user_content_progress p
       ON p.user_id = :me AND p.content_type = 'THEORY' AND p.content_id = q.id AND p.completed_at IS NOT NULL
WHERE t.hub = :hub AND t.status = 'PUBLISHED'
GROUP BY t.id, t.slug, t.name, t.icon, t.display_order
ORDER BY t.display_order;
```

**Answering a quiz question** (`PUT /api/quiz-attempts/{id}/answers/{questionId}`), one short transaction:

```sql
SELECT id, quiz_id, status, question_count FROM quiz_attempts WHERE id = :attempt AND user_id = :me FOR UPDATE;
SELECT correct_option, explanation_markdown, JSON_LENGTH(options) AS n FROM quiz_questions WHERE id = :question AND quiz_id = :quiz;
INSERT INTO quiz_attempt_answers (attempt_id, quiz_id, question_id, selected_option, is_correct, answered_at)
VALUES (:attempt, :quiz, :question, :selected, :selected <=> :correct, :now);
-- duplicate key → return the stored answer (the answer is final; no counter change)
UPDATE quiz_attempts
   SET completed_at   = IF(answered_count + 1 = question_count, :now, completed_at),
       status         = IF(answered_count + 1 = question_count, 'COMPLETED', status),
       correct_count  = correct_count + :is_correct,
       answered_count = answered_count + 1
 WHERE id = :attempt AND status = 'IN_PROGRESS';
```

MySQL evaluates single-table `UPDATE` assignments left to right, and a later assignment sees the values set by earlier ones. That is why `answered_count` is incremented **last**: the two `IF`s still compare against the old count. Keep this order; a unit test pins it. (`CHECK` constraints are evaluated on the final row, so the order of the other assignments does not matter to them.)

**Activity heatmap with quizzes** (`GET /api/me/activity`): the existing `SUBMIT` read plus an index-only read of completed quizzes (`idx_quiz_attempts_user_completed`), bucketed into IST days together in the application:

```sql
SELECT completed_at FROM quiz_attempts
WHERE user_id = :me AND completed_at >= :from AND completed_at < :to;
```

**Community feeds** (`GET /api/community/posts`), newest or most popular per category, served by the matching index with no sort:

```sql
SELECT id, author_id, title, company_id, level, role_title, upvote_count, comment_count, published_at
FROM community_posts
WHERE category = :category AND status = 'PUBLISHED'
  AND company_id = :company                      -- optional; the planner then prefers idx_posts_company
  AND level IN (:levels)                         -- optional; filtered after the index range
ORDER BY published_at DESC, id DESC              -- or: upvote_count DESC, published_at DESC, id DESC
LIMIT :limit OFFSET :offset;
```

Authors are then read by primary key for the page (display name; "Deleted user" for anonymized rows). The level filter is not in the index on purpose: seven values over a feed of this size do not justify another B-tree. Revisit with `EXPLAIN ANALYZE` in the load test.

**Moderation queue** (`GET /api/admin/moderation/queue`): `status = 'PENDING_REVIEW'` posts oldest first (`idx_posts_review`) plus `OPEN` reports oldest first (`idx_reports_queue`).

**Content review queue** (`GET /api/admin/revisions?status=IN_REVIEW`): `idx_revisions_queue`, oldest first, then one primary-key read per page item for its live title.

```sql
SELECT id, content_type, content_id, revision_no, author_id, submitted_at
FROM content_revisions
WHERE status = 'IN_REVIEW'
ORDER BY submitted_at, id
LIMIT :limit OFFSET :offset;
```

**Test cases of one set** (the judge at attempt creation, the problem page's samples, and the admin test list; `uq_test_cases_set_order` and `idx_test_cases_set_sample`):

```sql
SELECT id, display_order, is_sample FROM test_cases
WHERE problem_id = :p AND test_set = :set ORDER BY display_order;                        -- an attempt's result rows
SELECT input_payload, expected_output_payload FROM test_cases
WHERE problem_id = :p AND test_set = :live AND is_sample = TRUE ORDER BY display_order;  -- samples
```

**Blog feed** (`GET /api/blog/posts`): `idx_blog_posts_feed` returns rows in order with no sort.

```sql
SELECT slug, title, summary, byline, cover_asset, published_at, updated_at
FROM blog_posts
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC, id DESC
LIMIT :limit OFFSET :offset;
```

## Operations

**Server and client settings**

| Setting | Value | Why |
|---|---|---|
| Image | `mysql:8.4` | 8.0 reached end of life in April 2026; the DDL is written for both |
| `default-time-zone` | `'+00:00'` | R5; a numeric offset needs no time-zone tables |
| `log_timestamps` | `UTC` | Server logs agree with the data |
| `character_set_server` / `collation_server` | `utf8mb4` / `utf8mb4_0900_ai_ci` | Matches the table options |
| `sql_mode` | Keep the 8.x default (`STRICT_TRANS_TABLES`, `NO_ZERO_DATE`, `ONLY_FULL_GROUP_BY`, …) | Strict mode turns an oversize or invalid value into an error instead of a silent truncation |
| `log_bin_trust_function_creators` | `1` on managed MySQL with binlog | Lets the migration account create the two triggers |
| JDBC | `connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true`, plus `useAffectedRows=true` if the code relies on affected-row counts | R5; see Solve recording |
| Hibernate / JVM | `hibernate.jdbc.time_zone=UTC`; `-Duser.timezone=UTC`; `Clock.tickMillis(ZoneOffset.UTC)` | R2, R5 |

**Accounts and privileges.** Two accounts: the migration account (Flyway) owns DDL and the triggers; the runtime account has DML only — no `ALTER`, `DROP`, `TRUNCATE`, `CREATE TRIGGER`. Grant at table level (a database-level grant cannot be narrowed later) and make the audit and event tables append-only:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON semicolan.users TO 'semicolan_app'@'%';   -- repeat for each ordinary table
GRANT SELECT, INSERT                 ON semicolan.admin_audit_log TO 'semicolan_app'@'%';
GRANT SELECT, INSERT, UPDATE (processed_at) ON semicolan.payment_events TO 'semicolan_app'@'%';
GRANT SELECT, INSERT, UPDATE (user_id, anonymous_id) ON semicolan.analytics_events TO 'semicolan_app'@'%';
```

Optionally narrow `UPDATE` on `mock_test_sessions` to `(status, score, end_time)`; the entity must then map the other columns `updatable = false`, which it should anyway.

**Growth and retention**

| Table | Growth driver | Action |
|---|---|---|
| `submission_test_results` | One row per test per attempt: the largest table by far | Keep the aggregate on `submissions`; if storage dominates, archive or delete result rows of attempts older than a retention window (a product decision). Watch write cost: it carries six B-trees |
| `submissions` | `RUN` churn dominates row count; `source_code` dominates size | The batched 24-hour purge; if `RUN` volume ever dominates, move `RUN` to its own table or out of MySQL |
| `auth_tokens` | One row per refresh | Purge by `expires_at` |
| `payment_events` | One row per gateway event, with its payload | Archive payloads after the reconciliation window |
| `subscription_reminders` | Two rows per paid term | Purge after 90 days |
| `user_problem_solves` | One row per solved problem per user | Bounded by users × problems; no retention |
| `user_problem_bookmarks` | One row per saved problem per user | Capped at 1,000 per user; no retention |
| `quiz_attempt_answers` | One row per answered question | Bounded by attempts × questions; the largest of the new tables. Aggregate or purge attempts older than a retention window if it ever matters (a product decision) |
| `community_posts`, `community_comments`, votes | User activity | No retention; `DELETED` rows keep only IDs and timestamps |
| `community_reports` | One per report | Never purged (moderation record) |
| `problem_editorials`, `problem_editorial_code` | One editorial and four code rows per problem | Bounded by the catalog |
| `analytics_events` | One row per tracked event | Aggregate or purge after about 13 months (a product decision) |
| `admin_audit_log` | One row per admin action | Never purged |
| `content_revisions`, `content_revision_editors` | One row per revision of a content item (documents up to a few hundred KB for problems) | Never purged: they are the content history; bounded by edits |
| `test_cases` | One copy of a problem's tests per published or open revision | Superseded sets no result row references may be deleted by an operator (§6) |
| `problem_validation_attempts` and their `VALIDATE` submissions | Five attempts per gate run, latest run only per revision | Replaced by the next run; deleted with a discarded revision |
| `blog_posts` | One row per post | No retention; archived posts stay |

**Scale check.** The user-facing paths are bounded by one user's rows or one page: history and the in-flight cap by the user's own attempts, scoring by one session, the callback and apply paths by primary key. The only population-wide queries are the two leaderboard aggregates; at 100,000 solve rows the weekly one reads only that week's slice of `idx_ups_window` and the all-time one reads the table once, both behind the TRD §2 snapshot, so they run a few times per minute. Confirm in the Plan 6.1 load test with `EXPLAIN ANALYZE` on a seeded 100k and 1M-row dataset: the weekly aggregate should show a range scan on `idx_ups_window` with `Using index`; history should show no filesort; the dispatcher claim should show `idx_str_dispatch` with a `LIMIT`-bounded row estimate. Add a leaderboard summary table only if the snapshot refresh stops fitting its interval (a Redis-backed leaderboard is Future Scope, TRD §7).
