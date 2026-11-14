import { useEffect, useRef, useState } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";
import { MicOff } from "lucide-react";

// Own <video> instead of the SDK's <VideoPlayer>: the SDK player pauses the stream when an
// IntersectionObserver briefly sees the tile as off-screen during layout, which can freeze
// remote video. A frozen tile is exactly what the tests look for, so it must never be our bug.
export default function ParticipantTile({ participantId }: { participantId: string }) {
  const { displayName, webcamOn, webcamStream, micOn, micStream, isLocal, setViewPort, getVideoStats } =
    useParticipant(participantId);
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = webcamOn && webcamStream?.track ? new MediaStream([webcamStream.track]) : null;
    void video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [webcamOn, webcamStream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLocal) return;
    audio.srcObject = micOn && micStream?.track ? new MediaStream([micStream.track]) : null;
    void audio.play().catch(() => {});
  }, [isLocal, micOn, micStream]);

  // Tell the SFU the tile size so it sends a fitting resolution.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setViewPort(width, height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [setViewPort]);

  return (
    <div
      ref={boxRef}
      data-testid="participant-tile"
      data-participant-id={participantId}
      data-local={isLocal}
      data-webcam-on={webcamOn}
      data-mic-on={micOn}
      className="relative aspect-video overflow-hidden rounded-2xl border border-hairline bg-inset"
    >
      <video
        ref={videoRef}
        data-testid="participant-video"
        autoPlay
        muted
        playsInline
        className={`size-full object-cover ${isLocal ? "-scale-x-100" : ""} ${webcamOn ? "" : "invisible"}`}
      />
      {!webcamOn && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-16 items-center justify-center rounded-pill bg-raised text-2xl font-semibold text-ink">
            {displayName?.[0]?.toUpperCase()}
          </span>
        </div>
      )}
      {!isLocal && <audio ref={audioRef} autoPlay />}
      {webcamOn && <StatsBadge getVideoStats={getVideoStats} isLocal={isLocal} />}
      {/* Scrim over video: dark in both themes, so its colors are fixed, not theme aliases. */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-sm text-white">
        {!micOn && <MicOff aria-label="Muted" className="size-3.5 text-danger-soft" />}
        {displayName}
        {isLocal && " (you)"}
      </div>
    </div>
  );
}

type VideoStats = { bitrate?: number; size?: { width?: number; height?: number; framerate?: number } };

// Live video stats for this tile, polled once a second from VideoSDK's getVideoStats().
// Local tile: what you send. Remote tile: what you receive from that person.
function StatsBadge({ getVideoStats, isLocal }: { getVideoStats: () => Promise<VideoStats[]>; isLocal: boolean }) {
  const [stats, setStats] = useState<VideoStats>();

  useEffect(() => {
    const id = setInterval(async () => {
      const [s] = await getVideoStats().catch(() => []);
      setStats(s);
    }, 1000);
    return () => clearInterval(id);
  }, [getVideoStats]);

  if (!stats) return null;
  const kbps = Math.round(stats.bitrate ?? 0);
  const { width = 0, height = 0, framerate = 0 } = stats.size ?? {};
  return (
    <div
      data-testid="video-stats"
      data-bitrate={kbps}
      data-frame-height={height}
      data-fps={framerate}
      className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-1 font-mono text-xs text-white"
    >
      {isLocal ? "sending" : "receiving"} {kbps} kbps · {width}x{height} · {framerate} fps
    </div>
  );
}
