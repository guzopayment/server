import express from "express";
import Booking from "../models/Booking.js";
import History from "../models/History.js";
import { getIO } from "../utils/socket.js";
import uploadProof from "../middleware/uploadProof.js";
import cloudinary from "../utils/cloudinary.js";
import adminAuth from "../middleware/authMiddleware.js"; // or your verifyAdmin/auth middleware
const router = express.Router();

// ✅ CREATE BOOKING (Cloudinary)
router.post(
  "/",
  (req, res, next) => {
    // handle multer errors as JSON (no hidden 500)
    uploadProof.single("paymentProof")(req, res, (err) => {
      if (err) {
        return res.status(err.status || 400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Payment proof image is required" });
      }

      // ✅ Upload to Cloudinary using buffer
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "guzo-payment-proofs",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        stream.end(req.file.buffer);
      });

      const booking = await Booking.create({
        name: (req.body.name || "").trim(),
        organization: (req.body.organization || "").trim(),
        phone: (req.body.phone || "").trim(),
        participants: Number(req.body.participants || 0),
        paymentProof: uploadResult.secure_url, // ✅ store Cloudinary URL
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
      console.error("BOOKING CREATE ERROR:", err);
      res.status(500).json({
        message: err.message || "Server error",
      });
    }
  },
);
// ✅ GET BOOKINGS (ADMIN)
router.get("/", adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "50", 10);
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments();

    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      bookings,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /bookings error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
