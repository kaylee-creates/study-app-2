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
        cozy: {
          cream: "#fdf8f3",
          paper: "#f5f0e8",
          grid: "#e8e2d9",
          sage: "#9caa8a",
          clover: "#7a9b76",
          terracotta: "#c17f59",
          gingham: "#e84a5f",
          ink: "#2c2c2c",
          muted: "#6b6b6b",
        },
      },
      fontFamily: {
        handwritten: ["var(--font-caveat)", "cursive"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-paper":
          "linear-gradient(to right, rgb(232 226 217 / 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgb(232 226 217 / 0.4) 1px, transparent 1px)",
        "gingham-pattern": "repeating-conic-gradient(#fdf8f3 0% 25%, #f5f0e8 25% 50%) 50% / 12px 12px",
      },
    },
  },
  plugins: [],
};
export default config;
