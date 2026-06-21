import type { Config } from 'tailwindcss';

/**
 * liveui Tailwind preset. Wires the semantic CSS variables from `theme.css` to
 * Tailwind colour utilities, so every liveui component's classes resolve.
 *
 *   // tailwind.config.ts
 *   import liveui from "./tailwind.preset";
 *   export default { presets: [liveui], content: ["./src/**\/*.{ts,tsx}"] };
 *
 * Uses the `<alpha-value>` placeholder so opacity modifiers work
 * (e.g. `bg-destructive/10`). Dark mode is driven by `data-theme`.
 */
const preset = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
} satisfies Partial<Config>;

export default preset;
