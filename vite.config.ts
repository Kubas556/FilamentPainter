import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
	base: "",
	plugins: [viteSingleFile(), viteReact()],
	build: {
		assetsDir: ".",
		outDir: "build",
		emptyOutDir: true,
	},
});
