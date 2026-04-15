const User = require("../models/user.model.js");
const generateToken = require("../utils/generateToken.js");
const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate default avataaars avatar
  const defaultConfig = {
    seed: username,
    top: 'shortFlat',
    eyes: 'default',
    eyebrows: 'default',
    mouth: 'smile',
    clothing: 'hoodie',
    facialHair: '',
    accessories: '',
    skinColor: 'edb98a',
    hairColor: '4a2912',
    clothesColor: '3f51b5',
  };

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}&top=shortFlat&eyes=default&mouth=smile&clothing=hoodie&skinColor=edb98a&hairColor=4a2912&clothesColor=3f51b5&facialHairProbability=0&accessoriesProbability=0&backgroundColor=transparent`,
    avatarConfig: defaultConfig,
  });

  if (user) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      avatarConfig: user.avatarConfig,
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && (await bcrypt.compare(password, user.password))) {
    generateToken(res, user._id);
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      avatarConfig: user.avatarConfig,
    });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
};

const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { registerUser, loginUser, logoutUser };
