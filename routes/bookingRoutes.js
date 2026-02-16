// routes/bookingRoutes.js
const router = require("express").Router();
const Booking = require("../models/Booking");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const bookings = await Booking.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Booking.countDocuments();

  res.json({
    data: bookings,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

module.exports = router;
