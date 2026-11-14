import { useMeeting } from "@videosdk.live/react-sdk";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { IconButton } from "../ui/Button";

export default function Controls() {
  const { localMicOn, localWebcamOn, toggleMic, toggleWebcam, leave } = useMeeting();

  return (
    <footer className="flex h-16 items-center justify-center gap-2 border-t border-hairline">
      <IconButton
        size="lg"
        aria-label={localMicOn ? "Mute mic" : "Unmute mic"}
        aria-pressed={!localMicOn}
        variant={localMicOn ? "secondary" : "destructive"}
        onClick={() => void toggleMic()}
      >
        {localMicOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
      </IconButton>
      <IconButton
        size="lg"
        aria-label={localWebcamOn ? "Turn camera off" : "Turn camera on"}
        aria-pressed={!localWebcamOn}
        variant={localWebcamOn ? "secondary" : "destructive"}
        onClick={() => void toggleWebcam()}
      >
        {localWebcamOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
      </IconButton>
      <IconButton size="lg" aria-label="Leave call" variant="destructive" onClick={() => void leave()}>
        <PhoneOff className="size-5" />
      </IconButton>
    </footer>
  );
}
