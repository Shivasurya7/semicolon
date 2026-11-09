# UI Generation Prompts — Semicolan

Copy-paste prompts for an AI UI generator (Google Stitch, v0 or similar) that produce the React + Tailwind front end of the MVP. They put [UI_UX_Brief.md](UI_UX_Brief.md) into a form a generator can follow; when a prompt and the brief disagree, the brief wins.

## How many pages, and why these

The MVP has **15 core pages** plus one foundation step. The count comes from the scope filter in UI_UX_Brief §0.3: the 39 reference screenshots cover 22 distinct screens, and after the scope expansion 21 of them ship (only the Full Stack hub and the SQL coding tab stay Future); they fold into the 15 pages below. Pages the PRD needs that have no screenshot (mock tests, leaderboard) reuse the same components. Prompts 11–15 cover the modules brought into the MVP; Prompt 2 is the sign-in screen with the Google and GitHub buttons.

| # | Prompt | Route(s) | Behavior spec |
|---|---|---|---|
| 0 | Foundation: tokens, Tailwind theme, app shell, search palette | – | UI_UX_Brief §1, §2, §8, §9, §10.1 |
| 1 | Landing page | `/` | App_Flow §1 |
| 2 | Sign-in with Google / GitHub, onboarding, mock provider page (dev) | dialog, `/auth/complete`, `/dev/mock-oauth` | App_Flow §1, §15 |
| 3 | Home dashboard | `/home` | App_Flow §7 |
| 4 | Problem catalog | `/problems` | App_Flow §2.1 |
| 5 | Coding Workspace (5A layout and problem pane, 5B editor and results) | `/problems/{slug}` | App_Flow §2, UI_UX_Brief §3–§5 |
| 6 | Mock tests list and lobby | `/mock-tests`, `/mock-tests/{id}` | App_Flow §3.1 |
| 7 | Mock test runner header and report | `/mock-tests/sessions/{id}`, `…/report` | App_Flow §3.2–3.4 |
| 8 | Leaderboard | `/leaderboard` | App_Flow §5 |
| 9 | Pricing, paywall dialog, payment confirming | `/pricing`, dialog, `/checkout/confirm` | App_Flow §4 |
| 10 | Profile and account settings (with billing and connected accounts) | `/profile`, `/settings` | App_Flow §8 |
| 11 | DevOps and Data Science hubs: topic grid, Theory and Quiz tabs, quiz runner | `/devops`, `/data-science`, `/{hub}/{topic}`, `/quiz/{attemptId}` | App_Flow §10 |
| 12 | System Design and LLD: list and viewer | `/design/hld`, `/design/lld`, `/design/{kind}/{slug}` | App_Flow §11 |
| 13 | Companies: directory and company page | `/companies`, `/companies/{slug}` | App_Flow §12 |
| 14 | Community: feed, post, composer, moderation queue | `/community`, `/community/posts/{id}`, `/community/new`, `/admin/moderation` | App_Flow §14 |
| 15 | Projects: list and detail | `/projects`, `/projects/{slug}` | App_Flow §13 |

The blog (`/blog`, App_Flow §17) and the admin panel (`/admin/*`, App_Flow §18, UI_UX_Brief §10.4) have no generator prompt: they are built by hand from the existing components (Markdown renderer, tables, editors), following [Admin_Panel_Strategy.md](Admin_Panel_Strategy.md) §1.

## How to use these prompts

1. Run **Prompt 0 first** in a fresh project and keep its output (`globals.css`, `tailwind.config.ts`, the shell and primitives). Then run one page prompt per generation, in order. Prompt 5 is split into 5A and 5B because the Workspace is too large for one pass.
2. Every prompt repeats the **shared block** (stack rules, tokens, type, shape, component styles), because a generator only sees the prompt in front of it. Paste each prompt whole; don't trim the shared block.
3. The prompts ask for **presentational components only**: data comes in through typed props, actions go out through callback props, and preview data lives in a separate `*.fixtures.ts` file. Wiring to the API ([API_Contract.md](API_Contract.md)), Monaco, polling, autosave, the OAuth popup and auth stays in hand-written code, where the brief's rules on idempotency, timers and resilience can be met.
4. After each generation, check against the brief: no raw hex in components, focus ring visible, every status has an icon and a label, the contrast test (UI_UX_Brief §1.3) passes.

---

## Prompt 0 — Foundation: design tokens, Tailwind theme, app shell

```text
Build the design foundation and app shell for "Semicolan", a coding-practice and mock-test web app for students preparing for campus placements. Output: globals.css, tailwind.config.ts, and React components AppShell, Sidebar, TopBar, SearchPalette, Wordmark, plus primitives Button, IconButton, Input, Select, Checkbox, Radio, SegmentedControl, Tabs, Badge, DifficultyBadge, Tile, Section, ProgressBar, ProgressRing, Skeleton, EmptyState, ErrorState, Toast, Dialog, Tooltip. Include a /dev/gallery page that renders every primitive in every state (development builds only; never linked from the sidebar).

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
1. globals.css: every token above as a CSS variable under :root and [data-theme="light"]; body uses bg-base and text-primary; Inter and Fira Code via @font-face placeholders pointing at /fonts/*.woff2 (self-hosted, font-display: swap). tailwind.config.ts maps the variables to color names (base, section, card, input, inset, row, surface, raised, chip, ...), the type scale to fontSize entries (display, h1-marketing, ..., code-sm), radius (xs 4px, sm 6px, lg 16px) and the two shadows (popover, modal).
2. AppShell layout:
   - Left Sidebar, 240px, bg-base, 1px border-subtle right edge, collapsible to a 56px icon rail (collapse button with PanelLeftClose / PanelLeftOpen at the top-right of the sidebar; tooltips show labels when collapsed). Top: Wordmark. Nav groups with 11px/500 uppercase-tracked group labels in text-muted (as in the reference sidebar): PRACTICE — Home (House), Problems (Code2), Mock Tests (Timer), Leaderboard (Trophy); INTERVIEW SKILLS — System Design (Boxes), Low-Level Design (Blocks); DOMAINS — DevOps (Infinity), Data Science (ChartLine); CAREER — Companies (Building2), Projects (BriefcaseBusiness). Items are 36px tall, 20px icon + 14px label, text-muted. Active item: bg-raised, text-primary label, accent icon, aria-current="page". Then "Upgrade" (Zap icon) shown only when prop isPremium is false; when true show "Premium until {date}" in 12px text-muted. Pinned to the bottom: Community (Users), Blog (Newspaper), Admin (ShieldCheck; only when prop isAdmin; links to /admin), then the account button (28px round avatar with the initial on a generated color + display name), opening a menu with Profile, Settings, Billing, Log out.
   - TopBar, 48px, bg-base, 1px border-subtle bottom: a search field (240px, Search icon, placeholder "Search problems", trailing kbd chip "Ctrl K") that opens SearchPalette; optional chip "Test in progress — {mm:ss} left — Resume" (warning Clock icon, bg-raised, rounded-full) when prop activeTest is set; at the right either the avatar (signed in) or a single "Sign in" (primary, rounded-full, h-8) for visitors that calls onSignIn.
   - An in-flow banner slot between top bar and content (for onboarding-pending / expiring-Premium / offline banners; banners never overlay content): bg-raised, 40px, info or warning icon + text + action + dismiss.
   - Content area: main landmark, padding 16px (24px ≥1280px).
   - Below 768px: sidebar becomes a drawer opened by a Menu button in the top bar.
3. SearchPalette: a 640px dialog near the top (popover shadow, bg-input, 1px border-row, rounded-md), 40px input with Search icon, a listbox of up to 8 results (title 14 text-primary, DifficultyBadge, Lock + "Premium" when locked), arrow keys move, Enter selects (onSelect(slug)), Esc closes. Empty query shows a "Recent" list from props. No results: "No problems match “{q}”". Props: open, query, results, recent, loading, onQueryChange, onSelect, onClose.
4. Toast stack: bottom-right, 16px inset, max 3; bg-input, 1px border-row, popover shadow, 3px left border + icon in the status color, 14px text, close button; role="status" (or "alert" for errors).
5. Dialog: centered over the scrim, bg-base, 1px border, rounded-md, 32px padding, max-width 480px (sm) or 720px (lg), close X top-right, title h1-page.
6. /dev/gallery: every primitive in rest / hover / focus / disabled / loading / error states, dark theme only (light is Future Scope, UI_UX_Brief §1.2). Development builds only, never in the sidebar.
```

---

## Prompt 1 — Landing page

```text
Build the public landing page for "Semicolan", an affordable coding-practice and mock-test platform for students preparing for campus placements in India. Marketing layout, no sidebar. React + Tailwind + lucide-react. Presentational: all numbers, plans and FAQs come from props.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
Layout: full-width bg-base page; content in a centered 1200px container (16px side padding on small screens). Behind the hero and each section heading, a decorative aria-hidden backdrop: a 1px grid of white at 3% opacity on a 32px pitch, faded out with a radial mask, plus a soft accent-emphasis radial glow (20% opacity, ~600px) behind the pricing and steps sections. Sections are 128px apart; heading to content 48px.

1. Sticky top nav, 64px, bg-base with 1px border-subtle bottom when scrolled. Left: Wordmark. Center-left links (16px, text-primary, hover accent): "Products" with a ChevronDown opening a menu of the modules (Problems, Mock tests, System Design, Low-Level Design, DevOps, Data Science, Companies, Projects — icon + name + one-line description each), How it works, Community, Pricing. Right: a search field (bg-input, 1px border-strong, rounded-md, Search icon, kbd chip "Ctrl K") and "Sign in" (primary, rounded-full, h-9) → onSignIn. Below 768px the links collapse into a Menu drawer.
2. Hero, two columns (55/45; stacks below 1024px):
   - Left: a pill tag (bg-raised, 1px border, rounded-full, 13px text-primary, trailing ArrowRight) "{problemCount} problems · C, C++, Java, Python 3". Headline in display 72px/700 text-strong (48px below 768px): "Crack your placement coding round." Sub-copy in lead 20px text-secondary, max 560px: "Practice in a real in-browser IDE, rehearse timed mock tests, and see where you stand — priced for students, in rupees." Buttons: primary hero CTA (h-14, rounded-full, 18/600, ArrowRight) "Try a problem now" → onTryProblem; secondary outlined h-14 rounded-full "Browse problems" → onBrowse. A meta line under them in text-muted 14px: "Free to start · No card needed".
   - Right: a product montage slot `heroVisual: ReactNode` rendered inside a frame that imitates the app: rounded-lg (16px), 1px border, bg-surface, a 40px bg-raised strip with three tabs "Description · Solution · Submissions" (Description active in accent) on the left half and a "Python ▾" select on the right half; below, a two-column mock of problem text (prose lines as skeleton bars in bg-chip) and code lines in monospace with the --syn-* colors on bg-surface, and at the bottom-right "▷ Run" (secondary) and "Submit" (success-outline). Slight overlap of a second smaller card showing a verdict banner "Accepted · 42 ms" (12% success tint, CircleCheck). Decorative: aria-hidden, with a text alternative for the frame.
3. Stats row ("What's inside"): a centered 22px/700 text-strong heading "Everything you need for the coding round", then a 4-column grid (2 columns below 768px, 1 below 480px) of stat cards: bg-card, 1px border, rounded-md, 24px padding, centered; label row = 16px icon + 14px text-secondary label + ChevronRight when linked; number in stat 30px/500 text-strong tabular. Cards: Problems (Code2) {problemCount}, System & low-level design (Boxes) {designCount}, Companies (Building2) {companyCount}, Theory & quizzes (BookOpen) {theoryCount}. Above the cards, a row of eight outlined module chips (bg-base, 1px border, rounded-md, 16px icon + 14px label): Data Structures & Algorithms, System Design, Low-Level Design, DevOps, Data Science, Company prep, Projects, Community — each a link. Counts come from props; while loading show skeleton numbers; if a count is unavailable, hide that card (never invent a number).
4. Problem section: h1-marketing 48px "Placement prep shouldn't feel like guesswork" + h2-marketing 30px text-primary sub "Most students hit the same walls." Then a 2-column list (1 column below 768px) of six items, each an error-colored CircleAlert icon (20px) + body-lg 18px text-secondary: "Problem sets built for interviews abroad, not campus rounds", "Prices in dollars that a student budget can't stretch to", "No way to rehearse a timed test before the real one", "Not knowing which topics you're weakest in", "Practising alone with no sense of where you stand", "Wrong answers with no clue what went wrong". Row gap 32px.
5. Walkthrough ("How Semicolan helps"): a heading h1-marketing "One place to practise, test and improve" with body-lg text-muted sub. Then three alternating feature rows (text left / visual right, then swapped), each: an accent-icon 24px icon, h2 36px/700 text-strong title, body-lg text-secondary paragraph, a primary button and an optional "See also" line of accent links; the visual is a slot (ReactNode) in the same app frame as the hero.
   a. Code2 — "Solve in a real IDE": "Write C, C++, Java or Python 3 in a full editor. Run the sample tests, then submit against every hidden test and get a clear verdict." Button "Start with Arrays".
   b. Timer — "Rehearse under time pressure": "Timed mock tests with a server-side clock, a final report and per-problem verdicts — the closest thing to the real round." Button "See mock tests".
   c. Trophy — "See where you stand": "Earn difficulty-weighted points for every first solve and track your weekly rank." Button "View leaderboard".
   A thin vertical 1px border line with a small dot runs down the left of this section on ≥1024px (decorative).
6. How it works (id="how-it-works"): h1-marketing "Four steps to your first verdict" + 18px text-muted sub "Start free in under a minute." Then a 4-column grid (2 / 1 on smaller screens) of step cards: rounded-lg (16px), 1px border, background linear-gradient(180deg, var(--bg-card), var(--premium-surface)), 32px padding, min-height 296px; a 56px circle in step-badge with the number (20/700, its text color); title 20/700 text-strong ("Sign up free", "Pick a topic", "Solve and submit", "Take a mock test"); body 16/1.6 text-muted description. Hover/focus-within: border becomes border-hover.
7. Pricing (id="pricing"): h1-marketing "Simple prices, in rupees" + 18px text-secondary sub "One-time payment. No auto-renewal. Extend any time." Grid of plan cards from props `plans: {code, name, durationDays, pricePaise, currency, isFeatured}` plus a static Free card first. Card: bg-card, 1px border, rounded-md, 24px padding; plan name 20/400 text-muted; price as "₹{rupees}" in 30px text-strong tabular + " / {duration}" in 16px text-secondary; a 12px text-muted line "Billed once · access for {durationDays} days"; feature list with accent-icon Check icons and 16px text-secondary: Free = "40+ free problems", "Full IDE with Run and Submit", "Weekly leaderboard", "1 free mock test". Premium = "Every problem in the catalog", "Unlimited mock tests with reports", "Editorial solutions for every problem", "All of Free". Full-width CTA at the bottom: primary "Get Premium" (or "Start free" ghost-outlined on the Free card). The single featured plan (isFeatured) uses background plan-featured, a 1px premium-border, a small tag pinned to the top-right edge ("Best value", success text + 1px success border on bg-base, 12px) and a highlight CTA (bg highlight, text-on-highlight). Below the grid, 14px text-muted: "Pay with UPI, cards or netbanking via Razorpay · 7-day refund if you haven't started a mock test — Refund policy" (link). Prices: render from pricePaise / 100 with Intl.NumberFormat('en-IN'). No strike-through prices, no coupons, no payment logos.
8. FAQ (id="faq"): heading 30px/500 text-strong "Frequently asked questions"; an accordion of items from props (question + answer). Each row: 64px, 16px text-muted question, ChevronDown at the right that rotates when open, 1px border bottom; answer in 16/1.6 text-secondary, max 720px. Use <button aria-expanded> + region. Fixture questions: "Is there a free plan?", "Does Premium renew automatically?", "What is the refund policy?", "Which languages can I code in?", "Can I practise on my phone?", "How do mock tests work?", "Which payment methods do you accept?".
9. Footer: 1px border top, 64px top padding, 4 columns (stack on mobile): Brand (Wordmark, 14px text-secondary tagline "Placement prep, priced for students", support email link, "© {year} Semicolan"), Product (Problems, Mock tests, Leaderboard, Pricing), Legal (Terms, Privacy, Refund policy), Account (Sign in, Pricing). Column headings 12px/600 uppercase tracking 0.04em text-strong; links 14px text-secondary, hover text-primary.

Props: problemCount?, designCount?, companyCount?, theoryCount?, plans, faqs, heroVisual, walkthroughVisuals[3], onTryProblem, onBrowse, onSignIn, onChoosePlan(code), year.
Do not add: company logos, user counts, avatar rows, testimonials, star ratings, "as seen on", live chat bubble, cookie banner, newsletter signup.
```

---

## Prompt 2 — Sign-in with Google and GitHub (OAuth), onboarding, mock provider page

```text
Build the sign-in UI for "Semicolan": (A) a SignInDialog modal with "Continue with Google" and "Continue with GitHub" that opens over any page (including the code editor, which must stay visible behind it), with a second step for onboarding new accounts; (B) the /auth/complete page that finishes a sign-in; (C) a development-only MockProviderPage that lists test users. There is no email/password form anywhere. Layout and colors follow the reference sign-in modal (a dark centered card over a dimmed page, two full-width outlined provider buttons, a "Last used" tag). React + Tailwind + lucide-react, presentational: the OAuth popup, redirects and token handling are NOT implemented here — the components only render states and call callbacks.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
A. SignInDialog (role="dialog", aria-modal, labelled by its title):
- Backdrop: scrim. Panel 480px wide (full width minus 32px below 520px), bg-base, 1px border, rounded-md, modal shadow, 40px padding, close X (ghost IconButton, aria-label "Close") top-right.
- Centered header: a 56px Wordmark glyph ";" in accent, title "Sign in" (24/500 text-strong), and a 16px text-secondary reason line from prop `reason` (e.g. "Sign in to run your code — it stays in the editor."; default "Sign in to save your progress").
- Optional dev badge (prop `mode === 'MOCK'`): a small pill above the buttons, bg-raised, 1px border, 12px text-muted, FlaskConical icon, "Development sign-in — test users only".
- Two provider buttons, full width, 12px apart: h-10 (40px), bg-input, 1px border-strong, rounded-md, a 20px provider mark at the left (render the official multi-color Google "G" as an inline SVG and the GitHub Octocat mark as an inline SVG in text-primary — these are the only third-party marks allowed), the label centered 16/500 text-primary: "Continue with Google", "Continue with GitHub". Hover bg-raised; focus ring. The provider in prop `lastUsed` gets a 1px accent-emphasis border and a "Last used" tag overlapping its top-right corner (accent-emphasis-hover fill, white 11/600, rounded-full, px-2, h-5).
- Footer line, 12px text-muted, centered: "By continuing you agree to the Terms and Privacy Policy" (both links, underlined, accent).
- States (prop `state`):
  - idle: the buttons above.
  - waiting: the clicked button shows a 16px spinner and "Waiting for Google…" (aria-disabled), the other button is aria-disabled, and a ghost "Cancel" appears under them (onCancel). Text below: "Finish signing in in the window that opened."
  - error: a banner above the buttons — 12% error tint, 3px left error border, AlertCircle, 14px text-primary message, buttons still usable. Messages by prop `errorCode`: OAUTH_EMAIL_NOT_VERIFIED "Your GitHub account has no verified email. Add one in GitHub settings, or continue with Google." · OAUTH_CANCELLED "Sign-in cancelled." (neutral: info tint and Info icon instead of error) · OAUTH_STATE_INVALID "That sign-in link expired — try again." · OAUTH_PROVIDER_ERROR "{Provider} isn't responding. Try again or use the other option." · IDENTITY_CONFLICT "Your Semicolan account is linked to another {Provider} account. Sign in with it, then relink in Settings." · RATE_LIMITED "Too many attempts from your network. Try again in {n} s."
  - onboarding (new account): the header changes to the user's provider avatar (40px round, from prop) above the title "Welcome to Semicolan" and the line "A few details for your profile." The buttons are replaced by a form (labels above fields, 14/500 text-primary; inputs h-10): Display name (prefilled; helper "Shown on the leaderboard — never your email"), "I am a" — three one-tap chips in a role="radiogroup": Student / Working professional / Other (selected: bg-chip + text-primary + 1px accent border; others: bg-input + 1px border-strong + text-muted), and a disclosure "Add college (optional)" (ChevronRight rotates) revealing College and Graduation year (select 2020–2032). Primary full-width h-10 "Continue" (aria-disabled until name and segment are set; saving state: spinner + "Saving…"). Field errors inline.
- Props: open, reason, mode ('OAUTH'|'MOCK'), lastUsed?, state, errorCode?, providerLabel, onboarding {displayName, avatarUrl?, segment?, college?, graduationYear?, fieldErrors?, saving}, onContinueWithGoogle, onContinueWithGitHub, onCancel, onSubmitOnboarding(values), onClose.

B. AuthCompletePage (/auth/complete): a centered 440px card (bg-card, 1px border, rounded-md, 32px padding) on bg-base with the Wordmark at the page's top-left. States: completing (spinner, "Signing you in…"), success (CircleCheck in success inside a 12% success-tint circle, "You're signed in", text-secondary "You can close this window." — shown only when it was a popup that could not close itself), error (the same messages as above with a primary "Try again" and a ghost "Back to Semicolan").

C. MockProviderPage (/dev/mock-oauth, development builds only): a page styled like a provider consent screen, so testers recognize it as a stand-in. Top: a warning banner (12% warning tint, TriangleAlert) "Development only — this page does not exist in production." Then a 560px card: title "Choose a test user" and "Signing in with {Google|GitHub} (mock)"; a list of test users from props, each a 56px row button (bg-input, 1px border-strong, rounded-md): a 32px initial avatar, display name 15/500 text-primary, email 13px text-muted, and right-aligned tags for plan (Free / Premium / Expired / Revoked as Tag) and role (Admin). Special rows: "New user (first sign-in → onboarding)" and "GitHub user without a verified email (error path)". Footer: ghost "Cancel sign-in" → onCancel. Props: provider, users[] {userKey, displayName, email, plan, role, note?}, onPick(userKey), onCancel.
```

---

---

## Prompt 3 — Home dashboard

```text
Build the signed-in Home dashboard page for "Semicolan" inside the existing AppShell (sidebar + 48px top bar). React + Tailwind + lucide-react, presentational: every card receives its data and state through props and renders loading / empty / error on its own.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
Layout: content max-width 1376px, centered, 48px top padding. A greeting h1-app 36/600 text-strong "How's it going, {displayName}?" with 32px below. Then a two-column grid: main column (fluid) and a 296px side column, 32px gap. Below 1024px the side column moves under the main column. Each card is a Section (bg-section, 1px border, rounded-md, 20px padding), 24px apart.

MAIN COLUMN
1. Getting started (only if prop checklist.visible): title h2-section 18/600 text-primary "Getting started", meta "{done} of 3 complete". A horizontal 3-step stepper: numbered 28px circles (1px border-strong, 12px text-muted number; done = accent-icon fill with a bg-base Check) connected by a 1px border line; under each, a 14/600 text-primary title with a trailing ArrowUpRight and a 12px text-muted description: (1) "Solve your first problem" — "Get an Accepted verdict." (2) "Take a quiz" — "Test yourself on a DevOps or Data Science topic." (3) "Take the free mock test" — "Rehearse a timed round." A step that's done shows "Done" in success with a CircleCheck instead of its action. Stacks vertically below 768px.
2. Continue where you left off: a single wide row card (bg-card, 1px border-subtle, rounded-md, 16px padding): Code2 icon in a 32px bg-raised square, problem title 16 text-primary, DifficultyBadge, meta line "{language} · edited {relative time}" in 12px text-muted, and a primary "Resume" button at the right. Empty state: "Start with a warm-up" + a suggested problem row + "Open".
3. Topics: section title "Topics" in 18/400 text-muted with a leading 16px GripVertical-free spacing (no drag handle), trailing ghost "All problems ›". A 3-column grid (2 below 1280px, 1 below 640px), 12px gap, of Tiles: topic icon (Lucide guesses: Brackets, Link2, Network, GitBranch, Layers, Search, Hash), topic name, meta "{problemCount} problems", and for signed-in users a 2px progress track + "{solved} / {total} solved". Show up to 9; the "All problems" link leads to the catalog.
4. Your activity: title "Your activity" 18/400 text-muted; a right-aligned 12px text-muted summary "{totalSubmissions} submissions in the past year". The heatmap: 53 columns x 7 rows of 12px squares, 3px gap, 2px radius; month labels (12px text-muted) above the columns, Mon / Wed / Fri labels at the left; empty cells bg-raised; active cells accent-icon at 25 / 50 / 75 / 100% opacity by quartile. Each cell has a tooltip "{n} submissions on {date}" and the grid is role="img" with an aria-label summary, plus a visually hidden table. Footer row right-aligned, 12px text-muted: "Current streak: {n} days · Longest streak: {m} days". Horizontally scrollable inside its card below 1024px (never the page). Empty: "Submit a solution to start your streak."

SIDE COLUMN
5. Premium card (only when !isPremium): background premium-surface, 1px premium-border, rounded-md, 20px padding; a Premium pill; title 20/700 text-strong "Semicolan Premium"; three lines with accent-icon CircleCheck + 14px text-secondary: "Every problem in the catalog", "Unlimited timed mock tests", "Editorial solutions"; a full-width primary h-10 "See plans". When isPremium: a compact card "Premium until {date}" with a CalendarClock icon, and a warning-colored line "Expires in {n} days — Renew" when n <= 7.
6. Mock tests card: title 18/600 "Mock tests", one row for the free test with its state pill — "Available" (accent tag), "In progress — {mm:ss} left" (warning Clock + text) with a primary "Resume", or "Completed" (success CircleCheck) with a ghost "View report"; then a ghost "All mock tests ›".
7. This week card: title 18/600 "This week", the user's rank in stat 30/500 tabular ("#128") with "of {n} ranked" in 12px text-muted, then points and solved count as two small label/value pairs; states: no solves ("Solve a problem to get on this week's board" + link), loading, error. Ghost "Leaderboard ›" at the bottom.

Props (typed): displayName, checklist {visible, steps[3] {done, title, description, onAction}}, continueItem | null, suggestedProblem, topics[] {slug, name, problemCount, solvedCount?}, activity {days[{date, submissions}], totalSubmissions, currentStreak, longestStreak} | loading | error, isPremium, premiumUntil?, freeMockTest {state, remaining?, onAction}, weekly {state, rank?, rankedCount?, points?, solvedCount?}. Each card accepts its own `status: 'loading' | 'error' | 'ready'` and `onRetry`.
ADDITIONAL CARDS (measured from the reference dashboard):
8. Explore (main column, after Continue): a 3-column grid of module Tiles — System Design (Boxes), Low-Level Design (Blocks), DevOps (Infinity), Data Science (ChartLine), Companies (Building2), Projects (BriefcaseBusiness) — each with a count and, when available, a progress track.
9. Companies (main column, after Topics): section label "Companies" 18/400 text-muted + ghost "All companies ›"; a 3-column grid of up to 6 company Tiles: a 16px monogram (initial in accent on accent-subtle — never a logo), the name, "{n} questions" in 12px text-muted.
10. Latest interview experiences (side column, last): title 18/700 text-strong with a ChevronRight link; three compact experience items separated by 1px border-subtle: monogram + company 14/600, "{level} · {role}" 12px text-muted, the title 15/700 text-strong (2 lines), a 2-line excerpt 13px text-muted, "By {name} · Published {relative}" 12px text-muted, and two small pills (ArrowBigUp count, MessageSquare count; 1px border-subtle, h-7). A primary "Share your experience" at the bottom.
Do not add: roadmaps, "what's new", notifications, drag handles or edit pencils on sections.
```

---

## Prompt 4 — Problem catalog

```text
Build the Problems catalog page for "Semicolan" inside the AppShell: a dense, filterable problem list with a topic sub-sidebar, a Flat / Grouped toggle, per-problem status and bookmarks. Visitors see it too (without progress features). React + Tailwind + lucide-react, presentational.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
Layout: two columns inside the shell content area, full width: a 208px topic sub-sidebar (bg-base, 1px border-subtle right edge, sticky, scrolls on its own) and the list area (fluid, 24px padding). Below 1024px the sub-sidebar becomes a "Topics" select above the list.

1. Topic sub-sidebar: a 14px text-muted "All problems" item with a count, then one 32px item per topic: 16px topic icon (Lucide), 13px label text-muted, and right-aligned 12px tabular "{solved}/{total}" when signed in (just {total} for visitors). Active item: bg-raised, text-primary label, aria-current. Items are links (topic in the URL).
2. Header row: h1-page 24/500 text-strong "Problems" (or the topic name) with an Info IconButton (tooltip: "Solved means a first Accepted submission"). Right side: a 32px ProgressRing (3px bg-raised track, accent-icon arc, 10px center label "12%") with aria-label "{solved} of {total} solved" — signed-in only.
3. Toolbar row (8px gap, wraps on narrow screens): a fluid search Input with a trailing Search icon, placeholder "Search problems" (value + onQueryChange props); filter buttons (secondary, 32px, 13px label + trailing ListFilter/ChevronDown) opening popover menus of checkable items: "Difficulty" (Easy / Medium / Hard), "Status" (Solved / Attempted / Unsolved; signed-in only — visitors see instead a 13px accent link "Sign in to track progress"), "Saved" (a toggle button with Bookmark icon and aria-pressed; signed-in only); a SegmentedControl "Flat | Grouped" (List / LayoutList icons). Active filters show as removable chips below the toolbar (bg-chip, text-secondary, X button) with a "Clear all" ghost link.
4. A 12px eyebrow line text-muted: "{totalItems} problems · ordered by catalog" (or "by topic" in Grouped).
5. FLAT view: one list container (rounded-md, 1px border, rows clip to it). Each ProblemRow (60px, bg-row, 1px border-row bottom divider, 16px horizontal padding, hover bg-raised):
   - Left: a 20px status glyph — unsolved: Code2 in warning; attempted: CircleDot in accent-icon; solved: CircleCheck in success — each with a visually hidden label ("Unsolved", "Attempted", "Solved"); visitors always get Code2.
   - Title in row-title 16px text-primary, the row's main link (to /problems/{slug}).
   - Right cluster (12px gap): up to 2 topic tags (12px text-muted, hidden below 1280px), a FileCheck icon with tooltip "Has editorial" when hasEditorial, the DifficultyBadge (rounded-md), a Premium lock pill when the problem is locked for this viewer, and a bookmark IconButton (Bookmark / BookmarkCheck in accent-icon when saved, aria-pressed, aria-label "Save {title}"). The bookmark is a separate button, not inside the link.
   - Pagination below: "Showing 1–20 of 134" in 12px text-muted + Previous / Next secondary buttons + page size select (20 / 50 / 100).
6. GROUPED view: a list container per topic. Each group starts with a GroupHeader row (60px, bg-base, 16px text-primary topic name, "({solved} / {total})" in 14px tabular text-muted, a 200px 4px progress bar (bg-raised track, accent-icon fill) and a ChevronDown disclosure button with aria-expanded). Open groups show their ProblemRows; the first group with unsolved problems is open by default. A tab-shaped eyebrow label chip ("Arrays & Hashing", bg-inset, 1px border, top corners rounded, 11px text-muted) may sit on top of each container.
7. States: loading (8 skeleton rows at 60px), empty search ("No problems match “{q}”" + ghost "Clear search"), empty saved ("No saved problems yet — use the bookmark on any problem"), error (ErrorState + Retry). A locked row stays clickable (it opens the paywall via onOpenLocked).

Props: viewer {signedIn, isPremium}, topics[] {slug, name, problemCount, solvedCount?}, activeTopic?, query, filters {difficulty[], status[], saved}, view 'flat' | 'grouped', items[] {id, slug, title, difficulty, topics[], isPremiumOnly, hasEditorial, userStatus?, isBookmarked?}, groups? [{topic, solved, total, items[]}], page, size, totalItems, progress {solved, total}?, status 'loading'|'error'|'ready', and callbacks onQueryChange, onFiltersChange, onViewChange, onTopicSelect, onToggleBookmark(id, next), onOpenLocked(id), onPageChange, onRetry.
Do not add: company filters, curated-list names, "Export PDF", manual "mark as done" checkboxes, acceptance-rate or frequency columns.
```

---

## Prompt 5A — Coding Workspace: layout and problem pane

```text
Build the Coding Workspace page for "Semicolan" — part A: the full-bleed page layout (no app sidebar), its 48px header, and the left problem pane with three tabs (Description, Solution, Submissions). The right column (editor + results) is rendered through slots `editorSlot` and `resultsSlot` that part B fills; in part A render them as styled placeholders of the right size. React + Tailwind + lucide-react + react-resizable-panels, presentational.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
Layout (viewport height, no page scroll):
- Header 48px, bg-base, 1px border-subtle bottom, 16px padding: Wordmark glyph ";" (link Home), a ghost "‹ Problems" link, a divider, the problem title (16/500 text-primary — the visible title in the pane is the page h1), a DifficultyBadge (rounded-full), Previous / Next IconButtons (ChevronLeft / ChevronRight, aria-label "Previous problem"), then on the right a ghost "Report a problem" (Flag icon) and an optional `headerRightSlot` (mock-test timer in prompt 7).
- Body: bg-base with 8px padding; a horizontal PanelGroup: left problem pane (default 46%, min 320px, max min(60%, viewport-480px)) | right column (min 480px), which is a vertical PanelGroup: editor (default 58%, min 200px) | results (default 42%, min 176px, max 70%). Panels are rounded-md (6px) bg-surface cards with 1px border, separated by the 8px gutters, which are the resize handles: 10px hit area, a 1px border line with a centered 4x32px grip in border-strong; on hover/focus/drag the line becomes 4px accent; cursor col-resize / row-resize; role="separator" with aria-valuenow (percent), aria-label "Resize problem pane" / "Resize editor and results". Double-click resets.
- Collapsing: the problem pane collapses to a 40px rail with a PanelLeftOpen "Show problem" button.
- Skip links on focus: "Skip to problem", "Skip to editor", "Skip to results". Landmarks: header; main containing regions labelled "Problem", "Code editor", "Results".
- 768–1023px: the problem pane starts collapsed and opens as an overlay drawer (focus trap, Esc). Below 768px: render only the problem pane read-only, full width, with a non-blocking info banner "Coding needs a larger screen — open this problem on a laptop" + "Copy link" and "Share" buttons (desktop-class narrow window variant: "Widen the window or reset zoom (Ctrl/Cmd + 0) — current width {w}px").

Problem pane:
- Tab strip 40px bg-raised, 12px padding: tabs Description (FileText), Solution (CircleCheck), Submissions (History) — underline style; right end: a collapse IconButton (PanelLeftClose). Content below scrolls independently, 20px padding, bg-surface.
- DESCRIPTION tab: title in title-problem 20/500 text-primary as h1; a 12px-gap meta row: DifficultyBadge (rounded-full), a "Topics" disclosure button (Tags icon, 12px, bg-input, 1px border-strong, rounded-full, ChevronDown) that reveals topic tags (accent-subtle) — collapsed by default because topics spoil the technique; a Premium pill when isPremiumOnly. Then the statement as rendered Markdown (render from a `statementHtml` prop already sanitized, or from structured blocks): prose 15px/2.0 text-prose, max 75ch; inline code as bg-chip chips (4px radius, 2px 6px padding, code font 0.875em, text-secondary); headings "Example 1:" in 16/500 text-primary with 24px top margin; example blocks = bg-inset, 2px left border-strong, rounded-md, 12px 16px padding, code-sm 13/24 monospace text-secondary, with a Copy IconButton at the top-right of each block; "Constraints:" list = bullet list of inline-code chips. A footer link row: "Report a problem" (ghost, Flag).
- SOLUTION tab: first a spoiler guard card (bg-raised, rounded-md, 24px padding, centered): Eye icon, 16/500 "Try it yourself first?", 14px text-muted "The editorial shows a full solution.", primary "Show solution" (onRevealSolution). After reveal: a SegmentedControl "Overview | Code" is NOT needed — instead show in order: "Approach" (h2-section) + approach Markdown (prose); a two-line list with bold labels "Time complexity:" and "Space complexity:" followed by inline-code chips (e.g. O(n), O(1)); "Code" (h2-section 20/500) + a code block card: 1px border, rounded-md, bg-surface; a 36px tab row of languages (C, C++, Java, Python 3; active = bg-raised + text-primary, others text-muted; ARIA tabs) with a Copy IconButton at the right; the code area on bg-surface with a line-number gutter in --syn-line-number and the --syn-* colors (keyword, control, string, number, type, function, comment, default). Render code from props as pre-tokenized spans or plain text — no highlighter library needed. Other states: locked for visitors ("Sign in to read the editorial" + primary "Sign in"), locked for Free on a premium problem (Lock icon, "Editorials for Premium problems are part of Premium", primary "See plans"), no editorial ("No editorial for this problem yet"), loading, error. In mock-test mode (prop inTest) the Solution tab is not rendered at all.
- SUBMISSIONS tab: a table (sticky 40px bg-raised header, 12/500 text-muted headers: Status, Language, Runtime, Memory, Submitted): rows 48px with border-row dividers; Status = verdict icon + label in its color (Accepted CircleCheck success; Wrong Answer — a not-equal sign glyph — error; Time Limit Exceeded Clock warning; Runtime Error OctagonAlert error; Compile Error CircleX error; Judging Error CloudAlert info); numbers right-aligned tabular ("42 ms", "15.0 MB"); Submitted = relative time with the absolute time in a title attribute. Selecting a row opens a detail view inside the tab: back link "‹ All submissions", the verdict banner (12% tint of the status color, 3px left border, icon, 20/700 heading in the status color, meta line in text-secondary), the code read-only in a code block (same styling as Solution) with Copy and secondary "Load into editor" (onLoadIntoEditor — the app confirms). Empty state: "No submissions yet — Submit to see your history here."
- Loading: skeletons for title, meta row and 8 prose lines; Not found: "Problem not found" + link to Problems; Error: ErrorState + Retry.

Props: problem {title, slug, difficulty, isPremiumOnly, topics[], statement (blocks or html), examples[], constraints[]}, prevSlug?, nextSlug?, viewer {signedIn, isPremium}, inTest, activeTab, onTabChange, solution {state: 'guard'|'ready'|'loading'|'error'|'locked-visitor'|'locked-premium'|'none', approach?, timeComplexity?, spaceComplexity?, code?: Record<'c'|'cpp'|'java'|'python', string>}, onRevealSolution, submissions {state, items[] {id, status, language, runtimeMs, memoryKb, submittedAt}}, selectedSubmission?, onSelectSubmission, onLoadIntoEditor, editorSlot, resultsSlot, headerRightSlot, layout callbacks.
Do not add: Visualizer, Sources, Companies chips, an AI-assistant rail, likes/dislikes, discussion links.
```

## Prompt 5B — Coding Workspace: editor and results panel

```text
Build part B of the "Semicolan" Coding Workspace: the EditorPanel (toolbar + editor area) and the ResultsPanel (tabs + content + footer with Run and Submit). They mount into the right column of the Workspace layout as `editorSlot` and `resultsSlot`. The real code editor (Monaco) is wired later: render it through an `editor: ReactNode` prop and, for preview, a static monospace code block. React + Tailwind + lucide-react, presentational.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
EditorPanel (fills its panel; min-width:0; min-height:0; overflow:hidden):
- Toolbar 44px, bg-raised, 12px padding, 1px border-row bottom: left = native <select> styled as a 28px input (bg-input, 1px border-strong, 13px) with options C, C++, Java, Python 3 and aria-label "Language"; right = ghost IconButtons with tooltips: Reset (RotateCcw, "Reset to starter code"), Settings (Settings2, "Editor settings"), Maximize (Maximize2 / Minimize2, "Maximize editor"). An optional status text left of them in 12px text-muted from props, e.g. "Saved on this device" or warning "Autosave is off — copy your code before leaving" (TriangleAlert warning).
- Editor area: bg-surface, renders the `editor` prop. Preview fallback: a static code view on bg-surface with a 48px line-number gutter (--syn-line-number, active line text-primary), 14px/22px code font, 8px top/bottom padding, --syn-* token colors and --syn-selection for selected text.
- States: loading (a skeleton of the final editor size with "Loading editor…"), basic-editor fallback (an info banner "Basic editor — Retry full editor" above a plain <textarea> in the same mono font, labelled "Code editor"), locked (mock test closed: Lock icon + "Editor locked: test session closed", content read-only).
- Settings popover (opened by Settings): font size A- / A+ with the current px, Ligatures switch, Screen reader mode switch, "Keyboard shortcuts" list (Run Ctrl/Cmd+Enter; Submit Ctrl/Cmd+Shift+Enter; Tab moves focus Ctrl+M / Ctrl+Shift+M on macOS), "Reset layout" ghost button.

ResultsPanel (fills its panel):
- Tab strip 40px bg-raised: Test Cases (Play icon), Console (SquareTerminal), Submission Result (ClipboardCheck). Tabs carry text badges from props: "Test Cases 2/3" (with a CircleCheck success or CircleX error icon), "Console 2 errors". Right end: Maximize / Restore and Collapse IconButtons.
- Footer 56px bg-raised, 1px border-row top, 12px padding, always visible even when collapsed: left = secondary "Console" toggle (ChevronUp/ChevronDown, aria-expanded); right = secondary "Run" (Play icon; tooltip "Run — sample tests only, not saved"; aria-keyshortcuts "Control+Enter") and success-outline "Submit" (CloudUpload; tooltip "Submit — all tests, saved to history and the leaderboard"; aria-keyshortcuts "Control+Shift+Enter"). While an attempt is in flight both are aria-disabled; the clicked one shows a 14px spinner + "Sending…" / "Running…" / "Judging…" with fixed width. Rate-limited: both read "Retry in {n} s" (aria-disabled, reason via aria-describedby). Empty editor: aria-disabled with "Write some code first".
- TEST CASES tab: a row of case chips "Case 1", "Case 2", "Case 3" (28px, 13px; selected bg-chip + text-primary; others text-muted, hover bg-raised; aria-pressed) and a right-aligned ghost "Reset" (RotateCcw) that restores sample inputs — NO "+" add-case button. Below, for the selected case: each named input as a label "nums =" (14px text-secondary) above a value box (bg-chip, rounded-md, 12px 14px padding, code-sm text-secondary, Copy IconButton). Before any run show "Expected output" too and the hint "Run to see your output" (12px text-muted). After a Run, per case: a status line (icon + label + time: "Passed · 12 ms" success / "Failed" error), then Expected and Your output side by side when the panel is ≥640px wide (stacked otherwise), each labelled; the first differing line marked with a not-equal glyph and the differing characters underlined; a "Show whitespace" switch that renders spaces as · and tabs as →. Rows: the first failing case is selected by default.
- CONSOLE tab: monospace code-sm text-secondary on bg-surface, whitespace preserved, ligatures off, Copy button, "Output truncated" notice when flagged; Compile Error state shows a heading "Compile Error — tests did not run" (CircleX error) above the compiler text. Empty: "Compiler messages and stderr appear here."
- SUBMISSION RESULT tab: the verdict banner — 12% tint of the status color over bg-surface, 3px left border in the status color, 20px icon, heading 20/700 in the status color ("Accepted", "Wrong Answer on test 7", "Time Limit Exceeded on test 3", "Runtime Error on test 2", "Compile Error", "Judging Error"), meta line in 14px text-secondary tabular: "Submit · Python 3 · 42 ms · 15.0 MB · 2 min ago", and an underlined "Report a problem" link. Accepted adds, on a first solve, a "+{points} points" tag (accent-subtle) and "You're now #{rank} this week", plus actions: primary "Next problem", secondary "Leaderboard", ghost "Compare with the editorial". Judging Error uses info (CloudAlert) and the copy "Something went wrong on our side, not with your code. This attempt didn't count against your limit." with secondary "Try again". Hidden-test failures show only the test number and a one-line note "Hidden tests stay hidden so solutions can't be hard-coded." A "Code changed since this run" chip (PencilLine icon + text, bg-chip) appears when prop stale is true.
- In-flight states inside the active tab: Sending (skeleton rows, one per sample), Queued ("Queued — waiting for a free runner · 4 s"), Running (Run: per-case rows moving Queued → Running → Passed/Failed; Submit: "Judging… 7 of 20 tests" with a 4px progress bar), Slow (adds an info line "Taking longer than usual — your attempt is safe, keep editing"), Long wait (adds secondary "Stop waiting"), Reconnecting (warning WifiOff + "Connection lost — reconnecting. Your code is saved on this device."). The panel region has aria-busy while in flight. Provide one visually hidden polite live region element (`liveMessage` prop) for announcements.
- Empty (before any attempt): Submission Result reads "Submit to judge against every test."

Props: language, languages[], onLanguageChange, editor (ReactNode), editorState, saveStatus, onReset, onSettingsChange, settings, results {activeTab, testCases[] {name, inputs[{label, value}], expected, actual?, status?, timeMs?}, selectedCase, console {text, truncated, compileError}, verdict?, stale, inFlight?: {mode, phase, elapsedS, progress?}, rateLimitedFor?}, onRun, onSubmit, onStopWaiting, onTryAgain, onNextProblem, onOpenLeaderboard, onOpenEditorial, onToggleCollapse, onToggleMaximize, liveMessage.
Do not add: a custom-test-case "+" button, AI explain buttons, a code-formatting button, a minimap.
```

---

## Prompt 6 — Mock tests list and lobby

```text
Build two screens for "Semicolan" mock tests inside the AppShell: (A) the Mock Tests list, a grid of test cards showing the viewer's state on each, and (B) the Lobby, the confirmation page that comes before the timer starts, with rules and pre-flight checks. React + Tailwind + lucide-react, presentational.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
A. Mock Tests list (/mock-tests):
- Header: h1-page 24/500 "Mock tests", sub-copy 14px text-muted "Timed practice rounds with a server-side clock. Only Accepted problems score."
- A 3-column grid (2 below 1280px, 1 below 768px), 16px gap, of TestCards: bg-card, 1px border, rounded-md, 20px padding, min-height 168px. Top row: title 16/600 text-primary + a state element at the right. Meta row (12px text-muted, 16px icons): Clock "{durationMinutes} min" · ListChecks "{problemCount} problems" · Scale "Easy 1 · Medium 2 · Hard 3 points". Bottom row: the action.
- States per card (icon + label, never color alone):
  - Available: no pill; primary "Open" (goes to the lobby).
  - Free test, 1 attempt: tag "Free · 1 attempt" (accent-subtle) + primary "Open".
  - Locked (Premium): Premium pill with Lock; secondary "Unlock with Premium" (onUnlock).
  - In progress: warning Clock + "In progress — {mm:ss} left" (tabular), primary "Resume"; the card border is 1px warning.
  - Completed: success CircleCheck + "Completed · {score}/{maxScore}"; secondary "View report" and, for Premium, ghost "Retake"; for Free on the free test, ghost "Upgrade to retake".
  - Free attempt used: muted "Free attempt used" + link "See Premium".
- Empty: "No mock tests are available right now." Loading: 6 skeleton cards. Error: ErrorState.

B. Lobby (/mock-tests/{id}): a centered 720px card (bg-card, 1px border, rounded-md, 32px padding) on bg-base.
- Back link "‹ Mock tests". Title h1-page 24/500 text-strong; meta chips row: Clock "{n} minutes", ListChecks "{k} problems", Scale "Easy 1 · Medium 2 · Hard 3".
- "Before you start" (h2-section 18/600) — a rules list, each with a 16px icon and 14px text-secondary: Timer "The timer runs on our server and cannot be paused."; LogOut "Leaving the page does not stop it."; Target "Only Accepted problems score — no partial credit."; FileWarning "Code you haven't submitted is not scored."; RotateCcw "Free test: one attempt only." (shown only when isFreeTest).
- "Pre-flight checks" (h2-section) — a checklist from props, each row 40px: status icon (CircleCheck success "Ready" / CircleX error "Needs attention" / Loader spinner "Checking…"), the check name 14px text-primary ("Signed in", "Window at least 768px wide", "Online", "Editor loaded"), and for a failing check a fix action at the right (e.g. 12px text-muted "Current width: 702px — widen the window or reset zoom").
- Footer: a 14px text-secondary summary "90 minutes. The timer starts when you press Start and cannot be paused." Primary large h-10 "Start test — {n} min" (aria-disabled until all checks pass, with the reason in aria-describedby: "Widen the window to start"), secondary "Not now". Starting state: spinner + "Starting…". Locked variant: the Start button is replaced by the paywall prompt (Premium pill, "This test is part of Premium", primary "See plans"). Another-test-running variant: warning banner "Finish or resume your current test first" + primary "Resume {title}".
Props: tests[] {id, title, durationMinutes, problemCount, pointWeights, state, isFree, remainingS?, score?, maxScore?, canRetake}, viewer {isPremium}, lobby {test, rules, checks[] {id, label, state, fixAction?}, isFreeTest, startState, lockReason?, activeOtherTest?}, callbacks onOpen, onResume, onViewReport, onRetake, onUnlock, onStart, onFixCheck(id), onBack.
```

---

## Prompt 7 — Mock test runner header and report

```text
Build two "Semicolan" mock-test pieces: (A) the TestHeader that sits above the Coding Workspace during a timed test — title, problem switcher, server-synced countdown, Finish test — with its dialogs and banners, and (B) the Report page shown after the test (inside the AppShell). React + Tailwind + lucide-react, presentational: the remaining time arrives as a prop; do not run timers.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
A. TestHeader (replaces the Workspace header's right side and adds a 48px strip under it; bg-base, 1px border-subtle bottom):
- Left: the test title 16/600 text-primary.
- Center: the problem switcher — one chip per problem in order (32px, rounded-md, 1px border-strong, 13px): "1 · Two Sum" plus a state icon AND a hidden/visible text: not attempted (Circle, text-muted), attempted (CircleDot, accent-icon, "Attempted"), judging (spinner, "Judging"), accepted (CircleCheck, success, "Accepted"). The current problem chip: bg-raised + text-primary + 2px accent bottom border, aria-current. Overflows into a horizontal scroll on narrow screens.
- Right: the countdown in a 32px pill (bg-raised, rounded-full, 16/600 tabular, Clock icon): neutral text-primary above 10 minutes; warning text + warning icon at 10 minutes or less; error text + AlarmClock icon at 1 minute or less; never flashing. It has role="timer" and an aria-label "Time left {mm} minutes {ss} seconds"; until synced it reads "Syncing time…". Then secondary "Finish test" (Flag icon).
- Finish dialog (role="dialog"): title "Finish now?", body from props: "{unsolved} of {total} problems unsolved, {mm:ss} left. You can't resume after finishing.", buttons: secondary "Keep going" (initial focus) and primary "Finish test".
- Time's up dialog (role="alertdialog"): Hourglass icon in warning, title "Time's up", body "Your test has ended. Submissions after the deadline aren't counted." (or the late-submission variant "Your last submission arrived after the test ended and was not counted."), primary "View report" (initial focus) and secondary "Copy my code". After Esc, a persistent slim banner (40px, bg-raised, warning icon): "Test session closed — View report".
- Banners (in flow, under the header): offline ("Offline — your timer is still running on our server. Code is saved on this device.", WifiOff warning); another tab ("This test is open in another tab" + secondary "Use this tab"); finalizing chip near the timer ("Submitted at 00:02 — judging…").
- Toast variants for 5 and 1 minutes left: "{n} minutes left — unsubmitted code is not scored."

B. Report page (/mock-tests/sessions/{id}/report), in the AppShell, max-width 960px:
- Header: back link "‹ Mock tests", title h1-page "{test title} — report", meta 14px text-muted "Finished {date, time} · Time taken {h:mm:ss}".
- Score card (bg-card, 1px border, rounded-md, 24px padding): left a 120px ProgressRing with "{score} / {maxScore}" in stat 30/500 and "points" in 12px text-muted; right three label/value pairs: Solved "{k} of {n}", Time taken, Weights "Easy 1 · Medium 2 · Hard 3". Finalizing state: a spinner + "Finalizing your results…" in place of the score, with a 12px text-muted note "This can take a few seconds while the last submissions are judged."
- Problems table (Tables style): #, Problem (title + DifficultyBadge), Points (tabular), Verdict (icon + label in its color, or "Not attempted" text-muted), action ghost "View submission" (when bestSubmissionId).
- Next step card: Premium users — primary "Retake test", secondary "All mock tests"; Free users — the Premium card (premium-surface, premium-border, "All mock tests, unlimited retakes", primary "See plans").
- A one-line disclaimer in 12px text-muted: "Mock test scores are practice results, not certified assessments."
Props: header {title, problems[] {id, order, title, state}, currentId, remainingS | null (null = syncing), onSwitch, onFinish}, dialogs {finishOpen, timesUpOpen, lateSubmission}, banners {offline, otherTab, closed}, report {status 'finalizing'|'ready'|'error', score?, maxScore, solved, total, timeTakenS, finishedAt, problems[] {title, difficulty, points, verdict, bestSubmissionId?}}, viewer {isPremium}, callbacks.
```

---

## Prompt 8 — Leaderboard

```text
Build the public Leaderboard page for "Semicolan" inside the AppShell: a weekly / all-time ranked table plus a "Your position" panel that always shows the viewer's own rank and neighbours. React + Tailwind + lucide-react, presentational.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
Layout: max-width 1376px; header row; then two columns — the table (fluid) and a 296px side panel (moves above the table below 1024px).
1. Header: h1-page 24/500 "Leaderboard" with a Trophy icon in accent-icon; a SegmentedControl "This week | All-time" (aria-pressed); a 12px text-muted line "Weekly board resets every Monday at 00:00 IST · Points: Easy 1, Medium 2, Hard 3 for each first solve" (only the reset part for This week).
2. Table (bg-surface, 1px border, rounded-md): sticky 40px bg-raised header with 12/500 text-muted labels: Rank (72px, right-aligned), Name, Points (right), Solved (right). Rows 48px, border-row dividers: rank as "#1" tabular text-primary (top 3 get a Medal icon in accent-icon with aria-hidden and the rank text still present), display name 14px text-primary (anonymized rows show "Deleted user" in text-muted italic), points and solved tabular. A tooltip on the Rank header: "Ties go to whoever reached the score first." The viewer's own row, if on the page: accent-subtle fill + 3px accent left border + a "You" tag. Pagination below: "Ranks 1–50 of 1,284" + Previous / Next.
3. "Your position" side panel (Section style): states from props —
   - visitor: Users icon, "Sign in to get ranked", primary "Sign in";
   - no solves: "Solve a problem to get on this week's board" + primary "Pick a problem";
   - ranked: rank in stat 30/500 "#128", points and solved as two label/value pairs, then a mini table of neighbours (two above, two below; the viewer's row highlighted as in the main table).
4. States: loading (10 skeleton rows), empty week (Monday morning) "No solves yet this week — be the first" + link, error with Retry.
Props: window, onWindowChange, items[] {rank, displayName, points, solvedCount, isMe?, isDeleted?}, page, totalItems, me {state, rank?, points?, solvedCount?, neighbors[]?, resendCooldownS?}, status, callbacks.
Do not add: avatars from external services, country flags, college filters (Future), follow buttons.
```

---

## Prompt 9 — Pricing, paywall dialog and payment confirming

```text
Build the monetization UI for "Semicolan": (A) the Pricing page (marketing layout, also reachable inside the app), (B) the Paywall dialog shown when a user opens locked content, and (C) the "Confirming your payment" screen shown after Razorpay checkout. Fixed-term prepaid plans in INR, no auto-renewal. React + Tailwind + lucide-react, presentational.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
Shared PlanCard component (used by A and B): bg-card, 1px border, rounded-md, 24px padding. Plan name 20/400 text-muted ("1 month"); price "₹{rupees}" in 30px text-strong tabular via Intl.NumberFormat('en-IN') from pricePaise/100, followed by 16px text-secondary " for {durationDays} days"; an optional 14px text-secondary per-month equivalent "≈ ₹{x} / month" computed in the parent and passed in; feature list with accent-icon Check + 16px text-secondary; full-width CTA h-10: primary "Get {name}", or for the single isFeatured plan a highlight-filled button (text-on-highlight) and the card uses background plan-featured with a 1px premium-border plus a corner tag "Best value" (12px, success text, 1px success border, bg-base, pinned over the top-right border). Loading CTA: spinner + "Opening checkout…", aria-disabled (prevents a second order). No strike-through prices, no "lifetime" plan, no coupon fields.

A. Pricing page: h1-marketing 48/700 "Simple prices, in rupees", 18px text-secondary "One-time payment. No auto-renewal. Buying again extends your access." Grid: a Free card (features: "40+ free problems", "Full IDE with Run and Submit", "Weekly leaderboard", "1 free mock test"; CTA secondary "Start free" or, if signed in, a disabled "Your current plan") then the Premium plan cards from props (features: "Every problem in the catalog", "Unlimited mock tests with reports", "Editorial solutions", "Everything in Free"). Below: a 14px text-muted line "Pay with UPI, cards or netbanking via Razorpay. Prices include GST." and "7-day refund if you haven't started a mock test — Refund policy" (link). If the viewer is Premium: an info banner at the top "Premium until {date}. A new plan starts when this one ends." A compact FAQ (accordion) with 4 billing questions from props.

B. Paywall dialog (lg 720px, role="dialog"): header with a Premium pill and the title from props, e.g. "‘{problem title}’ is a Premium problem" or "This mock test is part of Premium"; a short context block of what is locked (problem title + DifficultyBadge + topic tags — never the statement); "What Premium adds" with three Check lines; the plan cards in a row (stacked below 768px); footer: 12px text-muted "One-time payment, no auto-renewal · Refund policy", a ghost "Not now" (closes and returns where the user was), and a "Try a free problem instead" list of up to 3 suggestion rows (title + DifficultyBadge + ChevronRight) from props. Visitor variant: the body says "Sign in with Google or GitHub first — it takes a few seconds." with primary "Sign in" instead of plan CTAs.

C. Confirming your payment (/checkout/confirm), a centered 520px card:
- confirming: a 48px spinner ring in accent-icon (a static ring + text under reduced motion), h1-page "Confirming your payment", 14px text-secondary "This usually takes a few seconds. You can keep practising — we'll unlock Premium automatically.", ghost "Back to problems".
- still-pending (after 60 s): Clock in info, "Still confirming", "You don't need to stay on this page — Premium unlocks automatically (up to 15 minutes) and we'll email you." No retry/pay-again button.
- paid: 56px CircleCheck in success inside a 12% success-tint circle, "Premium is active until {date}", primary "Continue to {returnLabel}".
- failed: CircleX in error, "Payment failed — no money was taken", primary "Try again", secondary "Choose another method".
- cancelled: "No payment was made" (neutral, Info icon), primary "Back to plans".
Props: plans[] {code, name, durationDays, pricePaise, perMonthLabel?, isFeatured}, viewer {signedIn, isPremium, premiumUntil?}, faqs[], paywall {open, kind 'problem'|'mock', lockedItem, suggestions[]}, checkout {loadingPlanCode?}, confirm {state, premiumUntil?, returnLabel?}, callbacks onChoosePlan(code), onClosePaywall, onSignup, onOpenSuggestion, onContinue, onRetry.
Do not add: payment brand logos, coupon inputs, testimonials, countdown "offer ends" timers, a lifetime plan.
```

---

## Prompt 10 — Profile and account settings

```text
Build two "Semicolan" pages inside the AppShell: (A) the private Profile page — identity card, solved-by-difficulty ring, activity heatmap, recent submissions — and (B) Account settings with Profile, Billing and Account tabs. React + Tailwind + lucide-react, presentational.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
A. Profile (/profile): max-width 1200px; two columns — a 320px identity column and the main column (fluid), 24px gap; stacks below 1024px.
- Identity column: an 80px rounded-md avatar (the initial in 32/600 on a generated color from props), display name 18/600 text-strong, segment + college + "Class of {year}" in 14px text-secondary, "Member since {month year}" 12px text-muted; weekly rank line "#128 this week" (or "Solve a problem to get ranked" as a link); a full-width secondary "Edit profile" (PencilLine) that goes to Settings. Then a divider and "Premium until {date}" (Premium pill) or a ghost "Get Premium".
- Main column, cards in Section style:
  1. Solved: a 160px ring split into three arcs in the Easy / Medium / Hard text colors over a 6px bg-raised track, center "{solved}" in stat 30/500 + "/{published}" in 14px text-muted and "Solved" in 12px text-muted; "{attempting} attempting" below. To the right, three stacked mini cards (bg-raised, rounded-md, 8px 12px, min-width 120px): the difficulty word in its color (12/500) and "{solved} / {published}" in 14px tabular text-primary. The ring has role="img" and an aria-label that lists all three numbers.
  2. Activity: "{n} submissions in the past year" (16/500 text-primary with the number in tabular) + Info tooltip "Counts submitted solutions, in IST days"; right-aligned 12px text-muted "Active days: {d} · Longest streak: {m}". The heatmap: 53 x 7 cells, 12px, 3px gap, 2px radius, month labels below the grid (12px text-muted), empty bg-raised, active accent-icon at 25/50/75/100% opacity; tooltips; role="img" summary + hidden table. Horizontal scroll inside the card on narrow screens.
  3. Recent submissions: underline tabs "Recent" | "Solved" (Solved lists first-solve rows); rows 48px with verdict icon + label, problem title (link), language, runtime (tabular) and relative time; trailing ghost "View all ›". Empty: "No submissions yet" + primary "Pick a problem".
- Do not render: followers/following, badges, reputation, views, discussion counts, skills or language panels, a share button, a public URL.

B. Settings (/settings): max-width 960px; h1-page "Settings"; a left vertical tab list (200px; items 36px, 14px; active bg-raised + text-primary + accent icon; ARIA tabs with vertical orientation) — Profile (UserRound), Accounts (KeyRound), Billing (Receipt), Account (ShieldAlert) — and the panel on the right (becomes horizontal underline tabs below 768px).
- Profile tab (a form card, 24px padding, labels above fields): Display name (helper "Shown on the leaderboard"), "I am a" chips (Student / Working professional / Other), College (optional), Graduation year (select, optional), Email (read-only input with a Lock icon and helper "From your Google or GitHub account"). Footer: primary "Save changes" (aria-disabled until something changed; saving state spinner + "Saving…"), ghost "Discard". Field errors inline; a success toast is the parent's job. An "unsaved changes" confirm dialog: "Discard changes?" with "Keep editing" / "Discard".
- Accounts tab: connected sign-in providers as two 64px rows (bg-card, 1px border, rounded-md): the provider mark (Google "G" / GitHub mark, 20px), the provider name 15/500, the linked email in 13px text-muted or "Not connected"; at the right secondary "Link" or ghost "Unlink" (aria-disabled with the tooltip "You need at least one way to sign in" when it is the last one). Banners for ?linked= success and IDENTITY_IN_USE ("That GitHub account is linked to a different Semicolan account").
- Billing tab: a status card — Premium pill + "Active until {date}" (or "Expired on {date}" in warning, or "Free plan" with primary "See plans"; revoked: "Your Premium access ended because the payment was refunded" in info) — then a receipts table (Date, Plan, Amount ₹ tabular right-aligned, Status as icon + label: Paid success / Refunded info / Disputed warning). Empty: "No payments yet." Note 12px text-muted "Plans don't renew automatically. Buying again extends your access."
- Account tab: a Destructive section with 1px error border, rounded-md, 20px padding: title "Delete your account" (16/600), text-secondary body listing what is lost ("Your submission history, mock test reports and any remaining Premium time are removed within 30 days. Your leaderboard entry becomes ‘Deleted user’."), destructive button "Request account deletion" (opens a confirmation dialog that requires typing the word DELETE; confirm button destructive). Requested state: info banner "Deletion requested on {date}. Contact support to cancel."
Props: profile {displayName, avatarColor, segment, college?, graduationYear?, memberSince, weeklyRank?, rankReason?, isPremium, premiumUntil?}, stats {solved, published, attempting, byDifficulty}, activity {days[], totalSubmissions, activeDays, currentStreak, longestStreak}, recent[] / solvedRecent[], settings {values, dirty, saving, fieldErrors}, billing {state, until?, payments[]}, deletion {requestedAt?}, per-section status + onRetry, and callbacks onEditProfile, onSave(values), onDiscard, onChoosePlans, onRequestDeletion.
```

---

## Prompt 11 — DevOps and Data Science hubs: topic grid, Theory, Quiz, quiz runner

```text
Build the knowledge-hub screens of "Semicolan" inside the AppShell: (A) the Hub page — a grid of topic tiles; (B) the Topic page with two underline tabs, Theory and Quiz; (C) the Quiz runner — one multiple-choice question at a time with server-graded feedback; (D) the Quiz result. The same components serve the DevOps hub and the Data Science hub. Data Science has no Coding tab (SQL is not supported). React + Tailwind + lucide-react, presentational: grading happens on the server; the runner only renders the result it receives.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
A. Hub page (/devops, /data-science), layout measured from the reference hub grid:
- Header row: h1-page "DevOps" (or "Data Science") in text-strong; right side: a 240px search input ("Search topics", trailing Search icon) and an A–Z / Most learned select (h-8, bg-input, 1px border-strong).
- A 4-column grid of topic Tiles (3 below 1440px, 2 below 1024px, 1 below 640px), 16px gap. Tile: bg-card, 1px border-subtle, rounded-md, padding 12px 14px; row 1 = a 16px generic Lucide icon from props (never a product logo) + topic name 14/500 text-primary + ChevronRight text-muted at the end; row 2 = a 14px Star icon and "{n} Questions" in 12px text-muted (tracking 0.02em); signed-in: a 2px progress track (bg-raised, accent-icon fill) and "{learned} / {n} learned" in 12px text-muted. Hover bg-row + border-hover. Whole tile is a link.
- Empty search: "No topics match “{q}”". Loading: 12 skeleton tiles.

B. Topic page (/{hub}/{topic}):
- Header: a round 32px back IconButton (bg-raised, ArrowLeft, aria-label "Back to {hub}"), the topic icon (24px) and name in 24/500 text-strong; right side: an expand-all / collapse-all segmented pair (two 28px icon buttons: ChevronsDownUp / ChevronsUpDown) and a 32px ProgressRing with "{pct}%".
- Below: a full-width search input "Search questions" and a "Status" filter button (secondary, ListFilter; menu: All, Learned, Not learned, Saved).
- Underline tabs: Theory (BookOpen) | Quiz (ListChecks).
- THEORY tab: for each section, a tab-shaped label chip on top of a list container (chip: bg-inset, 1px border, top corners rounded 6px, 11/500 tracking 0.04em text-muted, e.g. "Modules & Plugins"); the container is rounded-md with 1px border and its rows clip to it.
  Question row (bg-row, 1px border-row bottom divider, 16px 20px padding, min-height 60px): the question as 16px text-primary (inline code inside it = bg-code-accent chip, 4px radius, 2px 6px padding, code font 0.875em, code-accent text); on the right a 12px gap cluster: DifficultyBadge (rounded-md), a bookmark IconButton (Bookmark / BookmarkCheck in accent-icon, aria-pressed), a learned IconButton (Circle / CircleCheck in success, aria-pressed, aria-label "Mark as learned"); a locked row shows a Lock icon (text-muted) instead of the two toggles. The question text is the disclosure button (aria-expanded). Expanded: the answer as Markdown in 15px/2.0 text-secondary (bullets, inline code chips as above), then a 1px border-row divider and a "SOURCES · {n}" toggle row (Globe 14px, 11/600 uppercase text-muted, ChevronDown at the far right); opened, a wrap of source chips (bg-source-chip, 1px border, rounded-md, h-7, px-2, 12px source-chip-text, a 12px Globe icon, label, trailing ExternalLink 12px; each an <a target="_blank" rel="noopener noreferrer">). Locked expanded row: an inline panel (premium-surface, 1px premium-border, rounded-md, 16px) "This answer is part of Premium" + primary "See plans" (or "Sign in" for visitors).
- QUIZ tab: a 4-column grid of level cards (2 / 1 on smaller screens), 16px gap: bg-input, 1px border-subtle, rounded-md, 16px padding, min-height 84px; top row = level name 16/500 text-primary ("Easy", "Medium", "Hard", "Mixed") + a CircleCheck in success when completed (or Lock + Premium pill when locked); bottom-right "{n} Qs" 12px text-muted tabular; when there is a best score, bottom-left "Best {c}/{n}" 12px text-secondary. Clicking a card starts or resumes (onStartQuiz(slug)); an in-progress card shows "Resume · {answered}/{n}". Below, "Attempts" (h2-section 18/400 text-muted) and either a table (Date, Level, Score, Status, ghost "Review") or the empty state: a 1px dashed border box, rounded-md, centered "No quiz attempts yet" (16/500 text-primary) + "Try a quiz and see your progress here" (14px text-muted).

C. Quiz runner (/quiz/{attemptId}), full width in the shell:
- Header: round back button, the topic name 24/500 text-strong + level Tag; right: "{index} / {total}" 12px text-muted tabular. Under the header a full-width 2px progress bar (bg-surface track, accent-icon fill) with role="progressbar".
- Question card: bg-input, 1px border-subtle, rounded-md, 32px padding. Prompt 18/500 text-primary (Markdown, inline code chips). "Select the correct answer" 14/500 text-secondary, 24px below. Options: a 2-column grid (1 column below 768px), 24px gap; each option is a <button> 56px min-height, bg-input, 1px border-strong, rounded-md, 16px padding, a leading number "1".."6" in 14px text-muted (tabular) and the option text 16px text-secondary; hover bg-raised; focus ring. Number keys 1–6 select only while the card has focus.
- Answered state (props): every option becomes aria-disabled; the selected option gets a 1px status border + 12% status tint + icon + the word ("Correct" with CircleCheck in success, or "Incorrect" with CircleX in error) at its right; the correct option (if different) gets a 1px success border and "Correct answer"; below the grid an explanation panel (bg-surface, 1px border, rounded-md, 16px, Lightbulb icon in warning, 15px/1.8 text-secondary Markdown) and a primary "Next question" (or "See results" on the last).
- Footer row of the card, right-aligned: secondary "Don't know" (records a wrong answer) and ghost "Finish quiz" (opens a confirm dialog "Finish now? {k} unanswered questions will count as wrong." with "Keep going" / "Finish").
- Submitting state: the chosen option shows a spinner; double submission is impossible (aria-disabled).
- Do NOT render an AI hint button.

D. Result: a centered 720px card: a 120px ProgressRing with "{correct} / {total}" (stat 30/500) and "correct" (12px text-muted); a one-line summary; then a review list — each question number, prompt, "Your answer" (status color + icon + text) and "Correct answer", the explanation in a disclosure. Actions: primary "Retake", secondary "Back to {topic}".
Props: hub {name, topics[] {slug, name, icon, theoryCount, learnedCount?}}, topic {name, icon, progressPct, sections[] {name, questions[] {id, questionMarkdown, difficulty, locked, answerMarkdown?, sources?[], bookmarked?, learned?}}, quizzes[] {slug, level, questionCount, locked, bestScore?, inProgress?}}, attempts[], runner {topicName, level, index, total, question {promptMarkdown, options[]}, answered?: {selectedOption, correctOption, isCorrect, explanationMarkdown}, submitting}, result {...}, viewer {signedIn, isPremium}, callbacks onToggleBookmark, onToggleLearned, onStartQuiz, onAnswer(optionIndex|null), onNext, onFinish, onRetake, onUpgrade, onSignIn.
```

---

## Prompt 12 — System Design and Low-Level Design: list and viewer

```text
Build the design-interview screens of "Semicolan" inside the AppShell: (A) the System Design list and the identical Low-Level Design list, and (B) the Design viewer — a two-pane page with the problem (Problem / Solution / Quiz tabs) on the left and the user's private "My answer" Markdown notepad on the right. No AI whiteboard. React + Tailwind + lucide-react, presentational: the notepad's text, save state and conflicts come from props; diagrams arrive as already-rendered SVG strings or a slot.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
A. Design list (/design/hld, /design/lld), measured from the reference grids:
- Header: h1-page "System Design" (or "Low-Level Design") 24/500 text-strong; right: a 32px ProgressRing "{pct}%".
- Toolbar: full-width search input "Search questions"; filter buttons (secondary, 13px + ListFilter): "Difficulty", "Companies" (searchable menu of company names with monograms), "Status" (All, Done, Saved).
- Guide banner (full width, 56px): background premium-surface, 1px premium-border, rounded-md, 16px horizontal padding: a 32px round bg-base circle with the ";" glyph in accent, the title 16/400 text-primary "How to approach a system design interview", ChevronRight at the end. A link.
- A 1px border-subtle divider, then eyebrow 12px text-muted "Ordered by most frequently asked".
- A 2-column grid (1 below 1024px), 16px gap, of question cards: bg-input, 1px border-subtle, rounded-md, padding 12px 12px 10px; row 1 = a 24px icon tile (1px border, rounded-md, bg-base, a 14px colored Lucide icon from props such as Link, MessageSquare, Gauge, Search, Video, Bell) + title 15/500 text-primary + ChevronRight (text-muted) at the far right; row 2 = meta "Statement · Editorial · Quiz" in 11/500 tracking 0.04em text-muted (only the parts that exist) and, right-aligned, a Flag-style bookmark icon button and a SquareCheck done icon button (aria-pressed), or a Lock (text-muted) when locked. Hover bg-row + border-hover. The card is a link; the two icon buttons are separate buttons.
- States: loading (8 skeleton cards), empty filter ("No design questions match"), error.

B. Design viewer (/design/{kind}/{slug}), full-bleed like the Workspace (no app sidebar), viewport height:
- Header 48px (bg-base, 1px border-subtle bottom): Wordmark glyph, ghost "‹ System Design", divider, title 16/500 text-primary, DifficultyBadge (rounded-full), Prev/Next IconButtons; right: bookmark toggle, secondary "Mark as done" (SquareCheck; pressed state shows "Done" in success), ghost "Report a problem".
- Body: bg-base with 8px padding; two resizable panes (default 55% / 45%, min 360px each) as rounded-md bg-surface cards with 1px border, separated by an 8px gutter with a grip.
- LEFT pane: a 40px bg-raised tab strip: Problem (FileText) | Solution (CircleCheck) | Quiz (ListChecks; hidden if none). Content scrolls, 24px padding.
  - Problem: title 20/500 (the page h1); statement as prose 15/2.0 text-prose; then three requirement blocks with h2-section headings "Functional requirements", "Non-functional requirements", "Out of scope", each a bullet list in text-secondary with inline-code chips (bg-chip).
  - Solution: first a spoiler guard card (bg-raised, rounded-md, 24px, centered Eye icon, "Try it yourself first?", "The editorial shows a full solution.", primary "Show solution"). Then the sections: h2 heading per section, Markdown body, and for a diagram a <figure> (bg-base, 1px border, rounded-md, 16px padding, the SVG from props centered and scaled to fit, a 12px text-muted caption, and a disclosure "View diagram source" showing the Mermaid text in a code-sm block — the text alternative). For LLD a code block card (1px border, rounded-md, bg-surface; a 36px tab row Java | Python | C++ with ARIA tabs, active bg-raised + text-primary; Copy IconButton; line numbers in --syn-line-number and --syn-* token colors). Locked: premium panel "Editorials are part of Premium" + "See plans"; visitor: "Sign in to read the editorial".
  - Quiz: the quiz's level card and its attempts (reuse the Quiz tab pieces from the hubs).
- RIGHT pane "My answer": a 40px bg-raised strip with the title "My answer" (14/500 text-primary), a Lock icon + 12px text-muted "Private — only you can see this", and at the right the save status (12px): "Saved · 2 min ago" (CircleCheck text-muted), "Saving…" (spinner), "Saved on this device — reconnecting" (CloudOff warning), "Not saved" (AlertCircle error) + Retry. Below, the MarkdownEditor: a 36px toolbar (bg-raised, 1px border-row bottom) with Write | Preview tabs and icon buttons Heading, Bold, Code, List, ListOrdered, Link, Table (each with aria-label + tooltip); Write = a monospace textarea filling the pane (14/22, bg-surface, 16px padding, placeholder "Outline your design: requirements, API, data model, components, trade-offs…"); Preview = the rendered Markdown in prose. A character counter bottom-right "12.4 / 64 KB" (warning at 90%, error at 100%).
  - Conflict dialog (prop conflict): "This answer was changed in another tab" with two side-by-side read-only previews ("This tab" / "Other tab") and buttons "Keep this tab's version" (primary) / "Use the other version" (secondary).
  - Visitor: the editor is usable; a banner at the top "Sign in to save your answer" with primary "Sign in".
- Below 1024px the panes stack (problem first) with a sticky "My answer" button that scrolls to the notepad.
Props: list {kind, items[] {slug, title, icon, difficulty, parts[], locked, bookmarked?, done?}, progressPct, filters}, viewer {question {...}, activeTab, solution {state, sections[] {heading, markdown, diagramSvg?, mermaidSource?, code?}}, quiz?, myAnswer {text, saveState, lastSavedAt, byteSize, conflict?}, signedIn, isPremium}, callbacks onAnswerChange, onRevealSolution, onResolveConflict(choice), onToggleBookmark, onToggleDone, onSignIn, onUpgrade.
```

---

## Prompt 13 — Companies: directory and company page

```text
Build the company-preparation screens of "Semicolan" inside the AppShell: (A) the Companies directory and (B) the Company page with a left company sidebar and tabs Overview, Coding, System Design, Low-Level Design and Experiences. Companies are shown by NAME with a generated monogram — never a logo, never brand colors. React + Tailwind + lucide-react, presentational.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
Monogram component: a square with radius 6px — 24px (lists), 40px (headers) — background accent-subtle, the company's first letter (or first two letters for two-word names) in accent, 600 weight, 11px / 16px. aria-hidden (the name is always next to it).

A. Directory (/companies), measured from the reference directory:
- Header: h1-page "Companies"; a full-width search input "Search {n} companies" (bg-input, 1px border-strong, h-8, trailing Search); an A–Z select at the right.
- A 5-column grid (4 below 1600px, 3 below 1280px, 2 below 768px, 1 below 480px), 16px gap, of Tiles: bg-card, 1px border-subtle, rounded-md, padding 12px 14px; row 1 = Monogram (24px) + company name 14/500 text-primary + ChevronRight; row 2 = a 14px Star icon + "{n} Questions" 12px text-muted (tracking 0.02em) and, if any, "· {k} experiences". Hover bg-row + border-hover.
- States: loading (15 skeleton tiles), no match, error.

B. Company page (/companies/{slug}), measured from the reference company pages:
- Left company sidebar, 200px, bg-base, 1px border-subtle right edge, own scroll: a collapse IconButton (PanelLeftClose) at the top, "‹ All companies" (13px text-muted), a search input (bg-input, h-8, "Search companies"), then 30px rows: Monogram 16px + name 13px text-muted; current row bg-raised + text-primary + aria-current. Below 1024px the sidebar becomes a select above the content.
- Main column (24px padding): header row = Monogram 40px + company name h1-page 24/500 text-strong + an Info IconButton (tooltip "Questions are tagged from published interview experiences and editor reviews"); a full-width search input "Search questions" and a "Status" filter button.
- Underline tabs (40px, 24px gap; active accent text + 2px accent underline; 1px border-subtle line under the strip): Overview (FileText) · Coding (Code2) · System Design (Boxes) · Low-Level Design (Blocks) · Experiences (MessagesSquare), each with a count in text-muted ("Coding 13").
- OVERVIEW tab (two columns from 1280px: article max 880px + a 260px right rail):
  - Article: h1 "{Company}'s interview process ({year})" 36/400 text-strong; a breadcrumb "Companies / {Company}" (12px tracking 0.04em text-muted); a 16:9 header band (rounded-md) with background banner-gradient containing only the Monogram (64px, on a white 12% overlay square) and the company name in 28/600 white — no co-branding, no external logos; then the guide as Markdown in prose 18px/1.75 text-primary (numbered round lists with bold lead-ins like "Recruiter screen:"), with a "Reviewed {month year}" line (12px text-muted, CalendarCheck icon) at the end.
  - Right rail (sticky): "On this page" (14/600 text-strong) and a list of section links with a 1px border left rail (14px text-muted; current section accent with a 2px accent marker), then "Practice" (14/600) with rows "Coding · 11 Qs", "System Design · 1 Q" (14px text-muted, links to the tabs).
  - No guide yet: an empty state "No interview guide for {Company} yet" + links to the other tabs.
- CODING / SYSTEM DESIGN / LOW-LEVEL DESIGN tabs: eyebrow 12px text-muted "Ordered by most frequently reported"; a list container (rounded-md, 1px border) with ProblemRows (60px, bg-row, border-row dividers): a status glyph, title row-title, a Tooltip trigger Info icon showing the source note ("Reported in 3 interview experiences · reviewed Oct 2026"), DifficultyBadge, Premium lock pill when locked, bookmark. Design rows use the design card meta "Statement · Editorial · Quiz".
  - Visitor preview: after the first two rows, a 400px tall area of eight placeholder rows (bg-raised bars of varying width inside bg-row rows, all under filter: blur(6px), aria-hidden) with an overlaid centered primary button "Sign in to see all {n} questions" (h-10) and below it 12px text-muted "Sourced from published interview experiences". Do not render the withheld items at all.
- EXPERIENCES tab: the community PostCards for this company (see the Community prompt for the card), newest first, with "Share your experience" (primary) at the top right.
Props: directory {items[] {slug, name, questionCount, experienceCount}, query}, company {slug, name, counts {coding, hld, lld, experiences}, overview? {markdown, toc[], reviewedAt, year}, tab, items[] {rank, kind, title, slug, difficulty, locked, sourceNote, reviewedAt, userStatus?, bookmarked?}, lockedCount?, signInRequired?, experiences[]}, sidebarCompanies[], viewer {signedIn}, callbacks onSearch, onTab, onSignIn, onToggleBookmark, onShareExperience.
```

---

## Prompt 14 — Community: feed, post page, composer, moderation queue

```text
Build the community screens of "Semicolan" inside the AppShell: (A) the Community feed with tabs "Interview experiences" and "Discussions" and a right-hand filter column, (B) the Post page with upvotes and a one-level comment thread, (C) the Composer for a new interview experience or discussion, (D) "My posts" with moderation status, and (E) the admin Moderation queue. Layout and colors are measured from the reference "Interview experiences" page: flat outlined cards on the page background, a violet primary "Share your experience" button and a filter sidebar. React + Tailwind + lucide-react, presentational; Markdown arrives already sanitized as HTML or as blocks.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
A. Feed (/community): content max-width 1080px, centered: a feed column (fluid, max 720px) and a 296px right column, 32px gap; the right column moves above the feed (collapsed into a "Filters" button + drawer) below 1024px.
- Header: h1 30/700 text-strong "Interview experiences" (or "Discussions"); underline tabs below it: "Interview experiences" (Briefcase) | "Discussions" (MessagesSquare).
- PostCard (16px apart): bg-base, 1px border-subtle, rounded-md, 20px padding. Row 1: Monogram 24px + company name 15/600 text-strong, " · " separators, level and role in 15px text-muted ("Junior · Software Engineer"), an outcome tag at the end (Offer = success text + CircleCheck; Rejected = text-muted + CircleX; Pending = info + Clock) and a ChevronRight. Title 18/700 text-strong (2 lines max). Excerpt 15px/1.6 text-muted, 2 lines, ellipsis. Meta 13px text-muted tracking 0.02em: "By {name} · Published {date}" ("Deleted user" in italic for anonymized authors). Footer: two 32px pills 8px apart — transparent, 1px border-subtle, rounded-md, px-3, 14px text-primary: ArrowBigUp + count (a toggle button with aria-pressed; pressed = accent icon + 1px accent border) and MessageSquare + count (a link to the comments). The card body is a link to the post; the vote pill is a separate button. Discussion cards drop the company row and show a problem chip (Code2 + title) when linked to a problem.
- Right column (sticky top 64px): primary full-width h-10 "Share your experience" with CirclePlus (or "New discussion" on that tab); under it 12px text-muted: "Experiences are reviewed within 24 hours." Then "Filter" (18/600 text-strong) and three groups with 14/500 text-muted labels:
  - Sort: radio group "Most popular" / "Most recent" (16px radios: 1px border-strong; checked accent-icon fill with a bg-base dot; labels 15px text-primary).
  - Level (experiences only): checkboxes Intern, New grad, Junior, Mid-level, Senior, Staff, Principal, each with a right-aligned count (12px text-muted tabular); checkboxes 16px, 1px border-strong, rounded-sm, checked = accent-icon fill + bg-base Check.
  - Company: a search input (bg-raised, 1px border-strong, h-10, Search icon, "Search companies…") and up to 10 checkbox rows with Monogram + name + count; "Show all" ghost link.
  Selected filters also show as removable chips above the feed with "Clear all".
- Pagination at the bottom: "Load more" secondary button + "Showing 20 of 75".
- States: loading (5 skeleton cards), empty ("No experiences match these filters" + "Clear filters"), error.

B. Post page (/community/posts/{id}): a 760px column. Back link "‹ Interview experiences"; the company row; title h1-page 24/700 text-strong; meta row; body in prose 16px/1.75 text-primary (headings, lists, inline code bg-chip, code blocks bg-surface, blockquotes with a 3px border-strong start border; links accent with an ExternalLink icon for external ones; NO images). Action row: the vote pill, a "Copy link" ghost (Link icon), "Report" ghost (Flag) opening a dialog (radio list of reasons: Spam, Abuse or harassment, Personal information, Copyright, Leaked confidential questions, Off topic, Other; optional details textarea 1,000 chars; primary "Send report"; afterwards "Thanks — our moderators will review it."), and for the author "Edit" / "Delete" (destructive confirm).
- Comments: "Comments ({n})" h2-section; the composer (MarkdownEditor, 4 KB counter, primary "Comment") or for visitors a "Sign in to join the discussion" button; then the thread oldest first: each comment = a 32px initial avatar, name 14/600 text-primary + time 12px text-muted, body 15px/1.7 text-secondary, actions (vote pill small h-7, "Reply", author "Edit"/"Delete"); replies indented 40px with a 1px border left rail (one level only — replies have no Reply button); deleted or hidden comments render "[deleted]" / "Hidden by moderators" in italic text-muted, keeping their replies.

C. Composer (/community/new): a two-column layout (form 720px + a 296px guidelines card). Interview-experience fields: Company (a combobox with Monogram options), Level (select), Role title (input), Outcome (segmented control Offer / Rejected / Pending / Withdrew), Title (input, 10–200 chars with counter), Body (MarkdownEditor, 20 KB, placeholder "Rounds, topics, what surprised you, how you prepared…"). Discussion: Title, Body and an optional problem picker. Guidelines card (bg-raised, rounded-md, 20px): ShieldCheck icon, "Before you post", bullets: "Share your experience, not confidential question text", "No names or personal details of interviewers", "Be kind — reviewed within 24 hours". Footer: primary "Submit for review" (experiences) / "Publish" (discussions) and ghost "Cancel". States: account too new (the form replaced by an info card "You can post from {time} — new accounts wait 24 hours"), submitting, field errors, success card "Submitted for review — we'll email you when it's published" with "View my posts".

D. My posts (/community/mine): a list of the user's PostCards with a status chip on each: "Pending review" (info Clock), "Published" (success CircleCheck), "Rejected" (error CircleX) with the moderator's note in a 12% error-tint box and "Edit and resubmit", "Hidden by moderators" (warning EyeOff).

E. Moderation queue (/admin/moderation, admins): underline tabs "Pending posts ({n})" | "Reports ({n})"; a table (bg-surface, 40px bg-raised header, 48px rows): item (title + author + age), category, reasons (Tags), and row actions — Approve (primary sm), Reject (secondary sm; opens a dialog with a required note), Hide / Restore, Dismiss report. Clicking a row opens a right drawer (560px) with the full text. Every action button shows a spinner while pending.
Props: feed {tab, sort, filters, facets {levels, companies[]}, items[] {...}, page, total}, post {...}, comments[] {id, author, bodyHtml, status, upvotes, viewerHasUpvoted, createdAt, replies[]}, composer {category, values, fieldErrors, state, accountReadyAt?}, myPosts[], queue {pending[], reports[]}, viewer {signedIn, isAdmin, displayName}, callbacks onVote(target, next), onReport, onSubmitComment, onReply, onEdit, onDelete, onSubmitPost, onModerate(action, id, note?), onFilterChange, onLoadMore, onSignIn.
```

---

## Prompt 15 — Projects: list and detail

```text
Build the Projects screens of "Semicolan" inside the AppShell: (A) the Projects list with tabs "Take-home" and "Portfolio" and a grid of cover cards, and (B) the Project detail page with the brief, an acceptance checklist and a starter-repository link. Semicolan never hosts or reviews the user's project. React + Tailwind + lucide-react, presentational.

=== SHARED BLOCK (same in every Semicolan prompt) ===
STACK & RULES
- React 18 + TypeScript function components, Tailwind CSS, icons from lucide-react only (stroke 1.75; 16px in text and buttons, 20px in the sidebar). No other UI kit, no CSS-in-JS.
- Presentational only. All data arrives through typed props; every action is a callback prop. Put preview data in a separate `*.fixtures.ts` file. Do NOT add fetch/axios/React Query, mock APIs, setTimeout-faked loading, localStorage, routing guards or auth logic. Local UI state (selected tab, open accordion, open dialog) is fine.
- Render every state the props allow: loading (skeleton blocks at final size, bg-raised, gentle opacity pulse), empty (icon in a bg-raised circle + one line + one action), error (AlertTriangle in error color + plain message + Retry callback), normal.
- Colors only through the CSS variables below, mapped in tailwind.config (classes like bg-base, bg-raised, text-muted, border-strong, text-accent). Never raw hex inside components; never Tailwind's built-in palette (gray-*, zinc-*, violet-*...).
- Dark is the default theme (values under :root, plus `color-scheme: dark`). Also emit the light values under [data-theme="light"]. Do not render a theme toggle.
- Brand: the product is "Semicolan". Wordmark = a ";" glyph in accent + "Semicolan" in text-strong, Inter 700. Never use other brand names, company logos, tool/product logos (use generic Lucide icons), testimonials, user counts, star ratings or invented statistics; numbers come from props. The only third-party marks allowed are the Google "G" and GitHub mark on their own sign-in buttons.
- Accessibility: WCAG 2.2 AA. :focus-visible ring = 2px solid accent, 2px offset, on every interactive element. Every status is icon + text label + color, never color alone. Icon-only buttons have aria-label and a tooltip. Buttons at least 32px tall; hit targets at least 24px. Use semantic landmarks (header, nav, main), real <button>/<a>, ARIA tabs pattern for tabs, dialogs with focus trap + Esc + focus return. No single-character keyboard shortcuts.

TOKENS (dark default → light)
Surfaces (a ladder, darkest to lightest; hover moves one step up):
  --bg-base #1c1c1c → #f7f7f8 (page, shell, sidebar, top bar)
  --bg-section #1e1e1e → #f7f7f8 (large dashboard sections)
  --bg-card #212121 → #ffffff (tiles, cards)
  --bg-input #232323 → #ffffff (inputs, filter buttons, dialogs' inner cards)
  --bg-inset #242324 → #f4f4f6 (example/pre blocks in prose)
  --bg-row #262626 → #ffffff (list rows)
  --bg-surface #282728 → #ffffff (workspace panes, editor, code blocks)
  --bg-raised #2e2e2e → #f0f0f2 (tab strips, toolbars, footers, active nav item, hover)
  --bg-chip #3b3a3a → #e9e9ec (inline code, value boxes, selected chip)
  --scrim rgb(53 53 53 / 0.6) → rgb(17 17 19 / 0.45) (modal backdrop)
Borders: --border-subtle #282828 → #ececef (top bar, sidebar edges) · --border #2e2e2e → #e4e4e7 (cards) · --border-row #3a3a3a → #e4e4e7 (row dividers) · --border-strong #75777f → #878a94 (EVERY input, select, checkbox, outlined button) · --border-hover #55527d → #d6c8f5 (hovered link cards)
Text: --text-strong #fafaf9 → #111113 (h1/h2) · --text-primary #ecebea → #1d1d20 · --text-prose #dad9da → #2c2c30 (long reading text) · --text-secondary #c3c4c8 → #45474d (lead text, text on bg-chip) · --text-muted #979ba5 → #5f6370 (meta, inactive tabs, placeholders; never on bg-chip) · --text-on-accent #ffffff · --text-on-highlight #1c1c1c
Brand: --accent-emphasis #581fa6 (primary button fill, same in both themes) · --accent-emphasis-hover #732bdf → #4a1a8c · --accent #ae80ec → #6b2fc4 (active tab text + underline, links, focus ring, active nav label) · --accent-icon #9156e7 → #7c3aed (check icons, checkbox/radio fill, progress fills; non-text only) · --accent-subtle #2b1c3e → #f1eafc (violet tag fill, with accent text) · --premium-surface #221f27 → #f6f1fe · --premium-border #633e9a → #b794f4 · --plan-featured linear-gradient(180deg,#27222d,#230841) → linear-gradient(180deg,#ffffff,#f1eafc) · --step-badge #9478d7 (text #1c1c1c) → #6b2fc4 (text #ffffff) · --highlight #f5c02a (the single featured pricing CTA only)
Status (text, icons, 1px borders, or a 12% tint background — never a solid fill under white text): --success #5cc560 → #197934 · --error #f4695c → #cb212d · --warning #eba84d → #8d5e00 · --info #6598d4 → #0550ae
Difficulty pill (text + 1px border / fill), labels are the words Easy, Medium, Hard: Easy #409057 / #0a1b12 → #197934 / #e6f4ea · Medium #bc6c0f / #261203 → #9a5b00 / #fdf0dc · Hard #f03345 / #2d0c02 → #c4202f / #fde8e8
Modules (measured on the hub, community and project screens): --bg-code-accent #323232 → #eef3fb with --code-accent #6d9dd6 → #0550ae (inline code inside theory answers) · --bg-source-chip #2b2826 → #f4f1ee with --source-chip-text #a2a5a3 → #45474d (source links, tech-stack chips) · --banner-gradient linear-gradient(135deg,#42197c,#1c308a) (company header band; white text) · --project-border #420f5d → #d6c8f5 (project cards) · Company monogram = the initial in accent on accent-subtle, never a logo
Syntax (code views and the editor theme): --syn-default #d4d4d4 → #1f1f1f · --syn-comment #77a260 → #2f7a2f · --syn-keyword #619bd4 → #0f4fc2 · --syn-control #c586c0 → #9b14c4 · --syn-string #ce9178 → #a31515 · --syn-number #b5cea8 → #0b7a52 · --syn-type #4ec9b0 → #1f6f86 · --syn-function #dcdcaa → #6f5420 · --syn-line-number #8e8e8e → #5f6370 (active line: text-primary) · --syn-selection rgb(88 31 166 / 0.35) → rgb(124 58 237 / 0.10)

TYPE
- UI: Inter, system-ui, sans-serif. Code: "Fira Code", "JetBrains Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace, ligatures off.
- Scale (px size / line height / weight): display 72/72/700 (tracking -0.01em) · h1-marketing 48/1.15/700 · h2-marketing 30/1.3/500 · h1-app 36/1.2/600 · h1-page 24/1.3/500 · h2-section 18/1.4/600 · title-problem 20/1.4/500 · lead 20/1.4/400 · body-lg 18/1.6/400 · row-title 16/1.5/400 · prose 15/2.0/400 · body 14/1.43/400 · meta 12/1.33/400 · eyebrow 11/1.45/500 tracking 0.04em · stat 30/1.2/500 · code 14/22 · code-sm 13/24. Use rem. All numbers use tabular-nums.

SHAPE, SPACE, DEPTH, MOTION
- 4px grid. Card padding 20px; tile padding 12px x 14px; grid gaps 12–16px; app page padding 16px (24px from 1280px).
- Radius: 4px inline code · 6px buttons, inputs, cards, tiles, panes, dialogs · 16px landing step cards · full for pills, avatars, the hero CTA and the top-bar Sign in button.
- Flat UI: depth comes from the surface ladder and 1px borders. Shadows only on popovers (0 8px 24px rgb(0 0 0/.45)) and dialogs (0 24px 64px rgb(0 0 0/.6)). No hover lift.
- Motion: color 120ms ease-out; accordions/tab underline 200ms; dialogs 180ms fade + 4px rise. Under prefers-reduced-motion use opacity-only fades.

COMPONENT STYLES
- Primary button: bg accent-emphasis, text-on-accent 14/500, h-8 px-3 rounded-md (h-10 large, h-14 rounded-full 18/600 + ArrowRight for the hero), hover accent-emphasis-hover. Disabled = aria-disabled, 40% opacity, reason in a tooltip.
- Secondary (outlined): transparent, 1px border-strong, text-muted label + icon; hover bg-raised + text-primary.
- Success-outline (ONLY the Submit button): 1px success border, success label + CloudUpload icon; hover 12% success tint.
- Ghost: text-muted, no border; hover bg-raised + text-primary. Link: accent, underline on hover (always underlined inside prose).
- Input/select: h-8 bg-input, 1px border-strong, rounded-md, px-3, 14px text, placeholder text-muted; error = error border + AlertCircle + 12px error message below (aria-describedby).
- Underline tabs: 40px strip, 14/500 label with 16px leading icon, 24px gap; active = accent text + 2px accent underline; inactive = text-muted, hover text-primary.
- Tile: bg-card, 1px border-subtle, rounded-md, p-3; row 1 = 16px icon + title (14, text-primary) + ChevronRight (text-muted) at the end; row 2 = meta count (12, text-muted); optional 2px progress track (bg-raised with accent-icon fill) + "9 / 24 solved". Hover bg-row + border-hover. Whole tile is one link.
- Section: bg-section, 1px border, rounded-md, p-5, header row = title (18/600 or 18/400 text-muted for dashboard labels) + optional ghost "View all ›".
- Badge: 20px tall, px-2, 12/500, 1px border in the text color. DifficultyBadge uses the difficulty colors (rounded-full in headers, rounded-md in rows). Premium pill = accent-emphasis fill, white 12/600, Lock icon when it marks locked content. Tag = accent-subtle fill + accent text.
=== END SHARED BLOCK ===

PAGE-SPECIFIC
A. List (/projects), measured from the reference projects page:
- Header: h1-page "Projects"; underline tabs "Take-home" (Briefcase) | "Portfolio" (LayoutGrid).
- A 3-column grid (2 below 1280px, 1 below 768px), 16px gap, of ProjectCards: bg-card, 1px project-border, rounded-md, overflow hidden. Top: a 16:9 cover <img> from props (alt = the title, object-cover) (covers are designed on a dark violet base; show a bg-surface placeholder while loading); a Premium pill with Lock pinned top-right over the cover when locked. Body (16px padding): title 22/500 text-strong; summary 15px/1.6 text-muted, 2 lines; meta row 12px text-muted: DifficultyBadge + Clock "~{h} h"; then a wrap of tech-stack chips (bg-source-chip, rounded-md, h-6, px-2, 12px source-chip-text; text names, no technology logos). Hover: border border-hover. Whole card is a link.
- States: loading (6 skeleton cards with a cover block), empty tab ("No portfolio projects yet"), error.

B. Detail (/projects/{slug}): a 960px column.
- Back link "‹ Projects"; the cover as a 21:9 rounded-md banner; title h1-page 30/700 text-strong; meta row (DifficultyBadge, Clock "~12 h", kind Tag); action row: primary "Open starter repository" (FolderGit2 icon, not the GitHub mark; opens in a new tab, rel="noopener noreferrer"), bookmark toggle, secondary "Mark as done" (SquareCheck; done state "Done" in success).
- Two columns from 1024px: main (brief) and a 296px side card.
  - Main: "Brief" (h2-section) + Markdown in prose 16px/1.75 text-primary; "Acceptance checklist" (h2-section) as a list of checkbox rows (16px checkbox, 15px text-secondary, line-through + text-muted when ticked) with a "{k} of {n} done" counter and a 4px progress bar — ticks are personal and passed in/out via props (stored on the device by the app).
  - Side card (bg-section, 1px border, rounded-md, 20px): "Suggested stack" with the tech chips, "What you'll practise" bullets, and a note in 12px text-muted: "Build it on your own machine; Semicolan doesn't host or review projects."
- Locked: the brief and checklist are replaced by the Premium panel (premium-surface, 1px premium-border, "This project brief is part of Premium", primary "See plans"); visitors see "Sign in" instead.
Props: list {kind, items[] {slug, title, summary, coverSrc, techStack[], difficulty, estimatedHours, locked, bookmarked?, done?}}, project {title, coverSrc, kind, difficulty, estimatedHours, briefMarkdown?, checklist?[], checked[], starterRepoUrl?, techStack[], locked}, viewer {signedIn, isPremium}, callbacks onTab, onToggleBookmark, onToggleDone, onToggleChecklist(index), onUpgrade, onSignIn.
```
