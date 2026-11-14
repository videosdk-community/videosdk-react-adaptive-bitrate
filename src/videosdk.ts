export const token = import.meta.env.VITE_VIDEOSDK_TOKEN as string | undefined;

// Create a room with the same token the call joins with.
// https://docs.videosdk.live/api-reference/realtime-communication/create-room
export async function createRoom(): Promise<string> {
  const res = await fetch("https://api.videosdk.live/v2/rooms", {
    method: "POST",
    headers: { authorization: token ?? "", "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Create room failed: ${res.status}`);
  const { roomId } = (await res.json()) as { roomId: string };
  return roomId;
}
