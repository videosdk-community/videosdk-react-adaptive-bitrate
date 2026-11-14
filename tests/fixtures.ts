import { test as base, type Page } from "@playwright/test";
import { createRoom, joinCall, token } from "./helpers/meeting";

type Call = { roomId: string; alice: Page; bob: Page };

// Two people in one fresh room, each in their own browser context (separate cookies,
// storage and network, like two machines). Skips when no VideoSDK token is set.
export const test = base.extend<{ call: Call }>({
  call: async ({ browser }, use, testInfo) => {
    testInfo.skip(!token, "Set VITE_VIDEOSDK_TOKEN in .env to run call tests");
    const roomId = await createRoom();
    const [aliceCtx, bobCtx] = await Promise.all([browser.newContext(), browser.newContext()]);
    const [alice, bob] = await Promise.all([aliceCtx.newPage(), bobCtx.newPage()]);
    await joinCall(alice, roomId, "Alice");
    await joinCall(bob, roomId, "Bob");
    await use({ roomId, alice, bob });
    await Promise.all([aliceCtx.close(), bobCtx.close()]);
  },
});

export { expect } from "@playwright/test";
