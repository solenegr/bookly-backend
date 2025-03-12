const router = require("express").Router();
const Book = require("../models/books");
// const authMiddleware = require("../middlewares/auth");

// router.use(authMiddleware);

router.get("/title/:title", async (req, res) => {
  try {
    const { title } = req.params;
    console.log("Requête titre reçue :", req.params);
    // 1️⃣ Vérifier si le titre est fourni
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        result: false,
        error: "Le titre du livre est requis dans l'URL.",
      });
    }

    // 2️⃣ Requête à l’API ISBNdb
    const response = await fetch(
      `https://api2.isbndb.com/books/${encodeURIComponent(title)}?language=fr`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.ISBNDB_API_KEY,
        },
      }
    );

    // 3️⃣ Vérifier si l'API répond avec une erreur
    if (!response.ok) {
      return res.status(response.status).json({
        result: false,
        error: `Erreur API: ${response.status} - ${response.statusText}`,
      });
    }

    const data = await response.json();

    // 4️⃣ Vérifier si des livres existent dans la réponse API
    if (!data.books || data.books.length === 0) {
      return res.status(404).json({
        result: false,
        error: "Aucun livre trouvé pour ce titre.",
      });
    }
    // 5️⃣ Transformer chaque livre pour suivre le format Mongoose
    const books = data.books.map((book) => ({
      title: book.title || "Titre non disponible",
      author: book.authors ? book.authors[0] : "Auteur inconnu",
      volume: book.volume ? Number(book.volume) : 0,
      summary: book.synopsis || "Résumé non disponible",
      publisher: book.publisher || "Éditeur inconnu",
      pages: book.pages ? Number(book.pages) : 0,
      cover: book.image || "Image non disponible",
      publicationYear: book.date_published
        ? new Date(book.date_published)
        : "année inconnue",
      genres: book.subjects || [],
      rating: book.rating ? Number(book.rating) : 0,
      reviewCount: book.review_count ? Number(book.review_count) : 0,
      isbn: book.isbn13 || "ISBN non disponible",
    }));

    res.status(200).json({ result: true, books });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      result: false,
      error: "Erreur interne lors de la récupération des livres.",
    });
  }
});

router.get("/isbn/:isbn", async (req, res) => {
  try {
    const { isbn } = req.params;

    if (!isbn) {
      return res
        .status(400)
        .json({ result: false, error: "L'ISBN est requis dans l'URL." });
    }

    let book = await Book.findOne({ isbn });
    if (book) {
      return res.status(200).json({ result: true, book });
    }

    // 3️⃣ Requête à l’API ISBNdb
    const response = await fetch(
      `https://api2.isbndb.com/book/${isbn}?language=fr`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.ISBNDB_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        result: false,
        error: `Erreur API: ${response.status} - ${response.statusText}`,
      });
    }

    const data = await response.json();

    if (!data.book) {
      return res.status(404).json({
        result: false,
        error: "Aucun livre trouvé pour cet ISBN.",
      });
    }

    book = {
      title: data.book.title || "Titre non disponible",
      author: data.book.authors ? data.book.authors[0] : "Auteur inconnu",
      volume: data.book.volume ? Number(data.book.volume) : 0,
      summary: data.book.synopsis || "Résumé non disponible",
      publisher: data.book.publisher || "Éditeur inconnu",
      pages: data.book.pages ? Number(data.book.pages) : 0,
      cover: data.book.image || "Image non disponible",
      publicationYear: data.book.date_published
        ? new Date(data.book.date_published)
        : "année inconnue",
      genres: data.book.subjects || [],
      rating: 0,
      reviewCount: 0,
      isbn: data.book.isbn13 || isbn,
    };

    const newBook = new Book(book);
    await newBook.save();

    return res.status(200).json({ result: true, book: newBook });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      result: false,
      error: "Erreur interne lors de la récupération du livre.",
    });
  }
});
router.get("/author/:author", async (req, res) => {
  try {
    console.log("Requête auteur reçue :", req.params);
    const { author } = req.params;

    // 1️⃣ Vérifier si l’auteur est fourni
    if (!author || author.trim().length === 0) {
      return res.status(400).json({
        result: false,
        error: "Le nom de l'auteur est requis dans l'URL.",
      });
    }

    // 2️⃣ Requête à l’API ISBNdb avec l'index "author"
    const response = await fetch(
      `https://api2.isbndb.com/books/${encodeURIComponent(
        author
      )}?page=1&pageSize=20&column=author&language=fr`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.ISBNDB_API_KEY,
        },
      }
    );

    // 3️⃣ Vérifier si l'API répond avec une erreur
    if (!response.ok) {
      return res.status(response.status).json({
        result: false,
        error: `Erreur API: ${response.status} - ${response.statusText}`,
      });
    }

    const data = await response.json();
    console.log("Réponse API :", data);

    // 4️⃣ Vérifier si des livres existent
    if (!data.books || data.books.length === 0) {
      return res.status(404).json({
        result: false,
        error: "Aucun livre trouvé pour cet auteur.",
      });
    }

    // 5️⃣ Transformer la liste des livres en un format structuré
    const books = data.books.map((book) => ({
      title: book.title || "Titre non disponible",
      author: book.authors ? book.authors[0] : "Auteur inconnu",
      volume: book.volume ? Number(book.volume) : 0,
      summary: book.synopsis || "Résumé non disponible",
      publisher: book.publisher || "Éditeur inconnu",
      pages: book.pages ? Number(book.pages) : 0,
      cover: book.image || "Image non disponible",
      publicationYear: book.date_published
        ? new Date(book.date_published)
        : "année inconnue",
      genres: book.subjects || [],
      rating: 0,
      reviewCount: 0,
      isbn: book.isbn13 || book.isbn || "ISBN non disponible",
    }));

    res.status(200).json({ result: true, books });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      result: false,
      error: "Erreur interne lors de la récupération des auteurs.",
    });
  }
});

// router.post("/", async (req, res) => {
//   try {
//     const { title, author, volume, summary, publisher, pages, cover, publicationYear,genres,rating ,reviewCount, isbn} = req.body;
//     // Vérifie si le livre existe déjà via l'ISBN
//     const existingBook = await Book.findOne({ isbn });
//     if (existingBook) {
//       return res.status(400).json({ success: false, message: "Ce livre existe déjà." });
//     }

//     // Création du livre
//     const newBook = new Book({ title, author, volume, summary, publisher, pages, cover, publicationYear,genres,rating ,reviewCount, isbn});
//     await newBook.save();

//     res.status(201).json({ success: true, message: "Livre ajouté avec succès.", book: newBook });
//   } catch (error) {
//     console.error("Erreur lors de l'ajout du livre :", error);
//     res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// });

module.exports = router;
