import express from "express";
import History from "../models/History.js";

const router = express.Router();

router.get("/", async (_, res) => {
  res.json(await History.find().sort({ createdAt: -1 }));
});

export default router;
