const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  originalName: String,
  filename: String,
  size: Number,
  password: String,
  expiresAt: Date,

  // ✅ NEW
  maxDownloads: {
    type: Number,
    default: 1
  },
  downloads: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("File", fileSchema);
