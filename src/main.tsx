import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App";

// No <StrictMode>: in dev it mounts effects twice, so MeetingProvider would join twice
// and one browser would show up as two participants.
createRoot(document.getElementById("root")!).render(<App />);
