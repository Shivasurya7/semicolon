# Agent Testing Environment — Semicolan

This document is the test environment that human developers and AI coding agents use to prove Semicolan works: the tools, the harness classes, the local stack, the commands, and the rules that keep results deterministic. It is normative for the test harness.
- The verification tags it serves (**UT**, **IT**, **E2E**, **DRILL**, **LOAD**, **SCRIPT**, **CI/CD**) and the acceptance criteria are in [Implementation_Plan.md](Implementation_Plan.md).
- The mock providers it relies on are in [Dev_to_Prod_Strategy.md](Dev_to_Prod_Strategy.md).
- The endpoints it calls are in [API_Contract.md](API_Contract.md).

When this document and one of those disagrees, the other document wins and this one is fixed.

The repository holds no code yet. Implementation_Plan 0.4 builds the parts of the harness described here, and §11 lists which milestone adds the rest.

---

## 0. Principles

1. **Mock the edge, never the core** (Dev_to_Prod_Strategy §0). Integration tests run against real MySQL 8.4, the real Spring Security chain, the real `TokenService`, the real dispatcher and `JudgeResultApplier`, and the real `PaymentEventProcessor`. Only the outside world is replaced: the identity providers, the payment provider, Judge0 and email. H2 and other in-memory databases are never used, because the schema depends on MySQL triggers, generated columns, `SKIP LOCKED` and UTC session settings.
2. **Time never passes by waiting.** Tests move the injected `Clock` or backdate rows (Implementation_Plan working agreement 4). Background jobs run only when the test calls them. `Thread.sleep`, `page.waitForTimeout` and "wait 5 seconds and hope" are bugs.
3. **Every test starts from a known world.**
   - Each integration test starts on a clean database with the seeded users re-created.
   - Each end-to-end test that changes state signs in as its own **ephemeral** user, so tests can run in parallel without colliding on rate limits, the free mock-test attempt or purchases.
4. **A test names the criterion it proves.** Its display name starts with the milestone (`"3.1: …"`), so a failing test points at an acceptance criterion and a criterion can be traced to its test.
5. **One command per level, the same for everyone.** Humans, agents and CI all run the `make` targets of §8. CI runs nothing that a laptop cannot.
6. **Tests never touch shared environments by accident.** The E2E suite refuses to run against any stack that is not in mock mode (§7.5). Preview is used only when someone explicitly asks for it.

## 1. Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| JDK | 21 (Temurin), enforced by the Maven toolchain | Backend build, unit and integration tests |
| Maven | The wrapper `./mvnw` (3.9.x); no global install | Same |
| Docker Engine and Compose v2 | Engine 24+, Compose 2.20+ (needed for `up --wait`) | Testcontainers, the local and E2E stacks |
| Node.js and npm | 24 LTS, pinned in `.nvmrc` | Frontend tests, Playwright |
| Playwright browsers | Matching the `@playwright/test` version pinned in `e2e/package.json` | E2E |
| Linux x86-64 host with the cgroup mode the pinned Judge0 release requires (Implementation_Plan 0.3) | — | **Only** level L3 (real Judge0) and the canary. macOS and Windows run every other level |
| Free resources | 4 CPU cores and 8 GB RAM for the full E2E stack | E2E |

`make doctor` checks all of these, plus free ports 3306, 1025, 8025, 8080, 4173 and 5173, and prints what is missing.

## 2. Layout and Test Levels

```
backend/
  src/main/java/…/execution/fake/        FakeCodeExecutionClient (@DevOnly: also the dev/E2E executor, §5.2)
  src/test/java/…/**/*Test.java          unit tests            → Surefire  (./mvnw test)
  src/test/java/…/**/*IT.java            integration tests     → Failsafe  (./mvnw verify)
  src/test/java/…/testsupport/           MySqlTestContainer, AbstractIntegrationTest, MutableClock,
                                         DatabaseCleaner, Jobs, AuthHelper, Fixtures, CallbackSigner,
                                         Judge0Simulator, CallbackDriver, ConcurrentRunner, InMemoryEmailSender
  src/test/resources/application-test.yml
  src/test/resources/fixtures/judge0/    captured by the 0.3 spike (create, read, callback bodies per status)
  src/test/resources/fixtures/oauth/     recorded in 10.2 (JWKS, token, userinfo, GitHub user and emails)
  src/test/resources/fixtures/razorpay/  recorded in 10.3 (webhook bodies, re-signed in tests)
frontend/
  src/**/*.test.ts(x)                    Vitest + React Testing Library
  src/test/msw/                          MSW handlers built from the API_Contract examples
e2e/
  playwright.config.ts  global-setup.ts
  fixtures/                              users, editor, mailpit, api, seed (slugs of the dev seed)
  fixtures/files/                        test archives for admin bulk import
  specs/<area>/*.spec.ts                 one folder per area: auth, catalog, workspace, mock-tests, …, admin
scripts/test/                            doctor.sh, bundle-guard.sh, e2e-wait.sh
scripts/load/                            k6 scenarios (Implementation_Plan 9.1)
content/dev-seed/                        the development content pack (Implementation_Plan 2.1, 5.1, 6.1, 6.2)
docker-compose.yml                       mysql:8.4, mailpit, judge0 (profile "judge0")
docker-compose.e2e.yml                   backend and frontend images on top of the base file (§7.2)
Makefile                                 the entry points of §8
```

| Tag | Level | Tools | Command | Needs |
|---|---|---|---|---|
| UT | Backend unit | JUnit 5, Mockito, AssertJ | `make test-unit` | JDK |
| UT | Frontend unit and component | Vitest, React Testing Library, MSW | `make test-unit` | Node |
| IT | Backend integration | Spring Boot Test, MockMvc, Testcontainers MySQL, WireMock | `make test-it` | JDK, Docker |
| E2E | Browser flows on the compose stack | Playwright, `@axe-core/playwright` | `make e2e` | Docker, Node |
| E2E (L3) | Browser flows on real Judge0 | Same, with `E2E_EXECUTOR=judge0` | `make e2e-judge0` | Linux + Judge0 |
| SCRIPT | Committed scripts that exit 0 | Bash, `curl`, `jq` | per milestone | Varies |
| LOAD | Load tests | k6 | `make load` | A deployed stack |
| DRILL | Scripted manual runs | Checklists in the PR | — | Preview or staging |

## 3. Backend Unit Tests (JUnit 5 and Mockito)

**Stack**: JUnit Jupiter, Mockito with `mockito-junit-jupiter` (strict stubs), AssertJ. All three come from `spring-boot-starter-test`, and the Spring Boot BOM manages their versions.

**What belongs here**: pure logic that needs no database or Spring context.
- Verdict aggregation: the first failing test by display order wins, and a genuine failure outranks `JUDGING_ERROR`.
- Judge0 status mapping, including the reclassification of Python `SyntaxError`.
- Effective limits and clamping.
- Callback signature building and constant-time verification.
- The gate fingerprint (Admin_Panel_Strategy §2.6) and the revision state machine.
- The entitlement rule, and the rate-limit header arithmetic.
- The Markdown sanitizer allowlist.
- JWT claim building.

**Rules**
- No Spring context in a unit test: `@ExtendWith(MockitoExtension.class)`, with constructors called directly.
- Mock **ports** (`CodeExecutionClient`, `PaymentService`, `EmailSender`, `AnalyticsPublisher`, repositories), never value objects. Never mock the class under test.
- Never mock `Clock`. Pass `MutableClock` (§4.5) or `Clock.fixed(…)`.
- Anything whose correctness depends on SQL, locking, triggers or transactions is an integration test, not a unit test with a mocked repository.
- One behavior per test. The display name quotes the criterion.

```java
class VerdictAggregatorTest {
    @Test
    @DisplayName("3.1: the first failing test by display order decides the verdict, not arrival order")
    void firstFailingTestByDisplayOrder() {
        var arrivals = List.of(result(5, TIME_LIMIT_EXCEEDED), result(2, WRONG_ANSWER), result(1, ACCEPTED));
        var verdict = VerdictAggregator.aggregate(arrivals);
        assertThat(verdict.status()).isEqualTo(WRONG_ANSWER);
        assertThat(verdict.failedTestIndex()).isEqualTo(2);
    }
}

@ExtendWith(MockitoExtension.class)
class PublishGateServiceTest {
    @Mock ContentRevisionRepository revisions;
    @Mock ValidationAttemptFactory attempts;
    final MutableClock clock = MutableClock.at("2026-11-02T04:30:00Z");

    @Test
    @DisplayName("3.3: a validation run dispatches four reference attempts and one negative control at priority 3")
    void dispatchesFiveAttemptsAtLowestPriority() {
        when(revisions.lockForGate(7L)).thenReturn(problemRevision(7L));
        new PublishGateService(revisions, attempts, clock).start(7L, ADMIN_ID);
        verify(attempts, times(5)).create(argThat(a -> a.mode() == VALIDATE && a.dispatchPriority() == 3));
    }
}
```

## 4. Backend Integration Tests (Spring Boot, MockMvc, Testcontainers)

### 4.1 Maven wiring

Surefire runs `*Test`, Failsafe runs `*IT`, and `-DskipUTs` skips only the unit tests, so the integration suite can run alone.

```xml
<properties>
  <skipUTs>false</skipUTs>
  <argLine>-Duser.timezone=UTC</argLine>          <!-- Backend_Schema R5: the JVM is UTC in tests too -->
</properties>
…
<plugin>
  <artifactId>maven-surefire-plugin</artifactId>
  <configuration>
    <skipTests>${skipUTs}</skipTests>
    <excludes><exclude>**/*IT.java</exclude></excludes>
  </configuration>
</plugin>
<plugin>
  <artifactId>maven-failsafe-plugin</artifactId>
  <executions><execution><goals><goal>integration-test</goal><goal>verify</goal></goals></execution></executions>
  <configuration><includes><include>**/*IT.java</include></includes></configuration>
</plugin>
```

### 4.2 The MySQL container

There is one container per JVM, configured exactly like the compose service and Backend_Schema "Operations". A test that passes against it therefore runs against the same time zone, character set and trigger privileges as production.

```java
public final class MySqlTestContainer {
    public static final MySQLContainer<?> MYSQL = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
            .withDatabaseName("semicolan")
            .withCommand("--default-time-zone=+00:00", "--log-timestamps=UTC",
                         "--character-set-server=utf8mb4", "--collation-server=utf8mb4_0900_ai_ci",
                         "--log-bin-trust-function-creators=1")           // lets Flyway create the triggers
            .withUrlParam("connectionTimeZone", "UTC")
            .withUrlParam("forceConnectionTimeZoneToSession", "true")
            .withUrlParam("useAffectedRows", "true")
            .withTmpFs(Map.of("/var/lib/mysql", "rw"))                   // data on tmpfs: fast, disposable
            .withReuse(true);                                             // only if enabled locally (§8)
    static { MYSQL.start(); }
    private MySqlTestContainer() {}
}
```

- **Image digest.** The image tag is pinned by digest in the same constant that compose uses, and both are updated together.
- **Container reuse** applies only on machines that opt in (`testcontainers.reuse.enable=true` in `~/.testcontainers.properties`). CI always starts a fresh container.
- **Migrations.** Flyway runs `db/migration` and `db/seed-dev` when the Spring context starts, so every IT runs against the real baseline (Implementation_Plan 1.1).
- **Privileges.** One IT, `RuntimePrivilegesIT`, creates the runtime account with the grants from Backend_Schema "Operations" and proves that the application works with DML only, and that `admin_audit_log` rejects `UPDATE`.

### 4.3 The base class

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSupportConfig.class)
public abstract class AbstractIntegrationTest {
    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", MySqlTestContainer.MYSQL::getJdbcUrl);
        r.add("spring.datasource.username", MySqlTestContainer.MYSQL::getUsername);
        r.add("spring.datasource.password", MySqlTestContainer.MYSQL::getPassword);
    }

    @Autowired protected MockMvc mvc;
    @Autowired protected MutableClock clock;
    @Autowired protected DatabaseCleaner db;
    @Autowired protected MockUserSeeder seeder;
    @Autowired protected AuthHelper auth;
    @Autowired protected Fixtures fixtures;
    @Autowired protected FakeCodeExecutionClient executor;
    @Autowired protected InMemoryEmailSender emails;
    @Autowired protected Jobs jobs;

    @BeforeEach
    void resetWorld() {
        clock.setTo(TestTimes.BASE);   // 2026-11-02T04:30:00Z: a Monday, 10:00 IST
        executor.reset();
        emails.clear();
        db.deleteAllRows();
        seeder.reseed();               // the seven fixed test users (Dev_to_Prod_Strategy §1.2)
    }
}
```

- **Spring context caching.** Every IT extends this one class and uses one configuration, so Spring builds the context once per JVM. A test that adds `@MockitoBean` or its own properties starts a second context and costs seconds. Prefer the shared fakes (`FakeCodeExecutionClient`, `InMemoryEmailSender`, `MockPaymentServiceImpl`), and group the tests that need overrides, such as rate-limit tests, into a few classes.
- **No `@Transactional` rollback tests.** The code under test commits its own transactions, publishes after-commit events, and relies on row locks between threads. A test transaction would hide all three.

### 4.4 The `test` profile

`application-test.yml` builds on `application-dev.yml` (Dev_to_Prod_Strategy §1.1):

```yaml
semicolan:
  auth.mode: mock
  payments.provider: mock
  execution.client: fake                # FakeCodeExecutionClient (§5.2); SEMICOLAN_EXECUTION_CLIENT
  execution.fake.callback-mode: manual  # callbacks fire only when a test calls executor.deliverPending()
  scheduling.enabled: false             # no @Scheduled ticks: tests call Jobs (§4.8)
  async.mode: sync                      # analytics and email run on the calling thread
  content.self-review-allowed: false    # the production rule (Admin_Panel_Strategy §3.2)
  rate-limits:                          # generous defaults; a test that asserts a limit sets its own
    run: 1000
    submit: 1000
mail.sender: in-memory                  # InMemoryEmailSender instead of SMTP
```

A test that asserts a limit narrows it for that class only: `@TestPropertySource(properties = "semicolan.rate-limits.submit=3")`.

### 4.5 Controlling time

```java
public final class MutableClock extends Clock {
    private volatile Instant now;
    public static MutableClock at(String iso) { var c = new MutableClock(); c.setTo(Instant.parse(iso)); return c; }
    public void setTo(Instant t)    { now = t.truncatedTo(ChronoUnit.MILLIS); }      // like Clock.tickMillis (R2)
    public void advance(Duration d) { now = now.plus(d).truncatedTo(ChronoUnit.MILLIS); }
    @Override public Instant instant() { return now; }
    @Override public ZoneId getZone()  { return ZoneOffset.UTC; }
    @Override public Clock withZone(ZoneId zone) { throw new UnsupportedOperationException("UTC only"); }
}
```

- `TestSupportConfig` registers the clock as the `@Primary` `Clock` bean.
- Time-based criteria advance the clock and then run the relevant job. Examples: expiry at `expires_at`, the refresh leeway, the 24-hour account-age rule, and IST week and day boundaries.
- **Mock-test sessions are the one exception** (Implementation_Plan working agreement 4): `start_time` cannot be back-dated, so create the session under the moved clock, insert its attempts, and then shorten `end_time` to simulate expiry.

### 4.6 Database cleanup

`DatabaseCleaner.deleteAllRows()` runs on one connection: `SET FOREIGN_KEY_CHECKS = 0`, then `DELETE FROM` every table except `flyway_schema_history` and the reference rows that migrations insert (`plans`), then `SET FOREIGN_KEY_CHECKS = 1`.
- It reads the table list from `information_schema` once.
- `DELETE` is faster than `TRUNCATE` for small tables, because InnoDB rebuilds a table on `TRUNCATE`. Triggers are untouched.
- `AUTO_INCREMENT` values keep growing between tests, so **tests never hard-code IDs**; they read them from the fixture they created.

### 4.7 Signing in

```java
String free     = auth.tokenFor("free");                       // POST /api/auth/mock-login through MockMvc, cached per test
String reviewer = auth.ephemeral("e2e-reviewer", "admin");     // a second admin for four-eyes tests
mvc.perform(get("/api/problems/{id}", id).header(AUTHORIZATION, "Bearer " + free))
   .andExpect(status().isForbidden())
   .andExpect(jsonPath("$.error").value("PREMIUM_REQUIRED"));
```

- `tokenFor` signs in as one of the seven fixed users.
- `ephemeral(key, template)` creates an `e2e-…` user from a template (API_Contract §1). This is how tests get a fresh `free` user whose free mock-test attempt is unused, or a second admin.
- Tokens are real JWTs minted by `TokenService`, so every IT also exercises the security filter chain.

### 4.8 Driving background jobs

Every scheduled component exposes `runOnce()`. Its `@Scheduled` method only calls `runOnce()`, and scheduling is off in `test`. `Jobs` gathers them:

| Call | Job (TRD §2) |
|---|---|
| `jobs.dispatcher().runOnce()` | Claims due result rows and sends batches to the executor |
| `jobs.reconciler().runOnce()` | Reads overdue jobs, re-dispatches lost ones, sweeps stuck attempts |
| `jobs.mockTestCloser().runOnce()` | `closeIfDue` for sessions past `end_time` |
| `jobs.paymentReconciler().runOnce()` | Asks the provider about `CREATED` orders |
| `jobs.subscriptionSweeper().runOnce()` | Relabels lapsed `ACTIVE` users as `EXPIRED`, sends the expiry reminders |
| `jobs.runPurge().runOnce()`, `jobs.judge0RetentionPurge().runOnce()` | The purges |

A test therefore controls exactly when each job runs, and a criterion such as "within one closer interval" becomes "after one `runOnce()` with the clock moved by the interval".

### 4.9 Concurrency

Races are tested with real threads against the real database. `ConcurrentRunner.race(n, action)` releases `n` threads from one `CountDownLatch` and collects every outcome. The test then asserts the **final database state**, never an order. This is how these criteria are proven:
- "two last results finalize once" (3.1);
- "two concurrent starts create one session" (4.3);
- "concurrent answers increment once" (5.2);
- "20 concurrent upvotes leave 20" (7.1);
- "a duplicate payment event grants one term" (8.1).

### 4.10 Example

```java
class SubmissionReconcilerIT extends AbstractIntegrationTest {
    @Test
    @DisplayName("3.1: with every callback lost, the reconciler applies the results and the attempt finalizes")
    void lostCallbacksAreRecoveredByTheReconciler() throws Exception {
        var problem = fixtures.problem().samples(1).hidden(3).publish();
        executor.script(problem.id()).otherwiseAccepted();
        executor.callbacks(CallbackMode.LOST);

        long id = fixtures.submit(auth.tokenFor("free"), problem, "SUBMIT");   // 202, PENDING
        jobs.dispatcher().runOnce();                                             // tokens stored, JUDGING
        clock.advance(Duration.ofSeconds(16));                                   // past the 15 s reconcile horizon
        jobs.reconciler().runOnce();

        mvc.perform(get("/api/submissions/{id}", id).header(AUTHORIZATION, "Bearer " + auth.tokenFor("free")))
           .andExpect(jsonPath("$.status").value("ACCEPTED"))
           .andExpect(jsonPath("$.progress.completed").value(4))
           .andExpect(jsonPath("$.pointsAwarded").value(1));
    }
}
```

### 4.11 Content and admin fixtures

- **Content fixtures go through the production writer.** `Fixtures` builds content through `ContentPublisher`, the same writer as the admin panel and the importer (Admin_Panel_Strategy §0). Before 7.4 it goes through the Phase 2 loader, which is built on the publisher from the start (Implementation_Plan 2.1).
  - `fixtures.problem().samples(2).hidden(5).premium().publish()` imports a revision, runs the gate on the fake executor and publishes it.
  - `fixtures.problemRevision(problem).withTest(3, "in", "out")` opens a draft revision.
  - `fixtures.approve(revisionId, reviewerToken)` and `fixtures.publish(revisionId)` drive the workflow through the admin API with MockMvc.
- **Raw SQL fixtures are only for states that no service can create:** backdated `created_at` for the 24-hour posting rule, a session whose `end_time` was shortened, anonymized users. Each one has a named helper that uses the SQL from Backend_Schema or Dev_to_Prod_Strategy.

### 4.12 Real adapters against WireMock

- The real HTTP adapters are tested against WireMock (`org.wiremock:wiremock-standalone` 3.x, `WireMockExtension`) with recorded fixtures:
  - the Judge0 adapter (§5.4);
  - the Google and GitHub adapters (Implementation_Plan 10.2);
  - Razorpay `fetchOrder` (10.3).
- Webhook signature tests re-sign recorded bodies with a test secret.
- No test ever calls a real provider.

## 5. Judge0 Without Judge0: Simulating the Async Callbacks

Judge0 is asynchronous. The backend sends a batch with `wait=false`; Judge0 later sends a `PUT` to each job's signed `callback_url`; the backend treats that call only as a hint and reads the result back (TRD §3). Each part is tested at the cheapest level that can prove it.

### 5.1 Levels

| Level | Replaces Judge0 with | Proves | Used by |
|---|---|---|---|
| L1 | Nothing: MockMvc sends signed `PUT`s straight to the callback controller (§5.3) | Signature, `exp` and `kid` checks; the same `403` for every failure; the body is ignored; hints for terminal rows or rows without a token are dropped | IT, every PR |
| L2 | `FakeCodeExecutionClient`, the port implementation inside the JVM (§5.2) | The whole domain pipeline: dispatch, leases and backoff, callbacks in every order, duplicates and losses, the reconciler, re-dispatch, finalization, the stuck sweep, admission control, gate attempts | IT, every PR; the dev and E2E executor |
| L2-W | `Judge0Simulator`, which plays Judge0's REST API on WireMock (§5.4) | The real `Judge0CodeExecutionClient`: request shapes, batching (20/20/5), Base64, auth header, limits, `expected_output` always present, status mapping, Python `SyntaxError`, `DELETE` for retention | IT, every PR |
| L3 | The real Judge0 under the compose `judge0` profile | Language IDs, compilers, real limits, the real callback route, the canary | Linux only: `make e2e-judge0`, the preview and staging CD smoke stages |

### 5.2 `FakeCodeExecutionClient`

- **What it is.** A complete implementation of `CodeExecutionClient`, kept in the main source tree, marked `@DevOnly` and selected by `SEMICOLAN_EXECUTION_CLIENT=fake`. The startup guard refuses to run it under `staging` or `prod` (TRD §2), because a fake executor in production would accept everything.
- **How it behaves.**
  - `dispatch` returns a token per job unless a failure is scripted.
  - `fetch` returns the scripted outcome per token.
  - Callbacks go to the **real** callback endpoint with a correctly signed URL, so every level above L1 exercises the hint path too.
  - **Two callback modes:**
    - `manual` (integration tests): callbacks queue until `executor.deliverPending()` is called, so the test decides when they arrive.
    - `auto` (dev and E2E): each callback fires after a delay, 300 ms per job by default.
- **Default outcome.** Each test is `ACCEPTED`, `stdout` equals the expected output, time is 10 ms and memory is 1,024 KB.

Scripting from Java (integration tests):

```java
executor.script(problemId)
        .language("java")                       // optional: one language only
        .test(2).wrongAnswer("41\n")            // position among the attempt's tests, display order
        .test(5).timeLimitExceeded()
        .otherwiseAccepted();
executor.compileError(problemId, "python", "  File \"main.py\", line 3\nSyntaxError: invalid syntax");
executor.callbacks(CallbackMode.DUPLICATE);     // DELIVER (default) | DUPLICATE | REVERSED | LOST | BEFORE_BATCH_RESPONSE
executor.nextDispatch().fails(DispatchFailure.QUEUE_FULL_503);   // CONNECTION_REFUSED | TIMEOUT | SERVER_ERROR | REJECT_ITEM(3)
executor.loseJob(problemId, 4);                 // fetch answers null → re-dispatch with a fresh token
executor.internalError(problemId, 4);           // Judge0 status 13 → lost-job path
executor.acceptEverything();                    // the broken pipeline that the negative control must catch (3.3)
executor.deliverPending();                      // manual mode: fire the queued callbacks now
assertThat(executor.dispatchedJobs()).allSatisfy(j -> assertThat(j.expectedOutput()).isNotNull());
```

**Source directives (dev and E2E).** Playwright cannot call Java, so the fake also reads a directive from the submitted source. The directive is ignored when a Java script is set for the problem, and real Judge0 ignores it because it is only a comment.

```
semicolan-fake: <VERDICT>[@<position>] [<VERDICT>@<position> …] [delay=<ms>] [callbacks=deliver|duplicate|lost]
VERDICT := ACCEPTED | WRONG_ANSWER | TIME_LIMIT_EXCEEDED | RUNTIME_ERROR | COMPILE_ERROR
```

| Language | Example | Result |
|---|---|---|
| Python 3 | `# semicolan-fake: WRONG_ANSWER@3` | Tests 1–2 pass, test 3 `WRONG_ANSWER` with output `semicolan-fake: wrong output` |
| Java | `// semicolan-fake: COMPILE_ERROR` | `COMPILE_ERROR` with compile output `semicolan-fake: compilation failed (simulated)` |
| C++ | `// semicolan-fake: TIME_LIMIT_EXCEEDED@1 delay=4000` | The "Slow" execution state, then `TIME_LIMIT_EXCEEDED` on test 1 |
| C | `// semicolan-fake: RUNTIME_ERROR@2` | `RUNTIME_ERROR` with stderr `semicolan-fake: segmentation fault (simulated)` |
| any | `# semicolan-fake: ACCEPTED callbacks=lost` | No callback arrives; the reconciler applies the result within about 25 s (its interval plus the 15 s horizon) |
| any | no directive | Every test `ACCEPTED` |

- **Positions.** A position counts among the **attempt's** tests: a `RUN` has only the samples, a `SUBMIT` has all tests.
- **Negative control.** The publish gate's negative control (Admin_Panel_Strategy §2.6) carries `semicolan-fake: WRONG_ANSWER@1` in its source. Under the fake it is therefore rejected, exactly as the real program, which prints nothing, is rejected by real Judge0. Unless `acceptEverything()` is on, the gate passes on the fake for a seed problem whose reference solutions carry no directive.

### 5.3 L1: signed callbacks through MockMvc

```java
URI url = callbacks.signedUrl(resultId, clock.instant().plus(Duration.ofMinutes(15)), "k1");   // CallbackSigner
mvc.perform(put(url).contentType(APPLICATION_JSON).content(Judge0Fixtures.body("accepted.json")))
   .andExpect(status().isNoContent());

for (URI bad : List.of(callbacks.tamperedSig(url), callbacks.unknownKid(url), callbacks.expired(url), callbacks.unknownResult(url))) {
    mvc.perform(put(bad).contentType(APPLICATION_JSON).content("{}"))
       .andExpect(status().isForbidden())
       .andExpect(jsonPath("$.error").value("INVALID_SIGNATURE"));
}
assertThat(executor.fetchCount()).isZero();     // verification happens before any database or Judge0 access
```

`CallbackSigner` builds `sig = HMAC-SHA256(key[kid], "judge0-callback:v1|" + resultId + "|" + exp)` exactly as API_Contract §4 specifies, using the test key set from `application-test.yml`.

### 5.4 L2-W: the Judge0 adapter against `Judge0Simulator`

`Judge0Simulator` wraps a WireMock server with a response transformer that keeps a table of jobs.
- **Endpoints it plays:**
  - `POST /submissions/batch?base64_encoded=true&wait=false` requires the `X-Auth-Token` header and returns one `{"token": …}` per job, or a scripted `503` or per-item error.
  - `GET /submissions/batch?tokens=…&base64_encoded=true&fields=…` returns each job's scripted state, as Base64 fields line-wrapped like Judge0's, or `null` for an unknown token.
  - `DELETE /submissions/{token}` answers `204`.
- **`CallbackDriver`.** It reads the captured batch requests from WireMock's request journal, extracts each job's `callback_url`, and sends Judge0-shaped `PUT` bodies to the backend through MockMvc. Delivery can be in order, reversed, duplicated, partial, or before the batch response.
- **Fixtures.** The response bodies are the fixtures captured by the 0.3 spike, so the simulator speaks the pinned Judge0 release, not a guess.

```java
@Test
@DisplayName("3.2: a 45-test problem is sent as 20/20/5 with one signed callback_url and an expected_output per job")
void batchesAndSignsEveryJob() {
    var problem = fixtures.problem().samples(1).hidden(44).publish();
    fixtures.submit(auth.tokenFor("premium-active"), problem, "SUBMIT");
    jobs.dispatcher().runOnce();

    var batches = judge0.createRequests();
    assertThat(batches).extracting(b -> b.submissions().size()).containsExactly(20, 20, 5);
    assertThat(batches).flatExtracting(Judge0Batch::submissions).allSatisfy(job -> {
        assertThat(job.expectedOutput()).isNotNull();
        assertThat(callbacks.verify(job.callbackUrl())).isTrue();
    });
}
```

### 5.5 What only real Judge0 proves

These are L3 checks: they run only on Linux, with `make e2e-judge0` or in the preview and staging CD smoke stages.
- the language IDs recorded in 0.3;
- the four reference problems accepted in every language;
- real `TIME_LIMIT_EXCEEDED` and compile errors, including Python's;
- the multipliers under real load;
- the retention `DELETE`;
- the canary suite (TRD §6).

Contributors on macOS and Windows rely on L1, L2 and L2-W, and the CD stage runs L3 for them.

## 6. Frontend Unit and Component Tests

- **Stack.** Vitest (jsdom), React Testing Library, `@testing-library/user-event`, and MSW (`msw/node`). The MSW handlers return the JSON examples of API_Contract, so components are tested against the contract's shapes and error codes.
- **What belongs here:**
  - Presentational components with their `*.fixtures.ts` data (UI_Generation_Prompts rule 3).
  - The shared API client: single-flight refresh, proactive refresh at 75% of the lifetime, retry on `5xx` without logout, the `Retry-After` countdown.
  - Verdict and execution-state reducers.
  - The mock-test countdown arithmetic (offset from `serverNow`).
  - Markdown rendering with the sanitizer configuration.
  - The admin editors' reducers: autosave versions and conflict handling.
- **Client-side time.** Timers here are the browser's own, so `vi.useFakeTimers()` is allowed. Server time is never faked here, because the server is not involved.
- **Monaco.** It does not run in jsdom. Unit tests replace `@monaco-editor/react` with a `<textarea>` stub, and Playwright covers the real editor (§7.6).
- **Accessibility.** `vitest-axe` runs on every component story-fixture combination; full-page axe checks are in E2E (§7.8).
- **Commands.**
  - Watch: `npm --prefix frontend run test`.
  - CI: `npm --prefix frontend run test -- --run`.
  - One file and test: `npm --prefix frontend exec vitest run src/features/workspace/VerdictPanel.test.tsx -t "wrong answer"`.

## 7. End-to-End Tests (Playwright)

### 7.1 Why Playwright

The plan and Dev_to_Prod_Strategy §1.4 already use Playwright. It handles the flows this product depends on:
- the OAuth **popup** and its `postMessage` hand-off;
- a second tab (the older mock-test tab must go read-only);
- multiple browser contexts in one test (an author and a reviewer);
- an API request context for set-up through `mock-login` and the payment simulator;
- downloads of files;
- traces that replay a failure step by step.

Cypress is not used.

### 7.2 The E2E stack

`make e2e` starts the base compose file plus `docker-compose.e2e.yml`, waits until every service is healthy, imports the development seed, and runs the suite. The stack is left running for reruns; `make e2e-down` removes it and its volumes.

```yaml
# docker-compose.e2e.yml — layered on docker-compose.yml (mysql, mailpit)
services:
  backend:
    build: ./backend
    environment:
      SPRING_PROFILES_ACTIVE: dev
      APP_ENVIRONMENT: local
      SEMICOLAN_AUTH_MODE: mock
      SEMICOLAN_PAYMENTS_PROVIDER: mock
      SEMICOLAN_EXECUTION_CLIENT: fake            # judge0 under `make e2e-judge0`
      DB_URL: jdbc:mysql://mysql:3306/semicolan?connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true&useAffectedRows=true
      DB_USER: semicolan
      DB_PASSWORD: semicolan
      JWT_SIGNING_KEY: ${JWT_SIGNING_KEY}
      APP_PUBLIC_BASE_URL: http://localhost:8080
      CORS_ALLOWED_ORIGINS: http://localhost:4173
      JUDGE0_CALLBACK_BASE_URL: http://backend:8080   # the fake (and Judge0) call back over the compose network
      SMTP_HOST: mailpit
      SMTP_PORT: "1025"
    ports: ["8080:8080"]
    depends_on:
      mysql:   {condition: service_healthy}
      mailpit: {condition: service_started}
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8080/actuator/health/readiness"]
      interval: 5s
      retries: 30
  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_BASE_URL: http://localhost:8080
        VITE_ENABLE_DEV_TOOLS: "true"             # the mock OAuth and checkout pages, and the E2E editor hook (§7.6)
    ports: ["4173:80"]
    depends_on:
      backend: {condition: service_healthy}
```

- **Profiles.** The backend runs the `dev` profile, with real scheduling and mock providers. The `test` profile, which turns scheduling off, is only for integration tests.
- **Seed content.** `make e2e` runs `scripts/content-import --publish content/dev-seed/` once. Specs refer to seeded content only through `e2e/fixtures/seed.ts`: problem slugs, the one-minute mock test, hub topics, a company and a design question.
- **Local mode.** You can also run against a backend started with `./mvnw spring-boot:run` and the Vite dev server: set `E2E_BASE_URL=http://localhost:5173`.

| Variable | Default | Meaning |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:4173` | The SPA |
| `E2E_API_URL` | `http://localhost:8080` | The API, used for set-up calls |
| `E2E_MAILPIT_URL` | `http://localhost:8025` | Mailpit's HTTP API |
| `E2E_EXECUTOR` | `fake` | `judge0` selects the L3 specs and skips the fake-only ones (tagged `@fake-executor`) |
| `E2E_HTTP_USER`, `E2E_HTTP_PASSWORD` | unset | Basic-auth credentials, only when explicitly running against the access-gated preview |

### 7.3 Configuration

```ts
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  retries: 0,                                   // a flaky test is a bug to fix, not a retry to hide
  forbidOnly: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'results/junit.xml' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    httpCredentials: process.env.E2E_HTTP_USER
      ? { username: process.env.E2E_HTTP_USER, password: process.env.E2E_HTTP_PASSWORD ?? '' } : undefined,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] }, grep: /@cross-browser/ },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] },  grep: /@cross-browser/ },
  ],
});
```

Specs that test viewport tiers (1280, 1000 and 700 px; Implementation_Plan 3.4 and 4.4) call `page.setViewportSize` themselves.

### 7.4 Users

- **Seeded users for read-only specs.** Global setup signs in each seeded role once and saves its browser state, as in Dev_to_Prod_Strategy §1.4. Use these only in specs that change nothing the next spec depends on, for example the renewal prompt shown to `premium-expired`.
- **Ephemeral users for everything that changes state.** Any spec that runs code, submits, starts a mock test, pays, posts or edits content signs in as its own user.

```ts
// e2e/fixtures/users.ts
import { test as base, type Page } from '@playwright/test';
import { AUTH_STORAGE_KEY } from '../../frontend/src/auth/storageKeys';   // the SPA's own key, never hard-coded

type Template = 'free' | 'premium-active' | 'premium-expired' | 'revoked' | 'admin' | 'new-user';

export const test = base.extend<{ signIn: (template: Template, page?: Page) => Promise<{ page: Page; userKey: string }> }>({
  signIn: async ({ page, request }, use, testInfo) => {
    await use(async (template, target = page) => {
      const userKey = `e2e-${testInfo.testId.slice(0, 12)}-${template}`.toLowerCase();
      const res = await request.post(`${process.env.E2E_API_URL ?? 'http://localhost:8080'}/api/auth/mock-login`,
                                     { data: { userKey, template } });
      if (!res.ok()) throw new Error(`mock-login failed: ${res.status()} ${await res.text()}`);
      const { accessToken, refreshToken } = await res.json();
      await target.addInitScript(([key, value]) => {
        if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);   // never undo a rotation
      }, [AUTH_STORAGE_KEY, JSON.stringify({ accessToken, refreshToken })]);
      return { page: target, userKey };
    });
  },
});
```

- The first `mock-login` with a new `e2e-…` key creates that user from the template, with dates relative to the server `Clock`. Every template except `new-user` is created onboarded and 30 days old, so the 24-hour posting rule does not get in the way of community specs. Later calls sign the same user in again.
- Ephemeral users exist only in `dev` and `test`, end in `@semicolan.test`, and are caught by the production data check like every other mock row (Dev_to_Prod_Strategy §1.7).
- The sign-in screens themselves are tested through the real buttons and the mock provider page (Flow B), never through this shortcut.

### 7.5 Global set-up and the environment guard

```ts
// e2e/global-setup.ts (excerpt)
const api = process.env.E2E_API_URL ?? 'http://localhost:8080';
const providers = await (await request.get(`${api}/api/auth/providers`)).json();
if (providers.mode !== 'MOCK') {
  throw new Error(`Refusing to run E2E against ${api}: auth mode is ${providers.mode}, not MOCK`);
}
await request.post(`${api}/api/dev/mock-users/reseed`);   // the seven fixed users back to their documented state
// then sign in each seeded role and save e2e/.auth/<userKey>.json (Dev_to_Prod_Strategy §1.4)
```

Staging and production return `OAUTH` and have no development routes, so the suite cannot be pointed at real users by mistake.

### 7.6 Driving the Monaco editor

Monaco is not a `<textarea>`.
- Typing with `page.keyboard.type()` sends real key events, so auto-closing brackets, auto-indent and suggestions apply. Typing a multi-line program character by character produces a different program from the one intended.
- **The development tools expose a test hook.** With `VITE_ENABLE_DEV_TOOLS=true` the Workspace registers `window.__semicolan_e2e__ = { getEditorValue(), setEditorValue(code) }`, which reads and writes the active Monaco model through the same code path as **Load into editor**.
- **The hook never reaches production.** The production build tree-shakes it, and the bundle guard of Implementation_Plan 1.2 fails if `__semicolan_e2e__` appears in a production bundle.

```ts
// e2e/fixtures/editor.ts
export const editor = {
  async ready(page: Page) {
    await expect(page.getByTestId('editor')).toBeVisible();
    await page.waitForFunction(() => !!(window as any).__semicolan_e2e__);
  },
  setValue: (page: Page, code: string) => page.evaluate(c => (window as any).__semicolan_e2e__.setEditorValue(c), code),
  getValue: (page: Page) => page.evaluate(() => (window as any).__semicolan_e2e__.getEditorValue() as string),
};
```

- Use `editor.setValue` to put a whole program in place.
- Real typing is covered by one spec (`specs/workspace/editor-typing.spec.ts`): it clicks into the editor, types a short single-line statement with `page.keyboard.type`, inserts a block with `page.keyboard.insertText` (one input event, like a paste), and asserts the result with `editor.getValue`.
- The textarea fallback has its own spec (3.4: "With Monaco blocked …"), which blocks the Monaco chunk with `page.route` and types into the plain textarea.

### 7.7 Submitting code and reading verdicts

```ts
// e2e/specs/workspace/submit.spec.ts
import { test } from '../../fixtures/users';
import { editor } from '../../fixtures/editor';
import { seed, python } from '../../fixtures/seed';
import { expect } from '@playwright/test';

test('3.4: Run shows sample results; a wrong Submit names the hidden test; a correct Submit is Accepted @workspace @fake-executor',
  async ({ signIn }) => {
    const { page } = await signIn('free');
    await page.goto(`/problems/${seed.problems.freeEasy.slug}`);
    await editor.ready(page);
    await page.getByRole('button', { name: /language/i }).click();
    await page.getByRole('option', { name: 'Python 3' }).click();

    await editor.setValue(page, python.echo);                                     // no directive: every test passes
    await page.getByRole('button', { name: 'Run' }).click();
    await expect(page.getByTestId('test-case-row').first()).toContainText('Passed');

    await editor.setValue(page, python.echo + '\n# semicolan-fake: WRONG_ANSWER@3\n');
    await page.getByRole('button', { name: 'Submit' }).click();
    const verdict = page.getByTestId('verdict');
    await expect(verdict).toContainText('Wrong Answer on test 3');
    await expect(verdict).not.toContainText(seed.problems.freeEasy.hiddenInputSample);   // hidden data never shown

    await editor.setValue(page, python.echo);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(verdict).toContainText('Accepted');
    await expect(page.getByRole('status')).toContainText('+1 points');
  });
```

- Verdicts arrive through the UI's own polling, and Playwright's auto-retrying `expect` waits for them without sleeping. With the fake, a verdict arrives in well under 10 seconds. Specs that use `callbacks=lost` raise that one `expect` timeout to 40 seconds.
- Execution states are tested with the directive's `delay=`: Queued, Running with progress, Slow, and Long wait with **Stop waiting**.

### 7.8 Locators and accessibility

- **Locators.** Prefer role and name locators (`getByRole`, `getByLabel`). They double as an accessibility check, because an element without an accessible name cannot be found.
  - `data-testid` is reserved for things that have no semantic role. The list lives in `e2e/README.md`: `editor`, `verdict`, `test-case-row`, `countdown`, `gate-matrix`, `revision-status`.
- **Axe.** `@axe-core/playwright` runs once per page spec with the tags `wcag2a`, `wcag2aa`, `wcag21aa` and `wcag22aa`, and fails on any violation. Implementation_Plan 5.3 ("E2E + axe") and UI_UX_Brief §6.6 rely on it.

### 7.9 Time in end-to-end tests

- **The server's `Clock` cannot be moved from a browser test, and no endpoint exists to move it.** Criteria that need moved time are integration tests.
- E2E covers time with:
  - the seeded **one-minute mock test** (Implementation_Plan 4.3), for the countdown, the lock at zero and the "Time's up" dialog;
  - short development intervals from configuration.
- Playwright's `page.clock` may fake only **client** timers, such as toast durations or the render of a countdown that has already synced. It never stands in for the server deadline.

### 7.10 Email

Mailpit receives every email the `dev` stack sends.
- Specs find a message with `GET ${E2E_MAILPIT_URL}/api/v1/search?query=to:"<email>"` and read it with `GET /api/v1/message/{ID}`. An ephemeral user's address is unique, so there is no need to clear the mailbox between tests.
- These specs cover moderation approval emails (7.1), receipts and expiry reminders (8.1).

### 7.11 Payments

- Purchases go through the mock checkout page with **Pay**, **Fail** and **Cancel** (App_Flow §15).
- The lost-webhook and duplicate cases call `POST /api/dev/payments/{orderId}/simulate` through the `request` fixture.
- A purchase always uses an ephemeral `free` user, because a seeded user's plan is reset by `reseed`.
- No spec contacts Razorpay or Stripe.

### 7.12 Admin panel flows

The four-eyes rule needs two admins: the seeded `admin` as author, and an ephemeral reviewer signed in with `signIn('admin', reviewerPage)` in a second browser context. Each spec creates its own content with a slug built from its test ID (`e2e-<id>-two-sum`), so admin specs run in parallel.

| Spec | Proves (Implementation_Plan 7.4–7.6) |
|---|---|
| `admin/create-problem.spec.ts` | Create → statement → settings → **Paste JSON** stubs → 2 sample and 3 hidden tests by **Bulk import** (`setInputFiles` with `fixtures/files/sum-tests.zip`) → reference solutions → **Validate** (`gate-matrix` all Passed, negative control rejected) → Submit → the reviewer approves → Publish → a visitor sees the problem in the catalog |
| `admin/four-eyes.spec.ts` | The author sees no **Approve** button on their own revision, and the API answers the author's approve with `403 SELF_REVIEW_NOT_ALLOWED`; a reviewer who edits the revision loses the right to approve it |
| `admin/gate-failure.spec.ts` | A Java reference solution with `// semicolan-fake: WRONG_ANSWER@2` turns the gate to Failed, naming Java and test 2. Editing a test after a pass shows **Stale** and disables **Submit for review** |
| `admin/edit-published.spec.ts` | Changing one hidden test of a published problem publishes a new test set: a submission made before the change keeps its verdict, and a new one is judged on the new set |
| `admin/blog.spec.ts` | Draft → preview → review → publish; the post appears at `/blog` for a visitor; archiving it makes `/blog/<slug>` show "Page not found" |
| `admin/access.spec.ts` | `free` opening `/admin` gets the "Page not found" page and every `/api/admin/**` call returns `403`; a visitor gets `401` |

### 7.13 Running and reading results

```bash
make e2e                                                    # full suite on chromium (+ @cross-browser on firefox and webkit)
(cd e2e && npx playwright test specs/workspace/submit.spec.ts)          # one file
(cd e2e && npx playwright test specs/workspace/submit.spec.ts:9)        # one test, by line
(cd e2e && npx playwright test -g "Wrong Answer" --project=chromium)    # by title
(cd e2e && npx playwright test --grep @admin)                           # by tag
(cd e2e && npx playwright test --repeat-each=10 --workers=4 specs/admin) # flush out a flaky spec
(cd e2e && npx playwright test --ui)                                    # interactive, humans only
(cd e2e && npx playwright show-report)                                  # HTML report
(cd e2e && npx playwright show-trace test-results/<test>/trace.zip)     # replay a failure
```

On failure, read the first failing step and its `error-context.md` in `e2e/test-results/<test>/`. The backend log of the stack is in `docker compose -f docker-compose.yml -f docker-compose.e2e.yml logs backend`.

## 8. Local Setup, Step by Step

```bash
# 1. Check prerequisites (JDK 21, Node 24, Docker + Compose v2, free ports)
make doctor

# 2. Configure: development-only values; .env is git-ignored and never committed
cp .env.example .env
sed -i.bak "s|^JWT_SIGNING_KEY=.*|JWT_SIGNING_KEY=$(openssl rand -base64 32)|" .env && rm .env.bak

# 3. Install dependencies
./mvnw -q -pl backend dependency:go-offline
npm ci --prefix frontend
npm ci --prefix e2e
(cd e2e && npx playwright install --with-deps chromium)    # add "firefox webkit" for @cross-browser runs

# 4. Optional, local machines only: let Testcontainers reuse the MySQL container between runs
echo "testcontainers.reuse.enable=true" >> ~/.testcontainers.properties

# 5. Start the local infrastructure (MySQL 8.4 + Mailpit); add --profile judge0 on Linux for real Judge0
docker compose up -d --wait

# 6. Run the application (two terminals), then load the development content once
./mvnw -pl backend spring-boot:run -Dspring-boot.run.profiles=dev
npm --prefix frontend run dev                               # http://localhost:5173
./scripts/content-import --publish content/dev-seed/        # dev and test only (Admin_Panel_Strategy §3.6)

# 7. Test
make test-unit      # backend unit tests + frontend Vitest
make test-it        # backend integration tests; Testcontainers starts its own MySQL (compose not needed)
make e2e            # builds the images, starts the E2E stack, seeds it, runs Playwright
make verify         # everything CI runs, in CI order
make e2e-down       # stop the E2E stack and delete its volumes
```

| Target | Runs |
|---|---|
| `make doctor` | `scripts/test/doctor.sh` |
| `make test-unit` | `./mvnw -B -pl backend test` and `npm --prefix frontend run test -- --run` |
| `make test-it` | `./mvnw -B -pl backend verify -DskipUTs` |
| `make e2e` | `docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build --wait`, the seed import, then `(cd e2e && npx playwright test)` |
| `make e2e-judge0` | The same with `--profile judge0`, `SEMICOLAN_EXECUTION_CLIENT=judge0` and `E2E_EXECUTOR=judge0` (Linux only) |
| `make e2e-down` | `docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v` |
| `make lint` | Backend static checks, `npm --prefix frontend run lint` and `run typecheck` |
| `make bundle-guard` | A production build (`VITE_ENABLE_DEV_TOOLS=false`), then `scripts/test/bundle-guard.sh`: no `/dev/` route, no `mock-login`, no `__semicolan_e2e__` |
| `make verify` | `lint`, `test-unit`, `test-it`, `bundle-guard`, `e2e` |
| `make load` | `k6 run scripts/load/<scenario>.js` against `LOAD_BASE_URL` |

**One test at a time**

| Level | Command |
|---|---|
| Backend unit test (class or method) | `./mvnw -pl backend test -Dtest='VerdictAggregatorTest#firstFailingTestByDisplayOrder'` |
| Backend integration test | `./mvnw -pl backend verify -DskipUTs -Dit.test='SubmissionReconcilerIT'` |
| Frontend test | `npm --prefix frontend exec vitest run src/features/workspace/VerdictPanel.test.tsx -t "wrong answer"` |
| End-to-end test | `(cd e2e && npx playwright test specs/workspace/submit.spec.ts:9)` |

**Troubleshooting**

| Symptom | Cause | Fix |
|---|---|---|
| Testcontainers: "Could not find a valid Docker environment" | Docker is not running, or the socket is elsewhere (Colima, rootless Docker) | Start Docker. With Colima: `export DOCKER_HOST=unix://$HOME/.colima/default/docker.sock TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock` |
| The readiness check fails with a non-zero session offset | A database started without the UTC flags or JDBC parameters | Use `MySqlTestContainer` or the compose service; never a hand-made container |
| Flyway: "You do not have the SUPER privilege and binary logging is enabled" | `--log-bin-trust-function-creators=1` is missing | As above |
| Global setup: "Refusing to run E2E against …" | `E2E_API_URL` points at a non-mock stack | Point it at the local stack, or at preview with the basic-auth variables when explicitly asked |
| `429 RATE_LIMITED` or `TOO_MANY_IN_FLIGHT` in E2E | Parallel specs share one seeded user | Use `signIn(template)` for every spec that runs or submits code |
| A verdict never arrives in E2E | The executor cannot reach `JUDGE0_CALLBACK_BASE_URL` | In compose it must be `http://backend:8080`. The reconciler still recovers results within about 25 s; a longer stall means the dispatcher is not running (check the backend log) |
| Judge0 workers do not start | The host's cgroup mode does not match the pinned release | Use the host prerequisites from Implementation_Plan 0.3; off Linux, skip L3 |
| A port is already in use | A local MySQL or another stack | Stop it, or change the host port mapping in `docker-compose.override.yml` |

## 9. CI Pipeline

| Job | When | Runs | Blocks |
|---|---|---|---|
| `backend` | Every PR | `./mvnw -B verify` (unit and integration tests; Docker is available on the runner), JaCoCo report | Merge |
| `frontend` | Every PR | `npm ci`, lint, typecheck, `test -- --run`, build, `make bundle-guard` | Merge |
| `e2e` | Every PR | `make e2e` with the fake executor: chromium always, `@cross-browser` on firefox and webkit | Merge |
| `images-and-guard` | Every PR (from 1.1) | Builds the images, then starts the production image with the `prod` profile against a throwaway database and asserts that startup fails with any mock setting, including `SEMICOLAN_EXECUTION_CLIENT=fake`, and that development routes return `404` (TRD §5; extended in 10.4) | Merge |
| `dependency-scan` | Every PR | Dependency vulnerability scan | Merge on high or critical |
| `judge0-l3` and canary | CD to preview (3.2), later staging (10.1) | `make e2e-judge0` subset and the canary suite on the Judge0 host | Deploy |
| `load` | Before launch and on demand | `make load` (Implementation_Plan 9.1) | Evidence for the launch gate |

Every job uploads its reports: the Surefire and Failsafe XML, the JaCoCo HTML, the Vitest JUnit, the Playwright HTML report with traces, and the compose logs of the E2E stack when it fails. Nothing is retried automatically. A red job is read, fixed and pushed again.

## 10. Rules for AI Agents

**The loop**
1. Find the milestone and its acceptance criteria in Implementation_Plan. Each criterion's tag (`[IT]`, `[E2E]` and so on) gives the level of the test that proves it.
2. Write or extend the test, named after the criterion: `@DisplayName("3.1: …")`, or a Playwright title starting with the milestone plus an area tag such as `@workspace`.
3. Run the narrowest command (§8, one test at a time), then the module's level, then `make verify` before saying the work is done.
4. Report what actually ran: the command, and the counts of tests run, failed and skipped. Say which levels did not run and why (for example "Docker unavailable: integration and E2E not run"). Never describe a level as passing if it did not run.
5. Attach the evidence to the PR description: the commands, the counts, and for DRILL items the checklist.

**Never**
- add `Thread.sleep`, `page.waitForTimeout` or a longer timeout to make a race pass. Find the event to wait for, or move the `Clock`;
- add `@Disabled`, `test.skip` or `test.fixme`, or weaken an assertion, to get a green build, unless the user explicitly asks and an issue is linked;
- mock `Clock`, the database or Spring Security in an integration test, or use `@MockitoBean` for something that has a shared fake;
- write fixtures in raw SQL for state that a service can create (§4.11);
- edit an applied Flyway migration (Implementation_Plan working agreement 3);
- commit `.env`, secrets, recorded fixtures that still carry real account identifiers, or content exports, which contain hidden tests;
- point any test at preview, staging or production unless the user asked for that environment by name;
- leave a test that is flaky. Reproduce it with `--repeat-each` (Playwright) or a loop over the single-test command, and fix the cause.

**When a test fails**: read the first failure, not the last.
- Backend: `backend/target/surefire-reports/*.txt` or `failsafe-reports/*.txt`.
- E2E: `e2e/test-results/<test>/error-context.md` and the trace.

Reproduce the failure with the single-test command, fix the code or the test, whichever is wrong according to the spec, and rerun the wider suite.

## 11. Which Milestone Builds Which Part

| Milestone | Adds to the harness |
|---|---|
| 0.4 | The `Makefile` targets, `scripts/test/doctor.sh`, `MySqlTestContainer`, `AbstractIntegrationTest`, `MutableClock`, `DatabaseCleaner`, `Jobs`, `application-test.yml`, the Vitest and MSW set-up, the Playwright scaffold with a smoke spec, `docker-compose.e2e.yml`, and the CI jobs of §9 |
| 1.1 | `AuthHelper`, ephemeral mock users and `POST /api/dev/mock-users/reseed`, the startup-guard IT |
| 1.2 | The environment guard and reseed in E2E global set-up (§7.5), the Playwright auth fixtures (seeded storage states and `signIn`), the bundle-guard assertions |
| 2.1 | `Fixtures` for problems on the loader, which already writes through `ContentPublisher` |
| 3.1 | `FakeCodeExecutionClient` (scripting API, callback modes, source directives), `CallbackSigner`, `ConcurrentRunner` |
| 3.2 | `Judge0Simulator` and `CallbackDriver` with the 0.3 fixtures, `make e2e-judge0`, the canary |
| 3.4 | The editor fixture and the `__semicolan_e2e__` hook |
| 7.1 | `InMemoryEmailSender` assertions and the Mailpit helper |
| 7.4–7.6 | Revision and gate fixtures, the admin E2E specs and test archives |
| 8.1 | Payment-simulator helpers and a signed mock-webhook builder |
| 9.1 | The k6 scenarios |
| 10.2–10.3 | WireMock OAuth and Razorpay fixtures for the contract tests |
