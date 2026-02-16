import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

/* ===== GET CONFIRMED BOOKINGS ===== */
router.get("/confirmed", async (req, res) => {
  try {
    const data = await Booking.find({ status: "confirmed" }).sort({
      createdAt: -1,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch report" });
  }
});

/* ===== EXPORT PDF ===== */
router.get("/export/pdf", async (req, res) => {
  const data = await Booking.find({ status: "confirmed" });

  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(data, null, 2));
});

/* ===== EXPORT EXCEL ===== */
router.get("/export/excel", async (req, res) => {
  const data = await Booking.find({ status: "confirmed" });

  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(data, null, 2));
});

export default router;
