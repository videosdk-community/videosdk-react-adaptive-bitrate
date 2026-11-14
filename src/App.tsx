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
          const url = new URL(location.href); // keep other params, like ?tcp
          url.searchParams.set("room", c.roomId);
          history.replaceState(null, "", url);
          setCall(c);
        }}
      />
    );
  }
  return <CallRoom {...call} onLeft={() => setCall(null)} />;
}
