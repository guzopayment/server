import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

router.get("/confirmed", async (req, res) => {
  try {
    const data = await Booking.find({ status: "Confirmed" }).sort({
      createdAt: -1,
    });
    res.json(data);
  } catch (err) {
    console.error("REPORT /confirmed error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/export/pdf", async (req, res) => {
  try {
    const data = await Booking.find({ status: "Confirmed" }).sort({
      createdAt: -1,
    });
    // (you’re not generating a real PDF yet — you return JSON. fine for now)
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("REPORT /export/pdf error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/export/excel", async (req, res) => {
  try {
    const data = await Booking.find({ status: "Confirmed" }).sort({
      createdAt: -1,
    });
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("REPORT /export/excel error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
