# Test a VideoSDK video call with Playwright

A small two-person team call built with the [VideoSDK React SDK](https://docs.videosdk.live/react/guide/video-and-audio-calling-api-sdk/quick-start?utm_source=github&utm_medium=readme&utm_campaign=video-call-testing-2026),
and a Playwright suite that tests it the way a user would: two browsers with fake cameras join one
meeting, and the tests check that video really plays both ways.

What the tests prove:

- Both people see each other's live video. Frames keep arriving and the picture is not black.
- Muting shows on the other side.
- Leaving removes the tile for the other person.
- After a network drop, the call goes `RECONNECTING`, then rejoins on its own and video comes back.

## Run it

1. Clone and install:

   ```bash
   git clone https://github.com/videosdk-community/videosdk-react-video-call-testing.git
   cd videosdk-react-video-call-testing
   pnpm install
   pnpm exec playwright install chromium
   ```

2. [Sign up for VideoSDK](https://app.videosdk.live/?utm_source=github&utm_medium=readme&utm_campaign=video-call-testing-2026)
   and generate a temporary token on the API Keys page. Copy `.env.example` to `.env` and paste it:

   ```bash
   cp .env.example .env
   ```

3. Run the tests (headless):

   ```bash
   pnpm test:e2e
   ```

   Or try the app yourself with `pnpm dev`, open it in two browser windows, and join one room.

## How the tests work

- `playwright.config.ts` starts Chromium with `--use-fake-device-for-media-stream` and
  `--use-fake-ui-for-media-stream`, so each browser gets a fake camera and no permission prompt.
- `tests/fixtures.ts` creates a room through the VideoSDK REST API and joins Alice and Bob from two
  browser contexts.
- `tests/helpers/media.ts` reads `getVideoPlaybackQuality().totalVideoFrames` to check new frames
  keep arriving, and draws a frame to a canvas to check it is not black.
- `tests/reconnect.spec.ts` calls `context.setOffline(true)` on Alice, waits for the SDK's
  [`RECONNECTING` state](https://docs.videosdk.live/react/guide/video-and-audio-calling-api-sdk/setup-call/meeting-connection-state-events?utm_source=github&utm_medium=readme&utm_campaign=video-call-testing-2026),
  checks Bob stops getting her frames, then brings her back and waits for `CONNECTED`.

Copying the tests into your own app: see [`tests/README.md`](tests/README.md).

## Let Claude Code test the call

`.mcp.json` adds two [Playwright MCP](https://github.com/microsoft/playwright-mcp) browsers,
`alice` and `bob`. Out of the box the Playwright MCP gives you one browser with no fake camera and
no network control. These two each get a fake camera and mic, network control (`--caps=network`),
and their own window spot (`playwright-mcp.alice.json`, `playwright-mcp.bob.json`: Alice top-right,
Bob bottom-right). Change `--window-position` and `--window-size` there to fit your screen. Both
use your installed Google Chrome.

Follow these steps in order. Every command and prompt is copy-paste ready.

### 1. Open Claude Code in the repo

After the clone, install and `.env` steps in [Run it](#run-it):

```bash
claude
```

Approve the `alice` and `bob` MCP servers when Claude Code asks.

### 2. Install the Playwright plugin

```text
/plugin install playwright@claude-plugins-official
```

Then check that `alice` and `bob` are connected:

```text
/mcp
```

The call test uses only `alice` and `bob`.

### 3. Test the call

```text
Start the app, open Alice and Bob, join them to the same call, and check that each person sees the other's live video.
```

### 4. Plant a bug (in a second Claude Code session)

Open a second terminal in the same folder and start a separate session, so the one testing the
call never sees the change:

```bash
claude
```

```text
Add a small, realistic bug to the video tile so the other person's video stays black while the call still says connected. Change one line, add no comments about it, and don't tell me where it is.
```

Close this session when it is done.

### 5. Test again, find and fix the bug

Back in the first session:

```text
Rejoin Alice and Bob, run an end-to-end test of the call, and check that each sees the other's live video.
```

```text
Find and fix the problem, then run the end-to-end test again.
```

### 6. Drop the network

```text
Take Alice offline, check what happens, bring her back online, and confirm video works both ways.
```

### 7. Run the same checks headless

```text
Close the browser windows and run pnpm test:e2e.
```

Or from a terminal:

```bash
pnpm test:e2e
```

To run the MCP browsers without windows instead, add `--headless` to both servers' args in
`.mcp.json`.
