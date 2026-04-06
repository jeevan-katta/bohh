const Call = require("../models/call.model.js");

const logCall = async (req, res) => {
  const { receiverId, type, status } = req.body;
  if (!receiverId || !type || !status) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const call = await Call.create({
      caller: req.user._id,
      receiver: receiverId,
      type,
      status,
    });
    const populatedCall = await Call.findOne({ _id: call._id })
        .populate("caller", "username profilePic")
        .populate("receiver", "username profilePic");
        
    res.status(201).json(populatedCall);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCallHistory = async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [{ caller: req.user._id }, { receiver: req.user._id }],
    })
      .populate("caller", "username profilePic")
      .populate("receiver", "username profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { logCall, getCallHistory };
