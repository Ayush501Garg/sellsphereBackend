import express from "express";
import multer from "multer";
import unzipper from "unzipper";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const app = express();

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directories
const UPLOAD_DIR = join(__dirname, "uploads");
const PREVIEW_DIR = join(__dirname, "previews");
const LATEST_DIR = join(PREVIEW_DIR, "latest");

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });
if (!fs.existsSync(LATEST_DIR)) fs.mkdirSync(LATEST_DIR, { recursive: true });

// Multer setup
const upload = multer({ dest: UPLOAD_DIR });


// Helper: find folder containing index.html
function findIndexFolder(basePath) {
  const files = fs.readdirSync(basePath);
  for (let file of files) {
    const fullPath = join(basePath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && file.toLowerCase() === "index.html") return basePath;
    if (stat.isDirectory()) {
      const nested = findIndexFolder(fullPath);
      if (nested) return nested;
    }
  }
  return null;
}



// Serve /preview statically from LATEST_DIR
app.use("/preview", express.static(LATEST_DIR));

// Upload endpoint
app.post("/upload", upload.single("zipfile"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const uploadPath = req.file.path;

    // Clear previous contents of LATEST_DIR
    fs.rmSync(LATEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(LATEST_DIR, { recursive: true });

    // Extract zip to LATEST_DIR
    await new Promise((resolve, reject) => {
      fs.createReadStream(uploadPath)
        .pipe(unzipper.Extract({ path: LATEST_DIR }))
        .on("close", resolve)
        .on("error", reject);
    });

    fs.unlinkSync(uploadPath); // remove uploaded zip

    // Flatten if index.html is in a nested folder
    const indexFolder = findIndexFolder(LATEST_DIR);
    if (indexFolder !== LATEST_DIR) {
      const nestedFiles = fs.readdirSync(indexFolder);
      for (let file of nestedFiles) {
        fs.renameSync(join(indexFolder, file), join(LATEST_DIR, file));
      }
    }

    const protocol = req.protocol;
    const host = req.get("host");
    const liveUrl = `${protocol}://${host}/preview/index.html`;

    res.json({ previewUrl: liveUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process ZIP" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
