import express from "express";
import Booking from "../models/Booking.js";
import History from "../models/History.js";
import { getIO } from "../utils/socket.js";

const router = express.Router();

// router.get("/", async (_, res) => {
//   res.json(await Booking.find());
// });
// routes/bookings.js or admin route

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments();

    const bookings = await Booking.find()
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const booking = await Booking.create(req.body);

  await History.create({
    title: "New Booking",
    message: `${booking.name} registered`,
  });

  getIO().emit("newBooking", booking);
  res.json(booking);
});

export default router;
