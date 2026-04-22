require('dotenv').config();
// Required environment variables:
// GEMINI_API_KEY=AIza...       (must start with AIza, no spaces around =)
// MONGODB_URI=mongodb+srv://...
// JWT_SECRET=your_secret_here
// PORT=5000

// Startup environment validation
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ FATAL: GEMINI_API_KEY is missing from .env — AI features will not work.");
} else {
  console.log("✅ GEMINI_API_KEY loaded:", process.env.GEMINI_API_KEY.slice(0, 8) + "...");
}

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
const { handleBotMessage } = require("./utils/aiBot");

// In-memory store for public keys — keyed by socket ID
const publicKeyStore = {};

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
    try {
      const username = socket.user.username;
      const messageData = { 
        messageId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        room, username, text, time: new Date().toISOString(), reactions: {}
      };

      const newMessage = new Message(messageData);
      await newMessage.save();
      io.to(room).emit('receive_message', messageData);

      // STEP 5: AI bot interaction
      const history = await getRecentMessages(room);
      const botResponse = await handleBotMessage(text, history);

      if (botResponse) {
        const botMessageData = {
          messageId: Date.now().toString() + "-bot-" + Math.random().toString(36).substr(2, 5),
          text: botResponse,
          username: "🤖 Orbit Bot",
          room,
          time: new Date().toISOString(),
          isBot: true,
        };

        const botMessage = await Message.create(botMessageData);

        setTimeout(() => {
          // Using existing event name 'receive_message' for consistency with client
          io.to(room).emit("receive_message", botMessageData);
        }, 600);
      }
    } catch (error) {
      console.error("Socket send_message error:", error);
    }
  });

  socket.on('register-public-key', ({ publicKey }) => {
    publicKeyStore[socket.id] = publicKey;
  });

  socket.on('request-public-key', ({ targetUserId }) => {
    const key = publicKeyStore[targetUserId];
    if (key) {
      socket.emit('receive-public-key', {
        fromUserId: targetUserId,
        publicKey: key
      });
    }
  });

  socket.on('private_message', ({ to, iv, ciphertext }) => {
    io.to(to).emit('receive_private_message', {
      from: socket.user.username,
      fromId: socket.id,
      fromUserId: socket.id, // For compatibility with E2E instructions
      iv,
      ciphertext,
      timestamp: new Date()
    });
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
    delete publicKeyStore[socket.id];
  });
});

async function getRecentMessages(room) {
  try {
    return await Message.find({ room })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  } catch (err) {
    console.error("Failed to fetch message history:", err.message);
    return [];
  }
}

function getOnlineUsers(room) {
  const socketsInRoom = io.sockets.adapter.rooms.get(room) || new Set();
  return [...socketsInRoom].map(id => ({ id, username: onlineUsers[id] })).filter(u => u.username);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));