const express = require("express");
const { protect } = require("../middleware/authMiddleware.js");
const { allMessages, sendMessage, sendAudioMessage, deleteMessage, markAsRead } = require("../controllers/message.controller.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, '../uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/:chatId", protect, allMessages);
router.post("/", protect, sendMessage);
router.post("/audio", protect, upload.single("audio"), sendAudioMessage);
router.delete("/:id", protect, deleteMessage);
router.put("/:id/read", protect, markAsRead);

module.exports = router;
