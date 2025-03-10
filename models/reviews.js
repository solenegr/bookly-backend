const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
  {
    content: { type: String, required: true },
    note: { type: Number, required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "books" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "users",
      default: [],
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("reviews", reviewSchema);
module.exports = Review;
