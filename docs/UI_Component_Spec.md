# UI Component Spec — Semicolan

How the frontend team turns the Google Stitch designs into React + Tailwind components. It covers what each design is for, which components to build, how they move, how they show loading, success, error and empty states, and what in the designs must not ship.

**Precedence.** This document adds nothing to the token set and changes no behavior. [UI_UX_Brief.md](UI_UX_Brief.md) is binding for tokens, type, spacing, motion, components and accessibility; the API, schema and flows are binding in their own docs (see the table in `CLAUDE.md`). Where a Stitch screen disagrees with any of them, the doc wins and the design is wrong. Section numbers like "§9.6" refer to the brief.

## 1. Design source

- **Stitch project**: `semicolan`, ID `12482706302779973754`, 30 desktop screens at 2560 px wide (1280 CSS px at 2×).
- **Use the screens for layout, hierarchy and content placement only.** They came from a generator, and many of them carry invented data, out-of-scope features and off-brand styling (§6).
- The screens fall into two families. Neither is a source of truth for styling.

| Family | Screens | Styling | Use |
|---|---|---|---|
| **A: brief-aligned** | 05, 06, 07, 08, 09, 11, 12, 14, 16, 18, 21 | Inter + Fira Code, Lucide icons, CSS variables whose values match §1.1 | Layout and composition; token names are close to ours |
| **B: Stitch defaults** | 01, 02, 03, 04, 10, 13, 15, 17, 19, 20, 22–30 | Material 3 palette (`surface #131313`, `primary #d8b9ff`, `error #ffb4ab`), Geist / JetBrains Mono, Material Symbols, radii 2/4/8/12 px | Layout only. Re-skin everything with §1, §2, §8 |

Never copy markup from either family. The HTML has more than 100 `focus:outline-none` with no replacement ring, raw hex classes (`text-[#5cc560]`, `bg-[#581fa6]`, off-palette `#eab308`, `#4ade80`, `#38bdf8`), status colors used as fills, `transition-all` everywhere, Google Fonts CDN links (§2 requires self-hosted fonts) and a light theme block (dark only in the MVP).

## 2. Reference images

### 2.1 Folder and naming convention

Screenshots live in [`design-system/reference-images/`](../design-system/reference-images/). Every file is named:

```
{NN}_{area}[_{page}][_{variant}]_{theme}.{ext}
```

| Part | Rule | Examples |
|---|---|---|
| `NN` | Two-digit number from the index below. Numbers are never reused; a new screen takes the next free number | `07`, `31` |
| `area` | The product area, in lowercase kebab-case, matching the route's first segment where there is one | `workspace`, `mock-test`, `community`, `hub` |
| `page` | The page inside the area, when the area has more than one | `lobby`, `report`, `feed`, `post` |
| `variant` | A state or layout variant of the same page | `part-a`, `drawer`, `extended`, `locked`, `empty` |
| `theme` | Always `dark` in the MVP. `light` is reserved for Future Scope (§1.2) | `dark` |
| `ext` | The image's real format: `png` or `jpg`. Check the file signature, not the Stitch file name | |

Rules:
- Lowercase ASCII, `_` between parts, `-` inside a part. No spaces, no dates, no version suffixes.
- A redesigned screen **replaces** its file under the same name; history lives in Stitch.
- Stitch's `download_file` and `downloadUrl` return a JSON wrapper `{"dataString": "<base64>"}`, not the image. Decode `dataString` before saving, then check the first bytes (`89 50 4E 47` for PNG, `FF D8` for JPEG).
- Keep only screenshots in the folder. Stitch HTML is not a reference (§1).

### 2.2 Index

The route column gives the **documented** route. Where the design labels a different route, the design is wrong (§7.1).

| File | Stitch screen | Stitch ID | Route (docs) | Note |
|---|---|---|---|---|
| `01_pricing_paywall_payment_dark.png` | Pricing, Paywall & Payment Confirmation | `5eef513c…` | `/pricing`, dialog, `/checkout/confirm` | The state-inspector bar is a preview harness |
| `02_leaderboard_dark.png` | Public Leaderboard | `c18d84ea…` | `/leaderboard` | |
| `03_mock-test_report_dark.png` | Mock Test Post-Test Report | `a2ac2893…` | `/mock-tests/sessions/{id}/report` | |
| `04_mock-test_runner_dark.png` | Mock Test Header & Workspace | `e015c875…` | `/mock-tests/sessions/{id}` | Shows the app sidebar; the Workspace is full-bleed (§10.1) |
| `05_mock-test_lobby_dark.png` | Mock Test Pre-flight Lobby | `6b093ce2…` | `/mock-tests/{id}` | Design says `/mock-tests/lobby` |
| `06_mock-tests_list_dark.png` | Mock Tests List | `717826b6…` | `/mock-tests` | |
| `07_workspace_part-b_dark.png` | Coding Workspace (Part B) | `4a3d5990…` | `/problems/{slug}` | Results panel, verdicts, Submissions |
| `08_workspace_part-a_dark.png` | Coding Workspace (Part A) | `24c638c1…` | `/problems/{slug}` | Description, Solution, editor |
| `09_home_dashboard_dark.jpg` | Signed-In Home Dashboard | `d865e880…` | `/home` | |
| `10_auth_sign-in_onboarding_dark.jpg` | Sign-In Dialog, Onboarding & Auth | `3b41bb95…` | dialog, `/auth/complete`, `/dev/mock-oauth` | |
| `11_problems_catalog_drawer_dark.jpg` | Problems Catalog (Collapsible Drawer) | `e17f42d0…` | `/problems` | The screenshot is mostly blank; check it against screen 12 |
| `12_problems_catalog_extended_dark.png` | Problems Catalog (Extended) | `96dc2c51…` | `/problems` | |
| `13_landing_dark.jpg` | Landing | `1c20759e…` | `/` | |
| `14_app-shell_gallery_dark.jpg` | App Shell & Primitive Gallery | `1e3e703e…` | `/dev/gallery` | Design says `/gallery` |
| `15_profile_dark.png` | Profile | `e6212b86…` | `/profile` | |
| `16_hub_devops_dark.jpg` | DevOps & Data Science Hub | `1c134355…` | `/devops`, `/data-science` | |
| `17_settings_dark.png` | Account Settings | `62d84267…` | `/settings`, `/settings/billing`, `/settings/accounts` | |
| `18_hub_topic_theory-quiz_dark.png` | Topic Theory & Quiz | `94a8897b…` | `/{hub}/{topic}` | |
| `19_design_catalog_dark.png` | System Design & LLD Catalog | `71ce5fa5…` | `/design/hld`, `/design/lld` | Design shows one `/design` page with a toggle |
| `20_design_viewer_dark.jpg` | Two-Pane Design Viewer | `97a8140f…` | `/design/{kind}/{slug}` | |
| `21_quiz_runner_result_dark.png` | Quiz Runner & Result | `bd611230…` | `/quiz/{attemptId}` | |
| `22_company_page_dark.jpg` | Company Page | `0d649f1c…` | `/companies/{slug}` | The screenshot shows only the sidebar |
| `23_companies_directory_dark.jpg` | Companies Directory | `48dec821…` | `/companies` | |
| `24_community_mine_dark.png` | My Community Posts | `0a743d3d…` | `/community/mine` | |
| `25_community_feed_dark.png` | Community Feed | `3d935e21…` | `/community` | |
| `26_community_composer_dark.jpg` | Community Post Composer | `ac10ebab…` | `/community/new` | |
| `27_community_post_dark.png` | Post & Discussion Thread | `ca1cceea…` | `/community/posts/{id}` | |
| `28_admin_moderation_dark.jpg` | Admin Moderation Queue | `03590082…` | `/admin/moderation` | Rendered in the product shell; it belongs in the admin shell (§10.4) |
| `29_project_detail_dark.png` | Project Detail | `3c9115f7…` | `/projects/{slug}` | |
| `30_projects_catalog_dark.png` | Projects Catalog | `e9efc84e…` | `/projects` | |

Nothing exists yet for the blog (`/blog`, `/blog/{slug}`), the admin panel other than moderation (`/admin/**`, Admin_Panel_Strategy §1), the read-only Workspace fallback under 768 px, or `/dev/mock-checkout`. Those pages are built straight from the brief and UI_Generation_Prompts. Their numbers start at `31`.

## 3. Components

Components live in `frontend/src/components/` in three layers. A layer may import from the layers below it, never from above. Each component is specified once, in the brief section listed; this table says where it is used and what the designs add.

### 3.1 Primitives (`components/ui/`)

| Component | Brief | Screens | Variants and props |
|---|---|---|---|
| `Button` | §9.1 | all | `variant`: `primary`, `secondary`, `success` (Submit only), `highlight` (the single featured-plan CTA), `ghost`, `link`, `destructive`; `size`: `sm` 28, `md` 32 (default), `lg` 40, `xl` 56 (hero only, `radius-full`). `loading` + `loadingLabel` (spinner + progress word, fixed width). `disabledReason` sets `aria-disabled` and `aria-describedby`; never the native `disabled` on Run/Submit |
| `IconButton` | §9.1 | all | 32 px minimum (44 px on coarse pointers); required `label` (accessible name + tooltip) |
| `TextInput`, `SearchInput` | §9.2 | 14, 17, 25, 26 | `error` (border + `AlertCircle` + message linked by `aria-describedby`), `leadingIcon`, `size` 32 / 40 |
| `Select` | §9.2 | 07, 08, 17, 26 | A native `<select>`; 28 px in the editor toolbar |
| `Checkbox`, `Radio` | §9.2 | 11, 12, 25 | 24 px hit area including the label |
| `SegmentedControl` | §9.2 | 02, 12, 18, 19, 21 | 2–3 segments; `bg-chip` selection when it sits on `bg-surface` |
| `SelectableChip` | §9.2 | 07, 08, 10 | `aria-pressed`; test-case chips show status as icon + text, never a colored dot alone |
| `Tabs` | §9.3 | 02, 07, 08, 18, 20, 22 | Underline tabs; `icon`, `count` ("Test Cases 2/3"); ARIA tabs pattern |
| `DifficultyBadge` | §9.4 | 07, 11, 12, 18, 19, 22 | `shape`: `pill` (Workspace header) or `rounded` (lists); always the word |
| `PremiumPill` | §9.4 | many | `locked` adds `Lock`. The word is always **Premium**: not "PRO", "Pro Campus" or "Placement Favorite" |
| `Tag`, `StatusChip` | §9.4 | many | `Tag`: `accent` or `neutral`; `StatusChip`: status icon + label, no fill |
| `Tooltip` | §8.3 | all | Popover elevation; shown on hover and focus; Esc dismisses |
| `Kbd` | §9.12 | top bar | "Ctrl K" / "⌘ K" by platform |
| `Skeleton` | §9.11 | 14 screens | Block at the final dimensions; pulse (§4.2) |
| `Spinner` | §4.2 | 01, 03, 04, 07, 10, 26 | 14 px in buttons; a static ring under reduced motion |
| `ProgressBar` | §9.10 | 14, 16, 21, tiles | 2 px or 4 px; always next to a text count |
| `ProgressRing`, `DifficultyRing` | §9.10 | 03, 11, 12, 15 | 32 px or 160 px; `role="img"` with the numbers in `aria-label` |
| `Monogram` | §9.16 | 22, 23, 25, 26 | 16 / 24 / 40 px; `accent-subtle` with an `accent` initial for **every** company. Screen 23's violet fill and screen 22's grey are wrong |
| `Wordmark` | §0.2 | all | `;` in `accent` + "Semicolan". Screens 19 and 24–30 use a terminal icon, "SEMICOLAN" and "v2.4": wrong |

### 3.2 Composites (`components/patterns/`)

| Component | Brief | Screens | Notes |
|---|---|---|---|
| `Dialog`, `AlertDialog` | §9.9, §6.2 | 15 screens | 480 px or 720 px (paywall); focus trap; focus returns to the trigger. `AlertDialog` only for "Time's up" |
| `Drawer` | §9.9 | 11, mobile nav, compact Workspace | Slides from the start edge |
| `Toast`, `ToastRegion` | §4.3, §9.9 | 14 + 8 others | Bottom-right, 16 px inset, at most 3. The region is mounted at app start |
| `Section`, `StatCard`, `PremiumCard` | §9.5 | 09, 13, 15 | Stat numbers come only from the API; skeleton while loading |
| `Tile` | §9.6 | 09, 16, 23 | Whole tile is one link; optional progress track |
| `ProblemRow`, `GroupHeader`, `GroupLabelChip` | §9.7 | 09, 11, 12 | Solved glyph is read-only |
| `DataTable` | §9.8 | 02, 03, 07, 17, 18, 28 | Sortable headers with `aria-sort`; `pinnedRow` for the leaderboard's own row |
| `Pagination` | API §Pagination | 02, 12, 23, 25, 28 | Page / size offsets. "Load more" is allowed where the design shows it; it still requests `page + 1` |
| `EmptyState`, `ErrorState` | §9.11 | 02, 18, 24, 30 | §5 |
| `SearchPalette` | §9.12 | 24 screens | Problems only: title, difficulty, lock. No company tags, no command items, no "2,400+" count |
| `MarkdownEditor` | §9.20 | 20, 26, 27, 28 | Write / Preview; counter; no image button |
| `MarkdownView` | §3.1 | 07, 18, 20, 22, 27, 29 | Sanitized render; Mermaid as SVG figures with a source disclosure |
| `CodeBlock` | §3.1 | 07, 08, 20, 29 | Language tabs, Copy, monospace, ligatures off |
| `Breadcrumb` | §9.16 | 05, 17, 22, 27, 28 | `meta` text, `nav` landmark with `aria-label="Breadcrumb"` |
| `TableOfContents` | §9.16 | 22 | 1 px start rail; current section in `accent` |
| `InlineBanner` | §10.1 | 09, 14, 04 | In flow between the top bar and content, never overlaying: Premium expiring, confirming payment, test in progress, offline, session closed |
| `Accordion` | §8.4 | 01 (FAQ), 18 | `<button aria-expanded>` + region; chevron rotates 180° |
| `SkipLinks` | §6.2 | Workspace, mock runner | Visible on focus |

### 3.3 Domain components (`features/{area}/components/`)

| Component | Brief / doc | Screens | Notes |
|---|---|---|---|
| `AppShell`, `Sidebar`, `TopBar`, `AccountMenu` | §10.1 | most | Exactly the §10.1 groups: **Practice** (Home, Problems, Mock Tests, Leaderboard), **Interview skills**, **Domains**, **Career**, then Upgrade, then Community, Blog, Admin (admins only), account. No "Discussions", no "Moderation", no "/gallery" |
| `TestInProgressChip` | §10.1, §4.5 | 02, top bar | "Test in progress — mm:ss left — Resume"; Resume is required |
| `MarketingNav`, `Footer` | §10.2 | 01, 13 | Footer: brand + support email, Product, Legal (Terms, Privacy, Refund policy), copyright |
| `AdminShell`, `EnvironmentBadge` | §10.4 | 28 | The admin pages use this shell, not `AppShell` |
| `WorkspaceLayout` | §3 | 07, 08, 20 | Full-bleed; panes on `react-resizable-panels` |
| `Splitter`, `CollapsedPaneRail` | §3.2 | 07, 08, 20 | `role="separator"`, keyboard resize, double-click reset, persistence under `semicolan:layout:v1` |
| `WorkspaceHeader`, `ProblemStepper` | §3.1 | 07, 08 | Wordmark, back, title + difficulty, Prev / Next, Report a problem; right slot for the mock timer |
| `ProblemTabs` (Description, Solution, Submissions) | §3.1 | 07, 08 | Solution is not rendered in a mock test. No "Clarifications" tab |
| `SpoilerGuard` | §3.1 | 07, 08, 20 | "Try it yourself first?" + **Show solution**; remembered per problem on the device |
| `EditorPane`, `EditorToolbar`, `EditorFallback` | §5, §4.4 | 07, 08 | One Monaco model per problem and language; `<textarea>` fallback after 10 s |
| `ResultsPanel`, `ResultsFooter` | §3.1 | 07 | Test Cases · Console · Submission Result; Console toggle, Run, Submit. No "+ Custom" and no "Reset inputs" |
| `VerdictBanner` | §4.1 | 07 | Icon + label + hue; meta line in `text-secondary`; "Code changed since this run" marker |
| `TestCaseResultRow`, `OutputDiff` | §4.1 | 07 | First failure expanded; whitespace toggle; underline marks, never red/green alone |
| `ConsoleOutput` | §4.1 | 07 | Compile errors and stderr as text; truncated at 10,000 characters |
| `MockTestHeader`, `ProblemSwitcherChip`, `CountdownTimer`, `FinishTestButton` | §4.5 | 04 | `role="timer"`; neutral → `warning` at 10 min → `error` at 1 min; never flashes |
| `PreflightChecklist` | §3.3 | 05 | Viewport, editor loaded, online, signed in; each failure named on the disabled Start |
| `MockTestCard` | App_Flow §3.1 | 06 | From `state`, `canStart`, `lockReason` |
| `PlanCard` | §9.5, §1.1 | 01, 13 | `featured` uses `plan-featured` + `highlight` CTA. Plans render uniformly from `GET /api/plans` |
| `PaymentStatusCard` | App_Flow §4 | 01 | Confirming / Still confirming / Failed / Cancelled / Paid |
| `SignInDialog`, `OAuthButton`, `OnboardingStep` | §9.19 | 10 | "Last used" tag; onboarding chips Student / Working professional / Other |
| `ActivityHeatmap` | §9.10 | 09, 15 | With the "Current streak · Longest streak" line and a hidden data table |
| `LeaderboardTable`, `MyRankPanel` | §9.8 | 02 | Own row pinned |
| `TheoryRow`, `SourceChips` | §9.13 | 18 | Disclosure row |
| `QuizLevelCard`, `QuizRunner`, `QuizResult` | §9.14 | 18, 21 | One question at a time; options numbered 1–6; no timer, no XP |
| `GuideBanner`, `DesignQuestionCard`, `DesignViewer`, `MyAnswerNotepad` | §9.15 | 19, 20 | Notepad shows "Saved · 2 min ago" and the conflict dialog (API §10 `409 current`) |
| `CompanySidebar`, `CompanyHeader`, `LockedPreview` | §9.16 | 22, 23 | Sidebar includes the search input; withheld rows are never in the DOM |
| `PostCard`, `VotePill`, `CommentThread`, `PostComposer`, `AuthorStatusChip` | §9.17 | 24–27 | Edit / delete only when `viewerIsAuthor`; "Author" tag from `isPostAuthor` |
| `ModerationTable` | §9.17 | 28 | Actions: Approve, Reject (with note), Hide, Restore, Dismiss report. No "Ban" |
| `ProjectCard`, `ProjectBrief`, `ProjectChecklist` | §9.18 | 29, 30 | When locked, the paywall replaces the brief; no checklist or repo URL |

`/dev/gallery` renders every primitive and composite in rest, hover, focus, disabled, loading and error states. It exists only in development builds (Dev_to_Prod_Strategy §1.7 layer 4).

## 4. Motion

### 4.1 Rules

- **CSS transitions and keyframes through Tailwind only. No Framer Motion.** The MVP stack is fixed (`CLAUDE.md`). Every motion in §8.4 is a simple color, opacity or 4 px translate that CSS does natively. Adding a motion library needs explicit approval.
- **Animate only `color`, `background-color`, `border-color`, `opacity` and `transform`.** Never `transition-all`: it animates layout properties, fights Monaco's re-layout and makes focus rings fade in late.
- **Hover never lifts.** §8.3: "Hover moves a surface one step up the ladder … No lift, no shadow." So a problem card **does not** get `translateY(-2px)` or `shadow-lg` on hover. It goes from `bg-card` to `bg-row` and, for link cards, swaps its border to `border-hover`. Shadows are reserved for popovers and modals, and forced-colors mode drops them anyway (§1.5).
- **No press scale** (`active:scale-95` and friends), no `animate-ping`, no bounce, no flashing. Status never pulses (§4.5).
- **Every motion has a reduced-motion form**: an opacity fade of at most 120 ms, or nothing. Spinners become a static ring plus the progress word; skeletons stop pulsing (§1.5).
- **Direct manipulation is never animated.** Splitter drags, scrolling and typing follow the pointer exactly.

### 4.2 Tailwind configuration

```js
// tailwind.config.ts (theme.extend)
transitionDuration: { fast: '120ms', dialog: '180ms', base: '200ms', slow: '400ms' },
transitionTimingFunction: { out: 'cubic-bezier(0.16, 1, 0.3, 1)' },
keyframes: {
  'dialog-in':  { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
  'dialog-out': { from: { opacity: '1' }, to: { opacity: '0', transform: 'translateY(4px)' } },
  'toast-in':   { from: { opacity: '0', transform: 'translate(8px, 8px)' }, to: { opacity: '1', transform: 'none' } },
  'toast-out':  { from: { opacity: '1' }, to: { opacity: '0', transform: 'translateX(8px)' } },
  'fade-in':    { from: { opacity: '0' }, to: { opacity: '1' } },
  'skeleton':   { '0%,100%': { opacity: '0.9' }, '50%': { opacity: '0.45' } },
},
animation: {
  'dialog-in': 'dialog-in 180ms cubic-bezier(0.16,1,0.3,1)',
  'dialog-out': 'dialog-out 120ms ease-out forwards',
  'toast-in': 'toast-in 200ms cubic-bezier(0.16,1,0.3,1)',
  'toast-out': 'toast-out 200ms ease-out forwards',
  'fade-in': 'fade-in 120ms ease-out',
  'skeleton': 'skeleton 1.5s ease-in-out infinite',
},
```

```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 120ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 120ms !important;
    scroll-behavior: auto !important;
  }
  .animate-skeleton, .animate-spin { animation: none !important; }
  [class*="animate-"][class*="-in"] { animation-name: fade-in !important; }
}
```

### 4.3 Per interaction

| Interaction | Classes | Brief |
|---|---|---|
| Button, row, tile, tab, sidebar item hover and press | `transition-colors duration-fast ease-out` + the hover token (`hover:bg-raised` etc.) | §8.4, §9.1 |
| Link-card hover (tile, design card, project card, post card) | `transition-colors duration-fast ease-out hover:bg-row hover:border-hover` | §8.3 |
| Trailing chevron on a link card | `transition-transform duration-fast group-hover:translate-x-0.5` (2 px, the only allowed movement on hover) | — |
| Focus ring | No transition: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`. Never `focus:outline-none` without this | §1.1 |
| Tab underline | The 2 px underline is one absolutely positioned element per strip, moved with `transition-transform duration-base ease-out` on `translateX` and `scaleX`. Labels change color with `duration-fast` | §8.4 |
| Accordion, disclosure, theory row | Content: `grid` rows `0fr → 1fr` with `transition-[grid-template-rows] duration-base ease-out`; chevron `transition-transform duration-base rotate-180` | §8.4 |
| Dialog, popover, search palette | Enter `animate-dialog-in`; exit `animate-dialog-out`; scrim `animate-fade-in` | §8.4 |
| Toast | Enter `animate-toast-in` from the bottom-right; exit `animate-toast-out`; stacked toasts shift with `transition-transform duration-base` | §8.4, §4.3 |
| Drawer (compact Workspace, mobile nav) | `transition-transform duration-base ease-out` from `-translate-x-full`; scrim fades | §9.9 |
| Splitter | Drag: none. Handle line: `transition-colors duration-fast` from `border` to the 4 px `accent` line on hover, focus and drag. Collapse, restore and maximize are **instant**: animating pane size makes Monaco re-layout on every frame (§5) | §3.2 |
| Progress ring, progress bar, heatmap legend | `transition-[stroke-dashoffset] duration-slow ease-out` / `transition-[width] duration-slow ease-out` on value change only, not on first paint | §8.4 |
| Verdict banner and results arriving | `animate-fade-in` on the banner; rows appear without movement; tab selection changes, focus does not move | §4.1 |
| Mock timer colors | Color step at 10 min and 1 min, no transition, never flashes | §4.5 |
| Skeleton | `animate-skeleton` on `bg-raised`; static under reduced motion | §9.11 |
| Spinner | `animate-spin` 14 px in the button; static ring + "Running…" under reduced motion | §4.2 |

## 5. Visual states

Each data region renders exactly one of: **loading**, **content**, **empty**, **error**. Build them with one `<AsyncRegion status=…>` wrapper so no page invents its own.

### 5.1 Loading: skeleton or spinner

| Use | When | Examples |
|---|---|---|
| **Skeleton** | Content whose shape is known is loading on page or section load. Same dimensions as the final content, so nothing shifts | Catalog rows, statement and editor area, dashboard sections, tiles, tables, profile ring and heatmap, post cards |
| **Spinner in the control** | A user action is in progress. The spinner sits inside the button that started it, with the progress word | Run ("Sending…", "Running…"), Submit ("Judging… 7 of 20 tests"), sign-in ("Waiting for Google…"), Buy, composer submit, notepad save |
| **Status card with spinner** | A long, server-driven wait that is not tied to one button | Payment "Confirming your payment" (and "Still confirming" after 60 s), mock report "Finalizing your results…" |
| **Never** | A full-page spinner, a spinner instead of a skeleton for content, a spinner with no words | — |

Rules: mark loading regions `aria-busy="true"`. Run and Submit stay `aria-disabled` (not `disabled`) while an attempt is in flight; editing stays available (§4.2). Show skeletons only after 150 ms, so fast responses don't flash.

### 5.2 Success

- **The page itself is the record.** A success shows in its home first: the verdict banner, the saved field, the "Pending review" chip, the Premium badge.
- **A toast supplements it**, bottom-right, `role="status"`, 5 s, pausing on hover and focus. Used for: a successful Submit (no live-region role, because the Workspace live region already announced it), "Copied", "Saved", "Code reset — Undo", "Welcome back — 41:12 left".
- No confetti or celebratory animation. A first solve shows "+N points" and the new weekly rank inside the verdict banner (§4.1).

### 5.3 Errors

| Kind | Treatment | Never |
|---|---|---|
| Compile error | Console tab selected, compiler text in monospace; the verdict tab says "Compile Error — tests did not run"; `error` hue + circle-x icon + label | Red borders or squiggles in the editor (text-only in the MVP, §4.1); a toast |
| Wrong answer / runtime error / TLE | Verdict banner (3 px start border, 12% tint, icon, heading) plus a diff or stderr in Test Cases; hidden tests show only "on test N" | Color alone; hidden-test input or output |
| Judging error | `info` hue, cloud icon, "Something went wrong on our side, not with your code." + Try again | Red: it is not the user's fault |
| Form field | 1 px `error` border, `AlertCircle`, message below in `error` `meta`, linked by `aria-describedby`; focus moves to the first invalid field on submit | Placeholder-only errors |
| Region failed to load | `ErrorState`: `bg-surface` card, `AlertTriangle` in `error`, what failed in plain words, **Retry** | A blank region |
| Transient (offline, rate limit, save failed) | Warning or error toast (`role="alert"` for errors, persists until dismissed) **and** the persistent state in place (for example "Retry in 12 s" on the buttons) | A toast as the only signal |
| Blocking (Time's up, session closed) | `AlertDialog`, then a persistent slim banner | A toast |

Failures never use a toast as their home (§4.3).

### 5.4 Empty

`EmptyState`: a 48 px Lucide icon in `text-muted` on a `bg-raised` circle, one `row-title` line, a `meta` hint and at most one action. Copy comes from the docs, for example "No submissions yet — Submit to see your history here." (§3.1), "Run to see your output" (§4.4) and "No editorial for this problem yet." Filtered lists that come back empty say so and offer **Clear filters**. The quiz attempts empty state is the dashed-border box of §9.14. Never use illustrations, "NULL" artwork or invented reasons ("Blueprints currently generating").

## 6. What not to ship from the designs

Strip these wherever they appear. Each one breaks a guardrail (§0.2), is deferred (PRD §8, brief §7) or has no data behind it.

**Global chrome**
- Promo banner ("Placement Season Prep… slots fill in 3 days", "TCS, Infosys & Google tracks").
- Dark/light toggle and every light-theme block.
- Notifications bell, "Console" top-bar button, "Engine: Online 12ms", "Streak: 14 Days" in the top bar, "Session: 42m active", "Placement Status: Eligible", "Season 2025 · Verified".
- Hard-coded counts ("2,400+ placement problems", "650+", "40+ free problems"). A number appears only when it comes from the API.
- "State Inspector" bars on screens 01, 02, 04 and 24–30. They are preview harnesses.
- Footer links that don't exist ("Live Contests", "DSA Sheets", "TPO Campus Portal", "Student Registration").
- "PRO", "Pro", "Campus Pro", "ANNUAL", "Placement Season Pass", "Valid: 284 days left". Use **Premium** and "Premium until {date}".

**Fabricated metrics and credentials**
- Percentiles and "beats N%" ("Top 1.2%", "99.4th %ile", "Top 3.1%", "Top 10%", "beats 94.2%").
- "Candidate Qualified", "Passing Score 75%", "Performance Tier", "Surpasses benchmark cutoff for TCS Digital & Amazon", "OFFICIAL ATTEMPT".
- XP ("+320 XP"), "Weekly Target", "Overall Accuracy", "Mastered", "Prepped 5/48".
- Social proof and fake operations stats ("Verified Signal Rate 99.4%", "Weekly Submissions 412", "19 verified candidates", "Verified Placement Archive", "WCAG 2.2 AA Verified" badge).
- Fake leaderboard rows with colleges and "100% Solved" on the landing page.

**Out-of-scope features**
- Proctoring of any kind (fullscreen lock, webcam, "Proctor: Active", clipboard or keystroke telemetry).
- Mock-test sections, system-design questions inside mocks, and partial-credit percentages.
- AI hints, the AI mentor, "Evaluation Synthesis" and "Auto-Audit Bot".
- "+ Custom" test cases, "Reset inputs" and "Run all hidden test cases".
- The "Clarifications" tab.
- Quiz timers and quiz sections; "Skip to Scoreboard" or jumping between quiz questions.
- Lifetime or differently-featured plans, coupons and payment brand lists. Use "UPI · Cards · Netbanking, via Razorpay".
- Category chips on hubs and companies; "Save Company"; hiring-season filters.
- Community outcome filter, server-side drafts, post view counts, a comment sort dropdown, a "Ban & Hide" action and a project discussions rail.
- The "Evaluated" project status. Projects are self-checked: show **Done** or nothing.
- Session or test IDs and version strings ("SYS_ID", "Engine v2.4", "SPEC V1.4.2", "Harness: V2-SPEC-COMPLIANT").
- Emoji or brand marks for companies (🍎). Monograms only.
- Showing the author's college on experience cards.
- "Log out of all devices" in Settings.
- Required markers on the composer's role title and outcome; only company and level are required (API §13).
- "Most questions" sort on hubs and "Most questions / experiences" on companies. Hubs sort A–Z / Most learned, companies A–Z only.

**Copy to correct** (use the doc copy, not the design's)
- Onboarding chip "Engineer" → "Working professional"; leaderboard helper → "Shown on the leaderboard — never your email"; CTA → "Continue".
- Visitor leaderboard → "Sign up to get ranked".
- 5-minute mock warning → a toast, "Unsubmitted code is not scored.", not a banner.
- Removed comments → "[hidden by moderators]", with no reason shown.
- Language names → `GET /api/languages` `name`, never hard-coded versions.
- Account-deletion copy → App_Flow §1 (handled manually within 30 days, what becomes "[deleted]").

## 7. Design ↔ docs reconciliation

### 7.1 Routes and navigation

The docs are binding, so routes in code follow App_Flow and §10.3. These design labels are wrong:

| Design | Correct | Why |
|---|---|---|
| `/mock-tests/lobby` | `/mock-tests/{id}` | The lobby is per test (App_Flow §3.1) |
| `/design` with an HLD / LLD toggle | `/design/hld`, `/design/lld`; the toggle renders as two links | App_Flow §11 |
| `/design/url-shortener` | `/design/{kind}/{slug}` | App_Flow §11 |
| `/gallery` in the sidebar | `/dev/gallery`, development builds only, not in the sidebar | Dev_to_Prod_Strategy §1.7 |
| Moderation inside the product shell | `/admin/moderation` in the admin shell | Brief §10.4 |
| Mock runner inside the app shell | Full-bleed Workspace with the test header | Brief §10.1 |
| Practice Workspace showing a mock timer and the Solution tab | Either mock mode (no Solution tab, test header) or practice with the "Test in progress — Resume" chip | App_Flow §2.7, §3.2 |
| Quiz attempt IDs like `att_98f42c` | Numeric `attemptId` | API §9 |
| Project page shows the brief and repo to Free users | Paywall replaces the brief; checklist and repo withheld | App_Flow §13 |
| Visitor paywall shows plan buttons | Sign in first, then plans | App_Flow §4.1 |

### 7.2 Doc changes made for this sync

No `Backend_Schema.md` changes: every field the designs legitimately show already has a column or can be derived from one (avatar → `users.avatar_url`, member since → `users.created_at`, deletion request → `users.deletion_requested_at`). `App_Flow.md` is unchanged: the designs drift from it, and it doesn't need to change to match them.

[API_Contract.md](API_Contract.md):
- `GET /api/me` gains `createdAt` ("Member since", App_Flow §8.1), `canPostFrom` (the composer's "You can post from {time}", App_Flow §14) and `deletionRequestedAt` (the Settings banner).
- `GET /api/community/posts/{id}` gains `viewerIsAuthor`; comment items gain `isPostAuthor` and `viewerIsAuthor`, so the UI can show Edit / Delete and the "Author" tag without exposing user IDs.
- `GET /api/me/community/posts` gains an optional `status` filter and `statusCounts` for the status tabs.
- `GET /api/me/quiz-attempts` accepts `hub` + `topic` as an alternative to `quizSlug`, and items gain `quizSlug` and `level`, for the topic's single Attempts list (App_Flow §10).
- The design-notepad `409 REVISION_CONFLICT` defines its `current` object; company `designQuestion` items define their fields; moderation queue items define their shapes, capped at 100 each with `pendingTotal` / `reportTotal`.

Also changed: [UI_Generation_Prompts.md](UI_Generation_Prompts.md) (the gallery is at `/dev/gallery`, dark only), [Dev_to_Prod_Strategy.md](Dev_to_Prod_Strategy.md) §1.7 layer 4 (the build flag strips `/dev/gallery`) and [UI_UX_Brief.md](UI_UX_Brief.md) §10.3 row 2.

### 7.3 Resolved decisions

Each was settled in favour of the binding docs, adding no scope.

| # | Question | Decision | Docs changed |
|---|---|---|---|
| 1 | **"Log out of all devices"** was in the Settings design and UI_Generation_Prompts (`onLogoutAll`), but not in the PRD, App_Flow or the API | **Dropped.** It's on the strip list (§6). Adding it later would need a PRD requirement and `POST /api/auth/logout-all` reusing the "revoke all of that user's refresh tokens" path | UI_Generation_Prompts (Settings row and `onLogoutAll` removed) |
| 2 | **Unverified-email pre-flight check** in brief §3.3 | **Removed.** Only providers that assert a verified email can sign in (PRD §6.5, API `/me` `emailVerified` always `true`), so "Signed in" covers it. Pre-flight checks are signed in, width ≥ 768 px, online and editor loaded (App_Flow §3.1) | UI_UX_Brief §3.3 |
| 3 | **Home checklist**: PRD HOME-1 said "verify email", which contradicts the PRD's own "no separate email-verification step" | **App_Flow §7 ships**: Solve your first problem · Take a quiz · Take the free mock test, from `GET /api/me/stats`. It already matches UI_Generation_Prompts and the Implementation_Plan acceptance test | PRD HOME-1 |
| 4 | **Composer required fields**: the design marks role title and outcome as required | **Optional**, as in the current contract: experiences require only `companySlug` and `level` | None (strip list, §6) |
| 5 | **Extra sort options** on hubs and companies | **Dropped.** Hubs sort A–Z / Most learned, companies A–Z (App_Flow §10, §12) | None (strip list, §6) |
