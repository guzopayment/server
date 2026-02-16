import express from "express";
import Booking from "../models/Booking.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE BOOKING
router.post("/", async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// GET BOOKINGS (admin)
router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const bookings = await Booking.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Booking.countDocuments();

  res.json({
    data: bookings,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

export default router;
