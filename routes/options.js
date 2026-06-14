// optionsRoutes
import express from "express";
import AppOption from "../models/AppOption.js";
import authMiddleware from "../middleware/authMiddleware.js";
import logHistory from "../utils/logHistory.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const rows = await AppOption.find().sort({ type: 1, value: 1 });
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const type = String(req.body.type || "").trim();
    const value = String(req.body.value || "").trim();

    if (!type || !value) {
      return res.status(400).json({ message: "Type and value are required" });
    }

    const created = await AppOption.create({ type, value });

    await logHistory("Master Data Added", `Added ${type}: ${value}`, {
      actor: "admin",
      entityType: "master-data",
      entityId: String(created._id),
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "This item already exists" });
    }
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const value = String(req.body.value || "").trim();

    if (!value) {
      return res.status(400).json({ message: "Value is required" });
    }

    const updated = await AppOption.findByIdAndUpdate(
      req.params.id,
      { value },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Option not found" });
    }

    await logHistory(
      "Master Data Updated",
      `Updated ${updated.type}: ${updated.value}`,
      {
        actor: "admin",
        entityType: "master-data",
        entityId: String(updated._id),
      },
    );

    return res.json(updated);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "This item already exists" });
    }
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await AppOption.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Option not found" });
    }

    await logHistory(
      "Master Data Deleted",
      `Deleted ${deleted.type}: ${deleted.value}`,
      {
        actor: "admin",
        entityType: "master-data",
        entityId: String(deleted._id),
      },
    );

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
