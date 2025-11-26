const Material = require("../models/Material");
const supabase = require("../utils/supabaseClient");
const multer = require("multer");
const path = require("path");
const getPagination = require("../utils/paginate");
const s3 = require("../config/space");
const { sanitizeFileName, mapFileType } = require("../utils/fileHelper");
const fs = require("fs");
const os = require("os");
const fsp = require("fs/promises");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const wav = require("wav-decoder");

// // Dùng memoryStorage để đọc file từ RAM
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
// });

// const uploadFile = upload.single("file");

// // Hàm map mimetype -> type enum
// const mapFileType = (mimetype) => {
//   if (mimetype.includes("pdf")) return "pdf";
//   if (mimetype.includes("video")) return "video";
//   if (mimetype.includes("presentation")) return "slide"; // pptx, etc
//   return "text"; // fallback
// };

// // Upload học liệu (PDF, video, slide…)
// const uploadMaterial = async (req, res) => {
//   try {
//     uploadFile(req, res, async function (err) {
//       if (err) {
//         return res.status(400).json({ error: err.message });
//       }

//       if (!req.file) {
//         return res.status(400).json({ error: "Please upload a file" });
//       }

//       const { title, processedContent } = req.body;
//       if (!title) {
//         return res.status(400).json({ error: "Title is required" });
//       }

//       // Tạo tên file an toàn
//       const safeFileName =
//         Date.now() + "-" + sanitizeFileName(req.file.originalname);

//       // Tạo đường dẫn trong bucket
//       const filePath = `materials/${req.user.id}/${safeFileName}`;

//       // Upload file lên Supabase
//       const { error: uploadError } = await supabase.storage
//         .from("materials") // bucket name
//         .upload(filePath, req.file.buffer, {
//           contentType: req.file.mimetype,
//           upsert: false,
//         });

//       if (uploadError) {
//         return res.status(500).json({ error: uploadError.message });
//       }

//       // Lấy public URL
//       const { data: urlData, error: urlError } = supabase.storage
//         .from("materials")
//         .getPublicUrl(filePath);

//       if (urlError) {
//         return res.status(500).json({ error: urlError.message });
//       }

//       // Lưu thông tin vào MongoDB
//       const material = await Material.create({
//         ownerId: req.user.id,
//         title,
//         type: mapFileType(req.file.mimetype),
//         filePath,
//         url: urlData.publicUrl, // Public URL để client tải
//         processedContent: processedContent || "",
//       });

//       res.status(201).json(material);
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
// Giả lập hàm extract text từ video (thay bằng API thực tế nếu cần)
let transcriber = null;

// Lazy-load Whisper model từ @xenova/transformers (ESM)
async function getTranscriber() {
  if (!transcriber) {
    console.log("Loading Whisper model (Xenova/whisper-small)...");
    const { pipeline } = await import("@xenova/transformers");
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-small"
    );
  }
  return transcriber;
}

async function extractTextFromVideoBuffer(buffer) {
  const tmpDir = os.tmpdir();
  const videoPath = `${tmpDir}/video-${Date.now()}.mp4`;
  const audioPath = `${tmpDir}/audio-${Date.now()}.wav`;

  try {
    await fsp.writeFile(videoPath, buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions(["-vn", "-ac 1", "-ar 16000"])
        .save(audioPath)
        .on("end", resolve)
        .on("error", reject);
    });

    // 3. Lấy transcriber (lazy-load ESM)
    const transcriber = await getTranscriber();

    // 4. Đọc file WAV thành buffer
    const audioFileBuffer = await fsp.readFile(audioPath);

    // 5. Decode WAV -> lấy waveform dạng Float32Array
    const decoded = await wav.decode(audioFileBuffer);
    // decoded: { sampleRate, channelData: [Float32Array, Float32Array?] }

    // Lấy kênh mono (mình đã ép -ac 1 ở ffmpeg nên channelData[0] là đủ)
    const monoData = decoded.channelData[0]; // Float32Array

    // 6. Gọi Whisper với waveform thô + chunking
    const result = await transcriber(monoData, {
      chunk_length_s: 30, // mỗi chunk 30s
      stride_length_s: 5, // overlap 5s giữa các chunk
    });

    let text = result.text || "";

    if (!text.trim()) {
      return "[Không trích xuất được nội dung thoại từ video]";
    }

    const MAX_CHARS = 20000;
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + "\n\n[Transcript bị cắt bớt]";
    }

    return text;
  } finally {
    try {
      await fsp.unlink(videoPath);
    } catch {}
    try {
      await fsp.unlink(audioPath);
    } catch {}
  }
}

const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }

    const { title, processedContent, videoExtractContent } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Create safe file name
    const safeName = Date.now() + "-" + sanitizeFileName(req.file.originalname);
    // Path in bucket
    const filePath = `materials/${req.user.id}/${safeName}`;

    // Params upload for DigitalOcean Spaces
    const params = {
      Bucket: "qldapm",
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: "public-read", // or private depending on your preference
    };

    try {
      await s3.send(new PutObjectCommand(params));
    } catch (err) {
      return res.status(500).json({
        error: "Upload to Spaces failed",
        details: err.message,
      });
    }

    // Public URL
    const publicUrl = `https://qldapm.sgp1.digitaloceanspaces.com/${filePath}`;

    // Nếu là video, extract text từ video
    let finalProcessedContent = processedContent || "";
    const fileType = mapFileType(req.file.mimetype);
    console.log("File type detected:", fileType);
    if (fileType === "video") {
      try {
        // Extract text từ video buffer
        finalProcessedContent = await extractTextFromVideoBuffer(
          req.file.buffer
        );
        console.log("Extracted text from video:", finalProcessedContent);
      } catch (err) {
        // Nếu lỗi, vẫn lưu processedContent nếu có
        console.error("Lỗi extract text từ video:", err);
      }
    }

    // Save to database
    const material = await Material.create({
      ownerId: req.user.id,
      title,
      type: fileType,
      filePath,
      url: publicUrl,
      processedContent: finalProcessedContent,
    });

    return res.status(201).json(material);
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
        { processedContent: { $regex: search, $options: "i" } },
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
    let query = { ownerId: req.user._id };

    if (type) query.type = type;

    // Search theo title hoặc processedContent
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { processedContent: { $regex: search, $options: "i" } },
      ];
    }

    const materials = await Material.find(query).sort({ createdAt: -1 });

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

    // Xóa file trong DigitalOcean Spaces
    if (material.filePath) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: "qldapm",
            Key: material.filePath,
          })
        );
      } catch (err) {
        console.error("Error deleting file from Spaces:", err);
      }
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
