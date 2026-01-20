const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  originalName: String,
  filename: String,
  size: Number,

  password: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minutes
  }
});

module.exports = mongoose.model("File", fileSchema);
