# Copying these tests into another VideoSDK app

The folder is self-contained: `fixtures.ts`, `helpers/`, and the two specs. Copy `tests/` and
`playwright.config.ts`, then make the app meet this contract:

| What the tests read | Where it comes from |
| --- | --- |
| `[data-meeting-state]` attribute | Set from `onMeetingStateChanged`. Values `CONNECTING`, `CONNECTED`, `RECONNECTING`, `DISCONNECTED` |
| `[data-testid="participant-tile"]` | One per participant, with `data-local`, `data-mic-on`, `data-webcam-on` |
| `[data-testid="participant-video"]` | The `<video>` inside a tile |
| Label "Your name", button "Join" | Pre-join screen, opened with `/?room=<roomId>` |
| Buttons "Mute mic" / "Unmute mic", "Leave call" | Call controls |

If your app joins differently, change only `joinCall` in `helpers/meeting.ts`.

## What each check proves

- `expectFakeCamera`: every camera is Chrome's fake device, so a real webcam never ends up in a test.
- `expectVideoPlaying`: new frames keep arriving (`getVideoPlaybackQuality().totalVideoFrames`
  rises) and the picture is not black. A `<video>` that exists but is frozen or black fails.
- `expectNoNewFrames`: no frames arrive. Used to prove a network drop really cut the media.

## Gotchas

- The flag is `--use-fake-device-for-media-stream`, not `-capture`. Chrome ignores unknown flags
  and would open the real webcam.
- `context.setOffline(true)` cuts HTTP, the signaling WebSocket and WebRTC media in Chromium, so
  it is a real network drop for one participant.
- Run one test at a time (`workers: 1`). Each test runs two browsers with live video.
