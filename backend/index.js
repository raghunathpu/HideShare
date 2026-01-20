const File = require("./models/File");

const cors = require("cors");
const bcrypt = require("bcrypt");

console.log("INDEX.JS LOADED");

require("dotenv").config();

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

/* =======================
   CONFIG
======================= */
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const allowedMimeTypes = [
  // Images
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",

  // Videos
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",

  // Documents / text
  "application/pdf",
  "text/plain",

  // Archives
  "application/zip",
  "application/x-zip-compressed",

  // Source code (some browsers send these)
  "text/x-c",
  "text/x-c++src",

  // Generic fallback (IMPORTANT)
  "application/octet-stream"
];

/* =======================
   MONGODB
======================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("Mongo error:", err));
const allowedExtensions = [
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".mp4", ".mkv", ".avi", ".mov", ".webm",
  ".pdf", ".txt", ".zip",
  ".c", ".cpp", ".h", ".java", ".py", ".js"
];

/* =======================
   MULTER (UPLOAD)
======================= */
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  console.log("Uploaded file:", file.originalname);
  console.log("MIME type:", file.mimetype);
  console.log("Extension:", ext);

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

app.use(express.json());

/* =======================
   ROUTES
======================= */
app.get("/download/:filename", async (req, res) => {
  try {
    const file = await File.findOne({ filename: req.params.filename });

    if (!file) {
      return res.status(404).send("File expired or does not exist");
    }

    // If file is password protected
    if (file.password) {
      const providedPassword = req.query.password;

      if (!providedPassword) {
        return res.status(401).send("Password required");
      }

      const isMatch = await bcrypt.compare(providedPassword, file.password);

      if (!isMatch) {
        return res.status(403).send("Incorrect password");
      }
    }

    const filePath = path.join(__dirname, "uploads", file.filename);
    res.download(filePath, file.originalName);
  } catch (err) {
    res.status(500).send("Error downloading file");
  }
});


app.post("/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const password = req.body.password || null;
      let hashedPassword = null;

      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const file = new File({
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        password: hashedPassword
      });

      await file.save();

      res.json({
        message: "File uploaded successfully",
        downloadLink: `https://hide-share.vercel.app/download/${file.filename}`,
        passwordProtected: password ? true : false,
        expiresIn: "10 minutes"
      });
    } catch (error) {
      res.status(500).json({ error: "Error saving file" });
    }
  });
});



/* =======================
   CLEANUP JOB
======================= */
let dbConnected = false;

mongoose.connection.on("connected", () => {
  dbConnected = true;
});

setInterval(async () => {
  if (!dbConnected) return;

  const files = await File.find({});
  const fileNamesInDB = files.map(f => f.filename);

  fs.readdir("uploads", (err, uploadFiles) => {
    if (err) return;

    uploadFiles.forEach(file => {
      if (!fileNamesInDB.includes(file)) {
        fs.unlink(`uploads/${file}`, () => {
          console.log("Deleted expired file:", file);
        });
      }
    });
  });
}, 60 * 1000);

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

