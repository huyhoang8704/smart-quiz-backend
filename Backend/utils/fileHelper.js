exports.sanitizeFileName = (name) => {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
};

exports.mapFileType = (mimetype) => {
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.includes("presentation") || mimetype.includes("powerpoint"))
    return "slide";

  return "text"; // fallback
};
