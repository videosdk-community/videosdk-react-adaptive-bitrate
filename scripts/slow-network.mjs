// A local HTTP proxy that caps upload speed, to give one browser a bad network.
// Point one Chrome at it with --proxy-server=http://127.0.0.1:8899 and join with ?tcp in the URL
// (VideoSDK preferredProtocol TCP_ONLY), so that browser's call media goes through it as TCP.
// Change the cap while it runs:  curl "http://127.0.0.1:8899/rate?kbps=300"   (0 = no cap)
import http from "node:http";
import net from "node:net";

const PORT = Number(process.env.PORT ?? 8899);
let kbps = Number(process.env.KBPS ?? 0);

// Every upload chunk from every tunnel waits in one queue that drains at `kbps`.
const queue = [];
let budget = 0;
setInterval(() => {
  budget = kbps ? budget + (kbps * 1000) / 8 / 50 : Infinity;
  while (queue.length && queue[0].chunk.length <= budget) {
    const { chunk, out } = queue.shift();
    budget -= chunk.length;
    if (!out.destroyed) out.write(chunk);
  }
  if (!queue.length && kbps) budget = Math.min(budget, (kbps * 1000) / 8 / 10); // no burst after idle
}, 20);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/rate") {
    if (url.searchParams.has("kbps")) kbps = Number(url.searchParams.get("kbps"));
    res.end(`upload cap: ${kbps ? `${kbps} kbps` : "none"}\n`);
    return;
  }
  res.writeHead(404).end();
});

// HTTPS and TURN-over-TCP both arrive as CONNECT tunnels.
server.on("connect", (req, client, head) => {
  const [host, port] = req.url.split(":");
  const upstream = net.connect(Number(port), host, () => {
    client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    if (head.length) queue.push({ chunk: head, out: upstream });
    client.on("data", (chunk) => queue.push({ chunk, out: upstream }));
    upstream.pipe(client);
  });
  const close = () => (client.destroy(), upstream.destroy());
  upstream.on("error", close);
  client.on("error", close);
  client.on("close", close);
});

server.listen(PORT, "127.0.0.1", () => console.log(`slow-network proxy on :${PORT}, upload cap ${kbps || "none"}`));
