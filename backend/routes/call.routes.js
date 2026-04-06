const express = require("express");
const { logCall, getCallHistory } = require("../controllers/call.controller.js");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/", protect, logCall);
router.get("/", protect, getCallHistory);

module.exports = router;
