import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Logo } from "./ui/Logo";
import { createRoom, token } from "./videosdk";

type Props = { onJoin: (call: { roomId: string; name: string }) => void };

export default function PreJoin({ onJoin }: Props) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState(() => new URLSearchParams(location.search).get("room") ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Local camera preview. Stopped before joining so the SDK gets the camera.
  useEffect(() => {
    let stream: MediaStream | undefined;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera blocked. Allow camera access to join with video."));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start(newRoom: boolean) {
    setError("");
    setBusy(true);
    try {
      onJoin({ roomId: newRoom ? await createRoom() : roomId.trim(), name: name.trim() });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-[1fr_320px]">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-hairline bg-inset">
          <video ref={videoRef} autoPlay muted playsInline className="size-full -scale-x-100 object-cover" />
        </div>

        <form
          className="flex flex-col justify-center gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void start(false);
          }}
        >
          <Logo className="h-5 w-fit" />
          <h1 className="text-2xl font-semibold tracking-tight">Join team call</h1>

          {!token && (
            <p role="alert" className="rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-fg">
              Add <code className="font-mono">VITE_VIDEOSDK_TOKEN</code> to <code className="font-mono">.env</code>, then
              restart the dev server.
            </p>
          )}

          <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">
            Your name
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada" required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">
            Room ID
            <Input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="abcd-efgh-ijkl"
              className="font-mono"
            />
          </label>

          <div className="flex gap-2">
            <Button type="submit" disabled={!token || busy || !name.trim() || !roomId.trim()} className="flex-1">
              Join
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!token || busy || !name.trim()}
              onClick={() => void start(true)}
              className="flex-1"
            >
              New room
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger-fg">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
