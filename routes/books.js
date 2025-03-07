const express = require("express");
const Book = require("../models/books");
const router = express.Router();
const {
  fetchOpenLibraryData,
  fetchGoogleBooksData,
  fetchHuggingFaceSummary,
  detectGenreFromSummary,
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

    if (!openLibData.length && !googleData.length)
      return res.status(404).json({ result: false, error: "Book not found" });

    let summary = googleData[0]?.summary || openLibData[0]?.summary || null;
    let genres =
      googleData[0]?.genres.length > 0
        ? googleData[0]?.genres
        : openLibData[0]?.genres.length > 0
        ? openLibData[0]?.genres
        : [];

    // ✅ Si pas de résumé, on le génère avec Hugging Face
    if (!summary) {
      console.log("🔄 Génération du résumé avec Hugging Face...");
      summary = await fetchHuggingFaceSummary(
        googleData[0]?.title || openLibData[0]?.title || "Pas de titre"
      );
      console.log("✅ Résumé généré :", summary);
    }

    // ✅ Si pas de genres, on les génère aussi
    if (
      !genres.length ||
      (genres.length === 1 && genres[0] === "Genres inconnus")
    ) {
      console.log("🔄 Génération des genres avec Hugging Face...");
      genres = detectGenreFromSummary(summary);
      console.log("✅ Genres générés :", genres);
    }

    const bookDetails = {
      isbn,
      title: openLibData[0]?.title || googleData[0]?.title || "Titre inconnu",
      author:
        googleData[0]?.author || openLibData[0]?.author || "Auteur inconnu",
      summary,
      pages: googleData[0]?.pages || openLibData[0]?.pages || "Inconnu",
      publicationYear:
        googleData[0]?.publicationYear ||
        openLibData[0]?.publicationYear ||
        "Inconnu",
      genres,
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

    // 🔎 Vérifie si le livre est déjà en base
    const existingBooks = await Book.find({
      title: new RegExp(titleQuery, "i"),
    });

    if (existingBooks.length > 0) {
      return res
        .status(200)
        .json({ result: true, data: existingBooks, source: "database" });
    }

    // 🔍 Récupération depuis l'API Google Books
    const googleResponse = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
        titleQuery
      )}&maxResults=5&langRestrict=fr`
    );
    const googleData = await googleResponse.json();

    if (!googleData.items || googleData.items.length === 0) {
      return res
        .status(404)
        .json({ result: false, message: "Aucun livre trouvé" });
    }

    // 📥 Formatage et sauvegarde en DB
    const books = await Promise.all(
      googleData.items.map(async (item) => {
        const volumeInfo = item.volumeInfo;

        let summary =
          volumeInfo.language === "fr" ? volumeInfo.description || null : null;

        let genres = volumeInfo.categories || [];

        // ✅ Générer un résumé avec Hugging Face si nécessaire
        if (!summary) {
          console.log("🔄 Génération du résumé avec Hugging Face...");
          summary = await fetchHuggingFaceSummary(
            volumeInfo.title || "Titre inconnu"
          );
          console.log("✅ Résumé généré :", summary);
        }

        // ✅ Générer les genres avec Hugging Face si nécessaire
        if (
          !genres.length ||
          genres[0] === "Genres inconnus" ||
          genres.length === 1
        ) {
          console.log("🔄 Génération des genres avec Hugging Face...");
          genres = detectGenreFromSummary(summary);
          console.log("✅ Genres générés :", genres);
        }

        const bookData = {
          isbn:
            volumeInfo.industryIdentifiers?.[0]?.identifier || "ISBN inconnu",
          title: volumeInfo.title || "Titre inconnu",
          author: volumeInfo.authors
            ? volumeInfo.authors.join(", ")
            : "Auteur inconnu",
          summary,
          pages: volumeInfo.pageCount || null,
          publicationYear: volumeInfo.publishedDate?.split("-")[0] || "Inconnu",
          genres,
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
