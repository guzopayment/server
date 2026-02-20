import express from "express";
import Booking from "../models/Booking.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * DELETE /api/admin/bookings/:id
 * Delete a single booking by id (admin only)
 */
router.delete("/bookings/:id", auth, async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Deleted", id: req.params.id });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /api/admin/bookings/cleanup
 * Deletes: Rejected OR missing proof OR invalid proof
 */
router.delete("/bookings/cleanup", auth, async (req, res) => {
  try {
    const result = await Booking.deleteMany({
      $or: [
        { status: "Rejected" },
        { paymentProof: { $exists: false } },
        { paymentProof: "" },
        { paymentProof: null },
        // if you still have old local filenames like "123-paymentProof.jpg" and you want to delete them:
        { paymentProof: { $not: /^https?:\/\//i } },
      ],
    });

    res.json({ message: "Cleanup done", deletedCount: result.deletedCount });
  } catch (err) {
    console.error("Cleanup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
