// routes/notificationRoutes.js
const router = require("express").Router();
const Notification = require("../models/Notification");

router.get("/unread-count", async (req, res) => {
  const count = await Notification.countDocuments({
    read: false,
  });
  res.json({ count });
});

router.put("/:id/read", async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    read: true,
  });
  res.json({ message: "Updated" });
});

module.exports = router;
