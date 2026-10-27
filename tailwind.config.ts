import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        pine: {
          DEFAULT: "var(--pine)",
          deep: "var(--pine-deep)",
          soft: "var(--pine-soft)",
        },
        ochre: {
          DEFAULT: "var(--ochre)",
          soft: "var(--ochre-soft)",
        },
        rust: {
          DEFAULT: "var(--rust)",
          soft: "var(--rust-soft)",
        },
        slate: {
          DEFAULT: "var(--slate)",
          soft: "var(--slate-soft)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "'Anthropic Serif'", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(27,33,30,0.04), 0 12px 28px -20px rgba(27,33,30,0.28)",
        lift: "0 18px 50px -28px rgba(27,33,30,0.38)",
        paper: "0 18px 38px -18px rgba(41,37,29,0.34), 0 2px 4px rgba(41,37,29,0.08)",
      },
      borderRadius: {
        card: "10px",
      },
      animation: {
        "fade-up": "fadeUp .45s cubic-bezier(.22,.61,.36,1) both",
        "fade-in": "fadeIn .3s ease both",
        "slide-in": "slideIn .35s cubic-bezier(.22,.61,.36,1) both",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        "scan": "scan 3.8s ease-in-out infinite",
        "draw": "draw 1.1s cubic-bezier(.22,.61,.36,1) forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(14px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".45" },
        },
        scan: {
          "0%": { transform: "translateY(-6px)", opacity: "0" },
          "12%": { opacity: ".9" },
          "88%": { opacity: ".9" },
          "100%": { transform: "translateY(420px)", opacity: "0" },
        },
        draw: {
          "0%": { strokeDashoffset: "160" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
