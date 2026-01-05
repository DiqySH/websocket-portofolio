import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";
import https from "https";
import fs from "fs";

const PORT = 443;

const server = https.createServer({
  cert: fs.readFileSync("/etc/letsencrypt/live/vps.diqy.my.id/fullchain.pem"),
  key: fs.readFileSync("/etc/letsencrypt/live/vps.diqy.my.id/privkey.pem"),
});

const wss = new WebSocketServer({ server });

const players = new Map();

wss.on("connection", (ws) => {
  const id = crypto.randomBytes(16).toString("hex");
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

server.listen(PORT, () => {
  console.log(`WSS server running on port ${PORT}`);
});
