import express from "express";
import Booking from "../models/Booking.js";
import verifyAdmin from "../middleware/authMiddleware.js";
import historyLogger from "../middleware/historyLogger.js";

const router = express.Router();

// Dashboard stats
router.get("/stats", verifyAdmin, async (req, res) => {
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
        if (!orgStats[b.organization]) {
          orgStats[b.organization] = 0;
        }
        orgStats[b.organization] += Number(b.participants || 0);
      });

    res.json({
      totalBookings,
      totalParticipants,
      pendingPayments,
      organizationBreakdown: orgStats,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Approve payment
router.put("/confirm/:id", verifyAdmin, async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, {
    status: "Confirmed",
  });
  res.json({ message: "Payment confirmed" });
});

// Reject payment
router.put("/reject/:id", verifyAdmin, async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, {
    status: "Rejected",
  });
  res.json({ message: "Payment rejected" });
});
router.put(
  "/confirm/:id",
  historyLogger("Payment confirmed"),
  async (req, res) => {
    await Booking.findByIdAndUpdate(req.params.id, {
      status: "Confirmed",
    });
    res.json("Confirmed");
  },
);
export default router;
