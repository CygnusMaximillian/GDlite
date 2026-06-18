import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  // polling first so Render's proxy can complete the HTTP upgrade handshake,
  // then upgrades to websocket automatically
  transports: ["polling", "websocket"],
});
