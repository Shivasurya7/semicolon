/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Design tokens (UI_UX_Brief §1) are added here as CSS custom properties; components never use raw hex.
    extend: {},
  },
  plugins: [],
}
