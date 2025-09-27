function sanitizeFileName(filename) {
  // Loại bỏ dấu tiếng Việt + ký tự đặc biệt
  return filename
    .normalize("NFD")                 // tách tổ hợp dấu
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/[^a-zA-Z0-9.\-_]/g, "_"); // thay ký tự lạ bằng _
}

module.exports = sanitizeFileName;