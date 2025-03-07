const mongoose = require('mongoose');



const challengeSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  books: { type: [mongoose.Schema.Types.ObjectId], ref: "books"}, 
  duration:{type: Date}
},
{timestamps:true});

const Challenge = mongoose.model("challenges", challengeSchema);
module.exports = Challenge;