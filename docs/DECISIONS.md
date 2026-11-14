# Decisions

## 2026-11-05 Token: one dashboard token in `VITE_VIDEOSDK_TOKEN`

Same as the VideoSDK quickstart: the reader pastes a temporary token from the dashboard. The app
uses it to create rooms and to join. No server, no API secret in the repo. Ceiling: the token ships
in the browser bundle and expires, so this is a local example, not a deploy pattern.

## 2026-11-05 Join with `joinWithoutUserInteraction`

Calling `join()` from a child `useEffect` sent `authorization: undefined` to
`/infra/v1/meetings/init-config` and the meeting went `FAILED`. Child effects run before
`MeetingProvider`'s own effect, which is where it calls `VideoSDK.config(token)`. Letting the
provider join right after it configures the token fixes it. The pre-join click is the user action.

## 2026-11-05 Network-drop spike: `context.setOffline` is a real drop

Run on Chromium 156 (Playwright 1.64), react-sdk 1.2.0. Alice goes offline while in a call with Bob:

- Alice: `CONNECTED` -> `RECONNECTING` about 4-5 s after going offline. Her remote video stops.
- Bob gets no new frames from Alice. What he sees varies run to run: her tile frozen, her camera
  shown as off, or her tile gone. The test asserts "no new frames", which covers all three.
- Back online: Alice is `CONNECTED` again in under 5 s, and video flows both ways.
- Same result with `preferredProtocol` `UDP_ONLY` and the default `UDP_OVER_TCP`, so the app keeps
  the default.
- Drops of 15 s and 30 s recover. A 90 s drop did not: Bob's tile for Alice went away and Alice
  stayed `RECONNECTING` for 40 s after coming back. The test uses a short drop (about 8 s).

The proxy fallback and the leave-and-rejoin scene in the brief are not needed.

## 2026-11-05 Own `<video>` element, not the SDK `VideoPlayer`

Ported from the zoom-clone: the SDK player pauses the stream when its IntersectionObserver sees the
tile as off-screen during layout, which can freeze remote video. The tests look for frozen video,
so the app must not cause it.

## 2026-11-05 Playwright MCP uses installed Google Chrome

`@playwright/mcp@0.0.84` bundles its own Playwright build and cannot find the Chromium installed by
`@playwright/test`. `channel: "chrome"` in `playwright-mcp.json` uses the installed Chrome instead.
Fake camera works through the MCP (`fake_device_0`). Two servers (`alice`, `bob` in `.mcp.json`)
each joined the same room and got video both ways. In 0.0.84 the element argument is `target`,
not `ref`.

## 2026-11-05 No GitHub Actions workflow

The user's call. The suite runs headless locally with `pnpm test:e2e`.


## 2026-11-05 Playwright MCP gets `--caps=network`

The video has Claude take Alice's browser offline through the MCP. In `@playwright/mcp@0.0.84` the
offline tool, `browser_network_state_set`, only registers with `--caps=network`, so both servers in
`.mcp.json` pass it. The tool calls `browserContext.setOffline`, the same call the spike proved is a
real drop. Not yet run end to end through the MCP on installed Chrome.

## 2026-11-05 Visible MCP browsers, one config each

The video now shows both browsers live next to Claude Code instead of only screenshots in its
transcript. `playwright-mcp.json` is split into `playwright-mcp.alice.json` and
`playwright-mcp.bob.json`: same fake-media flags and permissions, plus `--window-position` and
`--window-size` so Alice opens top-right and Bob bottom-right (quadrants of a 1470x956 screen),
and `viewport: null` so the page follows the window. `headless` is no longer set in the config,
so the MCP default (headed) applies and `--headless` in `.mcp.json` turns windows off.

The call room grid switched from `md:grid-cols-2` to `landscape:grid-cols-2`: at 735 px the tiles
stacked and the remote tile fell below the fold.

Verified through both real MCP servers (0.0.84, installed Chrome) over stdio, twice: fake camera,
both join, 48-54 new remote frames per 2 s both ways, `browser_network_state_set` offline puts
Alice in `RECONNECTING` after 4.8 s with 0 new frames at Bob, online returns her to `CONNECTED` in
1.8 s and 6.4 s, then video both ways. This closes the "not yet run end to end through the MCP"
note on `--caps=network`. Recovery time varies run to run, so expect a few seconds, not a fixed number.

## 2026-11-14 Bad network = a local upload-capping proxy + TCP_ONLY, not DevTools throttling

Spikes on Chromium 156 (headless and headed) and installed Chrome 157 (headed), react-sdk 1.2.0,
`multiStream: false`. Video bitrate read from `RTCPeerConnection.getStats()` (bytes over 4 s).

- CDP `Network.emulateNetworkConditions` with a 300 kbps upload cap on Alice: no effect. She kept
  sending ~700 kbps and Bob kept 1280x720. DevTools throttling does not reach WebRTC media
  (`setOffline` does, which is why the reconnect test works).
- `--proxy-server` alone, or with `--force-webrtc-ip-handling-policy=disable_non_proxied_udp`: media
  still picks UDP (selected pair `prflx/udp`) and the cap does nothing. One early headless run did go
  over TCP and looked like it worked; it did not repeat.
- What works everywhere: VideoSDK `preferredProtocol: "TCP_ONLY"` (the app sets it when the URL has
  `?tcp`) plus `--proxy-server=http://127.0.0.1:8899` on Alice's Chrome. Selected pair is TCP, and
  `scripts/slow-network.mjs` caps it: ~700 kbps uncapped, ~190-260 kbps at a 300 kbps cap, on all three.
- Only Alice's browser uses the proxy (`playwright-mcp.alice.json`). No system network settings, no sudo.
