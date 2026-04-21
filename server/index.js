require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Room = require('./models/Room');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const { getBotReply } = require('./utils/aiBot');
const app = express();
app.use(cors());
app.use(express.json());

// 🟢 Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// 🟢 REST API Routes
app.use('/auth', authRoutes);
app.use('/api/ai', aiRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

// 🟢 Socket Middleware for JWT Validation
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: Token missing'));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = decoded; // Attach user data to socket
    next();
  });
});

const onlineUsers = {}; // { socketId: username }

io.on('connection', (socket) => {
  console.log('User connected authenticated:', socket.user.username);

  socket.on('join_room', async ({ room }) => {
    const username = socket.user.username; // Use verified username from token
    socket.join(room);
    onlineUsers[socket.id] = username;

    await Room.findOneAndUpdate({ name: room }, { name: room }, { upsert: true });

    const history = await Message.find({ room }).sort({ _id: -1 }).limit(50);
    socket.emit('message_history', history.reverse());

    socket.to(room).emit('user_joined', { username });
    io.to(room).emit('online_users', getOnlineUsers(room));
  });

  socket.on('send_message', async ({ room, text }) => {
    const username = socket.user.username;
    const messageData = { 
      messageId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      room, username, text, time: new Date().toISOString(), reactions: {}
    };

    const newMessage = new Message(messageData);
    await newMessage.save();
    io.to(room).emit('receive_message', messageData);

    // AI bot intercept
    if (text.trim().toLowerCase().startsWith('@bot')) {
      const question = text.trim().substring(4).trim();
      if (question) {
        // Get last 5 messages for context
        const history = await Message.find({ room }).sort({ _id: -1 }).limit(5);
        const context = history.reverse().map(m => `${m.username}: ${m.text}`);
        
        const botReply = await getBotReply(question, context);
        
        const botMessageData = {
          messageId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          room,
          username: "Orbit AI",
          text: botReply,
          time: new Date().toISOString(),
          reactions: {},
          isBot: true
        };
        
        io.to(room).emit('receive_message', botMessageData);
      }
    }
  });

  socket.on('private_message', ({ to, text }) => {
    const from = socket.user.username;
    const message = { from, text, time: new Date().toISOString() };
    io.to(to).emit('receive_private_message', { ...message, fromId: socket.id });
  });

  socket.on('react_message', async ({ room, messageId, emoji }) => {
    const username = socket.user.username;
    const message = await Message.findOne({ messageId });
    if (message) {
      if (!message.reactions[emoji]) message.reactions[emoji] = [];
      const userIndex = message.reactions[emoji].indexOf(username);
      if (userIndex === -1) {
        message.reactions[emoji].push(username);
      } else {
        message.reactions[emoji].splice(userIndex, 1);
        if (message.reactions[emoji].length === 0) {
          const newReactions = { ...message.reactions };
          delete newReactions[emoji];
          message.reactions = newReactions;
        }
      }
      message.markModified('reactions');
      await message.save();
      io.to(room).emit('message_reaction_update', { messageId, reactions: message.reactions });
    }
  });

  socket.on('typing', ({ room }) => {
    socket.to(room).emit('user_typing', { username: socket.user.username });
  });

  socket.on('stop_typing', ({ room }) => {
    socket.to(room).emit('user_stop_typing', { username: socket.user.username });
  });

  socket.on('disconnecting', () => {
    const username = onlineUsers[socket.id];
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        io.to(room).emit('user_left', { username });
        io.to(room).emit('user_stop_typing', { username });
        const socketsInRoom = io.sockets.adapter.rooms.get(room) || new Set();
        const users = [...socketsInRoom]
          .filter(id => id !== socket.id)
          .map(id => ({ id, username: onlineUsers[id] }))
          .filter(u => u.username);
        io.to(room).emit('online_users', users);
      }
    });
  });

  socket.on('disconnect', () => {
    delete onlineUsers[socket.id];
  });
});

function getOnlineUsers(room) {
  const socketsInRoom = io.sockets.adapter.rooms.get(room) || new Set();
  return [...socketsInRoom].map(id => ({ id, username: onlineUsers[id] })).filter(u => u.username);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));