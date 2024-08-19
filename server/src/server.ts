// src/server.ts
import express, { Request, Response } from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import httpProxy from "http-proxy";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const proxy = httpProxy.createProxyServer({});
const port = 8080;

interface Client {
  ws: WebSocket;
  target: string;
}

const clients: Record<string, Client> = {};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message.toString());
    if (data.type === "register") {
      clients[data.id] = { ws, target: data.target };
      console.log(`Client registered: ${data.id}`);
    }
  });

  ws.on("close", () => {
    for (const id in clients) {
      if (clients[id].ws === ws) {
        delete clients[id];
        console.log(`Client disconnected: ${id}`);
        break;
      }
    }
  });
});

app.use((req: Request, res: Response) => {
  const clientId = req.headers["x-client-id"] as string;
  if (clientId && clients[clientId]) {
    proxy.web(req, res, { target: clients[clientId].target });
  } else {
    res.status(404).send("Client not found");
  }
});

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
