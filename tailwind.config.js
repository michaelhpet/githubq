/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.tsx"],
  darkMode: "selector",
  theme: {
    extend: {
      colors: {
        foreground: "rgb(var(--foreground))",
        background: "rgb(var(--background))",
        stroke: "rgb(var(--stroke))",
      },
      fontFamily: {
        heading: ["'Source Serif 4', system-ui, serif"],
      },
    },
  },
  plugins: [],
};
