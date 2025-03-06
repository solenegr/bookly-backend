const fetch = require("node-fetch");

// 🚀 Récupération des infos d'Open Library par ISBN ou titre
async function fetchOpenLibraryData(query, isIsbn) {
  try {
    const url = isIsbn
      ? `https://openlibrary.org/api/books?bibkeys=ISBN:${query}&format=json&jscmd=data`
      : `https://openlibrary.org/search.json?title=${encodeURIComponent(
          query
        )}&limit=5`;

    const response = await fetch(url);
    const data = await response.json();

    if (isIsbn) {
      const book = data[`ISBN:${query}`];
      if (!book) return [];

      return [
        {
          title: book.title || "Titre inconnu",
          author: book.authors
            ? book.authors.map((a) => a.name).join(", ")
            : "Auteur inconnu",
          pages: book.number_of_pages || "Inconnu",
          publicationYear: book.publish_date || "Inconnu",
          genres:
            book.subjects && book.subjects.length > 0
              ? book.subjects
              : ["Genres inconnus"],
          cover: book.cover ? book.cover.large : null,
        },
      ];
    }

    return data.docs.slice(0, 5).map((book) => ({
      title: book.title || "Titre inconnu",
      author: book.author_name ? book.author_name.join(", ") : "Auteur inconnu", // ✅ Correction ici
      pages: book.number_of_pages || "Inconnu",
      publicationYear: book.first_publish_year || "Inconnu",
      genres: book.subject ? book.subject : ["Genres inconnus"],
      cover: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : null,
    }));
  } catch (error) {
    console.error("❌ Erreur Open Library :", error);
    return [];
  }
}

// 🚀 Récupération des infos de Google Books par ISBN ou titre
async function fetchGoogleBooksData(query, isIsbn) {
  try {
    const url = isIsbn
      ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${query}`
      : `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
          query
        )}&maxResults=5`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) return [];

    return data.items.map((book) => ({
      title: book.volumeInfo.title || "Titre inconnu",
      author: book.volumeInfo.authors
        ? book.volumeInfo.authors.join(", ")
        : "Auteur inconnu",
      summary: book.volumeInfo.description || "Résumé non disponible",
      pages: book.volumeInfo.pageCount || "Inconnu",
      publicationYear: book.volumeInfo.publishedDate || "Inconnu",
      genres:
        book.volumeInfo.categories && book.volumeInfo.categories.length > 0
          ? book.volumeInfo.categories
          : ["Genres inconnus"], // ✅ Correction ici
      cover: book.volumeInfo.imageLinks
        ? book.volumeInfo.imageLinks.thumbnail
        : null,
    }));
  } catch (error) {
    console.error("❌ Erreur Google Books :", error);
    return [];
  }
}

module.exports = {
  fetchOpenLibraryData,
  fetchGoogleBooksData,
};
