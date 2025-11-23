const PDFDocument = require("pdfkit");
const path = require("path");
const Quiz = require("../models/Quiz");

function slugify(text) {
  return text
    .toString()
    .normalize("NFD")                  // tách dấu
    .replace(/[\u0300-\u036f]/g, "")   // loại bỏ dấu
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")       // thay ký tự không phải chữ/số bằng "-"
    .replace(/^-+|-+$/g, "");          // loại bỏ dấu - thừa ở đầu/cuối
}


exports.exportQuizPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const includeAnswers = req.query.answers === "true";

    const quiz = await Quiz.findById(id).populate("materialId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const doc = new PDFDocument({ margin: 40 });

    // Header PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="quiz-${slugify(quiz.title)}.pdf"`
    );

    doc.pipe(res);

    // --- FONT HỖ TRỢ TIẾNG VIỆT ---
    const fontPath = path.join(__dirname, "../fronts/DejaVuSans.ttf"); // font Unicode hỗ trợ tiếng Việt
    doc.registerFont("vietnamese", fontPath);
    doc.font("vietnamese");

    // --- TITLE ---
    doc.fontSize(20).text(quiz.title, { align: "center" });
    doc.moveDown(1);

    // --- SETTINGS ---
    if (quiz.settings) {
      doc.fontSize(12).text(`Difficulty: ${quiz.settings.difficulty}`);
      doc.text(
        `Focus Areas: ${quiz.settings.focusAreas?.join(", ") || "None"}`
      );
      if (quiz.settings.customInstructions) {
        doc.text(`Instructions: ${quiz.settings.customInstructions}`);
      }
      doc.moveDown(1);
    }

    // --- QUESTIONS ---
    quiz.questions.forEach((q, index) => {
      // Câu hỏi
      doc.fontSize(14).text(`${index + 1}. ${q.question}`);
      doc.moveDown(0.5);

      // Các lựa chọn nếu MCQ
      if (q.type === "mcq" && q.options) {
        q.options.forEach((opt, index) => {
          const letter = String.fromCharCode(65 + index);
          doc.fontSize(14).font("vietnamese").text(`${letter}. ${opt}`);
        });
        doc.moveDown(0.5);
      }

      // True/False
      if (q.type === "truefalse") {
        doc.fontSize(12).text("   True / False");
      }

      // Fill in blank
      if (q.type === "fillblank") {
        doc.fontSize(12).text("   ________");
      }

      // Đáp án (nếu includeAnswers=true)
      if (includeAnswers && q.answer) {
        doc
          .fontSize(12)
          .fillColor("blue")
          .text(`→ Answer: ${q.answer}`);
        doc.fillColor("black");
      }

      doc.moveDown(1);
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
