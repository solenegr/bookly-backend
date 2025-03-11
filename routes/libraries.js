const express = require('express');
const Library = require('../models/libraries'); 
const router = express.Router();

// Ajouter un livre à la bibliothèque
router.post('/add-to-library', async (req, res) => {
  const { userId, bookId, status, genres } = req.body; // Récupération des données envoyées par l'utilisateur

  try {
    // Trouver la bibliothèque de l'utilisateur
    let library = await Library.findOne({ user: userId });

    // Si la bibliothèque n'existe pas, créer une nouvelle bibliothèque
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
      // Si le livre n'est pas dans la bibliothèque, ajouter un nouveau livre
      library.readings.push({
        book: bookId,
        status: status,
        genres: genres || [],
      });
    } else {
      // Si le livre existe déjà, mettre à jour son statut ou d'autres informations si nécessaire
      library.readings[bookIndex].status = status;
      library.readings[bookIndex].genres = genres || [];
    }

    // Sauvegarder les modifications dans la base de données
    await library.save();

    res.status(200).json({ success: true, message: 'Livre ajouté avec succès !', library });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du livre à la bibliothèque:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
  }
});

// Route pour récupérer toutes les bibliothèques
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Rechercher la bibliothèque associée à cet utilisateur et peupler les livres
    const library = await Library.findOne({ user: userId }).populate("readings.book");

    if (!library) {
      return res.status(404).json({ success: false, message: "Bibliothèque non trouvée" });
    }

    // Extraire uniquement les livres de cette bibliothèque
    const books = library.readings.map((reading) => ({
      title: reading.book.title,
      author: reading.book.author,
      volume: reading.book.volume || "N/A",
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

    res.status(200).json({ success: true, books });
  } catch (error) {
    console.error("Erreur lors de la récupération de la bibliothèque :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});



module.exports = router;
