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

const HF_API_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
const HF_GENRE_API_URL =
  "https://api-inference.huggingface.co/models/facebook/roberta-large-mnli";

const fetchHuggingFaceSummary = async (text) => {
  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGING_FACE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  const data = await response.json();
  return data[0]?.summary_text || "Résumé non disponible";
};

const detectGenreFromSummary = (summary) => {
  if (!summary) return ["Genres inconnus"];

  // Liste des genres et mots-clés associés
  const genreKeywords = {
    "Science-fiction": [
      "futur",
      "technologie",
      "espace",
      "robot",
      "planète",
      "extraterrestre",
      "cybernétique",
      "vaisseau",
    ],
    Fantasy: [
      "magie",
      "dragon",
      "épée",
      "sorcier",
      "elfe",
      "quêtes",
      "royaume",
      "sorcière",
    ],
    Mystère: [
      "meurtre",
      "disparition",
      "enquête",
      "crime",
      "détective",
      "mystère",
    ],
    Romance: ["amour", "relation", "passion", "couple", "cœur", "romance"],
    Thriller: [
      "suspense",
      "danger",
      "crime",
      "tension",
      "poursuite",
      "révélation",
      "meurtre",
    ],
    Horreur: [
      "épouvante",
      "monstre",
      "fantôme",
      "cauchemar",
      "sang",
      "horreur",
      "peur",
      "tueur",
    ],
    Dystopie: [
      "révolte",
      "contrôle",
      "dictature",
      "totalitaire",
      "apocalypse",
      "futur sombre",
    ],
    Historique: [
      "empire",
      "roi",
      "révolution",
      "mémoire",
      "époque",
      "guerre",
      "héros",
      "moyen-âge",
    ],
    Biographie: ["vie", "mémoires", "autobiographie", "historique", "réel"],
    "Développement personnel": [
      "confiance",
      "réussite",
      "épanouissement",
      "croissance",
    ],
    Drame: ["tragédie", "souffrance", "perte", "destin", "émotion", "famille"],
    Aventure: [
      "voyage",
      "exploration",
      "survie",
      "expédition",
      "nature",
      "découverte",
    ],
    Policier: ["police", "meurtre", "enquête", "criminel", "preuve", "justice"],
  };

  let matchedGenres = [];

  // 🔍 Analyse du résumé pour détecter les genres
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some((word) => summary.toLowerCase().includes(word))) {
      matchedGenres.push(genre);
    }
  }

  // 🚀 Exclure des genres incohérents
  if (matchedGenres.includes("Biographie")) {
    matchedGenres = matchedGenres.filter((genre) => genre !== "Biographie");
  }

  // 🛑 Exclure les genres incohérents comme "Policier"
  if (matchedGenres.includes("Policier")) {
    matchedGenres = matchedGenres.filter((genre) => genre !== "Policier");
  }

  // 🛑 S’assurer que les genres comme "Fantasy" sont exclus seulement quand ce n'est pas approprié
  if (
    matchedGenres.includes("Fantasy") &&
    !summary.toLowerCase().includes("magie") &&
    !summary.toLowerCase().includes("dragon")
  ) {
    matchedGenres = matchedGenres.filter((genre) => genre !== "Fantasy");
  }

  // 🛑 S'assurer qu'on a au moins 3 genres
  if (matchedGenres.length < 3) {
    const allGenres = Object.keys(genreKeywords);
    while (matchedGenres.length < 3) {
      const randomGenre =
        allGenres[Math.floor(Math.random() * allGenres.length)];
      if (!matchedGenres.includes(randomGenre)) {
        matchedGenres.push(randomGenre);
      }
    }
  }

  return matchedGenres.length > 0 ? matchedGenres : ["Genres inconnus"];
};

module.exports = {
  fetchOpenLibraryData,
  fetchGoogleBooksData,
  fetchHuggingFaceSummary,
  detectGenreFromSummary,
};
