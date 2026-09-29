/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.tsx"],
	darkMode: "selector",
	theme: {
		extend: {
			colors: {
				foreground: "rgb(var(--foreground) / <alpha-value>)",
				background: "rgb(var(--background) / <alpha-value>)",
				dark: "rgb(var(--dark) / <alpha-value>)",
				paper: "rgb(var(--paper) / <alpha-value>)",
				stroke: "rgb(var(--stroke) / <alpha-value>)",
				border: "rgb(var(--stroke) / <alpha-value>)",
				accent: "rgb(var(--accent) / <alpha-value>)",
				dim: "rgb(var(--dim) / <alpha-value>)",
			},
			fontFamily: {
				heading: ["'Source Serif 4', system-ui, serif"],
			},
		},
	},
	plugins: [],
};
