const express = require("express");
const router = express.Router();

// 🚀 Fonction pour récupérer les infos d'Open Library
async function fetchOpenLibraryData(isbn) {
  try {
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    const data = await response.json();
    const book = data[`ISBN:${isbn}`];

    if (!book) return null;

    return {
      title: book.title || null,
      author: book.authors ? book.authors.map((a) => a.name).join(", ") : null,
      pages: book.number_of_pages || null,
      publicationYear: book.publish_date || null,
      genres: book.subjects ? book.subjects.map((s) => s.name) : null,
      cover: book.cover ? book.cover.large : null,
    };
  } catch (error) {
    console.error("❌ Erreur Open Library :", error);
    return null;
  }
}

// 🚀 Fonction pour récupérer les infos de Google Books
async function fetchGoogleBooksData(isbn) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );
    const data = await response.json();
    const book = data.items ? data.items[0].volumeInfo : null;

    if (!book) return null;

    return {
      title: book.title || null,
      author: book.authors ? book.authors.join(", ") : null,
      summary: book.description || null,
      pages: book.pageCount || null,
      publicationYear: book.publishedDate || null,
      genres: book.categories || null,
      rating: book.averageRating || null,
      reviewCount: book.ratingsCount || null,
      cover: book.imageLinks ? book.imageLinks.thumbnail : null,
    };
  } catch (error) {
    console.error("❌ Erreur Google Books :", error);
    return null;
  }
}

// 🚀 Route principale optimisée
router.get("/:isbn", async (req, res) => {
  try {
    const { isbn } = req.params;
    const startTime = Date.now();

    // Exécuter les deux requêtes en parallèle
    const [openLibData, googleData] = await Promise.all([
      fetchOpenLibraryData(isbn),
      fetchGoogleBooksData(isbn),
    ]);

    // Fusionner les données (Google en priorité, puis Open Library en fallback)
    const bookDetails = {
      title: googleData?.title || openLibData?.title || "Titre inconnu",
      author: googleData?.author || openLibData?.author || "Auteur inconnu",
      summary: googleData?.summary || "Résumé non disponible",
      pages: googleData?.pages || openLibData?.pages || "Inconnu",
      publicationYear:
        googleData?.publicationYear ||
        openLibData?.publicationYear ||
        "Inconnu",
      genres: googleData?.genres || openLibData?.genres || [],
      rating: googleData?.rating || "Pas de note",
      reviewCount: googleData?.reviewCount || "Pas d'avis",
      cover: googleData?.cover || openLibData?.cover || "Pas de couverture",
    };

    const endTime = Date.now();
    const time = `${endTime - startTime} ms`;

    res.status(200).json({ result: true, book: bookDetails, time });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res
      .status(500)
      .json({ result: false, error: "Erreur de récupération des données" });
  }
});

module.exports = router;
