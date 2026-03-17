import express from "express";
import History from "../models/History.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const rows = await History.find().sort({ createdAt: -1 });
    return res.json(rows);
  } catch (error) {
    console.error("HISTORY FETCH ERROR:", error);
    return res.status(500).json({
      message: err.message || "Server error",
    });
  }
});

export default router;
