const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
  {
    content: { type: String, required: true },
    note: { type: Number, required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
