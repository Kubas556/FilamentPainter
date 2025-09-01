/// <reference types="vitest" />
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
	base: "",
	plugins: [viteSingleFile(), viteReact()],
	test: {
		projects: [
			{
				extends: true,
				test: {
					environment: "jsdom",
				},
			},
		],
	},
	build: {
		assetsDir: ".",
		outDir: "build",
		emptyOutDir: true,
	},
});
