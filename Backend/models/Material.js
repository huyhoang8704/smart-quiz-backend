const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { type: String, required: true },
    // kiểu file: pdf, video, slide, text...
    type: {
      type: String,
      enum: ['text', 'pdf', 'video', 'slide'],
      required: true
    },
    filePath: { type: String }, // đường dẫn trong Supabase bucket
    url: { type: String },      // public URL của file
    processedContent: { type: String }, // text rút ra từ học liệu
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', materialSchema, 'materials');
