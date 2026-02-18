import express from "express";
import multer from "multer";
import path from "path";
import Booking from "../models/Booking.js";
import History from "../models/History.js";
import auth from "../middleware/authMiddleware.js";
import { getIO } from "../utils/socket.js";

const router = express.Router();
/* ===== MULTER SETUP ===== */
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads"),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname || "");
//     cb(null, `${Date.now()}-${file.fieldname}${ext}`);
//   },
// });

// const upload = multer({ storage });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, png, webp, gif)."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
/* ===== CREATE BOOKING ===== */
router.post("/", upload.single("paymentProof"), async (req, res) => {
  try {
    const booking = await Booking.create({
      name: (req.body.name || "").trim(),
      organization: (req.body.organization || "").trim(),
      phone: (req.body.phone || "").trim(),
      participants: Number(req.body.participants || 0),
      paymentProof: req.file?.filename || "",
      status: "Pending",
    });

    const historyItem = await History.create({
      title: "New Booking",
      message: `${booking.name || "Someone"} registered`,
    });

    getIO().emit("newBooking", booking);
    getIO().emit("history", historyItem);

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/* ===== GET BOOKINGS (ADMIN) ===== */
router.get("/", auth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
