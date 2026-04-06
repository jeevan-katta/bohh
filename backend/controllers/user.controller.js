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
  const { bio, avatarConfig } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.bio = bio !== undefined ? bio : user.bio;
    if (avatarConfig) {
      user.avatarConfig = avatarConfig;
      if (avatarConfig.seed) {
        user.profilePic = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarConfig.seed)}`;
      }
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

module.exports = { allUsers, updateProfile };
