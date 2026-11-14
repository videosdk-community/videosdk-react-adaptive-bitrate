import { test, expect } from "./fixtures";
import { expectFakeCamera, expectVideoPlaying } from "./helpers/media";
import { remoteTile, remoteVideo, tiles } from "./helpers/meeting";

test("both people see each other's live video", async ({ call: { alice, bob } }) => {
  await expectFakeCamera(alice);
  await expectFakeCamera(bob);
  await expect(tiles(alice)).toHaveCount(2);
  await expect(tiles(bob)).toHaveCount(2);

  // Both directions: a bug can break only the second joiner, or only one way.
  await expectVideoPlaying(remoteVideo(alice));
  await expectVideoPlaying(remoteVideo(bob));
});

test("mute shows on the other side", async ({ call: { alice, bob } }) => {
  await alice.getByRole("button", { name: "Mute mic" }).click();
  await expect(remoteTile(bob)).toHaveAttribute("data-mic-on", "false");

  await alice.getByRole("button", { name: "Unmute mic" }).click();
  await expect(remoteTile(bob)).toHaveAttribute("data-mic-on", "true");
});

test("leaving removes the tile for the other person", async ({ call: { alice, bob } }) => {
  await alice.getByRole("button", { name: "Leave call" }).click();
  await expect(alice.getByRole("heading", { name: "Join team call" })).toBeVisible();
  await expect(tiles(bob)).toHaveCount(1);
  await expect(bob.getByText("Waiting for someone to join")).toBeVisible();
});
