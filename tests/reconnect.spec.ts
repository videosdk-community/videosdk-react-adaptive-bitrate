import { test } from "./fixtures";
import { expectNoNewFrames, expectVideoPlaying } from "./helpers/media";
import { expectState, remoteVideo } from "./helpers/meeting";

// setOffline cuts Alice's whole network in Chromium: HTTP, the signaling WebSocket and
// WebRTC media. VideoSDK notices, goes RECONNECTING, and rejoins on its own once she is back.
test("call recovers on its own after a network drop", async ({ call: { alice, bob } }) => {
  await expectVideoPlaying(remoteVideo(bob));

  await alice.context().setOffline(true);
  await expectState(alice, "RECONNECTING");
  await expectNoNewFrames(remoteVideo(bob)); // the drop is real: Bob gets no new frames from Alice

  await alice.context().setOffline(false);
  await expectState(alice, "CONNECTED", 60_000);
  await expectVideoPlaying(remoteVideo(bob));
  await expectVideoPlaying(remoteVideo(alice));
});
