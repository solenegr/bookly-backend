const mongoose = require("mongoose");

const conversationSchema = mongoose.Schema(
  {
    users: { type: [mongoose.Schema.Types.ObjectId], ref: "User" }, //Liste de participants
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "challenges",
      default: null,
    }, // Référence à un challenge (optionnel)
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
