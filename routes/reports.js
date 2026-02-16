import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

router.get("/confirmed", async (_, res) => {
  const data = await Booking.find({ status: "Confirmed" });
  res.json(data);
});

export default router;
