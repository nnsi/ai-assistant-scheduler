import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface colors
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",

        // Accent colors
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          light: "rgb(var(--color-accent-light) / <alpha-value>)",
          dark: "rgb(var(--color-accent-dark) / <alpha-value>)",
        },

        // Legacy primary (for compatibility)
        primary: {
          50: "#fef7f0",
          100: "#fdebe0",
          200: "#fad5bf",
          300: "#f5b894",
          400: "#ef9060",
          500: "#ea580c",
          600: "#dc4a0a",
          700: "#b63d0a",
          800: "#92330f",
          900: "#762d10",
        },

        // Schedule colors
        schedule: {
          default: "#ea580c",
          ai: "#8b5cf6",
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(41 37 36 / 0.02), 0 4px 8px rgb(41 37 36 / 0.04), 0 8px 16px rgb(41 37 36 / 0.02)",
        medium:
          "0 2px 4px rgb(41 37 36 / 0.02), 0 8px 16px rgb(41 37 36 / 0.06), 0 16px 32px rgb(41 37 36 / 0.04)",
        strong:
          "0 4px 8px rgb(41 37 36 / 0.04), 0 12px 24px rgb(41 37 36 / 0.08), 0 24px 48px rgb(41 37 36 / 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
