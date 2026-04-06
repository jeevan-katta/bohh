const Message = require("../models/message.model.js");
const User = require("../models/user.model.js");
const Chat = require("../models/chat.model.js");
const fs = require("fs");
const path = require("path");

const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username profilePic email")
      .populate("chat");
      
    // Filter out messages that the requesting user has "locally deleted"
    const visibleMessages = messages.filter(msg => {
       if (!msg.deletedBy) return true;
       const deletedStrs = msg.deletedBy.map(id => id.toString());
       return !deletedStrs.includes(req.user._id.toString());
    });
    
    res.json(visibleMessages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "username profilePic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username profilePic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

const sendAudioMessage = async (req, res) => {
  const { chatId } = req.body;
  if (!req.file || !chatId) {
    return res.status(400).send("No file or chat ID provided");
  }

  const newMessage = {
    sender: req.user._id,
    content: "/uploads/" + req.file.filename,
    isAudio: true,
    chat: chatId,
  };

  try {
    let message = await Message.create(newMessage);
    message = await message.populate("sender", "username profilePic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username profilePic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
    res.json(message);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id).populate("chat");
    if (!msg) return res.status(404).send("Message not found");

    if (msg.isAudio) {
       if (!msg.deletedBy) msg.deletedBy = [];
       if (!msg.deletedBy.includes(req.user._id)) {
           msg.deletedBy.push(req.user._id);
           await msg.save();
       }
       
       const senderStr = msg.sender.toString();
       const deletedStrs = msg.deletedBy.map(id => id.toString());
       const allReceiversListened = msg.chat.users
           .map(id => id.toString())
           .filter(id => id !== senderStr)
           .every(id => deletedStrs.includes(id));
           
       if (allReceiversListened) {
           if (msg.content) {
               const filename = msg.content.split("/uploads/")[1];
               if (filename) {
                  const filepath = path.join(__dirname, '../uploads/', filename);
                  if (fs.existsSync(filepath)) {
                      fs.unlinkSync(filepath);
                  }
               }
           }
           await Message.findByIdAndDelete(req.params.id);
       }
       return res.status(200).json({ success: true, allListened: allReceiversListened });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const markAsRead = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg || msg.isAudio) return res.status(200).send("No action for audio here");

    if (!msg.readBy.includes(req.user._id)) {
      msg.readBy.push(req.user._id);
      
      // Target reader marks it -> start the 24 hour deletion timer natively using Mongoose TTL
      if (msg.sender.toString() !== req.user._id.toString()) {
         if (!msg.deleteAt) {
             const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); 
             msg.deleteAt = expiry;
         }
      }
      await msg.save();
    }
    
    res.status(200).json(msg);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = { allMessages, sendMessage, sendAudioMessage, deleteMessage, markAsRead };
