// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  message: String,
  read: { type: Boolean, default: false },
});

module.exports = mongoose.model("Notification", notificationSchema);
