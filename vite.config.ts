import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The SDK logs failed requests while a test holds a browser offline; keep them in the
  // browser console instead of flooding the terminal.
  server: { forwardConsole: false },
});
