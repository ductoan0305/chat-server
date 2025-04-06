const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://chat-client-zeta-nine.vercel.app", // Thay bằng domain của client
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: "https://chat-client-zeta-nine.vercel.app",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// In-memory storage for demo (you can replace this with DB)
const messages = {}; // Format: { groupId: [ { sender, content, timestamp } ] }

// Handle socket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group: ${groupId}`);
    // Send chat history to new user
    socket.emit('chat_history', messages[groupId] || []);
  });

  socket.on('send_message', (data) => {
    const { groupId, sender, content } = data;
    const timestamp = new Date().toISOString();

    const message = { sender, content, timestamp };

    if (!messages[groupId]) messages[groupId] = [];
    messages[groupId].push(message);

    // Emit to all in room
    io.to(groupId).emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('✅ Chat server is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});