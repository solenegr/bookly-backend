const mongoose = require("mongoose");

const bookSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    volume: { type: Number },
    summary: { type: String, required: true },
    publisher: { type: String },
    pages: { type: Number },
    cover: { type: String },
    publicationYear: { type: Date },
    genres: { type: [String] },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isbn: { type: String, unique: true },
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
