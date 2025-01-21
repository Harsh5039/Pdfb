const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const Tesseract = require("tesseract.js");

app.use(express.json());
app.use(cors());
app.use("/files", express.static("files"));

// MongoDB connection
const mongoUrl = "mongodb+srv://harshbps2003:Jng01ehClr3pOaz8@cluster0.nesqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

// MongoDB Schema
require("./pdfDetails");
const PdfSchema = mongoose.model("PdfDetails");



// API Request
app.post("/upload-files", upload.single("file"), async (req, res) => {
  console.log(req.file);
  const title = req.body.title;
  const fileName = req.file.filename;

  try {
    await PdfSchema.create({ title: title, pdf: fileName });
    res.send({ status: "ok" });
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
});

// Get list of uploaded PDFs
app.get("/get-files", async (req, res) => {
  try {
    const data = await PdfSchema.find({});
    res.send({ status: "ok", data: data });
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
});

// Extract text from a PDF using Tesseract.js
app.post("/process-ocr", upload.single("file"), async (req, res) => {
  const filePath = `./files/${req.file.filename}`;

  try {
    console.log(`Processing OCR for file: ${filePath}`);

    Tesseract.recognize(filePath, "eng")
      .then(({ data: { text } }) => {
        res.send({ status: "ok", text: text });
      })
      .catch((error) => {
        res.status(500).send({ status: "error", message: error.message });
      });
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
});

// Default API to check server status
app.get("/", async (req, res) => {
  res.send("Server is running successfully!");
});

// Start server-----------------------------------------------------
app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});
