const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

// In-memory store
const rooms = {};        // { roomName: [{ id, username, text, time }] }
const onlineUsers = {};  // { socketId: username }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1️⃣ User joins a room
  socket.on('join_room', ({ room, username }) => {
    socket.join(room);
    onlineUsers[socket.id] = username;
    if (!rooms[room]) rooms[room] = [];

    // Send message history to the joining user
    socket.emit('message_history', rooms[room]);

    // Notify others
    socket.to(room).emit('user_joined', { username });

    // Broadcast updated online list
    io.to(room).emit('online_users', getOnlineUsers(room));
  });

  // 2️⃣ User sends a message
  socket.on('send_message', ({ room, username, text }) => {
    const message = { username, text, time: new Date().toISOString() };
    rooms[room].push(message);
    io.to(room).emit('receive_message', message); // send to ALL in room
  });

  // 3️⃣ User disconnects
  socket.on('disconnect', () => {
    const username = onlineUsers[socket.id];
    delete onlineUsers[socket.id];
    // Notify all rooms this socket was in
    socket.rooms.forEach(room => {
      io.to(room).emit('user_left', { username });
      io.to(room).emit('online_users', getOnlineUsers(room));
    });
  });
});

function getOnlineUsers(room) {
  const socketsInRoom = io.sockets.adapter.rooms.get(room) || new Set();
  return [...socketsInRoom].map(id => onlineUsers[id]).filter(Boolean);
}

server.listen(3001, () => console.log('Server running on port 3001'));