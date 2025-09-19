const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const auth = require('../middleware/authMiddleware');

// Upload học liệu
router.post('/upload', auth, materialController.uploadMaterial);

// Lấy danh sách học liệu của user
router.get('/', auth, materialController.getMyMaterials);

// Lấy chi tiết học liệu
router.get('/:id', auth, materialController.getMaterialById);

// Xóa học liệu
router.delete('/:id', auth, materialController.deleteMaterial);

module.exports = router;
