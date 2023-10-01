const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  ID: String,
  subject: String,
  body: String,
  unread: Boolean,
  snippet: String,
  date: Date,
  sentTo: [
    {
      name: String,
      email: String,
    },
  ],
  sentBy:[
    {
      name: String,
      email: String,
    },
  ],
  scheduledAt: Date, 
});

const userSchema = new mongoose.Schema({
  email: String,
  accessToken: String, 
  starredEmails: [emailSchema], 
  scheduledEmails: [emailSchema]
});

const User = mongoose.model('User', userSchema);

module.exports = User;