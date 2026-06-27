/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Single source of truth for surface + accent colors. These map to the
        // CSS variables in app/globals.css so the values live in exactly one place.
        panel: "var(--panel)",
        "panel-warm": "#fffaf0",
        ink: "var(--ink)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        // Unifies the previous mix of border-amber-900/10 and /15.
        line: "rgb(120 53 15 / 0.12)"
      },
      borderRadius: {
        card: "1rem", // 16px — stat cards, inputs-as-cards
        panel: "1.5rem", // 24px — content panels
        "panel-lg": "2rem" // 32px — hero/header panels
      }
    }
  },
  plugins: []
};
