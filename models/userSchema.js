const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  subject: String,
  body: String,
  recipient_array: [
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