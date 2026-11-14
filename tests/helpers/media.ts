import { expect, type Locator, type Page } from "@playwright/test";

// Every camera must be Chrome's fake device, so a real webcam never ends up in a test.
export async function expectFakeCamera(page: Page) {
  const labels = await page.evaluate(async () =>
    (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput").map((d) => d.label),
  );
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) expect(label).toMatch(/fake/i);
}

// Frames the <video> element has decoded so far. Rises while video really plays.
export const decodedFrames = (video: Locator) =>
  video.evaluate((v: HTMLVideoElement) => v.getVideoPlaybackQuality().totalVideoFrames);

// Average brightness 0-255 of the current frame, read through a small canvas.
export const brightness = (video: Locator) =>
  video.evaluate((v: HTMLVideoElement) => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 36;
    const g = c.getContext("2d")!;
    g.drawImage(v, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i + 1] + d[i + 2];
    return sum / (d.length / 4) / 3;
  });

// Video is playing when new frames keep arriving and the picture is not black.
// A <video> element that exists, or one frozen on its last frame, fails this.
export async function expectVideoPlaying(video: Locator, minNewFrames = 10) {
  await expect(video).toBeVisible();
  const start = await decodedFrames(video);
  await expect.poll(() => decodedFrames(video), { timeout: 15_000 }).toBeGreaterThan(start + minNewFrames);
  expect(await brightness(video)).toBeGreaterThan(10);
}

// No new frames arrive over `ms`. Passes whether the remote tile froze, its camera shows as
// off, or the tile is gone: during a drop the other side can see any of the three.
export async function expectNoNewFrames(video: Locator, ms = 3_000) {
  const frames = () =>
    video.evaluateAll((vs: HTMLVideoElement[]) => vs.reduce((n, v) => n + v.getVideoPlaybackQuality().totalVideoFrames, 0));
  const start = await frames();
  await video.page().waitForTimeout(ms);
  expect(await frames()).toBeLessThanOrEqual(start + 2);
}
