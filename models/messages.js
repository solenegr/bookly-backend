const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    content: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    Conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  },
  { timestamps: true }
);

const Message = mongoose.model("messages", challengeSchema);
module.exports = Message;
