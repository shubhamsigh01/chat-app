const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, required: true },
  messageId: { type: String, required: true, unique: true },
  reactions: { type: Object, default: {} } // { emoji: [usernames] }
});

module.exports = mongoose.model('Message', messageSchema);
