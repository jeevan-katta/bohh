const mongoose = require("mongoose");

const callSchema = mongoose.Schema(
  {
    caller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["audio", "video"], required: true },
    status: { type: String, enum: ["completed", "missed", "rejected"], required: true },
  },
  { timestamps: true }
);

const Call = mongoose.model("Call", callSchema);
module.exports = Call;
