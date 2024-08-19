// src/client.ts
import WebSocket from "ws";
import http from "http";
import { parse } from "url";
import { createProxyServer } from "http-proxy";

const serverUrl = "ws://localhost:8080";
const clientId = "my-client-id";
const localTarget = "http://localhost:3000";

const ws = new WebSocket(serverUrl);

ws.on("open", () => {
  ws.send(
    JSON.stringify({ type: "register", id: clientId, target: localTarget })
  );
  console.log(`Connected to server as ${clientId}`);
});

ws.on("close", () => {
  console.log("Disconnected from server");
});

const proxy = createProxyServer({});

proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err);
  if (res instanceof http.ServerResponse) {
    res.writeHead(502, {
      "Content-Type": "text/plain",
    });
    res.end("Bad Gateway: Unable to reach target server");
  }
});

const server = http.createServer((req, res) => {
  proxy.web(req, res, { target: localTarget }, (err) => {
    if (err) {
      console.error("Error proxying request:", err);
      if (res instanceof http.ServerResponse) {
        res.writeHead(502, {
          "Content-Type": "text/plain",
        });
        res.end("Bad Gateway: Unable to reach target server");
      }
    }
  });
});

server.listen(3001, () => {
  console.log("Client proxy server listening on port 3001");
});
