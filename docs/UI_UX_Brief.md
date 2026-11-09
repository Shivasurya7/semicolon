# UI/UX Design Brief — Semicolan

Scope: the whole MVP web app. The visual language is extracted from the reference screenshots in `UI Ref/` (39 captures of a dark-theme interview-prep site, taken at 1861–1920 CSS px). The **Workspace** (coding area) is still the most detailed part, because that is where users spend most of their time.

**Reading map**: §0 source, guardrails and MVP scope filter · §1 color · §2 typography · §3–§6 the Workspace (layout, states, Monaco, accessibility) · §7 Future Scope · §8 spacing, radius, elevation and motion · §9 component library · §10 app shell and page layouts. Copy-paste prompts for a UI generator, one per page, are in [UI_Generation_Prompts.md](UI_Generation_Prompts.md).

**Conventions**: **MUST** and **SHOULD** are normative. The accessibility bar is **WCAG 2.2 Level AA**. Every contrast ratio in this document was computed with the WCAG relative-luminance formula; thresholds are 4.5:1 for text (3:1 for large text) and 3:1 for UI components and meaningful graphics.

## 0. Design Source, Guardrails and Scope

### 0.1 How the values were extracted

- **Colors** were measured from the PNGs, not estimated. Fills are the mode color of a cropped region; text and hairlines are the pixels farthest from their background (glyph cores), which skips sub-pixel anti-aliasing fringes. Values are sRGB as rendered, give or take 1 per channel of compression noise.
- **Sizes** are CSS px measured on the 1919 px captures (100% zoom). They are rounded to the 4 px grid in §8.
- **Fonts** cannot be extracted: the captures render in the capturing machine's system UI font (Ubuntu). Semicolan keeps Inter (§2).
- **Where a measured color fails WCAG AA**, the token takes the smallest same-hue lightness change that passes. Both values are listed (the "Reference" column in §1.1), so the deviation is visible and reviewable.
- `profilePage.png` comes from a different product with a near-black palette (`#0f0f0f` / `#282828`); only its layout is used, re-skinned with the tokens below.

### 0.2 Brand guardrails (MUST)

The reference is someone else's product. We take its *design language* (dark neutral ladder, violet accent, flat bordered cards, dense lists), never its identity.

- Semicolan's own name, wordmark and copy everywhere. Never reproduce the reference's logo, product name, slogans, illustrations, page copy or curated-list names.
- **Wordmark**: a `;` glyph in `accent` followed by "Semicolan" in `text-strong`, Inter 700. Favicon: the `;` glyph on `accent-emphasis`.
- No third-party company logos or logo walls. Company pages show the name with a monogram (an initial in `accent` on `accent-subtle`), and every "asked at" tag shows its source (PRD CMP-2). Tool and technology tiles (Docker, Kubernetes, Pandas…) use generic Lucide icons, not product logos.
- No fabricated social proof: no user counts, avatar rows, testimonials, "verified by analytics" badges or strike-through "was" prices. Every number on a marketing page comes from the API (for example catalog counts) or is left out.
- Payment methods appear as text ("UPI · Cards · Netbanking, via Razorpay"), not as Stripe, PayPal or Google Pay marks.

### 0.3 MVP scope filter

Every screenshot was classified against the React + Spring Boot + MySQL + Judge0 architecture. "MVP (adapted)" means the page ships with the listed parts removed; anything removed is in §7.

| Screenshot(s) | What it shows | Verdict | What ships / why not |
|---|---|---|---|
| `landingPagePart1`–`7` | Hero with product montage, "everything you need" chips, stat cards, pain points, feature walkthrough, four steps, pricing, FAQ, footer | MVP (adapted) | Hero, catalog stat cards (live counts), problem/solution section, Workspace walkthrough, how-it-works steps, pricing, FAQ, footer. Dropped: company logo wall, social proof, "What's New", community links |
| `signingPage` | Sign-in modal, Google and GitHub | MVP | The same modal: wordmark, "Sign In", **Continue with Google**, **Continue with GitHub**, a "Last used" tag, terms line; plus an onboarding step for new accounts. In development the buttons open the mock provider page (App_Flow §15) |
| `userLobbyDashboardPart1`–`2` | Home: greeting, getting-started checklist, companies, topics, roadmaps, activity heatmap, Premium card, what's new, interview experiences | MVP (adapted) | Greeting, checklist, Continue where you left off, Explore tiles, Topics, Companies, activity heatmap, Premium card, Mock test and Leaderboard cards, Latest interview experiences. Dropped: roadmaps, what's new, drag-to-reorder and edit of sections |
| `lobbyPageLeftPanal` | Collapsible sidebar, 15 destinations in 4 groups | MVP (adapted) | The same grouped sidebar with 12 destinations (§10.1). Dropped: Behavioral, Full Stack, Resume, Roadmaps, Application Tracker, Earn, What's New |
| `questionListingPage`, `problemListingArea` | Problem list grouped by topic with progress bars, topic sub-sidebar, search, filters, difficulty badge, bookmark and done icons, progress ring, Export PDF | MVP (adapted) | Search, difficulty / topic / status filters, bookmarks, per-topic progress, overall progress ring, grouped and flat views. Dropped: curated lists, Companies filter, Export PDF. The manual "mark done" checkbox becomes a read-only **Solved** check derived from the first Accepted submission, so it can't disagree with the leaderboard |
| `problemAndCodeIDEPage`, `questionTab`, `solutionTab`, `submissiontab`, `testcasesTab`, `outputTab` | Workspace: Description / Solution / Submissions tabs, editor, Test Cases / Output panel, Run and Submit | MVP | Description, **Solution** (editorial, new; PRD SOL-1), **Submissions** (the History tab, renamed); Test Cases, Console, Submission Result; Run and Submit in the results footer. Dropped: Visualizer, Sources, Companies chip, AI-assistant rail, user-added custom test cases |
| `profilePage` | Profile: avatar, rank, solved ring by difficulty, badges, submission heatmap, Recent AC / List / Solutions / Discuss tabs, community stats, languages, skills | MVP (adapted) | Identity card with Edit profile, solved ring by difficulty, heatmap with streaks, recent submissions, account settings. Dropped: badges, followers, community stats, reputation, languages and skills panels |
| `subscriptionPage` | Pricing with coupon banner, Yearly and Lifetime plans, payment marks, testimonial | MVP (adapted) | Plans from `GET /api/plans` (fixed-term prepaid, INR, no auto-renewal; PRD §6.1). Dropped: Lifetime plan, coupons, testimonials, payment logos |
| `programGroupPage`, `DevOpsPage`, `DataSciencePage` | Domain hubs: grids of topic cards | MVP: DevOps and Data Science hubs | Topic tile grid with search and A–Z sort (§9.6). Brand logos of tools are replaced by generic Lucide icons. The Full Stack hub (`programGroupPage`) stays Future |
| `DevOpsQuestionsPage*`, `DataScienceTheoryView`, `DataScienceQuizTab`, `DataScienceProblemTab` | Theory Q&A with source chips, MCQ quizzes by level, SQL coding problems | MVP, except SQL | Theory tab (§9.13), Quiz tab and runner (§9.14). **The Data Science Coding tab (SQL) is Future**: Judge0 cannot evaluate SQL (PRD §4). "Get AI Hint" is Future |
| `systemDesignPage`, `lldPage` | Design-question grids with editorial, quiz and AI whiteboard | MVP (adapted) | Guide banner, two-column question cards, viewer with statement, editorial, quiz and a Markdown **My answer** notepad (§9.15). The AI whiteboard is Future |
| `companyPage`, `companyWiseQuestionsPageOverviewTab`, `CompanyWiseQuestionPage*` | Company directory; per-company Overview / Coding / System Design / LLD tabs | MVP (adapted) | Directory and company page with the same tabs plus Experiences, the sidebar company list, and the blurred sign-in preview (§9.16). Names with monograms, never logos; the reference's co-branded banner is replaced by a neutral gradient header |
| `communityPage` | Interview experiences with votes, comments and filters | MVP | Feed with the right-hand filter column, post page, comments, composer, reports, moderation queue (§9.17). The "7 days free for sharing" reward is Future (PRD §8) |
| `projectPage` | Take-home project cards | MVP | Take-home and Portfolio tabs, cover cards, project detail (§9.18) |

After this re-evaluation 21 of the 22 distinct screens ship in some form; only the Full Stack hub and the SQL coding tab stay Future, along with the features named in each row.

**Global chrome** in the screenshots: the promo banner with a coupon code is Future (no coupons in MVP). "Search everything" ships as **problem search** opened with Ctrl/Cmd + K, not `/`: a single-character shortcut breaks WCAG 2.1.4 (§6.3). The notifications bell and the live-chat bubble are Future (support is a monitored email in MVP). The "Getting started guide" button becomes the dashboard checklist (§10.3).

## 1. Color Palette

Dark mode is the default and primary theme, matching the reference and built for long practice sessions. It is the only theme built in the MVP. Light mode (user-toggleable) ships later, but its values are fixed now (§1.2, §1.4) so the token structure and the contrast checks already cover both themes.

Colors are CSS custom properties (for example `--color-bg-base`) mapped into the Tailwind theme; a theme is a set of values under `[data-theme]`. Components never hard-code hex values.

### 1.1 Dark tokens

**Surfaces** form a ladder from darkest to lightest. Each step up means "one level closer to the user": base → card → row/surface → raised → chip. Hover moves an element one step up the ladder.

| Token | Hex | Reference | Usage |
|---|---|---|---|
| `bg-base` | `#1c1c1c` | `#1c1c1c` | Page background, app shell, sidebar, top bar, the 8 px gutters between Workspace panes, list group headers |
| `bg-section` | `#1e1e1e` | `#1e1e1e` | Large dashboard section containers |
| `bg-card` | `#212121` | `#212121` | Tiles, topic cards, stat cards, pricing card body |
| `bg-input` | `#232323` | `#232323` | Text inputs, search, filter buttons, modal buttons, dialog cards |
| `bg-inset` | `#242324` | `#242324` | Example and `<pre>` blocks inside prose; the tab-label chip above a list group |
| `bg-row` | `#262626` | `#262626` | Problem list rows |
| `bg-surface` | `#282728` | `#282728` | Workspace panes (problem, editor, results), the Monaco background, editorial code blocks |
| `bg-raised` | `#2e2e2e` | `#2e2e2e` | Pane tab strips, editor toolbar, results footer bar, active sidebar item, row and tile hover, active segmented-control item |
| `bg-chip` | `#3b3a3a` | `#3b3a3a` | Inline code, test-case value boxes, the selected test-case chip |
| `bg-scrim` | `rgb(53 53 53 / 0.6)` | derived | Modal backdrop. Derived from the sign-in capture: white text behind it renders `#868686` and `bg-base` renders `#2b2b2b` |

**Borders**

| Token | Hex | Reference | Usage | Min. ratio |
|---|---|---|---|---|
| `border-subtle` | `#282828` | `#282828` | Top-bar bottom edge, sidebar and rail dividers | decorative |
| `border` | `#2e2e2e` | `#2e2e2e` | Card and section borders, FAQ dividers, table-of-contents rail | decorative |
| `border-row` | `#3a3a3a` | `#3a3a38` | Dividers between list rows on `bg-row` | decorative |
| `border-strong` | `#75777f` | `#75777f` (used as text there) | Any border or grip that identifies a control: inputs, select, outlined buttons (Run, Console), checkbox and radio outlines, the splitter grip | 3.04 on `bg-raised`, 3.33 on `bg-surface`, 3.52 on `bg-input`, 3.82 on `bg-base` |
| `border-hover` | `#55527d` | `#55527d` | Hover and keyboard-focus-within border of interactive cards (landing step cards, tiles) | decorative; focus also gets the ring |

**Text**

| Token | Hex | Reference | Usage | Min. ratio (on which surface) |
|---|---|---|---|---|
| `text-strong` | `#fafaf9` | `#fafaf9` | h1–h2, dialog titles, the dashboard greeting | 10.86 (`bg-chip`) |
| `text-primary` | `#ecebea` | `#ecebea` | Titles, list-row titles, primary labels, active line number | 9.52 (`bg-chip`) |
| `text-prose` | `#dad9da` | `#dad9da` | Problem statement and editorial body | 8.05 (`bg-chip`) |
| `text-secondary` | `#c3c4c8` | `#c3c4c8` | Lead paragraphs, example text, verdict-banner meta, **all text on `bg-chip`** | 6.51 (`bg-chip`) |
| `text-muted` | `#979ba5` | `#979ba5` | Meta, counts, inactive tabs, placeholders, FAQ questions, Run label | 4.88 (`bg-raised`). **Never on `bg-chip`** (4.07) |
| `text-on-accent` | `#ffffff` | `#ffffff` | Labels on `accent-emphasis` (9.72) and `accent-emphasis-hover` (6.69) | – |
| `text-on-highlight` | `#1c1c1c` | `#2b2826` | Label on `highlight` (10.11) | – |

**Brand**

| Token | Hex | Reference | Usage | Min. ratio |
|---|---|---|---|---|
| `accent-emphasis` | `#581fa6` | `#581fa6` | Fill of primary buttons: Sign in, Get started, Upgrade, Buy, Share-style wide CTAs; the Premium pill | white 9.72 |
| `accent-emphasis-hover` | `#732bdf` | `#732bdf` | Hover and pressed fill of primary buttons; the "Last used" tag | white 6.69 |
| `accent` | `#ae80ec` | `#ab7ceb` | Active tab label **and** its 2 px underline, links, active nav label, selected-state text, the focus ring | 4.59 on `bg-raised`, 5.03 on `bg-surface`, 5.76 on `bg-base` |
| `accent-icon` | `#9156e7` | `#8e52e6` | Check icons in feature lists, radio and checkbox fills, accent icons (non-text only) | 3.03 on `bg-raised`, 3.81 on `bg-base` |
| `accent-subtle` | `#2b1c3e` | `#2b1c3e` | Fill of violet tags and badges, with `accent` text | 5.30 |
| `premium-surface` | `#221f27` | `#221f27` | Premium upsell card background | – |
| `premium-border` | `#633e9a` | `#633e9a` | Premium card and featured-plan border | decorative |
| `plan-featured` | `linear-gradient(180deg, #27222d 0%, #230841 100%)` | measured top and bottom | Featured pricing card background | text measured on both stops |
| `step-badge` | `#9478d7` | `#9478d7` | Numbered circles in "How it works", with `bg-base` text | 4.81 |
| `highlight` | `#f5c02a` | `#f5c02a` | Fill of the single featured-plan CTA only; never decorative | `text-on-highlight` 10.11 |
| `banner-gradient` | `linear-gradient(135deg, #42197c 0%, #1c308a 100%)` | both stops measured (`companyWiseQuestionsPageOverviewTab`) | Company page header band, design-guide hero | white text 11.42 on the lighter stop |
| `project-border` | `#420f5d` | `#420f5d` | 1 px border of project cards | decorative |

**Module-specific surfaces** (measured on the hub, community and project captures)

| Token | Hex | Reference | Usage | Ratio |
|---|---|---|---|---|
| `bg-code-accent` + `code-accent` | `#323232` + `#6d9dd6` | `#323232` + `#6493cd` (4.03, fails) | Inline code inside theory answers (blue code on a gray chip, as in the reference) | 4.54 (5.36 on `bg-row`) |
| `bg-source-chip` + `source-chip-text` | `#2b2826` + `#a2a5a3` | same | Source link chips under a theory answer, tech-stack chips on project cards | 5.89 |
| Post card | `bg-base` + 1 px `border-subtle` | `#1c1c1c` / `#282828` | Community post cards (flat, outlined, not filled) | – |
| Design card | `bg-input` + 1 px `border-subtle` | `#232323` / `#282728` | Design question cards, quiz level cards, quiz question card | – |
| Theory row | `bg-row` + `border-row` divider | `#262626` / `#383836` | Theory question rows | – |
| Project card body | `bg-card` | `#222222` | Below the cover image | – |

**Status** — text, icons, borders and 12% tints. Never a fill under white text (white on `success` and `error` fails).

| Token | Hex | Reference | Usage | Min. ratio (all surfaces except `bg-chip`) |
|---|---|---|---|---|
| `success` | `#5cc560` | `#5cc560` | Submit button outline and label, Accepted, passed tests | 6.21 |
| `error` | `#f4695c` | `#f35e50` | Wrong Answer, Runtime Error, Compile Error, destructive actions | 4.54 |
| `warning` | `#eba84d` | `#eba84d` | Time Limit Exceeded, timer at 10 minutes or less, the problem-row glyph | 6.62 |
| `info` | `#6598d4` | `#5990d1` | Informational banners, hints, Judging Error | 4.52 |

**Difficulty badges** — a pill with a 1 px border in the text color over a dark tint. The labels are **Easy / Medium / Hard** (PRD CAT-1); the reference says Junior / Mid / Senior.

| Difficulty | Text and border | Reference text | Fill | Ratio |
|---|---|---|---|---|
| Easy | `#409057` | `#387e4c` (3.61, fails) | `#0a1b12` | 4.54 |
| Medium | `#bc6c0f` | `#a25d0d` (3.51, fails) | `#261203` | 4.52 |
| Hard | `#f03345` | `#de1023` (3.61, fails) | `#2d0c02` | 4.52 |

Rules:
- **Focus ring**: 2 px `accent` outline with a 2 px offset on `:focus-visible`; never removed without a replacement (5.76:1 on `bg-base`, 4.59:1 on `bg-raised`).
- **Text on `bg-chip`** uses `text-secondary` or brighter. `text-muted`, `accent`, status and syntax colors are not checked against it, so they never sit on it.
- **Verdict banners** (§4.1): a 12% tint of the status color over `bg-surface` — success `#2e3a2f`, error `#402f2e`, warning `#3f362c`, info `#2f353d`. The 20 px / 700 heading takes the status color (large text, so 3:1 applies; minimum 4.12, info). The meta line uses `text-secondary` (minimum 6.79), **not** `text-muted`, which drops to 4.25 on the warning tint.
- `accent` and `accent-emphasis` are both violet; tell controls apart by fill versus text, never by hue alone. `accent` and `info` are told apart by icon and context.
- `border`, `border-subtle` and `border-row` are decoration. Anything that identifies or operates a control needs 3:1 (WCAG 1.4.11), which is what `border-strong` is for. **Deliberate deviation**: the reference draws inputs as borderless `#232323` fills on `#1c1c1c` (1.16:1); Semicolan gives every input a 1 px `border-strong`.

### 1.2 Light tokens (Future Scope: specified now, not built in the MVP)

Same ladder, inverted. The light theme keeps the violet brand: `accent-emphasis` stays `#581fa6`, so primary buttons look the same in both themes.

| Token | Hex | Ratio |
|---|---|---|
| `bg-base` / `bg-section` | `#f7f7f8` | – |
| `bg-surface` / `bg-card` / `bg-input` / `bg-row` | `#ffffff` | – |
| `bg-inset` | `#f4f4f6` | – |
| `bg-raised` | `#f0f0f2` | – |
| `bg-chip` | `#e9e9ec` | – |
| `bg-scrim` | `rgb(17 17 19 / 0.45)` | – |
| `border-subtle` / `border` / `border-row` (decorative) | `#ececef` / `#e4e4e7` / `#e4e4e7` | – |
| `border-strong` | `#878a94` | ≥ 3.0 on every surface except `bg-chip` |
| `text-strong` | `#111113` | ≥ 15.57 |
| `text-primary` | `#1d1d20` | ≥ 13.88 |
| `text-prose` | `#2c2c30` | ≥ 11.48 |
| `text-secondary` | `#45474d` | ≥ 7.66 |
| `text-muted` | `#5f6370` | ≥ 4.94 (including `bg-chip`) |
| `accent` | `#6b2fc4` | ≥ 6.13 |
| `accent-emphasis` / `-hover` | `#581fa6` / `#4a1a8c` | white 9.72 / 11.55 |
| `accent-icon` | `#7c3aed` | ≥ 5.01 |
| `accent-subtle` | `#f1eafc` | `accent` on it 6.33 |
| `success` / `error` / `warning` / `info` | `#197934` / `#cb212d` / `#8d5e00` / `#0550ae` | ≥ 4.5 on every surface |
| Easy / Medium / Hard badge | `#197934` on `#e6f4ea` / `#9a5b00` on `#fdf0dc` / `#c4202f` on `#fde8e8` | 4.83 / 4.82 / 4.98 |
| `highlight` | `#f5c02a` with `#1c1c1c` text | 10.11 |
| `border-hover` (decorative) | `#d6c8f5` | – |
| `premium-surface` / `premium-border` | `#f6f1fe` / `#b794f4` | `text-primary` 15.16, `text-muted` 5.40, `accent` 6.69 on the surface |
| `plan-featured` | `linear-gradient(180deg, #ffffff 0%, #f1eafc 100%)` | `text-muted` ≥ 5.11 on both stops |
| `step-badge` | `#6b2fc4` with white text | 7.42 |
| `bg-code-accent` + `code-accent` | `#eef3fb` + `#0550ae` | 6.82 |
| `bg-source-chip` + `source-chip-text` | `#f4f1ee` + `#45474d` | 8.25 |
| `banner-gradient` | unchanged (white text) | 11.42 |
| `project-border` | `#d6c8f5` | decorative |

### 1.3 Contrast and color rules

- **MUST**: text is at least 4.5:1 (3:1 if 24 px or larger, or 18.66 px bold or larger); icons, control borders, focus indicators and state-bearing graphics are at least 3:1 against the adjacent color (WCAG 1.4.3, 1.4.11).
- **MUST**: color is never the only signal (WCAG 1.4.1). Every status pairs a hue with an icon shape and a text label (§4.1); difficulty is always the word. Red/green pairs — Accepted vs Wrong Answer, diffs, Easy vs Hard — are never told apart by hue alone.
- **MUST**: a unit test computes every token pair, every syntax-color/background pair, every difficulty badge and every verdict tint, for each theme, and fails the build below the thresholds. "AA in both modes" is a build property, not a review habit.
- Disabled controls are exempt from contrast, but "disabled" is never the only way a state is shown (§4.2).
- The activity heatmap (§9.10) encodes counts by `accent-icon` opacity; every cell also has a text tooltip and the grid has a text summary, so no information lives only in the shade.

### 1.4 Syntax highlighting (Monaco theme)

The editor background is `bg-surface` (`#282728`) in Dark and `#ffffff` in Light. The Dark values follow the reference, which uses a VS Code Dark+-like palette; two failed and were lightened.

| Role | Dark | Reference | Ratio on `bg-surface` | Light | Ratio |
|---|---|---|---|---|---|
| Default text, operators, delimiters | `#d4d4d4` | `#d4d4d4` | 10.04 | `#1f1f1f` | 16.48 |
| Comment | `#77a260` | `#658a51` (3.76, fails) | 5.05 | `#2f7a2f` | 5.32 |
| Keyword, storage | `#619bd4` | `#619bd4` | 5.07 | `#0f4fc2` | 7.20 |
| Control keyword (`return`, `if`, `for`) | `#c586c0` | – | 5.35 | `#9b14c4` | 6.38 |
| String | `#ce9178` | – | 5.63 | `#a31515` | 7.85 |
| Number, constant | `#b5cea8` | – | 8.76 | `#0b7a52` | 5.36 |
| Type, class | `#4ec9b0` | – | 7.30 | `#1f6f86` | 5.71 |
| Function name | `#dcdcaa` | – | 10.53 | `#6f5420` | 7.08 |
| Line number (active line: `text-primary`) | `#8e8e8e` | `#858585` (4.03, fails) | 4.54 | `#5f6370` | 5.99 |

- Every color except the line number also passes on `bg-inset` and `bg-raised` (minimum 4.61 Dark, 4.68 Light), because output, diff and editorial code blocks reuse them. Line numbers appear only on `bg-surface`.
- Ship custom themes (`defineTheme` on `vs-dark` / `vs`), not the stock ones: stock `vs-dark` paints `#1e1e1e`, which does not match `bg-surface`.
- Scopes not listed above inherit the base theme's colors, which nobody has verified. The contrast test runs on every foreground color the tokenizer actually emits for sample C, C++, Java and Python files, not only on this table.
- **Selection**: Dark `#581fa6` at 35% (renders `#392454`; code text 9.11, comment 4.58, keyword 4.60). Light `#7c3aed` at 10% (renders `#f2ebfd`; every Light syntax color stays at least 4.58). Bracket-pair colorization stays off in the MVP, because its six colors are not in the verified set.

### 1.5 System preferences

- **High contrast** (`forced-colors: active`): Monaco's `autoDetectHighContrast` stays at its default (`true`), so the editor switches itself to `hc-black` / `hc-light`; do not override the theme in that mode. Chrome uses system color keywords (`CanvasText`, `ButtonText`, `Highlight`). Draw focus rings and the splitter with `outline` or `border` — `box-shadow` is dropped in forced-colors mode.
- **Reduced motion** (`prefers-reduced-motion: reduce`): opacity-only transitions; spinners become a static ring plus the words "Running…". Monaco: `smoothScrolling: false`, `cursorSmoothCaretAnimation: 'off'`, `cursorBlinking: 'solid'`.
- **More contrast** (`prefers-contrast: more`): `border`, `border-subtle` and `border-row` are promoted to `border-strong`, and `text-muted` to `text-secondary`.
- `color-scheme: dark` on the root, so native scrollbars, `<select>` popups and form controls render dark.

## 2. Typography

- **UI chrome and prose**: `Inter, system-ui, -apple-system, "Segoe UI", sans-serif`. The reference renders in the capturing machine's system font (§0.1); the scale below is what was measured.
- **Code and output**: strictly monospace — `"Fira Code", "JetBrains Mono", "Cascadia Mono", Consolas, Menlo, "DejaVu Sans Mono", ui-monospace, monospace` — applied consistently to the Monaco editor **and** the Console, test-case, diff and editorial code panes, inline code and the example blocks, never falling back to a sans-serif font for code or stdout. Concrete platform fonts come before `ui-monospace` because only Safari understands that keyword; without them a Windows machine whose web font fails to load falls back to Courier New.
- **Fonts are self-hosted** (WOFF2, Latin subset, weights 400/500/600/700 for Inter and 400/500 for Fira Code, `font-display: swap`); no third-party font CDN, for reliability on restrictive campus networks and for privacy.
- **Monaco measures the font once**: create the editor after `document.fonts.load('14px "Fira Code"')` resolves (with a timeout of about 1.5 s), or call `monaco.editor.remeasureFonts()` when the font arrives. Otherwise the caret and selection drift away from the glyphs.

### 2.1 Type scale

Sizes are in `rem` (root 16 px), so the browser's default-font-size setting is respected. "Measured" is the reference value in CSS px.

| Token | Size / line height | Weight | Measured | Used for |
|---|---|---|---|---|
| `display` | 4.5 rem (72 px) / 1.0, tracking -0.01em | 700 | 72 / 72 | Landing hero headline only. Steps down to 3 rem below 768 px |
| `h1-marketing` | 3 rem (48 px) / 1.15 | 700 | 48 | Landing section headings, pricing heading |
| `h2-marketing` | 1.875 rem (30 px) / 1.3 | 500 | 30 | Landing sub-headings |
| `h1-app` | 2.25 rem (36 px) / 1.2 | 600 | 36 | Dashboard greeting |
| `h1-page` | 1.5 rem (24 px) / 1.3 | 500 | 24 | App page titles ("Problems", "Leaderboard") |
| `h2-section` | 1.125 rem (18 px) / 1.4 | 600 | 18–19 | Card and section titles ("Getting started"); `text-muted` 400 for dashboard section labels ("Topics") |
| `title-problem` | 1.25 rem (20 px) / 1.4 | 500 | 20 | Problem title in the Workspace (the page `h1`) |
| `lead` | 1.25 rem (20 px) / 1.4 | 400 | 20 / 28 | Landing hero sub-copy |
| `body-lg` | 1.125 rem (18 px) / 1.6 | 400 | 18 | Landing body, pricing features |
| `row-title` | 1 rem (16 px) / 1.5 | 400 | 16–17 | Problem list row titles, group headers, FAQ questions |
| `prose` | 0.9375 rem (15 px) / 2.0 | 400 | 15 / 32 | Problem statement and editorial. Measure about 75 characters. The reference pitch is 32 px; 30 px keeps long statements scannable |
| `body` | 0.875 rem (14 px) / 1.43 | 400–500 | 14 / 20 | Default UI text, tabs, buttons, inputs, tile titles |
| `meta` | 0.75 rem (12 px) / 1.33 | 400 | 12 / 16 | Counts ("32 problems"), timestamps, badge text, helper text |
| `eyebrow` | 0.6875 rem (11 px) / 1.45, tracking 0.04em | 500 | 11 | Group label chips, card sub-labels ("Statement · Editorial") |
| `stat` | 1.875 rem (30 px) / 1.2, `tabular-nums` | 500 | 30 | Stat-card numbers, prices, solved count in the ring |
| `code` | 0.875 rem (14 px) / 22 px | 400 | 14–15 / 22 | Monaco default, editorial code |
| `code-sm` | 0.8125 rem (13 px) / 24 px | 400 | 13 / 24 | Example blocks, test-case values, Console |
| `code-inline` | 0.875em of the parent | 400 | – | Inline code chips in prose |

- **Weights**: 400 body, 500 tabs, buttons and titles, 600 card titles and the greeting, 700 marketing headings and verdict headings only.
- **Editor font size**: 14 px default, user-adjustable 12–24 px (A- / A+), persisted per device. Monaco only accepts pixels, so the default is 14 × (root font size ÷ 16).
- **Ligatures**: off in the editor by default — a beginner who reads `!=` or `<=` as one glyph is debugging blind — with a Settings toggle. Always off in output, diff and stderr (`font-variant-ligatures: none`), where every character matters.
- **Numerals** in timers, runtimes, counters, prices, ranks and stats use `font-variant-numeric: tabular-nums`, so they do not jitter.
- **Text spacing** (WCAG 1.4.12): chrome and statement tolerate user overrides of line height, letter spacing and word spacing. Text containers use `min-height`, never a fixed `height`. (Monaco is exempt.)

## 3. Layout — Problem Solving View

The core workspace is a resizable three-pane split under a slim global header. Panes are rounded cards (`bg-surface`, 6 px radius) separated by 8 px `bg-base` gutters — the gutter *is* the splitter hit area — as in the reference (`problemAndCodeIDEPage.png`).

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ; < Problems   Problem title  [Easy]   ‹ ›      Report a problem  [Mock ⏱] │  48 px, bg-base
├────────────────────────────────┬───────────────────────────────────────────┤
│ Description | Solution | Subm. │ Python [v]        ↺ Reset  ⚙  ⛶          │  40 px tab strip / 44 px toolbar, bg-raised
│────────────────────────────────│───────────────────────────────────────────│
│ Title                          │   Code editor (Monaco), bg-surface        │
│ [Easy] [Topics ▾]              │                                           │
│ Statement, examples,           │                                           │
│ constraints                    ├───────────────────────────────────────────┤
│                                │ Test Cases | Console | Submission Result  │  40 px, bg-raised
│ Scrolls independently          │ Case 1  Case 2  Case 3                    │
│                                │ nums = [2,7,11,15]   (bg-chip boxes)      │
│                                │───────────────────────────────────────────│
│                                │ [^ Console]              [▷ Run] [Submit] │  56 px footer, bg-raised
└────────────────────────────────┴───────────────────────────────────────────┘
```

The vertical gutter between the problem pane and the right column, and the horizontal gutter between the editor and the results, are the two splitters (§3.2). Monaco's own sizing rules are in §5.

**Where Run and Submit live.** They sit in the results panel's footer bar, bottom-right, as in the reference: the footer stays visible when the results panel is collapsed to its tab strip, so the two buttons never move and are always one Tab stop from the results they produce. Left of the footer is **Console**, a toggle that collapses or restores the results panel (the non-drag alternative of §3.2).

### 3.1 Panes

- **Header** (48 px, `bg-base`): the wordmark, back to the catalog, the problem title with its difficulty badge (the word, not just a color), previous / next problem arrows (in the catalog's current filter order), and a **Report a problem** link (OPS-3). Mock mode adds the problem switcher and the timer (§4.5).
- **Left pane** — Problem: three tabs in a 40 px `bg-raised` strip — **Description**, **Solution** and **Submissions** — each with a Lucide icon (`FileText`, `CircleCheck`, `History`). The active tab is `accent` text over a 2 px `accent` underline; inactive tabs are `text-muted`. A collapse button sits at the strip's right end. The pane scrolls independently of the right column.
  - *Description*: title (`title-problem`), a meta row (difficulty badge; a collapsed **Topics** disclosure, because topics give away the technique; a **Premium** pill when relevant), then the statement in `prose`. Markdown is rendered through a sanitizer (no raw HTML). Inline code is a `bg-chip` chip (4 px radius, `text-secondary`). Examples are `bg-inset` blocks with a 2 px `border-strong` start border, `code-sm` monospace and a Copy button; constraints are a bulleted list of inline-code chips. Never images of text.
  - *Solution* (PRD SOL-1): the editorial — an **Overview** of the approach in `prose`, **Time** and **Space complexity** lines, then **Code**: a `bg-surface` code block with a language tab row (C, C++, Java, Python 3; defaults to the editor's language) and a Copy button. The tab opens on a spoiler guard — "Try it yourself first? The editorial shows a full solution." with **Show solution** — remembered per problem on the device. A problem without an editorial shows "No editorial for this problem yet." Visitors see a sign-up prompt and Free users on a Premium problem see the locked state (§4.4). The tab is hidden inside a mock test, and the API refuses it there too.
  - *Submissions*: this problem's `SUBMIT` history (`GET /api/submissions?problemId=`, EXE-3), the History tab of earlier drafts, renamed to match the reference. A table — verdict (icon and label), language, runtime, memory, relative time (`<time>`, absolute value in its title). Selecting a row shows its code read-only, with Copy and **Load into editor**, which asks for confirmation and then applies as an undoable edit, so the current draft stays recoverable. Empty: "No submissions yet — Submit to see your history here."
- **Right column**, split vertically:
  - **Top** — Code Editor: Monaco, with a 44 px `bg-raised` toolbar above it: the language selector (C, C++, Java, Python 3; a native `<select>`) on the left; on the right, icon buttons **Reset** (back to the starter stub; asks for confirmation, then offers Undo for 10 seconds — Ctrl/Cmd+Z also reverts it), **Settings** (font size, ligatures, screen-reader mode, shortcuts) and **Maximize editor**. Icon-only buttons have accessible names and tooltips.
  - **Bottom** — Results: a 40 px `bg-raised` tab strip — **Test Cases** (`Play` icon; a row of **Case 1 / Case 2 / …** chips, the selected one on `bg-chip`, showing each sample's named inputs as `bg-chip` value boxes and, after a Run, expected and actual output), **Console** (`SquareTerminal` icon; compile errors, stderr) and **Submission Result** (the verdict of a Submit). What each shows is specified in §4.1. Below them, the 56 px `bg-raised` **footer bar**: **Console** toggle (outlined, `ChevronUp` / `ChevronDown`) on the left; **Run** (outlined: `border-strong`, `text-muted` label, `Play` icon) and **Submit** (outlined in `success`, `success` label, `CloudUpload` icon; hover adds a 12% `success` tint) on the right. Run executes the sample test cases only; Submit judges all test cases and is saved to history. Tooltips say so: "Run — sample tests only, not saved"; "Submit — all tests, saved to history and the leaderboard". The reference's **+** (add your own test case) is Future Scope (§7).
- **Switching language never loses work.** Each problem and language keeps its own buffer, with its own undo history, cursor and scroll position (§5). The starter stub is loaded only into a buffer the user has never edited.
- **First visit**: three dismissible coach marks — the language selector; "Run checks the sample tests; Submit judges every test and is saved"; the results panel. Esc or a button dismisses each one. They sit beside their target without covering it or the focused element, never take or trap focus, appear once per device, and are suppressed during a mock test.

| Pane | Default | Minimum | Maximum |
|---|---|---|---|
| Problem pane (left) | 46% of width (the reference's split) | 320 px | the smaller of 60% and (viewport minus 480 px) |
| Right column | the remainder | 480 px, so the toolbar and footer never wrap | – |
| Editor (top of the right column) | 62% of column height | 200 px (about 9 lines) | – |
| Results panel (bottom) | 42% of column height | 176 px (tab strip, two rows, footer) | 70% |

Collapsed, the problem pane is a 40 px rail with a "Show problem" button and the results panel is its 40 px tab strip plus the 56 px footer, so Run and Submit stay put. On viewports shorter than 600 px the results panel starts collapsed and expands when results arrive.

### 3.2 Splitters

A drag handle sits between the left and right panes, and another between the top and bottom of the right column. Dragging is a convenience, never the only way to resize. Splitters are built on `react-resizable-panels`, which already provides the separator role, keyboard resizing, collapse and persistence; the behaviors below are verified against it, with a thin wrapper only where it falls short (for example the percent-valued `aria-valuenow` range or Enter-to-collapse).

- **Pointer**: 10 px hit area centered on the 8 px pane gutter; a 1 px `border` line with a centered 4 × 32 px grip in `border-strong` (so the control itself meets 3:1); on hover, focus and drag the line becomes 4 px `accent`; cursor `col-resize` / `row-resize`. Use Pointer Events with `setPointerCapture` and `touch-action: none` on the handle, so mouse, touch and pen all work and the drag keeps tracking when the pointer crosses Monaco (which otherwise swallows the events and the drag sticks). Set `user-select: none` on the page while dragging.
- **Keyboard** (WAI-ARIA window-splitter pattern): the handle is `role="separator"` and focusable, with `aria-orientation`, `aria-controls` (the primary pane), an accessible name ("Resize problem pane", "Resize editor and results"), and `aria-valuenow` / `aria-valuemin` / `aria-valuemax` giving the primary pane's size in percent within its allowed range. Arrow keys move it by 2% (Shift: 10%); Home and End jump to the minimum and maximum; Enter collapses or restores the pane.
- **Non-drag alternatives** (WCAG 2.5.7): a collapse/expand button on the problem pane and on the results panel, and a Maximize/Restore button on the results panel. Double-clicking a handle resets it to its default.
- **Limits**: each handle is bounded by the minimums and maximums above, so no pane can be dragged to zero width/height. Dragging past a minimum stops at the minimum — it never snaps to zero. Collapsing is an explicit action (button or Enter), so no pane disappears by accident. Collapsed panes are not tab stops, but their rail or tab strip keeps a restore button.
- **Auto-expand**: a collapsed results panel expands to its last height when a Run or Submit completes.
- **Persistence**: sizes are saved to localStorage as percentages (key `semicolan:layout:v1`) so a user's preferred layout survives across sessions. On load they are clamped to the current minimums and maximums — a layout saved on a 27" monitor must not break a 13" laptop. If storage is unavailable (private mode, quota), fall back to the defaults in memory without an error. "Reset layout" lives in Settings.

### 3.3 Responsive behavior and device policy

The Workspace is **deliberately desktop-only** ([PRD.md](PRD.md) §4): Monaco itself is not supported in mobile browsers (its FAQ says so), so below the gate the editor is not mounted at all — there is no half-working touch editor.

| Viewport (CSS px) | Experience |
|---|---|
| 1024 and wider | Full three-pane Workspace |
| 768 to 1023 | Compact Workspace: the problem pane auto-collapses to its rail and opens as an overlay drawer (focus trap, Esc closes); the editor/results split is unchanged |
| Under 768 | Read-only fallback |

**Why not simply "at least 1024 px".** The PRD says desktop-size *screen*, but CSS pixels measure the window, not the device. A half-snapped window on a 1080p display is 960 px wide, so is 200% browser zoom on that display, and a 1366 px laptop at 150% display scaling is 911 px. All three are keyboard-and-mouse desktops, and low-vision users zooming to 200% (WCAG 1.4.4) would lose the editor entirely. The compact band costs almost nothing because collapsible panes are already required (§3.2).

- **Read-only fallback**: the Description, Solution and Submissions tabs (read-only) in a single column that reflows down to 320 px with no horizontal scrolling except inside code blocks (WCAG 1.4.10), plus a non-blocking notice with **Copy link** and **Share** (Web Share, where the browser offers it), so the user's intent is not lost. The notice is actionable: on a desktop-class device (fine pointer) it shows the current width — "Widen the window or reset zoom (Ctrl/Cmd + 0)" — instead of a bare "use a larger screen"; on a phone or tablet it says "Coding needs a larger screen. Open this problem on a laptop or desktop." The draft is never touched.
- **Touch devices at or above the gate** (for example an iPad in landscape): allowed, with a one-time dismissible note that coding works best with a physical keyboard. Hardware-keyboard users are not blocked.
- **Mock tests**: starting needs an explicit confirmation step — App_Flow's lobby — that states the duration and that the timer cannot be paused ("90 minutes. The timer starts now and cannot be paused. Free test: one attempt."). Start stays disabled while a pre-flight check fails (viewport below 768 px, editor not loaded, offline, unverified email), and says which one. The server clock starts when the session is created (MT-2) and the free test is single-attempt (MT-5), so a phone user must not be able to burn it.
- **Crossing the gate is never destructive.** Code is autosaved and restored. A mock session in progress never swaps to the read-only fallback; it stays in the compact layout.

## 4. Component States

### 4.1 Verdict system

Every outcome has its own visual grammar: **icon shape + text label + hue**, plus a home. *Where* a cue appears tells the user *what kind* of problem it is.

| Outcome | Hue | Icon shape | Home | Cue in the editor | What it shows |
|---|---|---|---|---|---|
| Judging | `text-muted` | spinner | the clicked button and the active result tab | none | "Running…" / "Judging…" (§4.2) |
| Samples passed (Run) | `success` | check in a circle | Test Cases | none | "All sample tests passed — not submitted yet". The word "Accepted" is reserved for Submit |
| Accepted (Submit) | `success` | check in a circle | Submission Result | none | Language, runtime, memory; **Next problem** and **Leaderboard** actions; on a first solve, "+N points" (`pointsAwarded`) and the new weekly rank (from `GET /api/leaderboard/me`) |
| Wrong Answer | `error` | not-equal sign | Test Cases or Submission Result | none — the defect is in the output, not at a source line | Samples: input, expected, your output, diff. Hidden test: "Wrong Answer on test N" only |
| Runtime Error | `error` | octagon with an exclamation mark | Test Cases or Submission Result; stderr in Console | none | Samples: stderr. Hidden test: "Runtime Error on test N" and a short list of usual causes (bounds, null, division by zero, recursion depth); stderr is not stored for hidden tests |
| Compile Error | `error` | circle with an x (the IDE-standard error glyph) | **Console is selected**; the verdict tab says "Compile Error — tests did not run" | none (text-only in the MVP) | Compiler output as text, including Python syntax-error tracebacks |
| Time Limit Exceeded | `warning` | clock | Test Cases or Submission Result | none | "Time Limit Exceeded", plus "on test N" for a hidden test; elapsed time |
| Judging Error | `info` | cloud with an exclamation mark | the verdict tab | none | "Something went wrong on our side, not with your code." **Try again** and **Report a problem**; "This attempt didn't count against your limit." Never red: it is not the user's fault |

- **Compile Error and Wrong Answer never share a surface.** A compile error is about the build, so it lives in the Console. A wrong answer is about *what*: the output, so it lives in the results panel as a diff, and the editor is left untouched. When no test ran, the Test Cases tab says "Tests did not run — fix the compile errors first" instead of showing empty pass/fail rows.
- **Verdict banner**: a 3 px start border and a 12% tint in the status hue, the icon, a 20 px / 700 heading in the status hue, and a meta line (Run or Submit · language · runtime · memory · time) in `text-secondary` with tabular numerals (`text-muted` fails on two tints, §1.1), followed by an underlined **Report a problem** link (OPS-3). Mode and language are shown because the user may have switched buffers since. Once the buffer differs from the code that produced the result, a "Code changed since this run" marker (icon plus text) appears, so a verdict is never mistaken for newer code.
- **Tab badges**: tab labels carry an icon and a text count — "Test Cases 2/3", "Console 2 errors" — with an accessible name that spells it out. On completion the tab *selection* changes (Run: Test Cases; Submit: Submission Result; any compile error: Console) and a collapsed panel expands; keyboard focus does not move.
- **Per-test rows** (Run): one row per sample test — status icon, label, time. The first failing row is expanded; passed rows are collapsed. Expected and Your output sit side by side when the panel is 640 px or wider, stacked otherwise.
- **Diff**: blocks are labeled "Expected" and "Your output". The first differing line carries a not-equal marker and the differing characters are underlined — never red/green alone. Whitespace is made visible (spaces, tabs, line endings) automatically when the two outputs differ only in whitespace, and through a **Show whitespace** toggle otherwise, because a trailing space is the classic invisible Wrong Answer.
- **Output rendering**: text nodes only (no HTML), whitespace preserved, ANSI escapes stripped, monospace without ligatures, truncated at 10,000 characters with an "Output truncated" notice. Every scrollable block is keyboard-focusable (`tabindex="0"`, `role="region"`, accessible name) and has a Copy button.
- **Compile errors are text-only in the MVP.** The Console shows the compiler output as text. Judge0 returns raw compiler text rather than structured locations, and Monaco has no local diagnostics for these four languages (tokenizer only), so no squiggles, gutter icons or clickable locations are shown. Locations are Future Scope (§7).
- **Python syntax errors**: Judge0 has no Python compile step, so a `SyntaxError` arrives as a runtime error with a traceback. The backend reclassifies `SyntaxError`, `IndentationError` and `TabError` as `COMPILE_ERROR` ([TRD.md](TRD.md) §3), so the UI treats them like any other compile error.
- **Hidden test failures**: a failing hidden test shows only "Wrong Answer on test N" (or the equivalent for its verdict) in Submission Result — never its input or output. Sample tests show input, expected output, and actual output.

### 4.2 Loading (Judge0 execution)

[App_Flow.md](App_Flow.md) §2.3 defines the execution states and their thresholds; this section specifies how they look.

- **Buttons**: while an attempt is in flight **both** Run and Submit are set `aria-disabled="true"`, **not** `disabled`, so results never interleave and keyboard focus is not dropped (a natively disabled button can lose focus; browsers differ). The clicked button shows a spinner and its progress word ("Sending…", then "Running…"). Both ignore clicks and shortcuts until the attempt finishes. Editing and language switching stay available.
- **Empty editor**: Run and Submit are `aria-disabled` with the reason "Write some code first", linked by `aria-describedby`.

| State | What is shown |
|---|---|
| Sending | The button reads "Sending…"; the result panel opens with one skeleton row per sample test |
| Queued | "Queued — waiting for a free runner", with elapsed seconds |
| Running | Run: each sample row moves Queued, Running, then Passed or Failed as results land. Submit: "Judging… 7 of 20 tests", from the API's `progress` |
| Slow (15 s) | Adds "Taking longer than usual — your attempt is safe, keep editing" |
| Long wait (60 s) | Adds **Stop waiting**, which ends polling but not the attempt; a Submit still lands in Submissions |
| Reconnecting | "Connection lost — reconnecting. Your code is saved on this device." The last known state stays on screen |
| Judging Error | The Judging Error card of §4.1, with **Try again** |

- Panels are marked `aria-busy` until the status is final. Only transitions that need the user's attention are announced (§6.4) — start, slow, long wait, reconnecting, outcome — never per-row changes.
- **Send failures**: offline before clicking → "You're offline — your code is saved on this device" (nothing is queued); a `5xx` → "Our servers hit a problem. Try again." with Retry. Both leave the buttons enabled.
- **Resilience**: a polling failure is not an attempt failure; the client never marks an attempt failed on its own. The in-flight `submissionId` is kept per problem on the device (`sessionStorage`), so a refresh resumes polling. Only one attempt is in flight at a time.

### 4.3 Toasts

- **The results panel is the record; a toast only supplements it.** Failures never toast — they have a persistent home, and a toast would only repeat them. A successful Submit may add a brief success toast as reinforcement (the Plan's Phase 3 acceptance criterion expects one); it carries no live-region role, because the Workspace live region (§6.4) has already announced the verdict and a second announcement would double-speak. Other toasts carry transient events: rate limit, "Code reset — Undo", copied, save failed, network trouble, mock-test time warnings.
- **Placement**: bottom-right (the IDE convention), 16 px inset, at most three stacked. They never sit over the toolbar, Run/Submit or the mock timer — a top-right toast covers exactly the buttons the user is about to press again.
- **Lifetime**: success and info 5 s, warning 8 s; an error persists until dismissed or resolved. Timers pause on hover and keyboard focus; every toast can be closed manually, and Esc dismisses the newest. Focus is never moved into a toast.
- **Semantics**: `role="status"` for success, info and warning; `role="alert"` for errors. The live-region container exists from page load (content injected into a region that already exists is announced reliably). Reduced motion: fade only.
- A toast is never the only place information appears.

### 4.4 Other states

- **Locked (Premium)**: premium problems carry a lock icon **and** the word "Premium" (or an equivalent accessible name) in the catalog, and opening one shows a paywall dialog (a sign-up prompt for visitors). The dialog is modal: focus trap, Esc closes, focus returns to the trigger. If Premium ends while code is open, the code stays in the editor and the next Run/Submit (`403 PREMIUM_REQUIRED`) opens the paywall over the Workspace, leaving the buffer and results untouched.
- **Auth gate** (a visitor clicks Run or Submit, or any other signed-in action; App_Flow §1): a modal dialog over the current page — no navigation — with **Continue with Google** and **Continue with GitHub** (§9.19). The provider opens in a popup, so the editor stays visible and intact behind it; while the popup is open the dialog shows "Waiting for Google…" with Cancel; errors appear inline in the dialog; after success the dialog shows the onboarding step for a new account, then closes on the same problem and the pending Run or Submit runs.
- **Rate limited**: a `429` response shows a warning toast **and** turns the Run/Submit labels into "Retry in 12 s", counted from `Retry-After`; the buttons are `aria-disabled` with the reason linked by `aria-describedby`, and stay so until it elapses. The countdown updates visually every second but is announced only when it starts and when it ends ("You can run code again"). A `503 EXECUTION_BUSY` ("Runners are busy") and a `429 TOO_MANY_IN_FLIGHT` get the same toast and countdown treatment.
- **Onboarding pending**: a signed-in account without a segment (closed the onboarding step) sees the onboarding step again on the next page load, as a dialog that pending actions wait for. Practice is never blocked by anything else.
- **Session expiry**: if the silent refresh fails (App_Flow §1), a login dialog opens over the current screen — the user is never separated from their code — and the Workspace resumes in place, draft and polling intact. A network error or `5xx` during refresh never ends the session; show an offline indicator instead, not the logged-out UI.
- **Drafts and autosave**: saved locally as the user types (debounced to about a second), flushed on `pagehide`, when the tab is hidden, and before every Run or Submit. Success is silent. If the browser refuses storage, show a persistent warning — "Autosave is off — copy your code before leaving." — and only then use a `beforeunload` prompt. Drafts are keyed by user (`anonymous` for visitors), problem and language: a visitor's draft is adopted by the account at the auth gate (the newer wins if one exists), one account never sees another's code on a shared lab PC, and logout clears them. The same problem open in two tabs shows "Edited in another tab" on the tab that did not edit last and asks which version to keep; nothing is overwritten silently.
- **Editor load failure** (slow campus network, blocked asset): the statement stays usable. If Monaco has not loaded within 10 seconds or fails, the editor area becomes a plain `<textarea>` — same monospace stack, same buffer and autosave, labeled "Code editor" — with a notice "Basic editor — Retry full editor"; Run and Submit keep working. An error boundary keeps a Monaco crash from blanking the page.
- **Empty states**: before the first Run, Test Cases previews each sample's input and expected output ("Run to see your output"); Console reads "Compiler messages and stderr appear here."; Submission Result reads "Submit to judge against every test."
- **Page level**: skeletons with the final dimensions (no layout shift) for the statement and the editor; "Problem not found" for a 404; a load error with Retry.

### 4.5 Mock test mode

The lifecycle (lobby, start, resume, finish, report) is specified in [App_Flow.md](App_Flow.md) §3.

- **Test header**: above the Workspace — the test title, a problem switcher (one chip per problem, in order; each shows not attempted, attempted, judging or Accepted as an icon plus text, never color alone), the countdown, and **Finish test**. Finish asks for confirmation that names what is unsolved ("Finish now? 2 of 3 problems unsolved, 38:10 left. You can't resume after finishing.").
- **Timer**: the mock header shows a countdown synced to the server's `end_time`. Remaining time is computed from that absolute time (plus the measured server offset) on every tick, not by decrementing a counter — background tabs throttle timers — and re-synced after a refresh, every minute, on `visibilitychange`, on `online`, and after any `409` or `5xx`. Until the first sync completes it reads "Syncing time…", never `00:00`. It is `role="timer"`, so it is not announced every second; a polite live region announces 10, 5 and 1 minute remaining and the end. Neutral above 10 minutes, `warning` with a clock icon at 10 minutes or less, `error` at 1 minute or less; it never flashes. At 5 minutes and 1 minute a toast adds "Unsubmitted code is not scored."
- **At zero**: the client does one final sync before locking — if the server says time remains (the local clock ran ahead), the countdown simply continues. If the session is closed, the editor locks (`readOnly` and `domReadOnly`, labeled "Editor locked: test session closed") and Run/Submit become `aria-disabled`.
- **"Time's up" is a blocking dialog, not a toast**: the user has just lost the ability to act. It is an `alertdialog` with **View report** (initial focus) and **Copy my code**. A Run or Submit rejected with `409 TEST_SESSION_CLOSED` opens the same dialog with "Your last submission arrived after the test ended and was not counted." Esc closes it but leaves a persistent slim banner — "Test session closed — View report" — so the state stays discoverable. The server's clock is authoritative.
- A submission already in flight at the deadline keeps polling and still counts; the report shows "Finalizing your results…" until it is ready.
- **Interruptions**: offline → a persistent banner — "Offline — your timer is still running on our server. Code is saved on this device." — with the countdown continuing and Run/Submit disabled; the same test open in a second tab → the older tab goes read-only with "This test is open in another tab — Use this tab"; session or token expiry → the login dialog opens over the runner with the timer visible. On return after a refresh or crash, a "Welcome back — 41:12 left. Your code is restored." toast confirms the resume.
- **Test in progress bar**: on every other page, a persistent in-flow bar — "Test in progress — mm:ss left — Resume" — sits above the content, never over it, so it cannot cover a focused element. While the test runs, leaving triggers the browser's `beforeunload` guard and an in-app blocker ("Leave the test? Your timer keeps running").
- **Start**: the lobby and its pre-flight checks (§3.3).

## 5. Monaco Editor Rules

| Area | Rule |
|---|---|
| Container sizing | The editor wrapper has `min-width: 0; min-height: 0; overflow: hidden`. Flex and grid children default to `min-*: auto`, so without it the editor grows when a splitter moves but never shrinks |
| Re-layout | `automaticLayout: true` (a ResizeObserver) covers splitter drags, window resize, zoom, and showing a collapsed pane. If profiling shows jank during drags, switch to manual `editor.layout()` calls from the splitter callback, at most one per animation frame |
| Drag across the editor | Splitters use pointer capture (§3.2); otherwise Monaco swallows mouse events as the pointer enters it |
| Overflow widgets | `fixedOverflowWidgets: true`, so suggestion, hover and parameter widgets are not clipped by the pane's `overflow: hidden`. Dialogs and toasts must render above them (a z-index scale in the design system; QA: open the suggest list, then trigger a toast) |
| Fonts | §2: wait for the code font or call `monaco.editor.remeasureFonts()` |
| Theme | Custom themes from §1.4. Leave `autoDetectHighContrast` at its default (§1.5) |
| Options | `minimap.enabled: false` (a half-width pane can't spare it); `scrollBeyondLastLine: false`; `tabSize: 4`, `insertSpaces: true`, `detectIndentation: false` (stubs are authored at 4 spaces, and spaces are Python-safe); `fontLigatures: false`; `wordWrap: 'off'`; `padding: { top: 8, bottom: 8 }`; `ariaLabel` such as "Code editor, Python 3. Tab indents; press Ctrl+M (macOS: Ctrl+Shift+M) to let Tab move focus."; reduced-motion options in §1.5 |
| Models and state | One model per problem and language, with saved view state and its own undo stack. With `@monaco-editor/react`: `<Editor path="problem-101/java" />` and keep `saveViewState` on. The slugs from `GET /api/languages` (`c`, `cpp`, `java`, `python`) are valid Monaco language IDs. Reset and Load into editor go through `executeEdits`, so Ctrl/Cmd+Z undoes them |
| Language support | These four languages are tokenizer-only: syntax colors, bracket matching, auto-close. No IntelliSense and no diagnostics; the wrapper's `onValidate` never fires for them. Do not promise live error checking in UI copy |
| Keyboard | Monaco captures Tab for indentation. The built-in escape is **Ctrl+M** (macOS: **Ctrl+Shift+M**), "Toggle Tab Key Moves Focus"; it is listed in the shortcuts dialog and in the editor's `ariaLabel`. Run and Submit are registered with `editor.addCommand`, so they fire while the editor has focus (this overrides Monaco's Ctrl+Enter, "insert line below", and Ctrl+Shift+Enter, "insert line above"); a Workspace-level listener covers focus elsewhere |
| Locked state | `readOnly: true`, `domReadOnly: true` and a `readOnlyMessage`, with a visible "locked" treatment rather than just a dimmed one |
| Delivery | Lazy-load Monaco on the Workspace route only, and render the problem pane first (statement-first). `@monaco-editor/react` fetches Monaco from a CDN by default; self-host it (`loader.config({ paths: { vs } })`, or bundle it with `loader.config({ monaco })`) so restrictive campus networks and a tight CSP do not break the editor. Only the base editor worker is needed for these languages. Prefetch the editor chunk on catalog-row hover or idle time, and reserve the editor's final size so mounting causes no layout shift. If Monaco has not loaded after 10 seconds, show the plain-text fallback of §4.4. Initial targets, to be re-baselined after the first measurements: statement visible within 2 s and editor interactive within 5 s on throttled "Fast 3G" |

## 6. Accessibility and Keyboard

### 6.1 WCAG 2.2 AA coverage

| Criterion | How the Workspace meets it |
|---|---|
| 1.4.1 Use of Color; 1.4.3 and 1.4.11 Contrast | The verdict grammar (§4.1); verified tokens and the CI contrast test (§1) |
| 1.4.4 Resize Text; 1.4.10 Reflow | `rem` sizing; the read-only statement reflows at 320 px. The compact tier (§3.3) keeps the editor usable at 200% zoom on a 1080p screen (a 960 px window) |
| 1.4.12 Text Spacing | `min-height`, never fixed heights, on text (§2) |
| 2.1.1 Keyboard; 2.1.2 No Keyboard Trap | Splitters and every control work by keyboard (§3.2); Monaco's Tab capture has the Ctrl+M escape, documented in the UI (§5) |
| 2.2.1 Timing Adjustable | The mock timer is essential (server deadline); toasts pause on hover and focus (§4.3). Accommodations: a support-email process (PRD §6.4) |
| 2.4.7 Focus Visible; 2.4.11 Focus Not Obscured | The focus ring on every control (§1.1); toasts sit bottom-right and are dismissible; sticky banners never cover the focused element |
| 2.5.7 Dragging Movements | Every drag has a single-pointer alternative (§3.2) |
| 2.5.8 Target Size (Minimum) | Controls are at least 24 × 24 px (toolbar buttons 32 px, 44 px on coarse pointers). Splitter handles are thinner, so they rely on the "equivalent control" exception: the collapse and maximize buttons |
| 4.1.3 Status Messages | One polite live region for judging and verdicts (§6.4); the timer is not live-announced |

### 6.2 Structure and focus

- **Landmarks**: `<header>` and `<main>`, with labeled regions "Problem", "Code editor" and "Results". **Skip links** ("Skip to problem / editor / results") appear on focus; Monaco captures Tab, so keyboard users need a fast way across regions. The problem title is the single `h1`.
- **Tabs** (left pane and results) follow the ARIA Authoring Practices tabs pattern: roving tabindex, arrow keys, panels labeled by their tab, selection follows focus.
- **Focus never moves by itself** after Run or Submit; it stays on the button or in the editor. It moves only on a user action: "Go to line" focuses the editor; a dialog traps focus and returns it to the trigger on close.
- **Dialogs** (auth gate, paywall, mock-start lobby or confirmation, Finish test, shortcuts): `role="dialog"`, `aria-modal="true"`, labeled, Esc closes. The timer-triggered "Time's up" is a `role="alertdialog"`; it may take focus because the editor is already locked.

### 6.3 Shortcuts

| Action | Windows / Linux | macOS | Notes |
|---|---|---|---|
| Run | Ctrl + Enter | Cmd + Enter | `aria-keyshortcuts` on the button; overrides Monaco's "insert line below" while the editor has focus |
| Submit | Ctrl + Shift + Enter | Cmd + Shift + Enter | The extra Shift guards the action that is saved and counted; overrides Monaco's "insert line above" |
| Let Tab move focus out of the editor | Ctrl + M | Ctrl + Shift + M | Monaco built-in toggle |
| Open problem search (§9.12) | Ctrl + K | Cmd + K | Global; replaces the reference's `/`, a single-character shortcut (WCAG 2.1.4). Not registered inside Monaco, where Ctrl + K is a chord prefix |

Shortcuts do nothing while Run/Submit is `aria-disabled`. There are no single-character shortcuts (WCAG 2.1.4). All are listed in the Settings dialog.

### 6.4 Live regions and copy

One visually hidden polite live region, owned by the Workspace, announces "Running your code…" and then exactly one sentence per outcome. Toasts and banners do not repeat it.

- "Run finished: 2 of 3 sample tests passed. First failure: test 2, wrong answer."
- "Accepted. Runtime 42 milliseconds."
- "Wrong answer on test 7."
- "Compile error: your code did not compile; no tests ran."
- "Judging error. This was not caused by your code."
- "Judging is taking longer than usual."
- "Connection lost. Reconnecting; your code is saved on this device."

Icons beside a text label are `aria-hidden`; icon-only buttons have accessible names.

### 6.5 Screen reader and high contrast

- Monaco in a browser cannot tell whether a screen reader is attached (its accessibility support is "unknown" there), so Settings has a **Screen reader mode** toggle that sets `accessibilitySupport: 'on'`, remembered per device.
- High contrast is automatic (§1.5).

### 6.6 Verification

- **Automated**: axe-core in CI over the Workspace states — idle, running, each verdict, the paywall dialog, mock-locked — with no serious or critical findings; plus the contrast test (§1.3).
- **Manual, each release**: a keyboard-only pass (Run, read the result, fix, Submit); an NVDA smoke test (Firefox or Chrome) and a VoiceOver (Safari) test of the verdict announcements; 200% zoom and a 960 px window; forced-colors; reduced-motion; a throttled network; a phone-size viewport for the fallback; latest Chrome, Edge, Firefox and Safari.

## 7. Future Scope

Not built in the MVP; each item needs its own entry gate before work starts.

| Item | Why not MVP | Gate to start |
|---|---|---|
| Compile-error locations: Monaco squiggles, gutter icons, clickable `line:col` Console entries, F8 / Shift+F8 stepping, stale-marker clearing, and a Runtime Error crash-line highlight | Judge0 returns raw compiler text, so locations need a tested parser, either in the backend (a structured `diagnostics` list in the submission response) or best-effort in the client | Console text proves insufficient in user feedback. Prefer the backend `diagnostics` list: one parser, and the backend knows whether it prepends wrapper lines |
| Light theme (user-toggleable) | Dark is the primary theme and the only one built; the Light tokens (§1.2) and syntax colors (§1.4) are already verified, so Light is a switch plus visual QA | First accessibility feedback (some users find light-on-dark text harder to read) |
| Reference features cut by the MVP filter (§0.3): Visualizer, per-problem Sources, Companies chip and filter, AI assistant rail and AI hints, AI whiteboard, curated lists, Export PDF, promo banner with coupons, notifications bell, live-chat bubble, OAuth buttons, drag-to-reorder dashboard sections | Each needs content, licensing or infrastructure the MVP does not have (LLM calls, a canvas editor, PDF rendering, coupons in checkout, a notification service, a chat vendor, OAuth) | Listed individually in [PRD.md](PRD.md) §8 |
| Custom test input (the reference's **+** on Test Cases) | `submission_test_results` rows reference a stored `test_cases` row, and a custom input has no expected output, so it needs a nullable test case, a stdin column and a "no verdict, output only" result path through the dispatcher | "I want to try my own input" is a top-3 request in feedback |
| SQL coding problems (the Data Science Coding tab), the Full Stack hub, AI hints and AI whiteboard, resume and application tracker, community notifications and rewards | Need another execution engine, an LLM vendor or more content types (§0.3) | [PRD.md](PRD.md) §8 |

## 8. Spacing, Radius, Elevation and Motion

### 8.1 Spacing

A 4 px grid. Tailwind's default spacing scale already matches it (`1` = 4 px); the measured reference values below are rounded onto it.

| Measured in the reference | Value | Token / Tailwind |
|---|---|---|
| Gutter between Workspace panes; gap inside tab strips | 8 px | `2` |
| Gap between tiles and cards in a grid | 12 px (dashboard), 16 px (topic grids) | `3`, `4` |
| Tile inner padding | 12 px × 14 px | `px-3.5 py-3` |
| Card and section inner padding | 20 px | `5` |
| App page padding (left/right) | 16 px; 24 px from 1280 px | `4`, `6` |
| Dashboard column gap (main ↔ side column) | 32 px | `8` |
| Landing section vertical rhythm | 128 px between sections, 48 px heading → content | `32`, `12` |
| List row padding | 16 px horizontal, row height 60 px | `px-4 h-[60px]` |

**Fixed dimensions**

| Element | Size |
|---|---|
| Top bar | 48 px tall |
| Sidebar | 240 px expanded, 56 px collapsed icon rail (§10.1) |
| Catalog topic sub-sidebar | 208 px |
| Workspace pane tab strip / editor toolbar / results footer | 40 / 44 / 56 px |
| Landing container | max 1200 px, centered |
| App content container | max 1376 px (dashboard), full width with 16–24 px padding (catalog, Workspace) |
| Dashboard side column | 296 px |
| Buttons | `sm` 28 px, `md` 32 px, `lg` 40 px, `xl` 56 px tall |
| Inputs and selects | 32 px (`lg` 40 px in dialogs) |
| Badges | 20 px tall, 8 px horizontal padding |
| Icons | 16 px in body and buttons, 14 px in badges, 20 px in the sidebar, stroke 1.75 |
| Avatar | 28 px circle (top bar), 80 px (profile) |
| Heatmap cell | 12 × 12 px, 3 px gap, 2 px radius |

### 8.2 Radius

| Token | Value | Used for |
|---|---|---|
| `radius-xs` | 4 px | Inline code chips, heatmap cells (2 px) |
| `radius-sm` | 6 px | Buttons, inputs, tiles, list containers, Workspace panes, dialogs, pricing cards, badges in lists |
| `radius-lg` | 16 px | Landing step cards, the landing product montage |
| `radius-full` | 9999 px | The top-bar **Sign in** button, the hero CTA, pills (difficulty and Premium badges in the Workspace, the "new" pill), avatars, the progress ring |

### 8.3 Elevation

The reference is flat: depth comes from the surface ladder (§1.1) and 1 px borders, not shadows.

| Level | Treatment | Used for |
|---|---|---|
| 0 | `bg-base`, no border | Page, shell |
| 1 | `bg-card` / `bg-section` + 1 px `border` | Cards, tiles, sections |
| 2 | `bg-surface` / `bg-row` | Workspace panes, list rows |
| Popover | `bg-input` + 1 px `border-row` + `0 8px 24px rgb(0 0 0 / 0.45)` | Menus, selects, tooltips, the search palette |
| Modal | `bg-base` + 1 px `border` + `0 24px 64px rgb(0 0 0 / 0.6)` over `bg-scrim` | Dialogs (auth, paywall, confirmations) |

- **Hover** moves a surface one step up the ladder (row `#262626` → `#2e2e2e`; tile `#212121` → `#262626`) and, on cards that are links, swaps the border to `border-hover`. No lift, no shadow.
- **Landing backdrop**: a faint 1 px grid (white at 3%, 32 px pitch) behind the hero and section headings, faded out with a radial mask; plus a soft `accent-emphasis` radial glow (20% opacity, 600 px radius) behind the featured pricing card and the step cards. Decorative: `aria-hidden`, and removed under `prefers-contrast: more`.
- Shadows are dropped in forced-colors mode (§1.5), which is why no state depends on one.

### 8.4 Motion

| Interaction | Duration / easing |
|---|---|
| Hover and press color changes | 120 ms ease-out |
| Accordion, disclosure, tab underline slide | 200 ms ease-out |
| Dialog and popover enter | 180 ms (opacity + 4 px translate); exit 120 ms |
| Toast enter / exit | 200 ms slide + fade from the bottom-right |
| Progress ring and topic progress bars | 400 ms ease-out on value change |

Under `prefers-reduced-motion: reduce` every row collapses to an opacity fade of at most 120 ms (§1.5).

## 9. Component Library

All components are React + Tailwind, icons from Lucide (`lucide-react`). Each is described once here; pages compose them (§10).

### 9.1 Buttons

| Variant | Rest | Hover / pressed | Disabled (`aria-disabled`) | Used for |
|---|---|---|---|---|
| **Primary** | `accent-emphasis` fill, `text-on-accent`, 500 | `accent-emphasis-hover` | 40% opacity plus the reason in a tooltip / `aria-describedby` | Sign in, Get started, Upgrade, Buy, Start test, Save |
| **Secondary (outlined)** | transparent, 1 px `border-strong`, `text-muted` label and icon | `bg-raised` fill, `text-primary` label | same | Run, Console, Cancel, filter buttons |
| **Success (outlined)** | transparent, 1 px `success` border, `success` label and icon | 12% `success` tint | same | **Submit** only |
| **Highlight** | `highlight` fill, `text-on-highlight` | 8% black overlay | same | The single featured-plan CTA |
| **Ghost** | no border, `text-muted` | `bg-raised`, `text-primary` | same | Toolbar icon buttons, "Reset", "View all" |
| **Link** | `accent`, underline on hover and always inside prose | – | – | Inline links, "View all sources" |
| **Destructive** | 1 px `error` border, `error` label | 12% `error` tint | same | Request account deletion |

- Sizes from §8.1; `md` (32 px) is the app default, `xl` (56 px, `radius-full`, 18 px / 600, trailing `ArrowRight`) only for the hero CTA.
- Loading: the label changes to the progress word ("Sending…", "Running…") with a 14 px spinner before it; width is fixed so the button does not jump.
- Icon-only buttons are at least 32 × 32 px (24 × 24 is the WCAG floor, 44 px on coarse pointers) and always have an accessible name and a tooltip.

### 9.2 Inputs, selects and choice controls

- **Text input**: 32 px, `bg-input`, 1 px `border-strong`, `radius-sm`, 12 px horizontal padding, `body` text, `text-muted` placeholder. Focus: `accent` 2 px ring (the border stays). Error: `error` border, an `AlertCircle` icon and the message below in `error` `meta`, linked by `aria-describedby`. A leading or trailing Lucide `Search` icon for search fields.
- **Select**: native `<select>` styled like the input with a `ChevronDown`; the language selector in the editor toolbar is the same at 28 px.
- **Checkbox / radio**: 16 px, 1 px `border-strong`, `radius-xs` (checkbox) or circle (radio); checked fills `accent-icon` with a `bg-base` check or dot. The 24 px hit area includes the label.
- **Segmented control**: a `bg-input` track with 1 px `border`; the selected segment is `bg-raised` (or `bg-chip` on `bg-surface`) with `text-primary`; others `text-muted`. Used for Overview / Code inside Solution, This week / All-time, Flat / Grouped.
- **Chips (selectable)**: one-tap segment chips at sign-up ("Student / Working professional / Other") and test-case chips: `bg-input` rest, `bg-chip` + `text-primary` selected, `aria-pressed`.

### 9.3 Tabs

- Underline tabs (pane tabs, page tabs, results tabs): 40 px strip, 14 px / 500 labels with a 16 px leading icon, 24 px gap. Active: `accent` label and a 2 px `accent` underline inset under the label; inactive: `text-muted`, hover `text-primary`. ARIA tabs pattern (§6.2).
- Tabs that carry counts show them as text ("Test Cases 2/3"), never only a dot.

### 9.4 Badges and pills

- **Difficulty**: §1.1 table; 20 px, `meta` 500, 8 px padding, 1 px border in the text color, `radius-full` in the Workspace header and `radius-sm` in list rows (as in the reference).
- **Premium**: `accent-emphasis` fill, white `meta` 600, `Lock` icon when it marks locked content. The word is always present.
- **Tag** (topics, "Free test", "Last used"): `accent-subtle` fill with `accent` text, or `bg-chip` with `text-secondary` for neutral tags.
- **Status chip** (verdicts in tables): status-color icon + label, no fill.

### 9.5 Cards, sections and the Premium card

- **Section**: `bg-section`, 1 px `border`, `radius-sm`, 20 px padding; a header row with the title (`h2-section`) and an optional trailing ghost action ("View all ›").
- **Stat card** (landing, profile): `bg-card`, 1 px `border`, label row (`meta`, `text-muted`, 16 px icon, trailing `ChevronRight` when it is a link) above a `stat` number. Numbers always come from the API; skeleton while loading.
- **Premium card**: `premium-surface`, 1 px `premium-border`, a Premium pill, title (`h2-section`), three `Check`-icon lines in `text-secondary` with `accent-icon` checks, and a full-width primary button.

### 9.6 Tiles

The reference's most repeated element (topics, companies, languages): `bg-card`, 1 px `border-subtle`, `radius-sm`, 12 × 14 px padding. Row one: a 16 px icon, the title (`body`, `text-primary`) and a trailing `ChevronRight` in `text-muted`. Row two: the count in `meta`, `text-muted` ("24 problems"); Semicolan adds a 2 px progress track (`bg-raised`, `accent-icon` fill) with "9 / 24 solved" when signed in. Hover: `bg-row` + `border-hover`. The whole tile is one link with an accessible name that includes the count.

### 9.7 List rows and grouped lists

- **Problem row**: 60 px, `bg-row`, 1 px `border-row` bottom divider, 16 px horizontal padding. Left: a status glyph (a `warning`-colored `Code2` for unsolved, a `success` `CircleCheck` for solved, an `accent-icon` `CircleDot` for attempted — each with a visually hidden label), then the title in `row-title`. Right, in order: topic tags (up to 2, `meta`), the difficulty badge, a **Premium** lock pill when locked, the bookmark toggle (`Bookmark` / `BookmarkCheck`, `aria-pressed`). Hover: `bg-raised`. The title is the link; the bookmark is a separate button.
- **Group header** (grouped view): a 60 px `bg-base` row inside the list container with the topic name (`row-title`), the count "(9 / 24)" in `text-muted` tabular numerals and a 200 px progress track, plus a `ChevronDown` disclosure. Expanded groups show their rows below; one group open by default (the first with unsolved problems).
- **Group label chip**: an `eyebrow` tab-shaped chip (`bg-inset`, 1 px `border`, top corners rounded) sitting on top of a list container to name it ("Arrays & Hashing").
- The container is `radius-sm` with 1 px `border`; rows clip to it.

### 9.8 Tables

Leaderboard, Submissions, billing receipts: `bg-surface` container, 40 px `bg-raised` header row (`meta` 500 `text-muted`, sortable headers are buttons with `aria-sort`), 48 px rows with `border-row` dividers, numerals right-aligned in `tabular-nums`. The viewer's own row on the leaderboard is pinned with a 3 px `accent` start border and `accent-subtle` fill.

### 9.9 Dialogs, drawers and toasts

- **Dialog**: max 480 px (auth, confirmations) or 720 px (paywall), `bg-base`, 1 px `border`, `radius-sm`, 32 px padding, centered over `bg-scrim`; title `h1-page` centered with the wordmark above it on the auth dialog (as in `signingPage.png`); close button top-right. Behavior in §6.2.
- **Drawer** (compact Workspace problem pane, mobile nav): slides from the start edge, `bg-surface`, focus trap, Esc closes.
- **Toasts**: §4.3 for behavior; visually `bg-input`, 1 px `border-row`, popover shadow, a 3 px status start border and icon, `body` text, close button.

### 9.10 Data display

- **Progress ring**: 32 px (catalog header) or 160 px (profile), 3 px `bg-raised` track, `accent-icon` arc; center label in `meta` ("12%") or, large, `stat` "42 / 120 Solved". `role="img"` with an `aria-label` that states the numbers.
- **Difficulty ring** (profile, from the reference): the 160 px ring split into Easy / Medium / Hard arcs in the three badge colors, plus three stacked `bg-raised` mini cards "Easy 12 / 40", "Medium 8 / 55", "Hard 2 / 25" — the numbers carry the meaning, the colors only echo them.
- **Activity heatmap** (dashboard, profile): 53 columns × 7 rows of 12 px cells for the last 365 days (IST days), month labels above in `meta`, Mon / Wed / Fri labels at the left. Empty cells `bg-raised`; active cells `accent-icon` at 25 / 50 / 75 / 100% by quartile of the user's own daily counts. Each cell has a tooltip "3 submissions on 12 Oct 2026"; the grid is `role="img"` with a summary ("142 submissions in the past year, 38 active days"), and a visually hidden table offers the same data. Below: "Current streak: 4 days · Longest streak: 11 days".
- **Progress bar**: 2 px (tiles) or 4 px (group headers) `bg-raised` track with an `accent-icon` fill; always next to a text count.

### 9.11 Empty, loading and error states

- **Empty**: a 48 px Lucide icon in `text-muted` inside a `bg-raised` circle, a `row-title` line and a `meta` hint with one action ("No submissions yet — Submit to see your history here."). The reference's illustrated "NULL" artwork is not reused.
- **Loading**: skeleton blocks in `bg-raised` with a 1.5 s opacity pulse (static under reduced motion) at the final dimensions, so nothing shifts.
- **Error**: an inline `bg-surface` card with an `AlertTriangle` in `error`, what failed in plain words and **Retry**. Never a blank region.

### 9.12 Search palette

Opened from the top-bar search field or Ctrl/Cmd + K: a 640 px popover dialog with a 40 px search input and up to 8 problem results (title, difficulty badge, lock), keyboard navigable (`combobox` + `listbox`), Enter opens the Workspace. It queries `GET /api/problems?q=` debounced by 200 ms. Empty query shows "Recent" (the last five problems opened on this device). The field label shows the shortcut as a `kbd` chip ("Ctrl K").

### 9.13 Theory rows (hubs)

As in `DevOpsQuestionsPageTheoryTab.png`: a list container (rounded-md, 1 px `border`) under a tab-shaped `eyebrow` section chip ("Modules & Plugins"). Each question is a row on `bg-row` with a `border-row` divider: the question in `row-title` `text-primary` (inline code as `bg-code-accent` chips with `code-accent` text), and on the right the difficulty badge, a bookmark toggle (`Bookmark`) and a learned check (`CircleCheck`), or a `Lock` for a locked row. The row is a disclosure (`aria-expanded`): open, it shows the answer in `prose` `text-secondary` (the reference uses `text-muted`; `text-secondary` reads better at length, both pass), then a divider and a **Sources · 13** toggle that reveals a wrap of source chips (`bg-source-chip`, 1 px `border`, 12 px `source-chip-text`, a 12 px `Globe` icon, a trailing `ExternalLink`; each opens in a new tab with `rel="noopener noreferrer"`). A two-button segmented control (expand all / collapse all) sits at the top right.

### 9.14 Quiz level cards and the quiz runner

- **Level card** (`DevOpsQuestionsPageQuizTab.png`): `bg-input`, 1 px `border-subtle`, `radius-sm`, 16 px padding, 4 per row (2 / 1 on smaller screens); the level name 16/500 `text-primary` and a `CircleCheck` when the user has completed it, "36 Qs" in `meta` `text-muted` bottom-right, and the best score "30 / 36" when there is one; Premium lock on locked levels. **Attempts** below: a dashed 1 px `border` empty state, or a table of attempts.
- **Runner** (`DevOpsQuestionsPageQuizTabQuestionsView.png`): a back `IconButton` (round, `bg-raised`), the topic title 24/500, a "7 / 36" counter (`meta`), and a full-width 2 px progress bar (`bg-surface` track, `accent-icon` fill) under the header. The question card is `bg-input` with 32 px padding; prompt 18/500 `text-primary`; "Select the correct answer" 14/500 `text-secondary`; options in a two-column grid with 24 px gaps, each a 56 px button with 1 px `border-strong` (the reference's `#3b3a3a` fails 3:1), `radius-sm`, the number in `text-muted` and the option in 16 px `text-secondary`. Hover `bg-raised`. After answering: the chosen option gets a 1 px status border, a 12% status tint, an icon and the word "Correct" / "Incorrect"; the correct option is marked "Correct answer"; the explanation appears in a `bg-surface` panel with **Next question** (primary). **Don't know** is a secondary button bottom-right. The reference's "Get AI Hint" button is not rendered.

### 9.15 Design question cards and the design viewer

- **Guide banner** (`systemDesignPage.png`): full width, `premium-surface` with a 1 px `premium-border` (measured `#211e24` / `#60477b`, within 3 per channel of those tokens), 56 px tall, a 32 px round wordmark glyph, 16 px `text-primary` title and a trailing `ChevronRight`.
- **Question card**: a two-column grid, 16 px gap; `bg-input`, 1 px `border-subtle`, `radius-sm`, 16 px padding; row 1 a 24 px icon tile (1 px `border`, a colored Lucide icon) + title 15/500 `text-primary` + `ChevronRight`; row 2 the meta "Statement · Editorial · Quiz" in `eyebrow` `text-muted` and, at the right, bookmark and done icons or a `Lock`. Hover `bg-row` + `border-hover`.
- **Viewer**: the Workspace's two-pane layout (§3) with the right pane replaced by **My answer**: a Markdown notepad (§9.20) with a status line ("Saved · 2 min ago"). Editorial sections render Mermaid diagrams as SVG on `bg-surface` in a bordered figure with a caption and a "View diagram source" disclosure as the text alternative; LLD code uses the editorial code block (§3.1 Solution).

### 9.16 Company pages

- **Monogram**: a 24 px (list) or 40 px (header) `radius-sm` square, `accent-subtle` with the company's initial in `accent` 600. One style for every company — no logos, no brand colors.
- **Company sidebar** (`companyWiseQuestionsPageOverviewTab.png`): 200 px, `bg-base`, a collapse button, "‹ All companies", a search input, then 32 px rows (16 px monogram + 13 px name in `text-muted`); the current company is `bg-raised` + `text-primary`. Scrolls on its own.
- **Header**: the company name `h1-page` with an info tooltip ("Questions are tagged from published interview experiences"), a search field, then underline tabs Overview · Coding · System Design · Low-Level Design · Experiences. The Overview article uses `prose` at 18 px for this long-form page, a `banner-gradient` header band (the company monogram and name in white — not co-branded artwork), a breadcrumb in `meta`, and a right-hand "On this page" table of contents (1 px `border` start rail, 14 px `text-muted` links, the current section in `accent`).
- **Locked preview** (`CompanyWiseQuestionPageProbleTab.png`): below the visible rows, 8 placeholder rows rendered as `bg-raised` bars under a 6 px blur, `aria-hidden`, with a centered primary button "Sign in to see all {n} questions" and a `meta` line "Sourced from published interview experiences". The withheld rows are not in the DOM.

### 9.17 Community

- **Post card** (`communityPage.png`): flat — `bg-base` with a 1 px `border-subtle`, `radius-sm`, 20 px padding, 16 px between cards. Row 1: monogram + company name 15/600 `text-strong` · level · role in 14 px `text-muted`, and a `ChevronRight` at the end. Title 18/700 `text-strong`. Excerpt two lines of 15 px `text-muted`. Meta "By {name} · Published {date}" 13 px `text-muted`. Footer: two 32 px pills (transparent, 1 px `border-subtle`, `radius-sm`) — `ArrowBigUp` + count (pressed: `accent` icon and border, `aria-pressed`) and `MessageSquare` + count. The whole card is a link; the vote pill is its own button.
- **Right column** (296 px, sticky): a full-width primary button "Share your experience" with a `CirclePlus`, a 12 px `text-muted` note "Experiences are reviewed within 24 hours", then **Filter**: Sort as a radio group, Level as checkboxes with right-aligned counts, Company as a search input (`bg-raised`, measured `#2c2b2b`) with checkbox rows (monogram + name + count).
- **Post page**: max 760 px column; title `h1-page`; meta row; the body in `prose`; action row (vote, copy link, report, author's edit/delete); comments as a thread with 32 px initial avatars, one level of indentation (24 px with a 1 px `border` rail), and a composer.
- **Composer**: the §9.20 editor plus the experience fields (company combobox, level select, role input, outcome segmented control) and a `bg-raised` guidelines card.
- **Moderation queue**: a table (§9.8) with the item, its reports' reasons as tags, age, and row actions.
- **Status chips** for the author: "Pending review" (`info` `Clock`), "Rejected" (`error` `CircleX` + the note), "Hidden by moderators" (`warning` `EyeOff`).

### 9.18 Project cards

`projectPage.png`: a three-column grid (2 / 1 on smaller screens), 16 px gap. Card: `bg-card`, 1 px `project-border`, `radius-sm`, overflow hidden; a 16:9 cover image (static asset; `alt` = the project title) on a violet base (`#26152c` measured at the bottom of the cover); body 16 px padding: title 22/500 `text-strong`, summary 15 px `text-muted` (two lines), then a row of tech-stack chips (`bg-source-chip`, 12 px). A Premium lock pill over the cover's top-right corner when locked. Hover: border `border-hover`.

### 9.19 Sign-in dialog with OAuth buttons

`signingPage.png`: a 480 px dialog (`bg-base`, 1 px `border`, modal shadow, 40 px padding) over `bg-scrim`; centered a 56 px wordmark glyph, the title "Sign in" (24/500 `text-strong`) and a 16 px `text-secondary` reason line ("Sign in to run your code — it stays in the editor"). Two full-width 40 px provider buttons, 12 px apart: `bg-input`, 1 px `border-strong` (the reference's `#3b3a3a` fails 3:1), `radius-sm`, the provider mark at 20 px on the left (the official Google "G" and GitHub mark, as the providers' sign-in branding guidelines require) and the label centered in 16/500 `text-primary`: "Continue with Google", "Continue with GitHub". The provider used last on this device gets a 1 px `accent-emphasis` border and a "Last used" tag (`accent-emphasis-hover` fill, white 11/600, `radius-full`) overlapping its top-right corner. Below, 12 px `text-muted`: "By continuing you agree to the Terms and Privacy Policy" with links. States: waiting ("Waiting for Google…", spinner, Cancel), error banner (12% `error` tint, the App_Flow §1 messages), and, in development, a small `bg-raised` "Development sign-in" badge above the buttons. The onboarding step replaces the buttons in the same dialog (title "Welcome to Semicolan", the fields of App_Flow §1 step 5, primary **Continue**).

### 9.20 Markdown editor

For community posts, comments and design notes: a `bg-input` field with 1 px `border-strong`; a 36 px toolbar (`bg-raised`) with Write / Preview tabs and icon buttons (Heading, Bold, Code, List, Link, Table — each inserting Markdown); a monospace `textarea` (14/22, auto-growing up to 60 vh) in Write; the sanitized render in Preview. A character counter in `meta` turns `warning` at 90% and `error` at the limit. No image button.

## 10. App Shell and Page Layouts

### 10.1 App shell (signed-in pages and the public catalog)

```
┌────────────────┬───────────────────────────────────────────────────────────┐
│ ; Semicolan  ⇤ │                     [Search problems  Ctrl K] [Avatar ▾]  │ 48 px top bar
│────────────────│───────────────────────────────────────────────────────────│
│ PRACTICE       │                                                           │
│ ⌂ Home         │                                                           │
│ </> Problems   │                     page content                          │
│ ⏱ Mock Tests   │                                                           │
│ 🏆 Leaderboard │                                                           │
│ INTERVIEW      │                                                           │
│ ▣ System Design│                                                           │
│ ▦ Low-Level    │                                                           │
│ DOMAINS        │                                                           │
│ ∞ DevOps       │                                                           │
│ ⌁ Data Science │                                                           │
│ CAREER         │                                                           │
│ ▤ Companies    │                                                           │
│ ▥ Projects     │                                                           │
│ ⚡ Upgrade      │                                                           │
│ ⋯              │                                                           │
│ 👥 Community   │                                                           │
│ [S] Name ▾     │                                                           │
└────────────────┴───────────────────────────────────────────────────────────┘
```

- **Sidebar** (`lobbyPageLeftPanal.png`; `bg-base`, 1 px `border-subtle` end border; 240 px, collapsible to a 56 px icon rail with tooltips and dividers between groups; the choice is remembered on the device): the wordmark and a collapse button (`PanelLeftClose`); then groups with `eyebrow` headings in `text-muted` — **Practice**: Home (`House`), Problems (`Code2`), Mock Tests (`Timer`), Leaderboard (`Trophy`); **Interview skills**: System Design (`Boxes`), Low-Level Design (`Blocks`); **Domains**: DevOps (`Infinity`), Data Science (`ChartLine`); **Career**: Companies (`Building2`), Projects (`BriefcaseBusiness`). Rows are 36 px with 20 px icons and `body` labels in `text-muted`; the active item is `bg-raised` with `text-primary` and an `accent` icon, `aria-current="page"`. Then **Upgrade** (`Zap`, hidden for Premium users, who see "Premium until 12 Dec" in `meta` instead). Pinned to the bottom: **Community** (`Users`), **Blog** (`Newspaper`), **Admin** (`ShieldCheck`, admins only; opens the admin panel of §10.4, which holds the moderation queue), and the account button (avatar + display name) opening a menu with Profile, Settings, Billing, Log out.
- **Top bar** (48 px, `bg-base`, 1 px `border-subtle` bottom border): search field (240 px, opens §9.12); a "Test in progress — 41:12 left — Resume" chip when a mock test runs (App_Flow §3.3); for visitors, a single **Sign in** (primary, `radius-full`, as in the reference) that opens §9.19, instead of the avatar. The notifications bell of the reference is Future Scope and is not rendered.
- **Banners** (Premium expiring, confirming payment, test in progress, offline) sit in flow between the top bar and the content, never over it (§4.4, §4.5).
- Below 768 px the sidebar becomes a drawer behind a `Menu` button in the top bar.
- The **Workspace** does not use the shell: it is full-bleed under its own 48 px header (§3), so the editor gets the width.

### 10.2 Marketing pages (landing, pricing)

No sidebar. A sticky 64 px top nav: the wordmark, links (Products ▾ — a menu of the modules — How it works, Community, Pricing; in-page anchors where they exist), and on the right a search field and **Sign in** (primary, `radius-full`), which opens the sign-in dialog (§9.19). Content in the 1200 px container; footer with four columns (brand + support email, Product links, Legal: Terms, Privacy, Refund policy; and the copyright line). Section order and copy direction are in [UI_Generation_Prompts.md](UI_Generation_Prompts.md) prompt 1.

### 10.3 Page inventory

Each MVP page, its layout, and where its behavior is specified. The generator prompts follow the same numbering.

| # | Page | Route | Layout | Behavior spec |
|---|---|---|---|---|
| 1 | Landing | `/` | Marketing (§10.2) | App_Flow §1 |
| 2 | Sign-in dialog (Google / GitHub), onboarding step, `/auth/complete` | dialog; `/auth/complete`; dev only: `/dev/mock-oauth`, `/dev/mock-checkout`, `/dev/gallery` (every primitive in every state) | Dialog (§9.19); centered card for `/auth/complete` | App_Flow §1, §15 |
| 3 | Home dashboard | `/home` | Shell, two columns (main + 296 px side) | App_Flow §7 |
| 4 | Problem catalog | `/problems`, `/problems?topic=…` | Shell + 208 px topic sub-sidebar | App_Flow §2.1 |
| 5 | Coding Workspace | `/problems/{slug}` | Full-bleed three-pane (§3) | App_Flow §2 |
| 6 | Mock tests list and lobby | `/mock-tests`, `/mock-tests/{id}` | Shell, card grid; lobby is a centered 720 px card | App_Flow §3.1 |
| 7 | Mock test runner and report | `/mock-tests/sessions/{id}`, `…/report` | Workspace + test header (§4.5); report in the shell | App_Flow §3.2–3.4 |
| 8 | Leaderboard | `/leaderboard` | Shell, table + 296 px "me" panel | App_Flow §5 |
| 9 | Pricing, paywall dialog, payment confirming | `/pricing`, dialog, `/checkout/confirm?orderId=` | Marketing or shell; dialog | App_Flow §4 |
| 10 | Profile and account settings, billing, connected accounts | `/profile`, `/settings`, `/settings/billing`, `/settings/accounts` | Shell: profile is a 320 px identity column + main; settings uses left tabs | App_Flow §8 |
| 11 | DevOps and Data Science hubs: topic grid, topic page (Theory, Quiz), quiz runner and result | `/devops`, `/data-science`, `/{hub}/{topic}`, `/quiz/{attemptId}` | Shell; tile grid; full-width topic page with tabs | App_Flow §10 |
| 12 | System Design and LLD: list and viewer | `/design/hld`, `/design/lld`, `/design/{kind}/{slug}` | Shell list; viewer full-bleed two-pane | App_Flow §11 |
| 13 | Companies: directory and company page | `/companies`, `/companies/{slug}` | Shell; company page with a 200 px company sidebar | App_Flow §12 |
| 14 | Projects: list and detail | `/projects`, `/projects/{slug}` | Shell; card grid; detail in a 960 px column | App_Flow §13 |
| 15 | Community: feed, post, composer, my posts, moderation queue | `/community`, `/community/posts/{id}`, `/community/new`, `/community/mine`, `/admin/moderation` (inside the admin shell, §10.4) | Shell; feed column (max 720 px) + 296 px filter column | App_Flow §14 |
| 16 | Blog: list and article | `/blog`, `/blog/{slug}` | Marketing nav for visitors, shell when signed in; list in a 960 px column of cards; article in a 720 px reading column | App_Flow §17 |
| 17 | Admin panel: overview, content tables and editors, review queue and review screen, moderation, users, audit log | `/admin`, `/admin/{collection}`, `/admin/{collection}/{id}`, `/admin/revisions/{id}`, `/admin/review`, `/admin/moderation`, `/admin/users`, `/admin/users/{id}`, `/admin/audit` | Admin shell (§10.4) | App_Flow §18; [Admin_Panel_Strategy.md](Admin_Panel_Strategy.md) §1 |

### 10.4 Admin shell

The admin panel ([Admin_Panel_Strategy.md](Admin_Panel_Strategy.md) §1) uses this brief's tokens, type scale and components unchanged; it adds no colors. Its shell replaces the product sidebar with an admin sidebar of the same metrics (240 px, `bg-base`, grouped **Content**, **Workflow** and **People**, with count badges on Review queue and Moderation) and keeps the 48 px top bar, which carries an environment badge as its first element — an `error`-outlined pill reading `PRODUCTION` in production and a neutral pill elsewhere — plus content search and **View site**. Tables use §9.8 with server-side pagination; editors use the Markdown editor of §9.20 (with image buttons still absent) and Monaco with the §1.4 theme; the review diff marks added and removed lines with `+` / `−` markers and a 2 px `success` / `error` start border, never color alone. Desktop-class only: below 1024 px the panel shows a notice instead of a squeezed layout.
