const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    bio: { type: String, default: "" },
    profilePic: {
      type: String,
      default: "https://api.dicebear.com/7.x/bottts/svg?seed=placeholder",
    },
    avatarConfig: {
      type: Object, // To store dynamic avatar UI settings if needed
      default: {},
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
