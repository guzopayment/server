import express from "express";
import Booking from "../models/Booking.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ===== GET CONFIRMED BOOKINGS ===== */
router.get("/confirmed", authMiddleware, async (req, res) => {
  try {
    const data = await Booking.find({ status: "Confirmed" }).sort({
      createdAt: -1,
    });

    res.json(data);
  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ===== EXPORT PDF ===== */
router.get("/export/pdf", authMiddleware, async (req, res) => {
  try {
    const data = await Booking.find({ status: "Confirmed" });

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("PDF EXPORT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ===== EXPORT EXCEL ===== */
router.get("/export/excel", authMiddleware, async (req, res) => {
  try {
    const data = await Booking.find({ status: "Confirmed" });

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("EXCEL EXPORT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
