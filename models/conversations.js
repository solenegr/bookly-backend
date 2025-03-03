const mongoose = require('mongoose');



const conversationSchema = mongoose.Schema({
  
  users: { type: [mongoose.Schema.Types.ObjectId],  ref: "User"},
  messages:{type: [mongoose.Schema.Types.ObjectId],ref: "Message", default:[]}
},
{timestamps:true});


const Conversation = mongoose.model("conversations", conversationSchema);
export default Conversation;