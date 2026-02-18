import express from "express";
import Booking from "../models/Booking.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find();

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
        const org = (b.organization || "Unknown").trim() || "Unknown";
        orgStats[org] = (orgStats[org] || 0) + Number(b.participants || 0);
      });

    res.json({
      totalParticipants,
      pendingPayments,
      organizationBreakdown: orgStats,
    });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/confirm/:id", authMiddleware, async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, {
      status: "Confirmed",
    });
    res.json({ msg: "Confirmed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/reject/:id", authMiddleware, async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, {
      status: "Rejected",
    });
    res.json({ msg: "Rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
