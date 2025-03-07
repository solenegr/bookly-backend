const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      required: true,
    }, // Référence à la conversation
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    }, // Expéditeur du message
    content: { type: String, required: true }, // Contenu du message
  },
  { timestamps: true }
);

const Message = mongoose.model("messages", messageSchema);
module.exports = Message;
