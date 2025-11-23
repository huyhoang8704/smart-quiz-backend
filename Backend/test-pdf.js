const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Tạo PDF
const doc = new PDFDocument({ margin: 40 });

// Pipe ra file
const outputPath = path.join(__dirname, "test-vietnamese.pdf");
doc.pipe(fs.createWriteStream(outputPath));

// Đường dẫn tới font
const fontPath = path.join(__dirname, "./fronts/DejaVuSans.ttf");
doc.registerFont("vietnamese", fontPath);

// Sử dụng font
doc.font("vietnamese").fontSize(14).text("Xin chào, đây là tiếng Việt có dấu!");

// Kết thúc PDF
doc.end();

console.log("PDF đã tạo xong tại:", outputPath);
