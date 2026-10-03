import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	server: {
		// Local login testing: run `vercel dev` (port 3000) for /api functions
		// alongside `yarn dev`, and forward API calls to it.
		proxy: {
			"/api": "http://localhost:3000",
		},
	},
});
