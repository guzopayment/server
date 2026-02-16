import express from "express";
import Booking from "../models/Booking.js";
import History from "../models/History.js";
import { getIO } from "../utils/socket.js";

const router = express.Router();

router.get("/stats", async (_, res) => {
  const totalParticipants = await Booking.aggregate([
    { $match: { status: "Confirmed" } },
    { $group: { _id: null, total: { $sum: "$participants" } } },
  ]);

  res.json({
    totalParticipants: totalParticipants[0]?.total || 0,
    pendingPayments: await Booking.countDocuments({ status: "Pending" }),
  });
});

router.put("/confirm/:id", async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, { status: "Confirmed" });

  await History.create({
    title: "Payment Confirmed",
    message: "Participant payment confirmed",
  });

  getIO().emit("Payment confirmed", req.params.id);

  res.json({ msg: "Confirmed" });
});

router.put("/reject/:id", async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, { status: "Rejected" });

  await History.create({
    title: "Payment Rejected",
    message: "Participant rejected",
  });

  getIO().emit("paymentRejected", req.params.id);

  res.json({ msg: "Rejected" });
});

export default router;
