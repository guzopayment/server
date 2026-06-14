import express from "express";
import Booking from "../models/Booking.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getIO } from "../utils/socket.js";

const router = express.Router();

function buildClientStatusMessage(booking) {
  if (booking.status === "Confirmed") {
    return `${booking.name || "Your booking"}, your payment proof has been accepted by admin.`;
  }
  if (booking.status === "Rejected") {
    return `${booking.name || "Your booking"}, your payment proof has been rejected. Please contact the admin or resubmit the correct proof.`;
  }
  return `${booking.name || "Your booking"}, your payment proof is still waiting for admin review.`;
}

router.get("/stats", authMiddleware, async (_req, res) => {
  try {
    const bookings = await Booking.find();

    const totalBookings = bookings.length;
    const totalParticipants = bookings
      .filter((b) => b.status === "Confirmed")
      .reduce((sum, b) => sum + Number(b.participants || 0), 0);

    const pendingPayments = bookings.filter((b) => b.status === "Pending").length;
    const confirmedCount = bookings.filter((b) => b.status === "Confirmed").length;
    const rejectedCount = bookings.filter((b) => b.status === "Rejected").length;

    const orgStats = {};
    bookings.filter((b) => b.status === "Confirmed").forEach((b) => {
      const org = (b.organization || "Unknown").trim() || "Unknown";
      orgStats[org] = (orgStats[org] || 0) + Number(b.participants || 0);
    });

    res.json({
      totalBookings,
      totalParticipants,
      pendingPayments,
      confirmedCount,
      rejectedCount,
      organizationBreakdown: orgStats,
    });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/bookings/:id", authMiddleware, async (req, res) => {
  try {
    const { name, organization, phone, participants } = req.body;

    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(organization !== undefined ? { organization: String(organization).trim() } : {}),
        ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
        ...(participants !== undefined ? { participants: Number(participants) } : {}),
      },
      { new: true },
    );

    if (!updated) return res.status(404).json({ message: "Booking not found" });

    res.json({ message: "Updated", booking: updated });
  } catch (err) {
    console.error("Update booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/confirm/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "Confirmed", statusUpdatedAt: new Date(), action: "Confirmed" },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Booking not found" });
    const io = getIO?.();
    if (io) {
      io.emit("bookingUpdated", updated);
      io.emit("bookingStatusUpdated", {
        bookingId: String(updated._id),
        phone: updated.phone,
        name: updated.name,
        organization: updated.organization,
        status: updated.status,
        message: buildClientStatusMessage(updated),
        updatedAt: updated.statusUpdatedAt || updated.updatedAt,
      });
    }
    res.json({ msg: "Confirmed", booking: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/reject/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected", statusUpdatedAt: new Date(), action: "Rejected" },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Booking not found" });
    const io = getIO?.();
    if (io) {
      io.emit("bookingUpdated", updated);
      io.emit("bookingStatusUpdated", {
        bookingId: String(updated._id),
        phone: updated.phone,
        name: updated.name,
        organization: updated.organization,
        status: updated.status,
        message: buildClientStatusMessage(updated),
        updatedAt: updated.statusUpdatedAt || updated.updatedAt,
      });
    }
    res.json({ msg: "Rejected", booking: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
