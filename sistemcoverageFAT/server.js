const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname);
  },
  filename: function (req, file, cb) {
    if (file.originalname.endsWith(".xlsx")) {
      cb(null, "FAT Purwokerto.xlsx");
    } else if (file.originalname.endsWith(".kml")) {
      cb(null, "CL DONE RFS PURWOKERTO.kml");
    } else {
      cb(null, file.originalname);
    }
  },
});
const upload = multer({ storage: storage });

// Database for Demand Heatmap (simple JSON file)
const DB_FILE = path.join(__dirname, "public", "data", "heatmap.json");
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Endpoint to get all heatmap points
app.get("/api/heatmap", (req, res) => {
  fs.readFile(DB_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read heatmap data" });
    res.json(JSON.parse(data));
  });
});

// Endpoint to add a new heatmap point (Uncovered locations)
app.post("/api/heatmap", (req, res) => {
  const { lat, lon, address } = req.body;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and Longitude are required" });
  }

  fs.readFile(DB_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read heatmap data" });

    const heatmap = JSON.parse(data);
    heatmap.push({
      lat,
      lon,
      address,
      timestamp: new Date().toISOString(),
    });

    fs.writeFile(DB_FILE, JSON.stringify(heatmap, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Failed to save heatmap data" });
      res.json({ success: true });
    });
  });
});

// Endpoint to upload new data files
app.post(
  "/api/upload",
  upload.fields([
    { name: "excel", maxCount: 1 },
    { name: "kml", maxCount: 1 },
  ]),
  (req, res) => {
    // Run the python script to regenerate geojson
    exec("python data_pipeline/process_data.py", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).json({ error: "Failed to process new data" });
      }
      res.json({ success: true, message: "Files uploaded and processed successfully" });
    });
  },
);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
