import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

router.get("/uploads-exist/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const p = path.join(process.cwd(), "uploads", filename);
    await fs.access(p);
    return res.json({ exists: true, path: p });
  } catch {
    return res.json({ exists: false });
  }
});

export default router;
