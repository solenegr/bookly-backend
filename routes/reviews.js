const express = require("express");
const router = express.Router();
const Review = require("../models/reviews");
const Pusher = require("pusher");
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/auth");

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// router.use(authMiddleware);

//route pour récup les comm d'un livre spé
router.get("/", async (req, res) => {
  try {
    const { book } = req.query;
    console.log("test", req.query);
    if (!book) {
      return res.status(400).json({ error: "bookId est requis" });
    }

    const reviews = await Review.find({ book }).populate("user");

    res.status(200).json({ result: true, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//route pour poster comm d'un livre spé
router.post("/", async (req, res) => {
  try {
    let { content, book, user, note } = req.body;
    console.log(req.body);

    if (!content || !book || !user || !note) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    // book = new mongoose.Types.ObjectId(book);
    user = new mongoose.Types.ObjectId(user);
    console.log("BOOOKID", book);
    const newReview = new Review({
      content,
      book,
      user,
      note,
    });

    await newReview.save();

    // ✅ Récupérer la review avec `populate("user")`
    const populatedReview = await Review.findById(newReview._id).populate(
      "user"
    );

    console.log("Review après populate :", populatedReview);

    // 🔥 Envoie l'event avec Pusher avec l'user complet
    pusher.trigger(`book-reviews-${book}`, "new-review", populatedReview);

    res.status(201).json({ result: true, review: populatedReview });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la review :", error);
    res.status(500).json({ error: error.message });
  }
});

//route pour ajouter un like sur un comm
router.patch("/:reviewId/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const { reviewId } = req.params;

    // ✅ Trouver l'utilisateur avec son token

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Avis non trouvé" });
    }

    // ✅ Vérifie si l'utilisateur a déjà liké
    const hasLiked = review.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (hasLiked) {
      // ❌ Retirer le like si l'utilisateur a déjà liké
      review.likes = review.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // ✅ Ajouter le like sinon
      review.likes.push(userId);
    }

    await review.save();

    // ✅ Récupérer la review avec `populate("user")`
    const updatedReview = await Review.findById(reviewId).populate("user");

    console.log("Review après like :", updatedReview);

    // 🔥 Envoyer la review mise à jour via Pusher
    pusher.trigger("book-reviews", "new-like", updatedReview);

    res.status(200).json({ result: true, review: updatedReview });
  } catch (error) {
    console.error("Erreur lors du like de la review :", error);
    res.status(500).json({ error: error.message });
  }
});

//route pour récup les comm d'un user
router.get("/:userId", (req, res) => {
  const userId = req.params.userId;
  Review.find({ user: userId })
  .populate('book', 'cover title author isbn genres')
  .then((data) => {
    if (data === null) {
      res.status(404).json({ result: false });
    } else {
      res.status(200).json({ result: true, reviews: data });
    }
  });
});

module.exports = router;
