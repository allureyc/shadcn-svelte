// Resolve from the docs workspace root where node_modules actually lives.
// This avoids "Cannot find package" errors in editors that start the
// svelte-language-server from this subdirectory.
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const docsRoot = path.resolve(__dirname, "..", "..", "..");
const require = createRequire(path.join(docsRoot, "package.json"));
const resolvedPath = require.resolve("@sveltejs/vite-plugin-svelte");
const { vitePreprocess } = await import(pathToFileURL(resolvedPath).href);

export default {
	preprocess: vitePreprocess(),
};
