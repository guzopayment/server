import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else {
    const err = new Error(
      "Only image files are allowed (jpg, png, webp, gif).",
    );
    err.status = 400;
    cb(err, false);
  }
};

const uploadProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default uploadProof;
