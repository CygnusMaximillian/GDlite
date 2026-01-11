const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const {Server} = require('socket.io');
const documentRouter = require('./routes/documents');
const authRouter = require('./routes/authRoute');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());
app.use('/document' , documentRouter);
app.use('/api/auth' , authRouter);
app.get('/document' , () => {
  console.log('Server is running');
} );

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
  transports: ["websocket", "polling"],
})

io.use((socket,next) => {
  const token = socket.handshake.auth?.token;
  
  if(!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    console.log("Id is" , decoded);
    socket.user = { id: decoded.userId, email: decoded.email }; // attach actual user info
    next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

io.on("connect_error", (err) => {
  console.log("Connection failed:", err.message);
});

io.on("connection", (socket) => {
  console.log("✅ Socket connected");
  console.log("Socket ID:", socket.id);
  console.log("User:", socket.user);

  socket.emit("ping", "hello from server");

  socket.on("join_document", ({ documentId }) => {
    const roomName = `document:${documentId}`;
    socket.join(roomName);

    console.log(`📄 User ${socket.user.id} joined ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});




const PORT = process.env.PORT || 5000;
server.listen(PORT , () => {
  console.log(`Server is running in PORT ${PORT}`);
});