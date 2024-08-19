import WebSocket from "ws";
import http from "http";

const serverUrl = "ws://localhost:8080";
const localTarget = "http://localhost:3000";

const ws = new WebSocket(serverUrl);

ws.on("open", () => {
  ws.send(JSON.stringify({ type: "register", target: localTarget }));
  console.log(`Connected to server with target ${localTarget}`);
});

ws.on("close", () => {
  console.log("Disconnected from server");
});

ws.on("message", (message) => {
  const data = JSON.parse(message.toString());
  if (data.type === "request") {
    const options = {
      method: data.method,
      headers: data.headers,
    };

    const req = http.request(localTarget + data.url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        const responseMessage = {
          type: "response",
          responseId: data.requestId,
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        };
        ws.send(JSON.stringify(responseMessage));
      });
    });

    req.on("error", (err) => {
      console.error("Request error:", err);
      const responseMessage = {
        type: "response",
        responseId: data.requestId,
        statusCode: 500,
        headers: { "Content-Type": "text/plain" },
        body: "Internal Server Error",
      };
      ws.send(JSON.stringify(responseMessage));
    });

    if (data.body) {
      req.write(data.body);
    }
    req.end();
  }
});
