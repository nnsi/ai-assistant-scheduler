/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary/Accent colors (same as frontend)
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
        display: ["DMSerifDisplay_400Regular"],
        sans: ["DMSans_400Regular", "System"],
      },
    },
  },
  plugins: [],
};
