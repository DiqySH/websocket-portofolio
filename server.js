import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";

const PORT = process.env.PORT || 3000;

const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });

const players = new Map();

wss.on("connection", (ws) => {
  const id = crypto.randomUUID();
  players.set(id, { x: 0, y: 0 });

  console.log("player connected:", id);
  console.log("total players:", players.size);

  ws.send(JSON.stringify({ type: "welcome", id }));

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "move") {
        players.set(id, {
          x: msg.x,
          y: msg.y,
          state: msg.state,
          facing: msg.facing,
        });
      }

      const payload = JSON.stringify({
        type: "state",
        players: Object.fromEntries(players),
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
      });
    } catch (err) {
      console.error("invalid json");
    }
  });

  ws.on("close", () => {
    players.delete(id);

    const payload = JSON.stringify({ type: "remove", id });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
  });
});

console.log("WebSocket running on port", PORT);
