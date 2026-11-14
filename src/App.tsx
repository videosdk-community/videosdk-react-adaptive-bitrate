import { useState } from "react";
import PreJoin from "./PreJoin";
import CallRoom from "./meeting/CallRoom";

type Call = { roomId: string; name: string };

export default function App() {
  const [call, setCall] = useState<Call | null>(null);

  if (!call) {
    return (
      <PreJoin
        onJoin={(c) => {
          history.replaceState(null, "", `?room=${c.roomId}`);
          setCall(c);
        }}
      />
    );
  }
  return <CallRoom {...call} onLeft={() => setCall(null)} />;
}
