const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  fisrtname: {type: String ,required: true},
  username: {type: String ,required: true},
  email: {type: String ,required: true},
  password: {type: String ,required: true},
  token: {type: String },
  avatar: {type: String },
},
{timestamps:true}
);

const User = mongoose.model('users', userSchema);

module.exports = User;