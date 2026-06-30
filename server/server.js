const http = require("http");
const path = require("path");
const express = require("express");
const { Server } = require("socket.io");
const { loadConfig } = require("./configLoader");
const { NameAssigner } = require("./nameAssigner");

const PORT = Number(process.env.PORT || 3000);
const CONFIG_PATH = process.env.CONFIG_PATH || "/config/chat-config.json";
const TRUST_PROXY = String(process.env.TRUST_PROXY || "false").toLowerCase() === "true";
const MAX_HISTORY = 100;
const MAX_MESSAGE_LENGTH = 2000;

let config;
try {
  config = loadConfig(CONFIG_PATH);
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
}

const app = express();
if (TRUST_PROXY) {
  app.set("trust proxy", true);
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: false
});

const nameAssigner = new NameAssigner(config);
const messageHistory = [];
const socketUsers = new Map();

function normalizeIp(rawIp) {
  if (!rawIp || typeof rawIp !== "string") {
    return "unknown";
  }

  let ip = rawIp.trim();

  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  }

  if (ip.startsWith("::ffff:")) {
    ip = ip.slice("::ffff:".length);
  }

  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
    return "127.0.0.1";
  }

  const ipv4WithPort = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4WithPort) {
    return ipv4WithPort[1];
  }

  return ip;
}

function extractSocketIp(socket) {
  if (TRUST_PROXY) {
    const forwardedFor = socket.handshake.headers["x-forwarded-for"];
    if (forwardedFor) {
      return normalizeIp(Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor);
    }
  }

  return normalizeIp(socket.handshake.address);
}

function createMessage(senderName, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    senderName,
    text,
    timestamp: new Date().toISOString()
  };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const staticPath = path.join(__dirname, "public");
app.use(express.static(staticPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

io.on("connection", (socket) => {
  const ip = extractSocketIp(socket);
  const assignedName = nameAssigner.getNameForIp(ip);
  socketUsers.set(socket.id, { ip, assignedName });

  socket.emit("chat:user-assigned", { name: assignedName });
  socket.emit("chat:history", messageHistory);

  socket.on("chat:message", (payload) => {
    const text = typeof payload === "string" ? payload : payload && payload.text;
    const trimmedText = typeof text === "string" ? text.trim() : "";

    if (!trimmedText) {
      return;
    }

    const boundedText = trimmedText.slice(0, MAX_MESSAGE_LENGTH);
    const message = createMessage(assignedName, boundedText);
    messageHistory.push(message);

    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.splice(0, messageHistory.length - MAX_HISTORY);
    }

    io.emit("chat:message", message);
  });

  socket.on("disconnect", () => {
    socketUsers.delete(socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Sigit Messanger listening on port ${PORT}`);
  console.log(`Config loaded from ${path.resolve(CONFIG_PATH)}`);
});
