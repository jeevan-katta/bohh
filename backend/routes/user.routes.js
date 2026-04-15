const express = require("express");
const { allUsers, updateProfile, deleteAccount } = require("../controllers/user.controller.js");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/", protect, allUsers);
router.put("/profile", protect, updateProfile);
router.delete("/", protect, deleteAccount);

module.exports = router;
