import { useState } from "react";
import { MeetingProvider, useMeeting } from "@videosdk.live/react-sdk";
import { token } from "../videosdk";
import ParticipantTile from "./ParticipantTile";
import Controls from "./Controls";
import { Logo } from "../ui/Logo";

type Props = { roomId: string; name: string; onLeft: () => void };

export default function CallRoom({ roomId, name, onLeft }: Props) {
  return (
    <MeetingProvider
      token={token ?? ""}
      // The SDK joins right after it reads the token. Calling join() from a child effect
      // instead races it: child effects run first, so the join goes out with no token.
      joinWithoutUserInteraction
      config={{
        meetingId: roomId,
        name,
        micEnabled: true,
        webcamEnabled: true,
        multiStream: false,
        // ?tcp in the URL forces media over TCP, so a local proxy can slow it down (see README).
        preferredProtocol: new URLSearchParams(location.search).has("tcp") ? "TCP_ONLY" : "UDP_OVER_TCP",
        debugMode: false,
      }}
    >
      <Room roomId={roomId} onLeft={onLeft} />
    </MeetingProvider>
  );
}

// The runtime emits RECONNECTING, but the SDK's typed union still lists the pre-0.2.1 states,
// so the state is kept as a plain string.
function Room({ roomId, onLeft }: { roomId: string; onLeft: () => void }) {
  const [state, setState] = useState<string>("CONNECTING");
  const { participants } = useMeeting({
    onMeetingStateChanged: ({ state }) => setState(state as string),
    onMeetingLeft: onLeft,
  });

  const ids = [...participants.keys()];

  return (
    <main data-meeting-state={state} className="flex h-full flex-col">
      <header className="flex h-14 items-center justify-between border-b border-hairline px-4">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-mono text-sm text-ink-tertiary">{roomId}</span>
        </div>
        <StateBadge state={state} />
      </header>

      <section className="grid flex-1 content-center gap-4 p-4 landscape:grid-cols-2">
        {ids.map((id) => (
          <ParticipantTile key={id} participantId={id} />
        ))}
        {ids.length === 1 && (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-line text-ink-tertiary">
            Waiting for someone to join
          </div>
        )}
      </section>

      <Controls />
    </main>
  );
}

const BADGE: Record<string, string> = {
  CONNECTED: "border-success-border bg-success-bg text-success-fg",
  RECONNECTING: "border-warning-border bg-warning-bg text-warning-fg",
  CONNECTING: "border-line bg-inset text-ink-secondary",
};

function StateBadge({ state }: { state: string }) {
  return (
    <span
      data-testid="meeting-state"
      className={`rounded-pill border px-2.5 py-0.5 text-sm font-medium ${BADGE[state] ?? "border-danger-border bg-danger-bg text-danger-fg"}`}
    >
      {state.charAt(0) + state.slice(1).toLowerCase()}
    </span>
  );
}
