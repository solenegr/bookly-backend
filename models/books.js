const mongoose = require('mongoose');



const bookSchema = mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  volume: { type: Number, required: true },
  summary: { type: String },
  publisher: { type: String },
  pages: { type: Number },
  cover: { type: String },
  publicationYear: { type: Number },
  genres: { type: [String], required: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
},
{timestamps:true});


const Book = mongoose.model("books", bookSchema);
export default Book;
