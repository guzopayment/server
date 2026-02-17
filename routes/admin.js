import express from "express";
import Booking from "../models/Booking.js";
import verifyAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", verifyAdmin, async (_, res) => {
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
    res.status(500).json({ message: err.message });
  }
});

router.put("/confirm/:id", verifyAdmin, async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, { status: "Confirmed" });
  res.json({ msg: "Confirmed" });
});

router.put("/reject/:id", verifyAdmin, async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, { status: "Rejected" });
  res.json({ msg: "Rejected" });
});

export default router;
