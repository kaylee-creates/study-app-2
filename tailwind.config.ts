import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: "var(--color-bg)",
          surface: "var(--color-surface)",
          accent: "var(--color-accent)",
          "accent-dark": "var(--color-accent-dark)",
          "accent-yellow": "var(--color-accent-yellow)",
          text: "var(--color-text)",
          "text-muted": "var(--color-text-muted)",
          "nav-glass": "var(--color-nav-glass)",
        },
      },
      fontFamily: {
        cursive: ["var(--font-cursive)", "cursive"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass:
          "0 2px 8px var(--color-shadow), 0 4px 16px var(--color-shadow-light), 0 8px 32px var(--color-shadow-lighter)",
        "glass-up":
          "0 -2px 8px var(--color-shadow), 0 -4px 16px var(--color-shadow-light), 0 -8px 32px var(--color-shadow-lighter)",
      },
    },
  },
  plugins: [],
};
export default config;
