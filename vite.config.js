import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built site works from any OBS bucket path or domain.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
