import { defineConfig } from "vite";

export default defineConfig({
  // Set base directory to src
  root: "src",
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: "src/popup.html",
        icon: "src/icon.png",
      },
      output: {
        // Ensure all assets are output to root of dist
        assetFileNames: "[name][extname]",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        dir: "dist",
        preserveModules: false, // Prevent creation of subdirectories
      },
    },
    outDir: "dist",
    assetsInlineLimit: 512000, // Inline assets under ~500kb as base64
    // Ensure files are copied to dist
    copyPublicDir: true,
  },
});
