import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const bookings = await Booking.find();

    const totalParticipants = bookings.reduce(
      (sum, b) => sum + Number(b.participants || 0),
      0,
    );

    const organizations = {};

    bookings.forEach((b) => {
      const org = b.organization || "Unknown";
      organizations[org] =
        (organizations[org] || 0) + Number(b.participants || 0);
    });

    res.json({
      totalParticipants,
      organizations,
      totalBookings: bookings.length,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;
