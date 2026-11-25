/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        foreground: "#0f172a",
        card: "#ffffff",
        border: "#e2e8f0",
        input: "#ffffff",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
};
