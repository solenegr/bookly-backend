const express = require("express");
require("../models/books");
const Library = require("../models/libraries");
const Pusher = require("pusher");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

router.use(authMiddleware);

// Ajouter un livre à la bibliothèque
router.post("/add-to-library", async (req, res) => {
  const { bookId, genres, status, userId } = req.body;

  console.log("Requête reçue:", req.body);

  // Vérifier que userId est bien présent
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "L'ID utilisateur (userId) est requis.",
    });
  }

  try {
    // Vérifier si la bibliothèque de l'utilisateur existe
    let library = await Library.findOne({ user: userId });

    // Si la bibliothèque n'existe pas, en créer une nouvelle avec un user défini
    if (!library) {
      library = new Library({
        user: userId,
        readings: [],
      });
    }

    // Vérifier si le livre est déjà dans la bibliothèque
    const bookIndex = library.readings.findIndex(
      (reading) => reading.book.toString() === bookId
    );

    if (bookIndex === -1) {
      // Ajouter un nouveau livre
      library.readings.push({
        book: bookId,
        status: status || "A lire",
        genres: genres || [],
      });
    } else {
      // Mettre à jour les informations du livre existant
      library.readings[bookIndex].status =
        status || library.readings[bookIndex].status;
      library.readings[bookIndex].genres =
        genres || library.readings[bookIndex].genres;
    }

    // Sauvegarder la bibliothèque mise à jour
    await library.save();

    res.status(200).json({
      result: true,
      message: "Livre ajouté avec succès !",
      library,
    });
  } catch (error) {
    console.log("Erreur lors de l'ajout du livre à la bibliothèque:", error);
    res.status(500).json({
      result: false,
      message: "Erreur interne du serveur",
    });
  }
});

// Route pour récupérer toutes les bibliothèques
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { search } = req.query;

    // Rechercher la bibliothèque associée à cet utilisateur et peupler les livres
    const library = await Library.findOne({ user: userId }).populate(
      "readings.book"
    );

    if (!library) {
      return res
        .status(404)
        .json({ success: false, message: "Bibliothèque non trouvée" });
    }
    // Extraire uniquement les livres de cette bibliothèque
    let books = library.readings.map((reading) => ({
      _id: reading.book._id,
      title: reading.book.title,
      author: reading.book.author,
      volume: reading.book.volume || 1,
      summary: reading.book.summary || "Pas de résumé",
      publisher: reading.book.publisher || "Inconnu",
      pages: reading.book.pages || "Inconnu",
      cover: reading.book.cover,
      publicationYear: reading.book.publicationYear || "Non précisé",
      genre: reading.book.genres || [],
      rating: reading.book.rating || 0,
      reviewCount: reading.book.reviewCount || 0,
      isbn: reading.book.isbn || "Non disponible",
      status: reading.status, // Ajout du statut de lecture
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      books = books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({ result: true, books });
  } catch (error) {
    console.error("Erreur lors de la récupération de la bibliothèque :", error);
    res.status(500).json({ result: false, message: "Erreur serveur" });
  }
});

// Route PATCH pour mettre à jour le statut d'un livre
router.patch("/readings/:bookId/status", async (req, res) => {
  const { bookId } = req.params;
  const { newStatus } = req.body; // Statut à mettre à jour

  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ result: false, message: "Utilisateur non authentifié" });
    }

    const userId = req.user._id; // On récupère l'ID utilisateur depuis req.user

    // Vérifier si la bibliothèque existe pour cet utilisateur
    let library = await Library.findOne({ user: userId }).populate("user");

    // Si la bibliothèque n'existe pas, on la crée
    if (!library) {
      library = new Library({
        user: userId,
        readings: [],
      });
      await library.save();
    }

    // Trouver le livre dans la bibliothèque et mettre à jour son statut
    let reading = library.readings.find((r) => r.book.toString() === bookId);

    // Si le livre n'est pas encore ajouté, on l'ajoute avec un statut par défaut
    if (!reading) {
      reading = { book: bookId, status: newStatus || "none" };
      library.readings.push(reading);
    } else {
      // Sinon, on met à jour le statut
      reading.status = newStatus || reading.status;
    }

    // Sauvegarder la bibliothèque mise à jour
    await library.save();

    // // Notifier avec Pusher
    // pusher.trigger("book-channel", "update-books", {
    //   books: [library],
    // });

    return res
      .status(200)
      .json({ result: true, message: "Statut du livre mis à jour", reading });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ result: false, message: "Erreur serveur", error });
  }
});
module.exports = router;
