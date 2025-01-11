import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Get the repository name from package.json or environment variable
const base = '/chasing-roo/'; // Replace with your repository name

export default defineConfig({
  base: base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});