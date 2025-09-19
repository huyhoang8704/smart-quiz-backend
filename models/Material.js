const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { type: String, required: true },
    type: { type: String, enum: ['text', 'pdf', 'video', 'slide'], required: true },
    filePath: { type: String }, // lưu đường dẫn file nếu upload
    processedContent: { type: String }, // text rút ra từ học liệu
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', materialSchema, 'materials');
