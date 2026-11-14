# videosdk-react-adaptive-bitrate

Two-person VideoSDK call (pre-join + call room) for showing adaptive bitrate: what each person
sends and receives, and how it changes when a network gets worse. Playwright suite in `tests/`. Decisions and the network-drop spike: `docs/DECISIONS.md`.

- `pnpm dev`, `pnpm test:e2e` (headless, one worker), `pnpm typecheck`.
- Token: `VITE_VIDEOSDK_TOKEN` in `.env`. Tests skip without it.
- SDK hooks live only in `src/meeting/`.
- `onMeetingStateChanged` emits `RECONNECTING`, but the SDK's TypeScript union does not list it.
  Keep the state as a plain string.
- The tests read `data-meeting-state` and `data-testid` attributes (contract in `tests/README.md`).
  Renaming them breaks the tests and every repo that copied the folder.
- UI uses videosdk-design tokens (`src/styles/`) and ported primitives in `src/ui/`. Dark default.
- `.mcp.json` gives Claude Code two Playwright MCP browsers, `alice` and `bob`, with fake cameras.

## Testing the call live with the Playwright MCP

When asked to test the call, run the check end to end, or "see if video works", do it live in the
two MCP browsers. Do not answer from reading code, and do not run `pnpm test:e2e` unless asked.

Setup
- Start the slow-network proxy with `pnpm slow-network` in the background if it is not already
  running (port 8899). Alice's browser sends everything through it, so without it she has no network.
- Start the app with `pnpm dev` in the background if it is not already running, and use the URL it
  prints. Never start a second dev server.
- Alice is the `alice` MCP server, Bob is the `bob` MCP server. One person per browser. Never put
  both people in one browser or in two tabs of one browser.
- Leave the windows where the config files put them. Do not resize, move, or close them unless
  asked. Do not open extra tabs.
- Join flow: Alice opens the app with `?tcp` (`/?tcp`), types her name, clicks **New room**. Read
  the room id from her URL (`?tcp=&room=<id>`). Bob opens `/?room=<id>`, types his name, clicks **Join**. Wait for
  `data-meeting-state="CONNECTED"` in both browsers before checking anything.

Checking video (both directions, every time)
- The "Connected" badge and a `<video>` element existing prove nothing. Check what each person
  actually receives.
- For the remote tile (`[data-testid="participant-tile"][data-local="false"]`, its
  `[data-testid="participant-video"]`) in each browser, use `browser_evaluate` to:
  1. read `getVideoPlaybackQuality().totalVideoFrames`, wait about 2 seconds, read it again. It
     must rise by more than 10.
  2. draw the current frame to a small canvas and average the pixel brightness. It must be above
     10 (0-255), so the picture is not black.
- Same method as `tests/helpers/media.ts`. Report Alice -> Bob and Bob -> Alice separately, with the
  numbers.
- Also confirm both cameras are Chrome's fake device (`enumerateDevices` labels contain "fake").

After any code change
- Vite hot reload can leave an existing call in a stale state. After changing app code, reload both
  browsers and rejoin the same room before checking again. Never call a fix done until the live
  check passes both ways.

Finding and fixing a bug
- Start from the behavior you measured (which direction fails, which number is wrong), then read the
  code in `src/` that produces it. Fix the root cause in the app.
- Never edit `tests/`, the MCP config files, or `node_modules` to make a check pass. Never lower a
  threshold or skip a check.
- Keep the fix as small as the bug. No refactors, no new dependencies.

Network drop
- Use the `browser_network_state_set` tool on `alice` only (needs `--caps=network`, already set).
  Do not fake the drop with `browser_evaluate`.
- After going offline: wait for Alice's `data-meeting-state` to read `RECONNECTING` (about 5 s),
  then check Bob gets no new frames from her over about 3 s. Her tile on Bob's side may freeze, show
  camera off, or disappear; all three count.
- Bring her back online within about 10 s (drops past about 30 s may not recover). Wait for
  `CONNECTED`, then run the video check both ways again.
- Poll the state attribute; never wait on a fixed sleep and assume.

Bad network (upload cap on Alice)
- Alice's browser uses `scripts/slow-network.mjs` as its proxy, and `?tcp` makes VideoSDK send her
  media over TCP (`preferredProtocol: "TCP_ONLY"`), so it goes through the proxy. Without `?tcp` her
  media goes over UDP and the cap does nothing. Set her upload cap with
  `curl "http://127.0.0.1:8899/rate?kbps=<n>"`, and `kbps=0` to remove it. Bob is never capped.
- Chrome DevTools network throttling does not touch WebRTC media. Do not use it for this.
- After changing the cap, give the call about 5-10 s to adapt before reading numbers.

Headless run
- When asked to run the tests headless, close nothing else and run `pnpm test:e2e`. It starts its
  own server on port 5199 and its own browsers. Report the pass/fail per test.

Always
- Never print, echo, or paste the contents of `.env` or the token. Never commit or push.
- Keep reports short: what you did, the numbers, pass or fail.
