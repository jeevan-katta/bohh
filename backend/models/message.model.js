const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    isAudio: { type: Boolean, default: false },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deleteAt: { type: Date, expires: 0 },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
// Automatically delete messages older than 1 hour (3600 seconds)
Message.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }).catch(() => {});
module.exports = Message;
