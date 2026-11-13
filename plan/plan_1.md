# Plan 1 — Landing page (`/`), static build

This is the blueprint for building the public landing page as a **static, presentational** page: fixture data, no backend calls. It is meant to be coded from top to bottom, one step at a time.

| | |
|---|---|
| Route | `/` (UI_UX_Brief §10.3 row 1; App_Flow §1) |
| Phase | Implementation_Plan **1.2 (frontend)**, item "Landing". This is the presentational half only; wiring (sign-in dialog, live counts, plans) follows the 1.1 backend acceptance |
| Binding sources, in order | UI_UX_Brief §0–§2, §6, §8, §9, §10.2 → UI_Component_Spec §3–§6 → UI_Generation_Prompts **Prompt 1** (section order and copy) → App_Flow §1 |
| Visual reference | `design-system/reference-images/13_landing_dark.jpg` (1280 × 5383). **Layout reference only**: where it disagrees with the docs, the docs win (§12 lists every difference) |
| Stack | React 19 + TypeScript, Tailwind 3.4, `lucide-react`, `react-router-dom` (already in `frontend/package.json`). **No new dependencies**: no Framer Motion, no headless UI kit, no font package |

**The rule used throughout.** Where the docs specify something, follow the docs. Where they are silent, follow the image, using only tokens. Where the image adds something the docs forbid, strip it.

---

## 0. Corrections to the request

Your brief asked for two things the binding docs rule out. The plan follows the docs:

| Asked for | What the docs say | What this plan does |
|---|---|---|
| "Button hover scaling" | UI_Component_Spec §4.1: *no press scale, hover never lifts*. Brief §8.3: "No lift, no shadow" | Hover is a **color change only** (120 ms). The only movement on hover anywhere is a 2 px nudge of a trailing chevron on link cards |
| "Navbar transparency on scroll" | Prompt 1 §1: "Sticky top nav, 64px, bg-base with 1px border-subtle bottom when scrolled" | The nav is **always opaque** `bg-base`. Its bottom border goes from transparent to `border-subtle` once the page has scrolled. No blur and no translucency |
| Matching "the visual design perfectly" | Brief §0.2 guardrails and UI_Component_Spec §6 (strip list) | Pixel fidelity to layout, spacing and hierarchy, **minus** fabricated data, brand names and features the spec removes (§12) |

---

## 1. Step 0 — Foundation (before any landing component)

The scaffold has an empty `tailwind.config.js` and a 5-line `index.css`. Nothing on the page can be token-correct until this step is done.

### 1.1 CSS variables — `frontend/src/styles/tokens.css`

Define every dark token from Brief §1.1 under `:root`, named `--color-{token}` (Brief §1: "for example `--color-bg-base`"). Set `color-scheme: dark`. Dark is the only theme in the MVP, so emit no light block.

- **Colors that need alpha modifiers** (`/12`, `/20`, `/40`) are stored as **RGB channels**, not hex. For example `--color-success: 92 197 96;`, mapped in Tailwind as `rgb(var(--color-success) / <alpha-value>)`. This applies to `success`, `error`, `warning`, `info`, `accent`, `accent-emphasis`, `accent-icon` and `border`.
  - Without this, "12% success tint" would need a raw `rgba()` in a component, which is not allowed.
- **Plain values**: the other surfaces, text and border tokens, `--color-scrim`, all `--syn-*`, `--plan-featured`, `--step-badge` and `--step-badge-text`, and `--highlight` and `--text-on-highlight`.
- **Two landing-only decoration tokens.** They exist so no hex or `rgba()` appears in components:
  - `--backdrop-grid-line: rgb(255 255 255 / 0.03)`
  - `--backdrop-glow: rgb(88 31 166 / 0.20)`, which is `accent-emphasis` at 20%
- **Shadows**:
  - `--shadow-popover: 0 8px 24px rgb(0 0 0 / .45)`
  - `--shadow-dialog: 0 24px 64px rgb(0 0 0 / .6)`

### 1.2 Tailwind theme — `frontend/tailwind.config.js` (`theme.extend`)

Map the variables so components use only these class names:

| Tailwind key | Class names produced | From |
|---|---|---|
| `backgroundColor` | `bg-base`, `bg-section`, `bg-card`, `bg-input`, `bg-inset`, `bg-row`, `bg-surface`, `bg-raised`, `bg-chip`, `bg-scrim`, `bg-accent-emphasis`, `bg-accent-emphasis-hover`, `bg-accent-subtle`, `bg-premium-surface`, `bg-step-badge`, `bg-highlight`, `bg-success/12` | Brief §1.1 |
| `textColor` | `text-strong`, `text-primary`, `text-prose`, `text-secondary`, `text-muted`, `text-on-accent`, `text-on-highlight`, `text-accent`, `text-accent-icon`, `text-success`, `text-error`, `text-warning`, `text-info`, `text-step-badge`, `text-syn-*` | Brief §1.1, §1.3 |
| `borderColor` | `border` (DEFAULT = `--color-border`), `border-subtle`, `border-row`, `border-strong`, `border-hover`, `border-premium`, `border-success` | Brief §1.1 |
| `outlineColor` | `outline-accent` | Focus ring |
| `backgroundImage` | `bg-plan-featured`, `bg-step-card` = `linear-gradient(180deg, var(--color-bg-card), var(--color-premium-surface))` | Prompt 1 §6–7 |
| `fontFamily` | `font-sans` = Inter, system-ui, sans-serif; `font-mono` = "Fira Code", "JetBrains Mono", "Cascadia Mono", Consolas, Menlo, "DejaVu Sans Mono", ui-monospace, monospace | Brief §2 |
| `fontSize` (rem, with line height) | `text-display` 4.5rem/1 · `text-h1-marketing` 3rem/1.15 · `text-h2-marketing` 1.875rem/1.3 · `text-lead` 1.25rem/1.4 · `text-body-lg` 1.125rem/1.6 · `text-row-title` 1rem/1.5 · `text-body` 0.875rem/1.43 · `text-meta` 0.75rem/1.33 · `text-eyebrow` 0.6875rem/1.45 · `text-stat` 1.875rem/1.2 · `text-code-sm` 0.8125rem/1.5rem | Brief §2.1 |
| `screens` | add `xs: '480px'` (Tailwind defaults `sm` 640, `md` 768, `lg` 1024, `xl` 1280 are kept) | Prompt 1 §3 needs a 480 px step |
| `maxWidth` | `max-w-marketing` = 75rem (1200 px) | Brief §8.1 |
| `borderRadius` | `rounded-xs` 4px, `rounded-md` 6px, `rounded-lg` 16px, `rounded-full` | Brief §8.2. **Override** Tailwind's `md` (6px matches) and `lg` (Tailwind's 8px → 16px) |
| `boxShadow` | `shadow-popover`, `shadow-dialog` | Brief §8.3 |
| `transitionDuration`, `transitionTimingFunction`, `keyframes`, `animation` | Exactly the block in UI_Component_Spec §4.2 (`duration-fast` 120, `duration-dialog` 180, `duration-base` 200, `duration-slow` 400; `animate-dialog-in/out`, `animate-fade-in`, `animate-skeleton`) | Spec §4.2 |

Two cautions on the mapping:

- **Class-name collision.** `text-primary` is a color and `text-body` is a size. Name no color `body` and no font size `primary`.
- **Disable the default palette** so nobody can reach for `gray-*` or `violet-*`. Put the token `colors` in `theme.colors` (not `extend`), keeping `transparent`, `current`, `white` and `black`.

### 1.3 Fonts (self-hosted, Brief §2)

- WOFF2 files, Latin subset: Inter 400/500/600/700 and Fira Code 400/500. Put them in `frontend/src/assets/fonts/`, with `@font-face` rules in `src/styles/fonts.css` and `font-display: swap`.
- No Google Fonts link and no `@fontsource` package: that would be a new dependency, which needs approval. Download the files once from the font projects' releases and commit them.
- Preload Inter 400 and 700 in `index.html` (`<link rel="preload" as="font" type="font/woff2" crossorigin>`), because the hero headline is the LCP element.

### 1.4 Global CSS — `frontend/src/index.css`

- `@import` tokens and fonts, then the `@tailwind` layers.
- **`html`:**
  - `bg-base text-primary font-sans antialiased`
  - `scroll-behavior: smooth` (the reduced-motion block below resets it)
  - `scroll-padding-top: 5rem`, so anchor targets are not hidden under the 64 px sticky nav (WCAG 2.4.11)
- **`body`:** `bg-base` (Implementation_Plan 1.2 acceptance: computed `rgb(28, 28, 28)`).
- **Focus ring** on all interactive elements: `:focus-visible { outline: 2px solid rgb(var(--color-accent)); outline-offset: 2px; }`, with no transition. Never `outline: none` without a replacement.
- **`font-variant-numeric: tabular-nums`** utility class `tabular-nums` (Tailwind built-in) on every number.
- **The reduced-motion block** from UI_Component_Spec §4.2, verbatim.
- **`@media (prefers-contrast: more), (forced-colors: active) { .marketing-backdrop { display: none; } }`** (Brief §8.3).
- `index.html`:
  - Keep `lang="en"` and `<title>Semicolan</title>`.
  - Add `<meta name="description" content="Practice in a real in-browser IDE, rehearse timed mock tests, and see where you stand — priced for students, in rupees.">`.
  - Add `<meta name="theme-color">` with the `bg-base` value. This is the one hex outside components, and it is allowed because `index.html` is not a component.

### 1.5 Small shared helpers

| File | Content |
|---|---|
| `src/config.ts` | `WARMUP_PROBLEM_SLUG` (App_Flow §1: "its slug lives in frontend configuration"), `SUPPORT_EMAIL`. Read from `import.meta.env` with a dev default. See §13 open item 3 |
| `src/lib/format.ts` | `formatCount(n)` = `Intl.NumberFormat('en-IN')`; `formatRupees(paise)` = `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })` on `paise / 100`; `formatDuration(days)` → "30 days" / "1 day" |

**Done when:**

- The dev server shows the existing placeholder on a `#1c1c1c` body.
- A throwaway `<div class="bg-card border rounded-lg text-display">` renders with the right values.
- `grep -rE '#[0-9a-fA-F]{3,8}' src/components src/features` returns nothing.

---

## 2. File and component tree

UI_Component_Spec §3 assigns three layers: `ui/` → `patterns/` → `features/`. A layer imports only from the layers below it.

```
frontend/src/
├── config.ts
├── lib/format.ts
├── styles/{tokens.css, fonts.css}
├── assets/fonts/*.woff2
├── components/
│   ├── ui/
│   │   ├── Button.tsx            variant primary|secondary|highlight|ghost|link; size sm|md|lg|xl; asChild-free: renders <button> or <Link>/<a> via `href`
│   │   ├── IconButton.tsx        required `label` → aria-label + Tooltip
│   │   ├── Tooltip.tsx
│   │   ├── Kbd.tsx               "Ctrl K" / "⌘ K" by platform
│   │   ├── Skeleton.tsx
│   │   └── Wordmark.tsx          ";" in text-accent + "Semicolan" in text-strong, 700
│   └── patterns/
│       ├── StatCard.tsx
│       ├── Accordion.tsx         (AccordionItem inside)
│       └── Drawer.tsx            focus trap, Esc, focus return, start edge
├── features/landing/
│   ├── landing.types.ts          LandingViewProps, Plan, Faq, ModuleLink…
│   ├── landing.fixtures.ts       all mock data (§11)
│   ├── LandingView.tsx           presentational page: composes every section from props
│   └── components/
│       ├── MarketingContainer.tsx      max-w-marketing mx-auto px-4
│       ├── MarketingBackdrop.tsx       variant "grid" | "glow", aria-hidden
│       ├── SectionHeading.tsx          h2 + optional sub, align start|center
│       ├── MarketingNav.tsx
│       │   ├── ProductsMenu.tsx        disclosure + popover panel
│       │   ├── NavSearchTrigger.tsx    looks like an input, is a <button>
│       │   └── MobileNavDrawer.tsx
│       ├── HeroSection.tsx
│       │   └── HeroMontage.tsx         uses AppFrame + VerdictCard
│       ├── AppFrame.tsx                the "imitation app window" shared by hero and walkthrough
│       ├── StatsSection.tsx            ModuleChips + StatCard grid
│       ├── ModuleChips.tsx
│       ├── ProblemSection.tsx
│       ├── WalkthroughSection.tsx
│       │   ├── FeatureRow.tsx
│       │   └── visuals/{IdeVisual, MockTestVisual, LeaderboardVisual}.tsx
│       ├── HowItWorksSection.tsx
│       │   └── StepCard.tsx
│       ├── PricingSection.tsx
│       │   └── PlanCard.tsx            (domain layer per Spec §3.3; Free card = PlanCard variant="free")
│       ├── FaqSection.tsx
│       └── MarketingFooter.tsx         (Spec §3.3 "Footer")
└── pages/
    └── LandingPage.tsx           container: passes fixtures + callbacks to LandingView
```

- `App.tsx`: route `/` renders `LandingPage`. Delete the placeholder `pages/HomePage.tsx`, because `/` is the landing page and the Home dashboard lives at `/home` (App_Flow §7).
- `LandingView` is pure: props in, callbacks out (Prompt 1 Props line). That lets the same component later take live data from `LandingPage` without changes.

### 2.1 Nesting

```
<LandingPage>
  <LandingView {...fixtures} on…>
    <a href="#main" class="skip-link">Skip to content</a>
    <MarketingNav/>                     header (sticky)
    <main id="main">
      <HeroSection>                     MarketingBackdrop grid · pill · h1 · lead · CTAs · meta | HeroMontage
      <StatsSection>                    ModuleChips · SectionHeading · StatCard × 4
      <ProblemSection>                  SectionHeading · 6 pain points
      <WalkthroughSection>              SectionHeading · FeatureRow × 3 (each with a visual in AppFrame)
      <HowItWorksSection id=how-it-works>   MarketingBackdrop glow · SectionHeading · StepCard × 4
      <PricingSection id=pricing>       SectionHeading · PlanCard (free) + PlanCard × n · payment line
      <FaqSection id=faq>               SectionHeading · Accordion
    </main>
    <MarketingFooter/>
  </LandingView>
</LandingPage>
```

**Heading outline.** The page has one `h1` (the hero headline). Every section title is an `h2`. Step titles, plan names and footer column headings are `h3`. Visual size never decides the level: Prompt 1's "h1-marketing" is a **type token**, not a heading level.

---

## 3. Shared primitives used on this page

Only what the landing page needs is built now. Each one is complete; no stubs.

### 3.1 `Button` (Brief §9.1, Spec §3.1)

| Variant | Classes |
|---|---|
| base (all) | `inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors duration-fast ease-out` + focus ring (global) |
| `primary` | `bg-accent-emphasis text-on-accent hover:bg-accent-emphasis-hover` |
| `secondary` | `border border-strong text-muted hover:bg-raised hover:text-primary` (transparent fill) |
| `highlight` | `bg-highlight text-on-highlight hover:bg-[image:linear-gradient(rgb(0_0_0/0.08),rgb(0_0_0/0.08))]`. Brief §9.1: "8% black overlay". Make it a named `bg-overlay-dark` utility in config so no `rgb()` sits in the component |
| `ghost` | `text-muted hover:bg-raised hover:text-primary` |
| `link` | `text-accent underline-offset-4 hover:underline` |

| Size | Classes |
|---|---|
| `sm` | `h-7 px-2.5 text-body rounded-md` |
| `md` (default) | `h-8 px-3 text-body rounded-md` |
| `lg` | `h-10 px-4 text-body rounded-md` |
| `xl` (hero only) | `h-14 px-7 text-[1.125rem] font-semibold rounded-full` + trailing `ArrowRight` 16 |
| nav "Sign in" | `md` with `h-9 px-4 rounded-full` (Prompt 1 §1: "h-9") |

- Renders `<a>`/`<Link>` when given `href`/`to`, otherwise `<button type="button">`.
- Icons are `lucide-react` with `strokeWidth={1.75}` at size 16 and `aria-hidden`.
- **No** `active:scale-*`, no `hover:-translate-y-*` and no `hover:shadow-*` (Spec §4.1).

### 3.2 Others

- **`Wordmark`**:
  - `inline-flex items-baseline gap-0.5 font-bold text-[1.25rem] leading-none`
  - The glyph `;` is `text-accent`; "Semicolan" is `text-strong`.
  - Rendered as a `<Link to="/" aria-label="Semicolan home">`.
- **`Kbd`**:
  - `inline-flex h-5 items-center rounded-xs border border-row bg-raised px-1.5 font-sans text-meta text-muted`
  - Text "Ctrl K", or "⌘ K" when `navigator.platform`/`userAgentData` says macOS.
- **`Skeleton`**:
  - `rounded-md bg-raised animate-skeleton` at the final width and height.
  - Shown only after 150 ms (Spec §5.1). A `useDelayedFlag(150)` hook lives in `src/hooks/`.
- **`StatCard`** and **`Accordion`**: see §5.3 and §5.8.
- **`Drawer`**: see §5.1 (mobile nav).

---

## 4. Page frame

| Element | Classes and behavior |
|---|---|
| Page wrapper (`LandingView` root) | `min-h-screen bg-base text-primary` |
| Skip link | `sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-raised focus:px-3 focus:py-2 focus:text-primary` → `#main` |
| `MarketingContainer` | `mx-auto w-full max-w-marketing px-4` (16 px gutters; at ≥ 1232 px the container's own margin takes over) |
| `main` vertical rhythm | `flex flex-col gap-32` → **128 px between sections** (Brief §8.1). Below 768 px: `gap-24` (96 px), so small screens are not mostly empty space. The docs specify only the desktop value; this is a design-silent choice |
| Heading → content | `mt-12` (48 px) on the element after every `SectionHeading` |
| Section anchor offset | Handled globally by `scroll-padding-top: 5rem` (§1.4) |

### 4.1 `MarketingBackdrop` (Brief §8.3; Prompt 1 Layout)

- **Root:** `marketing-backdrop pointer-events-none absolute inset-0 -z-10`, `aria-hidden="true"`. The parent section is `relative isolate`.
- **`variant="grid"`** (behind the hero and section headings):
  - `background-image`: two `linear-gradient`s using `var(--backdrop-grid-line)`, 1 px lines on a `32px 32px` `background-size`.
  - `mask-image: radial-gradient(ellipse 60% 50% at 50% 30%, black 40%, transparent 100%)` (plus `-webkit-mask-image`).
  - Define this as a `.bg-grid-fade` component class in `index.css` (`@layer components`), so the gradients aren't written inline.
- **`variant="glow"`** (behind the step cards and the featured pricing card):
  - An absolutely centered `size-[37.5rem]` (600 px) disc.
  - `background: radial-gradient(circle, var(--backdrop-glow), transparent 70%)`.
  - Class `.bg-accent-glow`.
- Both are removed under `prefers-contrast: more` and `forced-colors` (§1.4).
- **Image check:** the reference shows the grid across the whole hero and fading out at the stats row, and a violet glow behind "Four steps" and pricing. That matches.

---

## 5. Sections, top to bottom

Positions are measured from the 1280 px-wide reference. Every value is snapped to the 4 px grid and to the token or prompt value; where the measurement and the docs differ, the docs are used.

### 5.1 `MarketingNav`: sticky top nav (Prompt 1 §1; Brief §10.2)

**Structure:** `<header>` > `MarketingContainer` > `<nav aria-label="Main">`.

| Part | Classes |
|---|---|
| `header` | `sticky top-0 z-40 h-16 bg-base border-b transition-colors duration-fast` + `border-transparent` at the top → `border-subtle` once scrolled |
| inner row | `flex h-16 items-center gap-8` |
| left | `Wordmark` |
| links (≥ 768 px) | `hidden md:flex items-center gap-6`. Each link is `text-[1rem] text-primary hover:text-accent transition-colors duration-fast` |
| right | `ml-auto flex items-center gap-3`: `NavSearchTrigger`, then the Sign in button |

**Scroll detection.** An `IntersectionObserver` watches a 1 px sentinel `<div>` placed at the top of `main`; when it leaves the viewport, set `data-scrolled` on the header. No `scroll` listener, so no work on every frame. Styles are `data-[scrolled=true]:border-subtle`.

**Links, in order:**

1. **Products** with `ChevronDown` 16. This is a `<button aria-expanded aria-controls>` that opens `ProductsMenu`.
2. **How it works** → `#how-it-works`.
3. **Community** → `/community`.
4. **Pricing** → `#pricing`.

**`ProductsMenu`** (a disclosure of links, *not* `role="menu"`, because these are navigation links):

- **Panel:**
  - `absolute left-0 top-full mt-2 w-[36rem] rounded-md border border-row bg-input p-2 shadow-popover`
  - Enters with `animate-dialog-in` and exits with `animate-dialog-out`.
- **Grid:** `grid grid-cols-2 gap-1`. Each item is a `<Link>` with `flex gap-3 rounded-md p-3 hover:bg-raised transition-colors duration-fast`, containing:
  - an icon of 20 px in `text-accent-icon`
  - the name, `text-body font-medium text-primary`
  - a description, `text-meta text-muted`
- **Closing:**
  - Esc closes it and returns focus to the trigger.
  - A click outside closes it.
  - Tab past the last item closes it.
  - Choosing a link closes it.
- **Items:** 8 modules, with the icons and descriptions in §11.3.

**`NavSearchTrigger`** (Brief §9.12; the palette itself is a later milestone):

- **≥ 1024 px:** `hidden lg:flex h-8 w-60 items-center gap-2 rounded-md border border-strong bg-input px-3 text-body text-muted hover:bg-raised transition-colors duration-fast`, containing:
  - `Search` 16
  - "Search problems" (the reference says "Search challenges…"; the brief says it is **problem** search)
  - `Kbd` "Ctrl K", pushed to the end with `ml-auto`
- **< 1024 px:** `IconButton` `Search`, `label="Search problems"`.
- **Element:** a `<button aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">` that calls `onOpenSearch`.
- **Shortcut:** a global `keydown` listener for Ctrl/Cmd+K, registered by `LandingView`, calls the same prop. There is never a `/` shortcut (WCAG 2.1.4).

**Sign in:** `Button` primary, `h-9 rounded-full px-4`, label "Sign in", calls `onSignIn`.

**Responsive:**

| Width | Behavior |
|---|---|
| ≥ 1024 | Everything inline, as above |
| 768–1023 | Links inline; search collapses to the icon button |
| < 768 | Links hidden. The right side holds the search `IconButton`, then the Sign in button (`h-9 px-3`), then a Menu `IconButton` (`Menu` 20, `label="Open menu"`, `aria-expanded`) |

**`MobileNavDrawer`** (< 768 px; Spec §4.3 Drawer row):

- **Panel:**
  - `fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] bg-base border-r border-subtle p-4`
  - Slides in with `transition-transform duration-base ease-out`, from `-translate-x-full` to `translate-x-0`.
- **Scrim:** `fixed inset-0 z-40 bg-scrim animate-fade-in`.
- **Contents:**
  - The Wordmark and a close `IconButton` (`X`, "Close menu").
  - A "Products" group label in `text-eyebrow uppercase tracking-[0.04em] text-muted`, followed by the 8 module links: `flex h-11 items-center gap-3 rounded-md px-2 text-body text-primary hover:bg-raised`, with an icon of 20 px. The rows are 44 px tall for touch targets.
  - Then How it works, Community and Pricing.
- **Behavior:**
  - Focus is trapped while it is open, and Esc closes it.
  - Focus returns to the Menu button.
  - `body` gets `overflow-hidden` while it is open.
  - Choosing an anchor link closes it first, then scrolls.

**Stripped from the reference:** the avatar circle at the far right of the nav. A visitor has no avatar; the signed-in state is the app shell, not this nav.

---

### 5.2 `HeroSection` (Prompt 1 §2)

| Part | Classes and content |
|---|---|
| `section` | `relative isolate pt-12 md:pt-16 lg:pt-20` + `MarketingBackdrop variant="grid"`; `aria-labelledby="hero-title"` |
| grid | `grid items-center gap-12 lg:grid-cols-[11fr_9fr] lg:gap-10` (the 55/45 split; stacks below 1024) |

**Left column, in order:**

1. **Pill.**
   - A `<Link to="/problems">` with `inline-flex h-8 items-center gap-2 rounded-full border bg-raised px-3 text-[0.8125rem] text-primary hover:bg-chip transition-colors duration-fast`.
   - Text: "`{formatCount(problemCount)}` problems · C, C++, Java, Python 3", followed by `ArrowRight` 14.
   - If `problemCount` is undefined, show only "C, C++, Java, Python 3". Never show a guessed number.
   - While loading, render a `Skeleton` of `h-4 w-10` inline in place of the number.
2. **Headline** `<h1 id="hero-title">`:
   - `mt-6 text-[3rem] leading-none md:text-display font-bold tracking-[-0.01em] text-strong text-balance`. It is 48 px below 768 px and 72 px from 768 px up (Brief §2.1).
   - Copy: "Crack your placement **coding round.**"
   - "coding round." is wrapped in `<span class="text-accent">`, as in the reference. The docs don't color it, and `accent` on `bg-base` is 5.8:1, so it is kept.
3. **Sub-copy** `<p>`: `mt-6 max-w-[35rem] text-lead text-secondary`. Copy: "Practice in a real in-browser IDE, rehearse timed mock tests, and see where you stand — priced for students, in rupees."
4. **Buttons:** `mt-10 flex flex-col gap-3 sm:flex-row`.
   - `Button` primary `xl`: "Try a problem now", calls `onTryProblem` (navigates to `/problems/{WARMUP_PROBLEM_SLUG}`; App_Flow §1).
   - `Button` secondary `xl` (`h-14 rounded-full`, no arrow): "Browse problems", calls `onBrowse` (`/problems`).
   - Below 640 px both are `w-full`.
5. **Meta line:** `mt-4 text-body text-muted`, reading "Free to start · No card needed".

**Right column: `HeroMontage`** (`relative`, `aria-label` on the frame; see §6):

- An `AppFrame` with the IDE contents (§6.1).
- `VerdictCard`, which overlaps the frame:
  - `absolute -bottom-6 left-6 hidden sm:flex items-center gap-2 rounded-md border border-success/40 bg-success/12 px-3 py-2 shadow-popover`
  - Contents: `CircleCheck` 16 `text-success`, then "Accepted" in `text-body font-medium text-success`, then "· 42 ms" in `text-body text-secondary tabular-nums`.
  - In the reference it sits inside the frame's lower-right; Prompt 1 says "slight overlap of a second smaller card", so it overlaps the bottom edge.
- **Below 640 px** the card moves into the frame's footer row instead of overlapping: render a second, static copy there under `sm:hidden`.

**Responsive:**

| Width | Behavior |
|---|---|
| ≥ 1024 | Two columns, vertically centered |
| 640–1023 | Stacked. Text first, montage below at full container width, `max-w-[40rem]` |
| < 640 | Stacked. The montage hides its statement column and shows the code only (§6.1). Buttons are full width |

**Stripped from the reference:** the three colored "traffic-light" window dots. They are not in Prompt 1 and would need non-token colors.

---

### 5.3 `StatsSection` ("What's inside", Prompt 1 §3)

The reference order is kept: module chips, then the heading, then the stat cards. That also satisfies Prompt 1, which puts the chips "above the cards".

| Part | Classes and content |
|---|---|
| `section` | `aria-labelledby="stats-title"` |
| `ModuleChips` | `<nav aria-label="Modules">` > `<ul class="flex flex-wrap justify-center gap-2">`; each chip is a `<Link>` with `inline-flex h-9 items-center gap-2 rounded-md border bg-base px-3 text-body text-primary hover:bg-raised transition-colors duration-fast` plus an icon of 16 px in `text-muted`. There are 8 chips (§11.3) |
| heading | `<h2 id="stats-title" class="mt-16 text-center text-[1.375rem] font-bold text-strong">Everything you need for the coding round</h2>`. 22/700 per Prompt 1. It is not a scale token, so it is the one arbitrary size here |
| grid | `mt-12 grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]`. `auto-fit` keeps the row full if a card is hidden |

**`StatCard`** (Brief §9.5 "Stat card"; Spec §3.2):

- **Root:** a `<Link>` with `group flex flex-col items-center rounded-md border bg-card p-6 text-center transition-colors duration-fast hover:bg-row hover:border-hover`.
- **Label row:** `flex items-center gap-2 text-body text-secondary`, holding the icon (16, `text-muted`), the label, and a `ChevronRight` 16 with `text-muted transition-transform duration-fast group-hover:translate-x-0.5`.
- **Number:** `mt-3 text-stat text-strong tabular-nums`.
- **The four cards:**

  | Label | Icon | Count | Link |
  |---|---|---|---|
  | Problems | `Code2` | `problemCount` | `/problems` |
  | System & low-level design | `Boxes` | `designCount` | `/design/hld` |
  | Companies | `Building2` | `companyCount` | `/companies` |
  | Theory & quizzes | `BookOpen` | `theoryCount` | `/devops` |

- **States:**
  - Loading: the number becomes a `Skeleton` of `h-9 w-20` (after 150 ms).
  - Count `undefined`: the card is not rendered.
  - All four `undefined`: the grid is not rendered; the chips and heading stay.

**Responsive:** 4 columns from 768 px, 2 columns from 480 px, 1 column below that. The chips wrap and stay centered.

**Stripped from the reference:**

- The uppercase labels "PROBLEMS" and so on, with the icon on the right. The docs specify a centered label row.
- The sub-lines "Arrays to DP with hidden tests" and "TCS, Infosys, Amazon, Wipro archives". Company names are forbidden (Brief §0.2).
- The sub-heading "Calibrated specifically for engineering placement assessments across Indian colleges". It is not in the docs and is an unverifiable claim.
- The hard-coded "650+ / 120 / 48 / 340" (Spec §6). In this static build the numbers come from fixtures (§11.1), never from markup.

---

### 5.4 `ProblemSection` (Prompt 1 §4)

| Part | Classes and content |
|---|---|
| `section` | `relative isolate` + `MarketingBackdrop variant="grid"` behind the heading; `aria-labelledby="problem-title"` |
| `SectionHeading` (start-aligned) | h2 `text-h1-marketing font-bold text-strong max-w-[40rem] text-balance` "Placement prep shouldn't feel like guesswork"; sub `<p class="mt-4 text-h2-marketing font-medium text-primary">` "Most students hit the same walls." |
| list | `<ul class="mt-12 grid gap-x-12 gap-y-8 md:grid-cols-2">` |
| item | `<li class="flex gap-4">` + `CircleAlert` 20 `text-error shrink-0 mt-1` (`aria-hidden`) + `<span class="text-body-lg text-secondary">` |

The six items, in order:

1. Problem sets built for interviews abroad, not campus rounds
2. Prices in dollars that a student budget can't stretch to
3. No way to rehearse a timed test before the real one
4. Not knowing which topics you're weakest in
5. Practising alone with no sense of where you stand
6. Wrong answers with no clue what went wrong

**Responsive:** 2 columns from 768 px, 1 column below that. The heading wraps; `text-balance` avoids a one-word last line.

**Stripped from the reference:**

- The large bordered panel and the per-item boxes. Prompt 1 specifies an open two-column list.
- The "THE PROBLEM" eyebrow, which the docs don't have.

---

### 5.5 `WalkthroughSection` (Prompt 1 §5)

| Part | Classes and content |
|---|---|
| `section` | `relative` + `aria-labelledby="walkthrough-title"` |
| `SectionHeading` (start) | h2 `text-h1-marketing font-bold text-strong` "One place to practise, test and improve"; sub `<p class="mt-4 max-w-[40rem] text-body-lg text-muted">` "Solve problems, rehearse timed tests and track your rank — all in one account." |
| rows wrapper | `relative mt-12 flex flex-col gap-16 lg:gap-24 lg:pl-10` |
| decorative rail (≥ 1024) | `hidden lg:block absolute left-0 top-2 bottom-2 w-px bg-border` (`aria-hidden`); each `FeatureRow` adds a `size-2 rounded-full bg-accent-icon` dot at `-left-[calc(2.5rem+3.5px)] top-3`, aligned on the rail |

**`FeatureRow`:**

- **Root:** `relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12`.
- **Alternation:** row b uses `lg:[&>[data-visual]]:order-first`, so its visual sits on the left. Rows a and c keep text on the left.
- **Text column:**
  1. Icon box: `grid size-10 place-items-center rounded-md border bg-card`, holding the icon at 24 px in `text-accent-icon`.
  2. h3: `mt-6 text-[1.875rem] md:text-[2.25rem] leading-[1.2] font-bold text-strong`. Prompt 1 asks for 36/700, which is not a scale token, so it uses an arbitrary size and steps down to 30 below 768.
  3. Paragraph: `mt-4 max-w-[32rem] text-body-lg text-secondary`.
  4. `Button` primary `lg`, with `mt-8`.
  5. For row a only, "See also": `mt-4 text-body text-muted`, with `Button` link items separated by "·".
- **Visual column:** `data-visual`. An `AppFrame` with one of the visuals in §6.

| Row | Icon | Title | Body | Button → | Visual |
|---|---|---|---|---|---|
| a | `Code2` | Solve in a real IDE | Write C, C++, Java or Python 3 in a full editor. Run the sample tests, then submit against every hidden test and get a clear verdict. | "Start with Arrays" → `/problems?topic=arrays`; See also: Dynamic Programming → `/problems?topic=dynamic-programming`, Trees → `/problems?topic=trees` | `IdeVisual` |
| b | `Timer` | Rehearse under time pressure | Timed mock tests with a server-side clock, a final report and per-problem verdicts — the closest thing to the real round. | "See mock tests" → `/mock-tests` | `MockTestVisual` |
| c | `Trophy` | See where you stand | Earn difficulty-weighted points for every first solve and track your weekly rank. | "View leaderboard" → `/leaderboard` | `LeaderboardVisual` |

**Responsive:** below 1024 px every row is text first, visual below, and the rail is hidden.

**Stripped from the reference:**

- The "ENGINEERED FOR CLARITY" eyebrow.
- The jargon sub-copy ("continuous calibration pipeline…").
- Secondary-styled buttons on rows b and c. Prompt 1 says primary for all three.
- "…across Indian engineering institutions" in row c's body.
- Visual content, covered in §6.

---

### 5.6 `HowItWorksSection` (Prompt 1 §6)

| Part | Classes and content |
|---|---|
| `section` | `id="how-it-works" relative isolate` + `MarketingBackdrop variant="glow"` centered behind the grid; `aria-labelledby="how-title"` |
| `SectionHeading` (center) | h2 `text-center text-h1-marketing font-bold text-strong text-balance` "Four steps to your first verdict"; sub `<p class="mt-4 text-center text-[1.125rem] text-muted">` "Start free in under a minute." |
| list | `<ol class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">` |

**`StepCard`** (an `<li>`; not a link):

- **Root:** `flex min-h-[18.5rem] flex-col rounded-lg border bg-step-card p-8 transition-colors duration-fast hover:border-hover focus-within:border-hover`. The minimum height is 296 px.
- **Badge:** `grid size-14 place-items-center rounded-full bg-step-badge text-[1.25rem] font-bold text-step-badge` holding the number. It is `aria-hidden`, because `<ol>` already numbers the steps.
- **Title** (h3): `mt-6 text-[1.25rem] font-bold text-strong`.
- **Body:** `mt-3 text-[1rem] leading-[1.6] text-muted`.

| # | Title | Body |
|---|---|---|
| 1 | Sign up free | Create your account in seconds with Google or GitHub. No payment details needed. |
| 2 | Pick a topic | Choose a topic like Arrays, Graphs or Dynamic Programming and start with Easy problems. |
| 3 | Solve and submit | Write your solution in the browser editor, run the sample tests, then submit against the hidden tests. |
| 4 | Take a mock test | Try the free timed mock test and get a report with a verdict for every problem. |

**Responsive:** 4 columns at ≥ 1024 px, 2 columns at 640–1023 px, 1 column below that. On 1 column, drop the minimum height (`sm:min-h-[18.5rem]`) so cards fit their content.

**Stripped from the reference:**

- The "WORKFLOW" eyebrow.
- The rounded-square badges. The docs specify a 56 px circle.
- The footers "01 / SETUP", "02 / SYLLABUS" and so on.
- "TCS NQT / Infosys interview packs" in step 2.
- "Instant percentile analytics" in step 4, because percentiles are banned.

---

### 5.7 `PricingSection` (Prompt 1 §7; Brief §9.5)

| Part | Classes and content |
|---|---|
| `section` | `id="pricing" relative isolate` + `MarketingBackdrop variant="glow"` positioned behind the featured card's column (desktop) / centered (mobile); `aria-labelledby="pricing-title"` |
| `SectionHeading` (center) | h2 `text-center text-h1-marketing font-bold text-strong` "Simple prices, in rupees"; sub `<p class="mt-4 text-center text-[1.125rem] text-secondary">` "One-time payment. No auto-renewal. Extend any time." |
| grid | `mx-auto mt-12 grid max-w-[60rem] items-stretch gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))]`. Free plus n plans fill the row whatever n is |
| payment line | `mt-8 text-center text-body text-muted`: "Pay with UPI, cards or netbanking via Razorpay · 7-day refund if you haven't started a mock test — " + `Button` link "Refund policy" |

**`PlanCard`** (an `<article aria-labelledby>`):

| Part | Classes |
|---|---|
| root | `relative flex flex-col rounded-md border bg-card p-6` |
| name (h3) | `text-[1.25rem] font-normal text-muted` |
| price row | `mt-4 flex items-baseline gap-1`. Price: `text-stat text-strong tabular-nums` (`formatRupees(pricePaise)`). Duration: `text-[1rem] text-secondary` "/ {formatDuration(durationDays)}" |
| billing meta | `mt-1 text-meta text-muted` "Billed once · access for {durationDays} days" |
| features | `<ul class="mt-6 flex-1 space-y-3">`; each `li` is `flex gap-3 text-[1rem] text-secondary` + `Check` 16 `text-accent-icon shrink-0 mt-1` |
| CTA | `mt-8 w-full`; `Button` `lg` |

**Variants:**

| Variant | Differences |
|---|---|
| `free` (always first, static) | Name "Free"; price "₹0" with no duration; meta "No card needed"; CTA `secondary` "Start free" → `onSignIn` |
| premium (each plan in `plans`) | Name = `plan.name` from the API, used as is; CTA `primary` "Get Premium" → `onChoosePlan(code)` |
| featured (the single plan with `isFeatured`) | `bg-plan-featured border-premium` (replaces `bg-card border`); CTA `highlight` "Get Premium"; tag `absolute -top-3 right-4 inline-flex h-6 items-center rounded-md border border-success bg-base px-2 text-meta text-success` "Best value" |

**Feature lists** (Prompt 1, with one correction):

- **Free:**
  - "Free problems in every topic". Prompt 1 says "40+ free problems", but Spec §6 bans hard-coded counts; see §13 open item 5.
  - "Full IDE with Run and Submit"
  - "Weekly leaderboard"
  - "1 free mock test"
- **Premium** (the same list for every premium plan):
  - "Every problem in the catalog"
  - "Unlimited mock tests with reports"
  - "Editorial solutions for every problem"
  - "All of Free"

**Responsive:**

- Three cards fit one row at ≥ 1024 px.
- At 640–1023 px, `auto-fit` gives 2 + 1. The lone card stays the minimum width, left-aligned. Accept that, or switch to `md:grid-cols-2` with the Free card spanning (`md:col-span-2 lg:col-span-1`); choose during the visual check.
- Below 640 px, one column. The featured card stays in API order; don't reorder it to the top.

**Stripped from the reference:**

- The plan eyebrows "TIER", "PLACEMENT SPRINT" and "COMPREHENSIVE".
- The invented plan names "3-Month Sprint" and "Full Season". Names come from `GET /api/plans`.
- The per-plan feature lists ("48 Company recruitment packs", "340+ CS Theory quizzes").
- "Free forever" and "Billed once · access for lifetime" on the Free card.
- The featured card standing taller than the others. The UI is flat, so all cards are the same height.

---

### 5.8 `FaqSection` (Prompt 1 §8)

| Part | Classes and content |
|---|---|
| `section` | `id="faq"` + `aria-labelledby="faq-title"` |
| heading | h2 `text-center text-h2-marketing font-medium text-strong` "Frequently asked questions" (30/500) |
| accordion | `mx-auto mt-12 max-w-[45rem] border-t border-row` |

**`Accordion` / `AccordionItem`** (Spec §3.2 and §4.3; APG accordion pattern):

- **Item:** `border-b border-row`.
- **Header:** `<h3>` wrapping a `<button aria-expanded aria-controls id>`.
- **Button:**
  - `flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left text-row-title text-muted transition-colors duration-fast hover:text-primary aria-expanded:text-primary`
  - The `ChevronDown` 16 at the end has `shrink-0 transition-transform duration-base ease-out`, plus `rotate-180` when open.
- **Panel:**
  - `<div role="region" aria-labelledby>` with `grid transition-[grid-template-rows] duration-base ease-out`, switching between `grid-rows-[0fr]` and `grid-rows-[1fr]`.
  - The inner `<div class="overflow-hidden">` holds `<p class="pb-6 max-w-[45rem] text-[1rem] leading-[1.6] text-secondary">`.
  - A closed panel gets the `inert` attribute, so its links are not tabbable and screen readers skip it.
- More than one item may be open at once. All are closed initially.
- **Reduced motion:** the global block shortens the transition to 120 ms or less (Spec §4.2).

The items come from props; the fixture copy is in §11.4.

**Stripped from the reference:**

- The boxed, separated rows. Prompt 1 specifies 1 px bottom borders.
- The "SUPPORT" eyebrow.

---

### 5.9 `MarketingFooter` (Prompt 1 §9; Brief §10.2)

| Part | Classes and content |
|---|---|
| `footer` | `mt-32 border-t pt-16 pb-12` (128 px after FAQ, matching the rhythm) |
| grid | `MarketingContainer` > `grid gap-10 sm:grid-cols-2 lg:grid-cols-4` |
| column heading (h3) | `text-meta font-semibold uppercase tracking-[0.04em] text-strong` |
| link list | `<ul class="mt-4 space-y-3">`; links `text-body text-secondary hover:text-primary transition-colors duration-fast` |

| Column | Contents |
|---|---|
| Brand | `Wordmark`; `<p class="mt-4 max-w-[16rem] text-body text-secondary">` "Placement prep, priced for students"; `mailto:{SUPPORT_EMAIL}` link (`text-body text-secondary hover:text-primary`); `<p class="mt-6 text-meta text-muted">` "© {year} Semicolan" |
| Product | Problems `/problems` · Mock tests `/mock-tests` · Leaderboard `/leaderboard` · Pricing `#pricing` |
| Legal | Terms · Privacy · Refund policy (routes: §13 open item 4) |
| Account | Sign in (a `<button>` → `onSignIn`, styled as a link) · Pricing `#pricing` |

**Responsive:** 4 columns at ≥ 1024 px, 2 × 2 at 640–1023 px, stacked below 640 px. Brand comes first in every layout.

**Stripped from the reference:**

- The links that don't exist: "DSA Sheets", "Placement Mock Tests", "Live Contests", "Company Roadmap", "Code of Conduct", "Security & Integrity", "Student Registration", "TPO Campus Portal" and "Placement Help Desk".
- The bottom bar's "System Online" status dot and "Engineered for campus recruitment rigor in India".
- The long tagline. It is replaced with the docs' tagline.

---

## 6. `AppFrame` and the montage visuals

These are all decorative imitations of the product, built from tokens and markup. There are **no raster images**.

**`AppFrame`** (Prompt 1 §2 "frame that imitates the app"; Brief §8.2 `radius-lg`):

- **Root:**
  - `<figure>` with `overflow-hidden rounded-lg border bg-surface`
  - `role="img"` and an `aria-label`, which is the text alternative for the frame
  - Its whole content subtree is `aria-hidden="true"` and `inert`, so nothing inside is focusable
- **Header strip:** `flex h-10 items-center justify-between border-b bg-raised px-3`. A slot.
- **Body:** a slot. **Footer strip** (optional): `flex h-12 items-center justify-end gap-2 border-t bg-raised px-3`.
- Fake buttons inside are `<span>`s styled like `Button` `sm`. They are never real buttons, because they must not be focusable.

### 6.1 `IdeVisual`, used by the hero and walkthrough row a

`aria-label`: "Preview of the Semicolan Workspace: a problem statement, a Python solution and an Accepted verdict."

- **Header:**
  - Tabs on the left as `text-body`, `gap-6`: "Description" (`text-accent`, with a 2 px `bg-accent` underline pinned to the strip bottom), "Solution" and "Submissions" (`text-muted`).
  - On the right, a fake select: `flex h-7 items-center gap-1 rounded-md border border-strong px-2 text-body text-muted`, reading "Python 3" + `ChevronDown` 14.
- **Body:** `grid grid-cols-1 sm:grid-cols-[2fr_3fr]`.
  - **Statement column** (`hidden sm:block border-r p-4 space-y-2`):
    - A title bar `h-3 w-2/3 rounded-xs bg-chip`.
    - Four text bars `h-2 rounded-xs bg-chip`, at widths 100%, 90%, 95% and 70%.
    - An example block: `mt-4 rounded-md bg-inset p-3 font-mono text-code-sm text-secondary`, with "Input: nums = [2,7,11,15], target = 9" and "Output: [0,1]".
  - **Code column** (`p-4 font-mono text-code-sm`): ten lines, each `flex gap-4 whitespace-pre`. The line number is `w-5 text-right text-syn-line-number` (the active line uses `text-primary`). The code is colored with `text-syn-keyword`, `text-syn-function`, `text-syn-default`, `text-syn-number` and `text-syn-comment` spans. The exact lines are in §11.5.
- **Footer:**
  - On the left, "Console" as ghost `sm`.
  - On the right, "▷ Run" as a secondary-styled span with `Play` 14.
  - Then "Submit" as a success-outline span: `border border-success text-success` with `CloudUpload` 14.
- **Overflow:** the frame clips (`overflow-hidden`), so long code lines never cause a horizontal page scroll at 320 px.

### 6.2 `MockTestVisual` (walkthrough row b)

`aria-label`: "Preview of a mock test in progress: three problems with their status and the time left."

- **Header:**
  - On the left, a `Timer` 16 in `text-muted`, then "Mock test · 90 min" in `text-body text-primary`.
  - On the right, "54:12 left" in `text-body font-medium text-primary tabular-nums`. It stays `text-primary` above 10 minutes (Brief §4.5 colors only under 10 min).
- **Body:** `divide-y divide-row`, three rows of `flex items-center justify-between gap-4 px-4 py-3`. Each row shows:
  - a title in `text-body text-primary`, plus a meta line in `text-meta text-muted` reading "Easy · Arrays", "Medium · Graphs" or "Medium · Bit manipulation"
  - a status chip (icon + label, never color alone):

  | Status | Icon | Color |
  |---|---|---|
  | Accepted | `CircleCheck` | `text-success` |
  | Attempted | `CircleDot` | `text-warning` |
  | Not started | `Circle` | `text-muted` |

**Stripped from the reference:**

- "TCS Digital Assessment Simulator", a company brand name.
- The red dot that pulses next to it, because status never pulses.
- "Module 1A · Arrays & Hashing" style IDs.

### 6.3 `LeaderboardVisual` (walkthrough row c)

`aria-label`: "Preview of the weekly leaderboard with your rank highlighted."

- **Header:**
  - On the left, "Weekly leaderboard" in `text-body text-primary`.
  - On the right, "This week" in `text-meta text-muted`.
- **Body:** three rows of `flex items-center gap-3 px-4 py-3`, each holding:
  - a rank in `w-8 text-body font-medium text-muted tabular-nums` ("#1", "#2", "#3")
  - a name bar `h-2.5 w-28 rounded-xs bg-chip`. Other users are **abstract bars, not invented people**.
  - points at the end, in `ml-auto text-body text-secondary tabular-nums`
- **Pinned "You" row:** `border-t bg-accent-subtle`, showing "#12", "You" in `text-accent font-medium`, and "18 pts".

**Stripped from the reference:**

- "National Placement Standing" and "Candidate #0491 / IIT Delhi" with colleges and "100% Solved". This is the exact item on Spec §6's strip list.
- "Week 42 Live".

---

## 7. Interactive states (complete list for this page)

| Element | Rest → hover | Focus | Active / open | Motion |
|---|---|---|---|---|
| Nav text link | `text-primary` → `text-accent` | global ring | — | `transition-colors duration-fast` |
| Products trigger | same as link; chevron `rotate-180` when open | ring | `aria-expanded="true"` | chevron `transition-transform duration-base` |
| Products panel item | transparent → `bg-raised` | ring | — | colors 120 ms; panel `animate-dialog-in` / `-out` |
| Search trigger | `bg-input` → `bg-raised` | ring | opens palette (later) | colors 120 ms |
| Sign in, primary buttons | `bg-accent-emphasis` → `bg-accent-emphasis-hover` | ring | — | colors 120 ms. **No scale** |
| Secondary buttons | transparent → `bg-raised`, label `text-muted` → `text-primary` | ring | — | colors 120 ms |
| Highlight CTA | 8% dark overlay | ring | — | colors 120 ms |
| Hero pill | `bg-raised` → `bg-chip` | ring | — | colors 120 ms |
| Module chip | `bg-base` → `bg-raised` | ring | — | colors 120 ms |
| Stat card (link) | `bg-card` → `bg-row`, `border` → `border-hover`, chevron +2 px | ring | — | colors 120 ms; chevron `translate-x-0.5` |
| Step card (not a link) | `border` → `border-hover` | `focus-within:border-hover` | — | colors 120 ms |
| FAQ row | `text-muted` → `text-primary` | ring | open: `text-primary`, chevron rotated, panel expanded | rows 200 ms; chevron 200 ms |
| Footer link | `text-secondary` → `text-primary` | ring | — | colors 120 ms |
| Nav bottom border | transparent → `border-subtle` once scrolled | — | — | colors 120 ms |
| Mobile drawer | — | trapped inside | open | `transition-transform duration-base`; scrim `animate-fade-in` |
| Anchor jump | — | the target section receives no focus; the link keeps it | — | `scroll-behavior: smooth`; `auto` under reduced motion |

**None of these:**

- hover lift, hover shadow, press scale, `transition-all`
- parallax, scroll-triggered reveal or fade-in animations on sections
- typing animation in the code montage
- auto-rotating carousels

Spec §4.1 permits no such motion, and scroll reveals would leave content invisible to anyone who doesn't scroll it into view.

**Reduced motion:** the global block (§1.4) turns every row above into a fade of at most 120 ms or no motion, and skeletons stop pulsing.

---

## 8. Responsive summary

| Breakpoint | Nav | Hero | Stats | Problem | Walkthrough | Steps | Pricing | Footer |
|---|---|---|---|---|---|---|---|---|
| ≥ 1280 (`xl`) | full | 55/45 | 4 cols | 2 cols | alternating 2 cols + rail | 4 cols | 3 in a row | 4 cols |
| 1024–1279 (`lg`) | full | 55/45 | 4 cols | 2 cols | alternating + rail | 4 cols | 3 in a row | 4 cols |
| 768–1023 (`md`) | links + search icon | stacked | 4 cols | 2 cols | stacked, text first | 2 cols | 2 + 1 | 2 × 2 |
| 640–767 (`sm`) | drawer | stacked, full montage | 2 cols | 1 col | stacked | 2 cols | 1 col (if < 2 × 17rem) | 2 × 2 |
| 480–639 (`xs`) | drawer | stacked, code-only montage, full-width CTAs | 2 cols | 1 col | stacked | 1 col | 1 col | stacked |
| 320–479 | drawer | same; display 48 px | 1 col | 1 col | stacked | 1 col | 1 col | stacked |

**Hard rules at every width:**

- **No horizontal page scroll at 320 px** (WCAG 1.4.10). Frames clip their own content.
- **Touch targets** are at least 24 px everywhere, and 44 px rows in the drawer.
- **Text containers** use `min-h-*`, never a fixed `h-*` on text (Brief §2 text spacing). The fixed `h-*` values on buttons, chips and inputs are control sizes, which the brief allows.
- **At 200% zoom** on a 1280 px window (an effective 640 px), the page uses the `sm` layout and nothing overlaps.

---

## 9. Accessibility checklist (Brief §6, Prompt 1 shared block)

- [ ] Landmarks: `header` > `nav[aria-label="Main"]`, `main#main`, `footer`; every section has `aria-labelledby` pointing at its h2.
- [ ] There is one `h1`; section titles are `h2`; step titles, plan names, FAQ questions and footer columns are `h3`.
- [ ] The skip link is the first focusable element.
- [ ] The tab order is nav → hero → … → footer.
- [ ] Every interactive element shows the 2 px `accent` focus ring at a 2 px offset.
- [ ] Nothing inside the `AppFrame` montages is focusable (`inert`), and each frame has a meaningful `aria-label`.
- [ ] Icons beside text are `aria-hidden`; icon-only buttons have `aria-label` and a `Tooltip`.
- [ ] Every status has icon + word + color: the montage statuses and "Accepted".
- [ ] Contrast:
  - `text-muted` on `bg-base` is 6.1:1.
  - On `bg-step-card`'s `premium-surface` stop, `text-muted` is 5.8:1.
  - `text-success` on `bg-base` (the "Best value" tag) is 7.8:1.
  - `text-on-highlight` on `highlight` is 10.1:1.
- [ ] Ctrl/Cmd+K opens search; there are no single-key shortcuts.
- [ ] The mobile drawer and Products panel close on Esc and return focus.
- [ ] Prices are read correctly: "₹499 / 90 days". The `/` separator is `aria-hidden` and an `sr-only` "for" is added.

---

## 10. Wiring boundaries (what stays static now)

| Prop / callback | Now (static) | Later (live) |
|---|---|---|
| `problemCount`, `designCount`, `companyCount`, `theoryCount` | fixtures | §13 open item 1 |
| `plans` | fixtures | `GET /api/plans` (public) |
| `faqs` | fixtures | stays static content in the frontend (no FAQ API exists) |
| `onTryProblem` | `navigate('/problems/' + WARMUP_PROBLEM_SLUG)` | same |
| `onBrowse` | `navigate('/problems')` | same |
| `onSignIn` | opens nothing yet: the `SignInDialog` is Implementation_Plan 1.2's next item. Until it lands, `LandingPage` passes a handler that navigates to `/?signin=1`, a no-op on this page | opens `SignInDialog` (Brief §9.19) |
| `onChoosePlan(code)` | same as `onSignIn` for a visitor (App_Flow §4.1: sign in first, then plans) | sign-in → checkout |
| `onOpenSearch` | no-op | opens `SearchPalette` (Brief §9.12) |
| `year` | `new Date().getUTCFullYear()` in `LandingPage` | same |
| `isLoading` | `false`; exercise the loading state by passing `true` from the dev gallery | `true` while counts and plans load |

Routes that don't exist yet (`/problems`, `/mock-tests`, `/community` and so on) are linked anyway, because they are the final URLs. Add a catch-all `*` route rendering a minimal "Page not found — Back to home" page so they don't render blank.

---

## 11. Mock data assets (`features/landing/landing.fixtures.ts`)

These are fixtures, **not copy**. They live in one file, are imported only by `LandingPage` (and the future `/dev/gallery`), and never appear in component markup.

### 11.1 Counts

```ts
counts: { problemCount: 650, designCount: 120, companyCount: 48, theoryCount: 340 }
```

The values mirror the reference so the layout can be compared side by side. Add a second fixture `countsPartial = { problemCount: 650 }` to test the hide-a-card rule.

### 11.2 Plans

| code | name | durationDays | pricePaise | currency | isFeatured |
|---|---|---|---|---|---|
| `PREMIUM_3M` | 3 months | 90 | 49900 | INR | true |
| `PREMIUM_12M` | 12 months | 365 | 99900 | INR | false |

These mirror the reference's ₹499 and ₹999 at the API's shape (API_Contract `GET /api/plans`). `isFeatured` is not in the API yet; see §13 open item 2.

### 11.3 Module links: shared by `ProductsMenu`, `MobileNavDrawer` and `ModuleChips`

| Name (chip label if different) | Icon | Route | Menu description |
|---|---|---|---|
| Problems (Data Structures & Algorithms) | `Code2` | `/problems` | Coding problems with hidden tests |
| Mock tests | `Timer` | `/mock-tests` | Timed rounds with a final report |
| System Design | `Boxes` | `/design/hld` | High-level design questions and editorials |
| Low-Level Design | `Blocks` | `/design/lld` | Class design and patterns |
| DevOps | `Infinity` | `/devops` | Theory and quizzes by topic |
| Data Science | `ChartLine` | `/data-science` | Theory and quizzes by topic |
| Companies (Company prep) | `Building2` | `/companies` | Questions asked at each company |
| Projects | `BriefcaseBusiness` | `/projects` | Take-home and portfolio briefs |
| Community (chips only) | `Users` | `/community` | — |

The icons match the sidebar's in UI_Generation_Prompts (AppShell). The chips show the 8 entries Prompt 1 §3 lists, which drops "Mock tests" and adds "Community". The menu shows the 8 modules Prompt 1 §1 lists.

### 11.4 FAQ (answers drawn only from the docs)

| Question | Answer | Source |
|---|---|---|
| Is there a free plan? | Yes. Free gives you a set of free problems in every topic, the full editor with Run and Submit, the weekly leaderboard and one free mock test. No card needed. | PRD §3 tiers |
| Does Premium renew automatically? | No. Premium is a one-time payment for a fixed period. When it ends you go back to Free, and you can buy again whenever you like — a new purchase adds to any time you have left. | PRD §6.4; API checkout ("stacks onto the current expiry") |
| What is the refund policy? | You can get a full refund within 7 days of paying, as long as you haven't started a mock test. Write to support and we'll process it. | PRD §6.4 ("7 days, provided no mock test was attempted") |
| Which languages can I code in? | C, C++, Java and Python 3. | Prompt 1 hero pill |
| Can I practise on my phone? | You can browse problems, read statements and editorials, and check the leaderboard on a phone. Writing and running code needs a laptop or desktop browser. | Brief §3.3 |
| How do mock tests work? | A mock test is a timed set of problems. The timer runs on our server and can't be paused. When time is up you get a report with a verdict for every problem. The free test allows one attempt. | App_Flow §3; Brief §3.3 |
| Which payment methods do you accept? | UPI, cards and netbanking, through Razorpay. | Prompt 1 §7 |

### 11.5 Montage code (Python, `IdeVisual`)

```
1  class Solution:
2      def twoSum(self, nums, target):
3          # Time: O(n) · Space: O(n)
4          seen = {}
5          for i, n in enumerate(nums):
6              need = target - n
7              if need in seen:
8                  return [seen[need], i]
9              seen[n] = i
10         return []
```

Each line is stored as an array of `{text, tone}` tokens. `tone` is `keyword`, `function`, `default`, `number`, `comment` or `control`, and maps to `text-syn-*`. Line 8 is the "active" line, with its number in `text-primary`.

### 11.6 Icons used (all `lucide-react`, stroke 1.75)

- **Nav:** `ChevronDown`, `Search`, `Menu`, `X`, `ArrowRight`.
- **Modules:** `Code2`, `Timer`, `Boxes`, `Blocks`, `Infinity`, `ChartLine`, `Building2`, `BriefcaseBusiness`, `Users`, `BookOpen`.
- **Cards:** `ChevronRight`, `CircleAlert`, `Trophy`, `Check`.
- **Montage:** `CircleCheck`, `CircleDot`, `Circle`, `Play`, `CloudUpload`.

Confirm each name exists in the installed `lucide-react` version before coding; some were renamed between majors, for example `LineChart` → `ChartLine`.

### 11.7 Images

**None.** Every visual is built from markup and tokens, including the montages, the backdrop grid and the glow. This keeps the page crisp at any zoom, themeable and free of baked-in text. The reference JPG is a comparison aid only and is never imported.

The only binary assets are the WOFF2 fonts (§1.3). Add a favicon later, as the `;` glyph SVG in `accent`.

---

## 12. Design vs. docs: every difference, in one place

| Reference shows | Built as | Rule |
|---|---|---|
| Avatar circle in the nav | Removed (visitor page) | Brief §10.2 |
| "Search challenges…" | "Search problems" | Brief §9.12 |
| Window traffic-light dots | Removed | Prompt 1 §2; token-only colors |
| Hero CTA with a small radius | `rounded-full`, 56 px | Brief §8.2, §9.1 |
| Hard-coded 650+ / 120 / 48 / 340 | Props, card hidden when missing | Spec §6; Prompt 1 §3 |
| Stat sub-lines naming TCS, Infosys, Amazon, Wipro | Removed | Brief §0.2 |
| Stats sub-heading about "Indian colleges" | Removed | Not in Prompt 1 |
| Eyebrows: THE PROBLEM, ENGINEERED FOR CLARITY, WORKFLOW, PRICING, SUPPORT | Removed | Not in Prompt 1 |
| Pain points inside a panel with boxed items | Open two-column list | Prompt 1 §4 |
| "TCS Digital Assessment Simulator" with a pulsing red dot | "Mock test · 90 min", no pulse | Brief §0.2, §4.5 |
| "National Placement Standing", candidates with colleges, "100% Solved" | Abstract bars + a "You" row | Spec §6 |
| Secondary buttons on walkthrough rows b and c | Primary | Prompt 1 §5 |
| Rounded-square step badges and "01 / SETUP" footers | 56 px circles, no footer | Prompt 1 §6 |
| "Interview packs", "percentile analytics" in step copy | Removed | Spec §6 (percentiles) |
| Plan eyebrows, invented plan names, per-plan feature lists, "lifetime" | API name, one shared Premium list | API `GET /api/plans`; Prompt 1 §7 |
| Featured plan card taller than the others | Same height | Brief §8.3 (flat) |
| "40+ free problems" | "Free problems in every topic" | Spec §6 (no hard-coded counts) |
| FAQ as separate boxed rows | Rows with a 1 px bottom border | Prompt 1 §8 |
| Footer links that don't exist; "System Online" | Prompt 1 footer only | Spec §6 |

---

## 13. Open items (decisions needed before *wiring*, not before the static build)

1. **No endpoint for the landing counts.** Prompt 1 needs `problemCount`, `designCount`, `companyCount` and `theoryCount`; API_Contract has no summary endpoint. All four can be derived client-side from public, unpaginated lists:
   - the sum of `problemCount` over `GET /api/topics`
   - the length of the HLD and LLD design lists
   - the length of `GET /api/companies`
   - the sum of `theoryCount` over both hub topic lists

   That is about 5 requests on a cold landing page. The alternative is a contract addition such as `GET /api/catalog/summary`. **Recommendation:** add the summary endpoint, since it is one cheap query and keeps the landing page fast. It needs your approval per CLAUDE.md.
2. **`isFeatured` is missing from `GET /api/plans`.** Prompt 1 relies on it. Options:
   - add `isFeatured` to the plans contract and the `plans` table, which is a schema change
   - derive it in the client, for example "the middle plan" or "the best price per day"

   **Recommendation:** derive best price per day for now, with no contract change, and revisit when the admin wants to choose.
3. **Two config keys are missing from the inventory:** `VITE_WARMUP_PROBLEM_SLUG` (App_Flow §1 says frontend configuration) and `VITE_SUPPORT_EMAIL`. Per CLAUDE.md, add both to `.env.example` and to the Implementation_Plan configuration inventory when step 0 lands.
4. **Legal pages have no routes.** The footer and pricing line link to Terms, Privacy and Refund policy, but Brief §10.3 lists no such pages. Propose `/legal/terms`, `/legal/privacy` and `/legal/refund-policy` as static Markdown pages in the marketing layout.
5. **"40+ free problems"** in Prompt 1 conflicts with Spec §6's ban on hard-coded counts. This plan uses count-free copy; if you want a number, it needs a `freeProblemCount` source (it could join item 1's summary).

---

## 14. Build order and verification

Each step ends with a visual check against the reference at **1280 px**, and a responsive pass at **320, 375, 768, 1024 and 1440 px**.

| Step | Work | Done when |
|---|---|---|
| 0 | Tokens, Tailwind theme, fonts, global CSS, `config.ts`, `format.ts` (§1) | Body is `rgb(28,28,28)`; Inter and Fira Code load from the app's own origin (Network tab shows no third-party font host); no hex in `src/components` or `src/features` |
| 1 | `ui/`: `Button`, `IconButton`, `Tooltip`, `Kbd`, `Skeleton`, `Wordmark` | Every variant and size renders; keyboard focus ring visible; no scale on press |
| 2 | Page frame: `LandingView`, `MarketingContainer`, `MarketingBackdrop`, skip link, routing (`/` → `LandingPage`, `*` → not found), delete `HomePage` | Grid backdrop visible and fading; disappears with "prefers-contrast: more" emulated in DevTools |
| 3 | `MarketingNav` + `ProductsMenu` + `NavSearchTrigger` + `Drawer`/`MobileNavDrawer` | Border appears after scrolling; menu and drawer fully keyboard-operable, Esc returns focus; Ctrl/Cmd+K fires `onOpenSearch` |
| 4 | `AppFrame` + `IdeVisual` + `HeroSection` + `HeroMontage` | Matches reference hero at 1280; at 320 no horizontal scroll and code-only montage; headline 48 px below 768 |
| 5 | `ModuleChips` + `StatCard` + `StatsSection` | With `countsPartial`, three cards are hidden and the row stays full; `isLoading` shows skeletons after 150 ms |
| 6 | `ProblemSection` | Two columns become one below 768 |
| 7 | `MockTestVisual`, `LeaderboardVisual`, `FeatureRow`, `WalkthroughSection` | Row b is mirrored on ≥ 1024; rail and dots aligned; nothing inside frames is focusable |
| 8 | `StepCard` + `HowItWorksSection` | Cards 296 px tall on desktop; glow behind; hover and focus-within border |
| 9 | `PlanCard` + `PricingSection` | ₹ formatting via `en-IN`; the featured card uses the gradient, premium border, "Best value" tag and highlight CTA; the grid holds 1, 2 and 3 plans |
| 10 | `Accordion` + `FaqSection` | Arrow keys are not required (APG accordion), but Tab and Enter/Space work; closed panels are `inert`; reduced motion is honored |
| 11 | `MarketingFooter` | 4 / 2 / 1 columns; `mailto:` works |
| 12 | Full-page pass | §9 checklist all ticked; Lighthouse accessibility ≥ 95 at 375 and 1280; no console errors; `npm run build` and `npm run lint` clean |

**Not in this plan:** the sign-in dialog, the search palette, live data, the `/pricing` page (it reuses `PricingSection` later) and analytics events. Each comes with its own milestone.
