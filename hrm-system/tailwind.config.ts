import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TAG Solutions Brand Colors
        tag: {
          orange: {
            DEFAULT: "#f97316",
            hover: "#ea6c0a",
            deep: "#c2530a",
            light: "#fed7aa",
            pale: "#fff7ed",
            mid: "#fb923c",
          },
          amber: {
            DEFAULT: "#fbbf24",
            light: "#fef3c7",
          },
          heading: "#1a1a1a",
          label: "#374151",
          body: "#6b7280",
          bg: {
            DEFAULT: "#ffffff",
            warm: "#fafaf9",
            orange: "#fef9f6",
          },
          dark: {
            DEFAULT: "#1c1917",
            deep: "#0c0a09",
          },
          border: {
            DEFAULT: "#f3ede8",
            orange: "#fed7aa",
            soft: "#ffedd5",
            dashed: "#c2530a",
            amber: "#fef3c7",
          },
          success: {
            DEFAULT: "#16a34a",
            text: "#15803d",
            bg: "rgba(22,163,74,0.15)",
            border: "rgba(22,163,74,0.3)",
          },
          warning: {
            DEFAULT: "#d97706",
            bg: "rgba(217,119,6,0.15)",
            border: "rgba(217,119,6,0.3)",
          },
          danger: {
            DEFAULT: "#ef4444",
            text: "#dc2626",
            bg: "rgba(239,68,68,0.15)",
            border: "rgba(239,68,68,0.3)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-sohne)", "SF Pro Display", "-apple-system", "sans-serif"],
        mono: ["SourceCodePro", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "display-hero": ["3.50rem", { lineHeight: "1.03", letterSpacing: "-1.4px", fontWeight: "300" }],
        "display-large": ["3.00rem", { lineHeight: "1.15", letterSpacing: "-0.96px", fontWeight: "300" }],
        "section-heading": ["2.00rem", { lineHeight: "1.10", letterSpacing: "-0.64px", fontWeight: "300" }],
        "sub-heading-lg": ["1.63rem", { lineHeight: "1.12", letterSpacing: "-0.26px", fontWeight: "300" }],
        "sub-heading": ["1.38rem", { lineHeight: "1.10", letterSpacing: "-0.22px", fontWeight: "300" }],
        "body-lg": ["1.13rem", { lineHeight: "1.40", fontWeight: "300" }],
      },
      borderRadius: {
        micro: "2px",
        standard: "4px",
        comfortable: "5px",
        relaxed: "6px",
        large: "8px",
      },
      boxShadow: {
        "tag-ambient": "rgba(23,23,23,0.06) 0px 3px 6px",
        "tag-standard": "rgba(23,23,23,0.08) 0px 15px 35px",
        "tag-elevated": "rgba(120,53,15,0.15) 0px 30px 45px -30px, rgba(0,0,0,0.08) 0px 18px 36px -18px",
        "tag-elevated-hover": "rgba(120,53,15,0.2) 0px 30px 45px -20px, rgba(0,0,0,0.1) 0px 18px 36px -18px",
        "tag-modal": "rgba(28,12,0,0.2) 0px 14px 21px -14px, rgba(0,0,0,0.08) 0px 8px 17px -8px",
        "tag-focus": "0 0 0 3px rgba(249,115,22,0.2)",
      },
      fontFeatureSettings: {
        ss01: '"ss01"',
        tnum: '"tnum"',
      },
    },
  },
  plugins: [],
};

export default config;
