const mongoose = require("mongoose");

const LibrarySchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    isPublic: { type: Boolean, default: true },
    readings: [
      {
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "books",
          required: true,
        },
        status: {
          type: String,
          enum: ["reading", "completed", "want to read", "none"],
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
const Library = mongoose.model("labraries", ReadingListSchema);

module.exports = Library;
