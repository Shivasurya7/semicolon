/** @type {import('tailwindcss').Config} */

const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`

// Shared across bg-, text-, border-, outline-, ring-, fill- and stroke- utilities.
const shared = {
  transparent: 'transparent',
  current: 'currentColor',
  accent: token('accent'),
  'accent-icon': token('accent-icon'),
  'accent-emphasis': token('accent-emphasis'),
  success: token('success'),
  error: token('error'),
  warning: token('warning'),
  info: token('info'),
  highlight: token('highlight'),
}

const syntax = Object.fromEntries(
  ['default', 'comment', 'keyword', 'control', 'string', 'number', 'type', 'function', 'line-number'].map((name) => [
    `syn-${name}`,
    token(`syn-${name}`),
  ]),
)

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Tailwind's built-in palette is removed on purpose: components use tokens only (UI_UX_Brief §1).
    colors: shared,
    backgroundColor: {
      ...shared,
      base: token('bg-base'),
      section: token('bg-section'),
      card: token('bg-card'),
      input: token('bg-input'),
      inset: token('bg-inset'),
      row: token('bg-row'),
      surface: token('bg-surface'),
      raised: token('bg-raised'),
      chip: token('bg-chip'),
      border: token('border'),
      scrim: 'var(--color-scrim)',
      'accent-emphasis-hover': token('accent-emphasis-hover'),
      'accent-subtle': token('accent-subtle'),
      'premium-surface': token('premium-surface'),
      'step-badge': token('step-badge'),
    },
    textColor: {
      ...shared,
      ...syntax,
      strong: token('text-strong'),
      primary: token('text-primary'),
      prose: token('text-prose'),
      secondary: token('text-secondary'),
      muted: token('text-muted'),
      'on-accent': token('text-on-accent'),
      'on-highlight': token('text-on-highlight'),
      'step-badge': token('step-badge-text'),
    },
    borderColor: {
      ...shared,
      DEFAULT: token('border'),
      subtle: token('border-subtle'),
      row: token('border-row'),
      strong: token('border-strong'),
      hover: token('border-hover'),
      premium: token('premium-border'),
    },
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: [
        '"Fira Code"',
        '"JetBrains Mono"',
        '"Cascadia Mono"',
        'Consolas',
        'Menlo',
        '"DejaVu Sans Mono"',
        'ui-monospace',
        'monospace',
      ],
    },
    borderRadius: {
      none: '0',
      xs: '0.25rem',
      sm: '0.375rem',
      md: '0.375rem',
      lg: '1rem',
      full: '9999px',
    },
    extend: {
      fontSize: {
        display: ['4.5rem', { lineHeight: '1', letterSpacing: '-0.01em' }],
        'h1-marketing': ['3rem', { lineHeight: '1.15' }],
        'h2-marketing': ['1.875rem', { lineHeight: '1.3' }],
        lead: ['1.25rem', { lineHeight: '1.4' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'row-title': ['1rem', { lineHeight: '1.5' }],
        body: ['0.875rem', { lineHeight: '1.43' }],
        meta: ['0.75rem', { lineHeight: '1.33' }],
        eyebrow: ['0.6875rem', { lineHeight: '1.45', letterSpacing: '0.04em' }],
        stat: ['1.875rem', { lineHeight: '1.2' }],
        code: ['0.875rem', { lineHeight: '1.375rem' }],
        'code-sm': ['0.8125rem', { lineHeight: '1.5rem' }],
      },
      maxWidth: {
        marketing: '75rem',
      },
      // Status tints are 12% (UI_UX_Brief §1.1).
      opacity: { 12: '0.12' },
      backgroundImage: {
        'plan-featured': 'var(--plan-featured)',
        'step-card': 'var(--step-card)',
        'overlay-dark': 'linear-gradient(var(--overlay-dark), var(--overlay-dark))',
      },
      boxShadow: {
        popover: 'var(--shadow-popover)',
        dialog: 'var(--shadow-dialog)',
      },
      // Motion tokens: UI_Component_Spec §4.2.
      transitionDuration: { fast: '120ms', dialog: '180ms', base: '200ms', slow: '400ms' },
      transitionTimingFunction: { out: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      keyframes: {
        'dialog-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        'dialog-out': { from: { opacity: '1' }, to: { opacity: '0', transform: 'translateY(4px)' } },
        'toast-in': { from: { opacity: '0', transform: 'translate(8px, 8px)' }, to: { opacity: '1', transform: 'none' } },
        'toast-out': { from: { opacity: '1' }, to: { opacity: '0', transform: 'translateX(8px)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        skeleton: { '0%,100%': { opacity: '0.9' }, '50%': { opacity: '0.45' } },
      },
      animation: {
        'dialog-in': 'dialog-in 180ms cubic-bezier(0.16,1,0.3,1)',
        'dialog-out': 'dialog-out 120ms ease-out forwards',
        'toast-in': 'toast-in 200ms cubic-bezier(0.16,1,0.3,1)',
        'toast-out': 'toast-out 200ms ease-out forwards',
        'fade-in': 'fade-in 120ms ease-out',
        skeleton: 'skeleton 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
