import express from "express";
import Submission from "../models/Submission.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/submit", upload.single("paymentProof"), async (req, res) => {
  try {
    const submission = new Submission({
      ...req.body,
      paymentProof: req.file?.filename,
    });

    await submission.save();

    res.json({ message: "Submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
