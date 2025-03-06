const express = require("express");
const Book = require("../models/books");
const router = express.Router();
const {
  fetchOpenLibraryData,
  fetchGoogleBooksData,
} = require("../services/bookService");

// 🚀 Recherche par ISBN
router.get("/isbn/:isbn", async (req, res) => {
  try {
    const { isbn } = req.params;

    let book = await Book.findOne({ isbn });
    if (book) {
      return res.status(200).json({ result: true, book, source: "database" });
    }

    const [openLibData, googleData] = await Promise.all([
      fetchOpenLibraryData(isbn, true),
      fetchGoogleBooksData(isbn, true),
    ]);

    // ✅ On vérifie bien que les auteurs et genres sont récupérés
    const bookDetails = {
      isbn,
      title: openLibData[0]?.title || googleData[0]?.title || "Titre inconnu",
      author:
        googleData[0]?.author || openLibData[0]?.author || "Auteur inconnu",
      summary: googleData[0]?.summary || "Résumé non disponible",
      pages: googleData[0]?.pages || openLibData[0]?.pages || "Inconnu",
      publicationYear:
        googleData[0]?.publicationYear ||
        openLibData[0]?.publicationYear ||
        "Inconnu",
      genres:
        googleData[0]?.genres.length > 0
          ? googleData[0]?.genres
          : openLibData[0]?.genres.length > 0
          ? openLibData[0]?.genres
          : ["Genres inconnus"],
      cover:
        googleData[0]?.cover || openLibData[0]?.cover || "Pas de couverture",
    };

    if (bookDetails.title !== "Titre inconnu") {
      const newBook = new Book(bookDetails);
      await newBook.save();
    }

    res.status(200).json({ result: true, book: bookDetails, source: "api" });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res
      .status(500)
      .json({ result: false, error: "Erreur de récupération des données" });
  }
});

// Route pour chercher un livre par titre
router.get("/title/:title", async (req, res) => {
  try {
    const titleQuery = req.params.title;

    // 🔎 Vérifier si le livre est déjà en base de données
    const existingBooks = await Book.find({
      title: new RegExp(titleQuery, "i"),
    });

    if (existingBooks.length > 0) {
      return res
        .status(200)
        .json({ result: true, data: existingBooks, source: "database" });
    }

    // 🔍 Sinon, récupérer depuis l'API Google Books
    const googleResponse = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
        titleQuery
      )}&maxResults=5&langRestrict=fr`
    );
    const googleData = await googleResponse.json();

    if (!googleData.items || googleData.items.length === 0) {
      return res.status(404).json({
        result: false,
        message: "Aucun livre trouvé",
      });
    }

    // 📥 Formatage et sauvegarde en DB
    const books = await Promise.all(
      googleData.items.map(async (item) => {
        const volumeInfo = item.volumeInfo;
        const bookData = {
          isbn:
            volumeInfo.industryIdentifiers?.[0]?.identifier || "ISBN inconnu",
          title: volumeInfo.title || "Titre inconnu",
          author: volumeInfo.authors
            ? volumeInfo.authors.join(", ")
            : "Auteur inconnu",
          summary:
            volumeInfo.language === "fr"
              ? volumeInfo.description || "Résumé non disponible"
              : "Résumé non disponible en français",
          pages: volumeInfo.pageCount || null,
          publicationYear: volumeInfo.publishedDate?.split("-")[0] || "Inconnu",
          genres: volumeInfo.categories || ["Genres inconnus"],
          cover: volumeInfo.imageLinks?.thumbnail || "Pas de couverture",
        };

        // 🔄 Sauvegarde uniquement si le livre n'existe pas déjà
        const existingBook = await Book.findOne({ isbn: bookData.isbn });
        if (!existingBook) {
          return Book.create(bookData);
        }

        return existingBook; // Si déjà existant, le renvoyer
      })
    );

    res
      .status(200)
      .json({ result: true, data: books, source: "Google Books API" });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res
      .status(500)
      .json({ result: false, error: "Erreur de récupération des données" });
  }
});

module.exports = router;
