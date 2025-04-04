const mongoose = require("mongoose");

const LibrarySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: { type: Boolean, default: true },
    readings: [
      {
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },
        status: {
          type: String,
          enum: [
            "A lire",
            "En cours de lecture",
            "Terminé",
            "Suivi de lecture",
          ],
          required: true,
        },
        added_at: { type: Date, default: Date.now },
        genres: { type: [String], default: [] },
      },
    ],
  },
  { timestamps: true }
);

// Création du modèle
const Library = mongoose.model("Library", LibrarySchema);

module.exports = Library;
