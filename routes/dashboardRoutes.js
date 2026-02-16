// routes/dashboardRoutes.js
const router = require("express").Router();
const Booking = require("../models/Booking");
const User = require("../models/User");

router.get("/stats", async (req, res) => {
  const bookings = await Booking.countDocuments();
  const users = await User.countDocuments();

  res.json({
    totalBookings: bookings,
    totalUsers: users,
  });
});

module.exports = router;
