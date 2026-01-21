const EXPIRY_OPTIONS = {
  "10m": 10 * 60 * 1000,
  "20m": 20 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "permanent": null
};

const File = require("./models/File");
const cors = require("cors");
const bcrypt = require("bcrypt");
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

console.log("INDEX.JS LOADED");

const app = express();

/* =======================
   SECURITY MIDDLEWARE
======================= */

// 🔐 Secure headers
app.use(helmet());

// 🌐 CORS (ONLY frontend allowed)
app.use(
  cors({
    origin: "https://hideshare.vercel.app",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

/* =======================
   RATE LIMITERS
======================= */

const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10,
  message: "Too many uploads. Try again later."
});

const downloadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 20,
  message: "Too many requests. Try again later."
});

/* =======================
   CONFIG
======================= */

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const allowedMimeTypes = [
  "image/png","image/jpeg","image/jpg","image/gif","image/webp",
  "video/mp4","video/mpeg","video/quicktime","video/x-msvideo","video/x-matroska","video/webm",
  "application/pdf","text/plain",
  "application/zip","application/x-zip-compressed",
  "text/x-c","text/x-c++src",
  "application/octet-stream"
];

const allowedExtensions = [
  ".png",".jpg",".jpeg",".gif",".webp",
  ".mp4",".mkv",".avi",".mov",".webm",
  ".pdf",".txt",".zip",
  ".c",".cpp",".h",".java",".py",".js"
];

/* =======================
   MONGODB
======================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("Mongo error:", err));

/* =======================
   MULTER
======================= */

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      allowedMimeTypes.includes(file.mimetype) &&
      allowedExtensions.includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  }
});

/* =======================
   ROUTES
======================= */

/* 📄 FILE METADATA */
app.get("/meta/:filename", downloadLimiter, async (req, res) => {
  const file = await File.findOne({ filename: req.params.filename });

  if (!file) return res.status(404).json({ error: "File not found" });

  if (file.expiresAt && file.expiresAt < new Date()) {
    return res.status(410).json({ error: "Link expired" });
  }

  res.json({
    originalName: file.originalName,
    size: file.size,
    expiresAt: file.expiresAt,
    maxDownloads: file.maxDownloads,
    downloadsLeft:
      file.maxDownloads === null
        ? null
        : Math.max(file.maxDownloads - file.downloads, 0)
  });
});

/* ⬇ DOWNLOAD */
app.get("/download/:filename", downloadLimiter, async (req, res) => {
  const file = await File.findOne({ filename: req.params.filename });
  if (!file) return res.status(404).send("File not found");

  if (file.expiresAt && file.expiresAt < new Date()) {
    return res.status(410).send("Link expired");
  }

  if (file.maxDownloads !== null && file.downloads >= file.maxDownloads) {
    return res.status(410).send("Download limit reached");
  }

  if (file.password) {
    const pw = req.query.password;
    if (!pw) return res.status(401).send("Password required");

    const ok = await bcrypt.compare(pw, file.password);
    if (!ok) return res.status(403).send("Incorrect password");
  }

  const filePath = path.join(__dirname, "uploads", file.filename);

  if (!fs.existsSync(filePath)) {
    await file.deleteOne();
    return res.status(410).send("File no longer available");
  }

  res.download(filePath, file.originalName, async () => {
    file.downloads += 1;
    await file.save();

    if (file.maxDownloads !== null && file.downloads >= file.maxDownloads) {
      fs.unlink(filePath, () =>
        console.log("File deleted:", file.filename)
      );
    }
  });
});

/* ⬆ UPLOAD */
app.post("/upload", uploadLimiter, (req, res) => {
  upload.single("file")(req, res, async err => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const password = req.body.password || null;
    const expiry = req.body.expiry || "10m";

    let maxDownloads = parseInt(req.body.maxDownloads || "1");
    if (maxDownloads >= 9999) maxDownloads = null;

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : null;

    const expiresAt = EXPIRY_OPTIONS[expiry]
      ? new Date(Date.now() + EXPIRY_OPTIONS[expiry])
      : null;

    const file = new File({
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      password: hashedPassword,
      expiresAt,
      maxDownloads,
      downloads: 0
    });

    await file.save();

    res.json({
      message: "File uploaded successfully",
      downloadLink: `https://hideshare.vercel.app/download/${file.filename}`,
      passwordProtected: !!password,
      expiresAt,
      maxDownloads
    });
  });
});

/* =======================
   CLEANUP JOB
======================= */

setInterval(async () => {
  const now = new Date();
  const files = await File.find({});

  for (const file of files) {
    if (file.expiresAt && file.expiresAt < now) {
      fs.unlink(`uploads/${file.filename}`, () => {});
      await file.deleteOne();
      console.log("Deleted expired file:", file.filename);
    }
  }
}, 60 * 1000);

/* =======================
   SERVER
======================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on ${PORT}`)
);
