import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/trackr/",  // <-- add this line. Must match your repo name exactly.
});
