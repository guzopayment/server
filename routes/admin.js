import express from "express";
import Booking from "../models/Booking.js";
import History from "../models/History.js";
import { getIO } from "../utils/socket.js";
import verifyAdmin from "../middleware/authMiddleware.js"; // keep your admin protection

const router = express.Router();

router.get("/stats", verifyAdmin, async (_, res) => {
  try {
    const bookings = await Booking.find();

    const totalBookings = bookings.length;

    const totalParticipants = bookings
      .filter((b) => b.status === "Confirmed")
      .reduce((sum, b) => sum + Number(b.participants || 0), 0);

    const pendingPayments = bookings.filter(
      (b) => b.status === "Pending",
    ).length;

    const orgStats = {};
    bookings
      .filter((b) => b.status === "Confirmed")
      .forEach((b) => {
        const org = b.organization || "Unknown";
        orgStats[org] = (orgStats[org] || 0) + Number(b.participants || 0);
      });

    res.json({
      totalBookings,
      totalParticipants,
      pendingPayments,
      organizationBreakdown: orgStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/confirm/:id", verifyAdmin, async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, { status: "Confirmed" });

  await History.create({
    title: "Payment Confirmed",
    message: "Participant payment confirmed",
  });

  getIO().emit("history", {
    title: "Payment Confirmed",
    message: `Payment confirmed for ${req.params.id}`,
    createdAt: new Date(),
  });

  res.json({ msg: "Confirmed" });
});

router.put("/reject/:id", verifyAdmin, async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, { status: "Rejected" });

  await History.create({
    title: "Payment Rejected",
    message: "Participant rejected",
  });

  getIO().emit("history", {
    title: "Payment Rejected",
    message: `Payment rejected for ${req.params.id}`,
    createdAt: new Date(),
  });

  res.json({ msg: "Rejected" });
});

export default router;
