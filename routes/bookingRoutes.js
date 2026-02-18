import express from "express";
import Booking from "../models/Booking.js";
import History from "../models/History.js";
import { getIO } from "../utils/socket.js";
import uploadProof from "../middleware/uploadProof.js";
import cloudinary from "../utils/cloudinary.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ===== CREATE BOOKING (PUBLIC) ===== */
router.post("/", uploadProof.single("paymentProof"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Payment proof image is required" });
    }

    // ✅ Upload file buffer to Cloudinary
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
      paymentProof: uploadResult?.secure_url || "",
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
    console.error("BOOKING POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ===== GET BOOKINGS (ADMIN) ===== */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("BOOKING GET ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
