var express = require("express");
var router = express.Router();

require("../models/connection");
const Challenge = require("../models/challenges");
const Conversation = require("../models/conversations");
const Message = require("../models/messages");
//Ajouter un nouveau challenge
router.post("/", async (req, res) => {
  const { title, description, duration, books } = req.body;
  try {
    const challenge = new Challenge({ title, description, duration, books });
    await challenge.save();
    res.status(201).json({ result: true, challenge: challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Récupérer tous les Challenges
router.get("/", async (req, res) => {
  try {
    const challenges = await Challenge.find().populate("books");
    res.status(200).json({ result: true, challenges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Récupérer un Challenge par ID
router.get("/:challengeId", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId).populate(
      "books"
    );
    if (!challenge) {
      return res
        .status(404)
        .json({ result: false, message: "Challenge not found" });
    }
    res.json({ result: true, challenge: challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Modifier un challenge
router.put("/:challengeId", async (req, res) => {
  const { title, description, duration, books } = req.body;

  try {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.challengeId,
      { title, description, duration, books },
      { new: true }
    );

    if (!challenge) {
      return res.status(404).json({ message: "Challenge non trouvé" });
    }

    res.json({ result: true, challenge: challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Supprimer un challenge
router.delete("/:challengeId", async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.challengeId);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge non trouvé" });
    }

    res.json({ message: "Challenge supprimé avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Ajouter un Livre à un Challenge
router.post("/:challengeId/add-book", async (req, res) => {
  const { bookId } = req.body;

  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge non trouvé" });
    }

    if (!challenge.books.includes(bookId)) {
      challenge.books.push(bookId);
      await challenge.save();
    }

    res.json({ result: true, challenge: challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Supprimer un Livre à un Challenge
router.post("/:challengeId/remove-book", async (req, res) => {
  const { bookId } = req.body;

  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge non trouvé" });
    }
    challenge.books = challenge.books.filter((id) => id.toString() !== bookId);
    await challenge.save();

    res.json({ result: true, challenge: challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//recuperer tous les livres d'un challenge

router.get("/:challengeId/books", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId).populate(
      "books"
    );
    if (!challenge) {
      return res.status(404).json({ message: "Challenge non trouvé" });
    }
    res.json({ result: true, books: challenge.books });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Récupérer tous les messages d’un challenge

router.get("/:challengeId/messages", async (req, res) => {
  const { challengeId } = req.params;

  try {
    // Trouver toutes les conversations liées au challengeId
    const conversations = await Conversation.find({ challenge: challengeId });

    if (!conversations.length) {
      return res
        .status(404)
        .json({
          result: false,
          message: "Aucune conversation trouvée pour ce challenge",
        });
    }

    // Extraire les IDs des conversations
    const conversationIds = conversations.map((conv) => conv._id);

    // Trouver tous les messages des conversations liées à ce challenge
    const messages = await Message.find({
      conversation: { $in: conversationIds },
    })
      .populate("user", "username") // Peupler avec les infos de l'utilisateur (uniquement username)
      .populate("conversation", "title") // Peupler avec le titre de la conversation
      .sort({ createdAt: 1 }); // Trier par date croissante

    res.status(200).json({ result: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
