import { defineConfig, devices } from "@playwright/test";

// Load VITE_VIDEOSDK_TOKEN from .env locally. In CI it comes from a repo secret.
try {
  process.loadEnvFile();
} catch {}

const PORT = 5199;

export default defineConfig({
  testDir: "tests",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  retries: process.env.CI ? 1 : 0,
  // Each test already runs two browsers with live video; parallel tests starve each other of CPU.
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    permissions: ["camera", "microphone"],
    ...devices["Desktop Chrome"],
    launchOptions: {
      args: [
        // `-stream`, not `-capture`: Chrome ignores unknown switches and would use the real webcam.
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        "--autoplay-policy=no-user-gesture-required",
      ],
    },
  },
  webServer: {
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Never test someone else's dev server that happens to hold the port.
    reuseExistingServer: false,
  },
});
