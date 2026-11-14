# Test adaptive bitrate in a VideoSDK video call

A small two-person call built with the [VideoSDK React SDK](https://docs.videosdk.live/react/guide/video-and-audio-calling-api-sdk/quick-start?utm_source=github&utm_medium=readme&utm_campaign=bitrate-explained-2026),
plus a way to give one person a slow network on purpose, so you can watch adaptive bitrate work.

Each video tile shows a live badge with what is being sent or received: bitrate (kbps), resolution
and frame rate, read from VideoSDK's `getVideoStats()`.

What you will see when Alice's upload is capped (measured on Chrome 157, VP8):

| Alice's upload | What Bob receives |
|---|---|
| no cap | ~700 kbps, 1280x720, 20 fps |
| 300 kbps | ~200-280 kbps, 960x540, 20 fps (dips to 360p at times) |
| 150 kbps | ~100 kbps, 480x270, 20 fps |
| cap removed | climbs back over the next ~45 s |

The video gets softer, but it never stops.

## Why not DevTools throttling?

Chrome DevTools network throttling does not slow down WebRTC media. With a 300 kbps upload limit,
the call kept sending ~700 kbps at 720p. So this repo uses a tiny local proxy instead
([`scripts/slow-network.mjs`](scripts/slow-network.mjs)) that drains one browser's upload at a set
speed. Two things send that browser's call media through it:

- Chrome's `--proxy-server` flag, pointing at the proxy.
- `?tcp` in the app URL, which sets VideoSDK's `preferredProtocol: "TCP_ONLY"`. Over the default
  UDP, media skips the proxy.

## Run it

1. Clone and install:

   ```bash
   git clone https://github.com/videosdk-community/videosdk-react-adaptive-bitrate.git
   cd videosdk-react-adaptive-bitrate
   pnpm install
   ```

2. [Sign up for VideoSDK](https://app.videosdk.live/?utm_source=github&utm_medium=readme&utm_campaign=bitrate-explained-2026)
   and generate a temporary token on the API Keys page. Copy `.env.example` to `.env` and paste it.

3. Start the app and the slow-network proxy, each in its own terminal:

   ```bash
   pnpm dev
   ```

   ```bash
   pnpm slow-network
   ```

4. Open Alice in a separate Chrome that uses the proxy. The separate `--user-data-dir` keeps it away
   from your normal Chrome profile.

   macOS:

   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --user-data-dir=/tmp/alice --proxy-server=http://127.0.0.1:8899 "http://localhost:5173/?tcp"
   ```

   Windows (PowerShell):

   ```powershell
   & "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir=$env:TEMP\alice --proxy-server=http://127.0.0.1:8899 "http://localhost:5173/?tcp"
   ```

   Linux:

   ```bash
   google-chrome --user-data-dir=/tmp/alice --proxy-server=http://127.0.0.1:8899 "http://localhost:5173/?tcp"
   ```

   Type a name and click **New room**.

5. Open Bob in your normal browser: copy the room id from Alice's URL and open
   `http://localhost:5173/?room=<id>`. Join.

6. Make Alice's network worse and watch Bob's badge for Alice:

   ```bash
   curl "http://127.0.0.1:8899/rate?kbps=300"
   curl "http://127.0.0.1:8899/rate?kbps=150"
   curl "http://127.0.0.1:8899/rate?kbps=0"    # no cap
   ```

   Give it 5-10 seconds after each change. For the raw numbers, open `chrome://webrtc-internals` in
   Alice's Chrome: the video `outbound-rtp` entry shows `targetBitrate`, `frameHeight` and
   `qualityLimitationReason: bandwidth` while capped.

Using two machines, or one person on a phone, works too: only the browser started with
`--proxy-server` and `?tcp` is slowed down.

## Let Claude Code run it

`.mcp.json` gives [Claude Code](https://claude.com/claude-code) three MCP servers:

- `videosdk`: the [VideoSDK MCP server](https://docs.videosdk.live/react/guide/video-and-audio-calling-api-sdk/ai-tools/mcp-server?utm_source=github&utm_medium=readme&utm_campaign=bitrate-explained-2026),
  so it looks up VideoSDK APIs in the current docs.
- `alice` and `bob`: two [Playwright MCP](https://github.com/microsoft/playwright-mcp) browsers with
  fake cameras. Alice's goes through the slow-network proxy (`playwright-mcp.alice.json`).

Open `claude` in the repo, approve the servers, and ask it to start a call, cap Alice's upload and
report what Bob receives. [`CLAUDE.md`](CLAUDE.md) tells it how: which browser is which, to join
Alice with `?tcp`, to change the cap with `curl`, and to check real frames and bitrate instead of
trusting the "Connected" badge.

## Tests

`pnpm test:e2e` runs a headless Playwright suite: video both ways, mute, leave, and recovery after a
full network drop. See [`tests/README.md`](tests/README.md).
