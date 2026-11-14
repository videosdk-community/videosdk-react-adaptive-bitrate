import { expect, type Page } from "@playwright/test";

export const token = process.env.VITE_VIDEOSDK_TOKEN;

// https://docs.videosdk.live/api-reference/realtime-communication/create-room
export async function createRoom(): Promise<string> {
  const res = await fetch("https://api.videosdk.live/v2/rooms", {
    method: "POST",
    headers: { authorization: token ?? "" },
  });
  expect(res.ok, `create room: HTTP ${res.status}`).toBe(true);
  return ((await res.json()) as { roomId: string }).roomId;
}

export async function joinCall(page: Page, roomId: string, name: string) {
  await page.goto(`/?room=${roomId}`);
  await page.getByLabel("Your name").fill(name);
  await page.getByRole("button", { name: "Join", exact: true }).click();
  await expectState(page, "CONNECTED");
}

// The app mirrors the SDK's onMeetingStateChanged into data-meeting-state.
// Values: CONNECTING, CONNECTED, RECONNECTING, DISCONNECTED.
export async function expectState(page: Page, state: string, timeout = 30_000) {
  await expect(page.locator("[data-meeting-state]")).toHaveAttribute("data-meeting-state", state, { timeout });
}

export const tiles = (page: Page) => page.getByTestId("participant-tile");
export const remoteTile = (page: Page) => page.locator('[data-testid="participant-tile"][data-local="false"]');
export const remoteVideo = (page: Page) => remoteTile(page).getByTestId("participant-video");
