import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
    file.mimetype,
  );

  if (!ok) {
    const err = new Error(
      "Only image files are allowed (jpg, png, webp, gif).",
    );
    err.status = 400;
    return cb(err, false);
  }

  cb(null, true);
};

const uploadProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default uploadProof;
