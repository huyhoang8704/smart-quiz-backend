const Material = require("../models/Material");
const supabase = require("../utils/supabaseClient");
const multer = require("multer");
const path = require("path");
const sanitizeFileName = require("../utils/sanitizeFileName");
const getPagination = require("../utils/paginate");



// Dùng memoryStorage để đọc file từ RAM
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const uploadFile = upload.single("file");

// Hàm map mimetype -> type enum
const mapFileType = (mimetype) => {
  if (mimetype.includes("pdf")) return "pdf";
  if (mimetype.includes("video")) return "video";
  if (mimetype.includes("presentation")) return "slide"; // pptx, etc
  return "text"; // fallback
};

// Upload học liệu (PDF, video, slide…)
const uploadMaterial = async (req, res) => {
  try {
    uploadFile(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Please upload a file" });
      }

      const { title, processedContent } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Tạo tên file an toàn
      const safeFileName =
        Date.now() + "-" + sanitizeFileName(req.file.originalname);

      // Tạo đường dẫn trong bucket
      const filePath = `materials/${req.user.id}/${safeFileName}`;

      // Upload file lên Supabase
      const { error: uploadError } = await supabase.storage
        .from("materials") // bucket name
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        return res.status(500).json({ error: uploadError.message });
      }

      // Lấy public URL
      const { data: urlData, error: urlError } = supabase.storage
        .from("materials")
        .getPublicUrl(filePath);

      if (urlError) {
        return res.status(500).json({ error: urlError.message });
      }

      // Lưu thông tin vào MongoDB
      const material = await Material.create({
        ownerId: req.user.id,
        title,
        type: mapFileType(req.file.mimetype),
        filePath,
        url: urlData.publicUrl, // Public URL để client tải
        processedContent: processedContent || "",
      });

      res.status(201).json(material);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Lấy danh sách học liệu của user
const getMyMaterials2 = async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = { ownerId: req.user._id };

    if (type) query.type = type;
  
    // Search theo title hoặc processedContent
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { processedContent: { $regex: search, $options: "i" } }
      ];
    }

    const materials = await Material.find(query).sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Lấy danh sách học liệu của user
const getMyMaterials = async (req, res) => {
  try {
    const { type, search } = req.query;
    const { page, limit, skip } = getPagination(req);
    let query = { ownerId: req.user._id };

    if (type) query.type = type;
  
    // Search theo title hoặc processedContent
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { processedContent: { $regex: search, $options: "i" } }
      ];
    }

    const [materials, total] = await Promise.all([
      Material.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Material.countDocuments(query),
    ]);

    res.json({
      data: materials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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

    if (material.ownerId.toString() !== req.user._id.toString()) {
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

    if (material.ownerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this material" });
    }

    // Xóa file trong Supabase Storage
    if (material.filePath) {
      await supabase.storage.from("materials").remove([material.filePath]);
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
