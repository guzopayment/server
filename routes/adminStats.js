import express from "express";
import Participant from "../models/Participant.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const totalParticipants = await Participant.countDocuments();

    const orgAgg = await Participant.aggregate([
      {
        $group: {
          _id: "$organization",
          count: { $sum: 1 },
        },
      },
    ]);

    const organizations = {};
    orgAgg.forEach((o) => {
      organizations[o._id || "Unknown"] = o.count;
    });

    res.json({
      totalParticipants,
      organizations,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

export default router;
