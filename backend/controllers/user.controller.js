const User = require("../models/user.model.js");

// /api/users?search=piyush
const allUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { username: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select("-password");

  res.send(users);
};

const updateProfile = async (req, res) => {
  const { bio, avatarConfig, profilePic } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.bio = bio !== undefined ? bio : user.bio;
    
    if (avatarConfig) {
      user.avatarConfig = avatarConfig;
    }
    
    // Accept direct profilePic URL from the client (built from avatarConfig)
    if (profilePic) {
      user.profilePic = profilePic;
    } else if (avatarConfig && avatarConfig.seed) {
      // Fallback: build URL from seed if no direct URL provided
      user.profilePic = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarConfig.seed)}`;
    }
    
    await user.save();
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      avatarConfig: user.avatarConfig,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Note: To prevent orphaned messages or chats, production apps typically do soft deletes.
    // For this context, standard hard delete works cleanly.
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { allUsers, updateProfile, deleteAccount };
