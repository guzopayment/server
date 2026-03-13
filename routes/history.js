// import express from "express";
// import History from "../models/History.js";

// const router = express.Router();

// router.get("/", async (_, res) => {
//   res.json(await History.find().sort({ createdAt: -1 }));
// });

// export default router;
import express from "express";
import History from "../models/History.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const history = await History.find().sort({ createdAt: -1 }).limit(500);
    res.json(history);
  } catch (err) {
    console.error("HISTORY FETCH ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
