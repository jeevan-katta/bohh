const express = require("express");
const { allUsers, updateProfile } = require("../controllers/user.controller.js");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/", protect, allUsers);
router.put("/profile", protect, updateProfile);

module.exports = router;
