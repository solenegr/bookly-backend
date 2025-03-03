const mongoose = require('mongoose');



const challengeSchema = mongoose.Schema({
  title: { type: String, required: true },
  books: { type: [mongoose.Schema.Types.ObjectId], ref: "Book"}, 
  duration:{type: Date},
  Conversation: { type: mongoose.Schema.Types.ObjectId,  ref: "Conversation"}
},
{timestamps:true});


const Challenge = mongoose.model("challenges", challengeSchema);
export default Challenge;