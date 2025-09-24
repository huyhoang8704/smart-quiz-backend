const Material = require("../models/Material");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/materials/";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  // Only allow PDF files
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware for single PDF upload
const uploadPDF = upload.single("pdfFile");

// Upload học liệu PDF
const uploadMaterial = async (req, res) => {
  try {
    // Handle file upload first
    uploadPDF(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Please upload a PDF file" });
      }

      const { title, processedContent } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      const material = await Material.create({
        ownerId: req.user.id,
        title,
        type: "pdf",
        filePath: req.file.path,
        processedContent: processedContent || "",
      });

      res.status(201).json(material);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách học liệu của user
const getMyMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ ownerId: req.user.id });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy chi tiết học liệu
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material)
      return res.status(404).json({ message: "Material not found" });

    if (material.ownerId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this material" });
    }

    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa học liệu
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material)
      return res.status(404).json({ message: "Material not found" });

    if (material.ownerId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this material" });
    }

    // Delete the physical file if it exists
    if (material.filePath && fs.existsSync(material.filePath)) {
      fs.unlinkSync(material.filePath);
    }

    await material.deleteOne();
    res.json({ message: "Material deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadMaterial,
  getMyMaterials,
  getMaterialById,
  deleteMaterial,
};
