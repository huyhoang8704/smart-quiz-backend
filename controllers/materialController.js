const Material = require('../models/Material');

// Upload học liệu (giai đoạn đầu chỉ lưu metadata và text cơ bản)
const uploadMaterial = async (req, res) => {
  try {
    const { title, type, processedContent } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required' });
    }

    const material = await Material.create({
      ownerId: req.user.id,
      title,
      type,
      processedContent
    });

    res.status(201).json(material);
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
    if (!material) return res.status(404).json({ message: 'Material not found' });

    if (material.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this material' });
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
    if (!material) return res.status(404).json({ message: 'Material not found' });

    if (material.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this material' });
    }

    await material.deleteOne();
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadMaterial,
  getMyMaterials,
  getMaterialById,
  deleteMaterial
};
