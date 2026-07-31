import express from "express";
import Participant from "../models/Participant.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// PUBLIC: submit participant info
router.post("/participants", async (req, res) => {
  try {
    const { name, organization, phone, sex } = req.body;
    if (!name || !organization || !phone || !sex) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const participant = await Participant.create({
      name: String(name).trim(),
      organization: String(organization).trim(),
      phone: String(phone).trim(),
      sex: String(sex).trim(),
    });
    res.status(201).json(participant);
  } catch (err) {
    console.error("Create participant error:", err);
    res.status(500).json({ message: "Server error" });
  }
  const existing = await Participant.findOne({
    name,
    organization,
    phone,
    sex,
  });
  if (existing) {
    return res.status(409).json({
      message: "⚠️ ይህ ስም ከዚህ በፊት ተመዝግቧል! ⚠️",
    });
  }
});

// ADMIN: stats — total, men, women, total organizations
router.get("/admin/participants/stats", authMiddleware, async (_req, res) => {
  try {
    const all = await Participant.find().select("sex organization");
    const total = all.length;
    let men = 0;
    let women = 0;
    const orgSet = new Set();

    all.forEach((p) => {
      const sex = (p.sex || "").trim();
      if (sex === "ወንድ" || sex.toLowerCase() === "male") men += 1;
      else if (sex === "ሴት" || sex.toLowerCase() === "female") women += 1;
      if (p.organization) orgSet.add(p.organization.trim());
    });

    res.json({
      totalParticipants: total,
      men,
      women,
      totalOrganizations: orgSet.size,
    });
  } catch (err) {
    console.error("Participant stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: paginated list with search + organization filter + optional grouping
router.get("/admin/participants", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    const q = (req.query.q || "").trim();
    const organization = (req.query.organization || "All").trim();

    const filter = {};
    if (organization && organization !== "All") {
      filter.organization = organization;
    }
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ name: regex }, { phone: regex }, { organization: regex }];
    }

    const total = await Participant.countDocuments(filter);
    const items = await Participant.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error("Participant list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: full list (no pagination) — used for Excel/PDF export and org grouping
router.get("/admin/participants/all", authMiddleware, async (_req, res) => {
  try {
    const items = await Participant.find().sort({
      organization: 1,
      createdAt: -1,
    });
    res.json({ items });
  } catch (err) {
    console.error("Participant export fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: distinct organization list (for filter dropdown)
router.get(
  "/admin/participants/organizations",
  authMiddleware,
  async (_req, res) => {
    try {
      const orgs = await Participant.distinct("organization");
      res.json({
        organizations: orgs.filter(Boolean).sort((a, b) => a.localeCompare(b)),
      });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
