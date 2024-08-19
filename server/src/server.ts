import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = 8080;

interface Client {
  ws: WebSocket;
  target: string;
}

let client: Client | null = null;

// WebSocket server for client connections
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message.toString());
    if (data.type === "register") {
      client = { ws, target: data.target };
      console.log(`Client registered: ${data.target}`);
    } else if (data.type === "response" && data.responseId) {
      // Find the request corresponding to the response and forward the response
      const requestResponseMap = requestMap[data.responseId];
      if (requestResponseMap) {
        requestResponseMap.res.writeHead(data.statusCode, data.headers);
        requestResponseMap.res.end(data.body);
        delete requestMap[data.responseId];
      }
    }
  });

  ws.on("close", () => {
    if (client && client.ws === ws) {
      client = null;
      console.log(`Client disconnected`);
    }
  });
});

// Map to store pending requests
const requestMap: Record<
  string,
  { req: http.IncomingMessage; res: http.ServerResponse }
> = {};

// Express middleware to handle requests
app.use((req, res) => {
  if (client) {
    const requestId = Math.random().toString(36).substring(2); // Generate a unique ID for the request
    requestMap[requestId] = { req, res };

    const message = {
      type: "request",
      requestId,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: "",
    };

    req.on("data", (chunk) => {
      message.body += chunk.toString();
    });

    req.on("end", () => {
      client?.ws.send(JSON.stringify(message));
    });
  } else {
    res.status(502).send("No client connected");
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
