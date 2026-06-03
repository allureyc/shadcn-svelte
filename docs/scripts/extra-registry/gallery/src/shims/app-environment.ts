// Shim for `$app/environment` (SvelteKit-only module). In a plain Vite SPA we
// always behave as a browser-side build.
export const browser = true;
export const dev = false;
export const building = false;
export const version = "gallery";
