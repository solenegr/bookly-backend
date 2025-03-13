var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
require("../models/connection");
const Conversation = require("../models/conversations");
const Message = require("../models/messages");
const Pusher = require("pusher");
const authMiddleware = require("../middlewares/auth");

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// router.use(authMiddleware);

// Send message, il ajoute un msg a une coversation donné
router.post("/message", (req, res) => {
  const { conversationId, content, userId } = req.body;
  if (!conversationId || !content || !userId) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  const messageData = {
    content,
    user: userId,
    conversation: conversationId,
    createdAt: new Date().toISOString(),
  };

  console.log("📡 Envoi du message via Pusher :", messageData);

  pusher.trigger(`private-chat-${conversationId}`, "message", {
    message: messageData, // ✅ Envoi propre de l’objet
  });

  res.json({ result: true, message: messageData });
});

// Créer un message qui appartient a une conversation

router.post("/:userId/conv/:conversationId", async (req, res) => {
  const { content } = req.body;
  const { conversationId, userId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(conversationId)
  ) {
    return res
      .status(400)
      .json({ error: "L'ID utilisateur ou conversation est invalide" });
  }

  if (!content || typeof content !== "string") {
    return res
      .status(400)
      .json({ error: "Le contenu du message est invalide" });
  }
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation non trouvée" });
    }

    if (!conversation.users.some((user) => user.equals(userId))) {
      return res.status(403).json({
        error: "Accès refusé : Vous ne faites pas partie de cette conversation",
      });
    }

    const newMessage = new Message({
      content,
      user: userId,
      conversation: conversationId,
    });

    await newMessage.save();

    // 🔥 Populate user avant d'envoyer la réponse
    const populatedMessage = await newMessage.populate(
      "user",
      "username firstname"
    );

    console.log("📡 Envoi du message via Pusher :", populatedMessage);
    pusher.trigger(
      `private-chat-${conversationId}`,
      "message",
      populatedMessage
    );

    res.status(201).json({ result: true, message: populatedMessage });
  } catch (error) {
    console.error("❌ Erreur envoi message :", error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir tous les messages d'une conversation
router.get("/:userId/:conversationId", async (req, res) => {
  const { conversationId, userId } = req.params;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation non trouvée" });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Vérifie que l'utilisateur fait partie de la conversation
    // ✅ Vérifie que l'utilisateur fait partie de la conversation
    const isUserInConversation = conversation.users.some((user) =>
      user.equals(userObjectId)
    );

    if (!isUserInConversation) {
      return res.status(403).json({
        error:
          "Accès refusé : tous les utilisateurs ne sont pas dans la conversation",
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("user", "username firstname")
      .populate("conversation") // 🔥 Récupère le nom et prénom de l'utilisateur
      .sort({ createdAt: 1 });

    console.log("messages populate", messages);
    res.status(200).json({ result: true, messages });
  } catch (error) {
    console.error("❌ Erreur récupération messages :", error);
    res.status(500).json({ error: error.message });
  }
});

// router.get("/:conversationId", async (req, res) => {
//   const { conversationId } = req.params;

//   try {
//     // Récupérer tous les messages d'une conversation
//     const messages = await Message.find({ conversation: conversationId })
//       .populate("user", "username") //Peupler avec les informations de l'utilisateur, ici, on ne garde que le champ username
//       .populate("conversation", "title")
//       .sort({ createdAt: 1 }); // Trier par date croissante (premier message d'abord)

//     res.status(200).json({ result: true, messages });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Supprimer un message
router.delete("/:messageId", async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findByIdAndDelete(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message non trouvé" });
    }

    res
      .status(200)
      .json({ result: true, message: "Message supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
