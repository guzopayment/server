import express from "express";
import Booking from "../models/Booking.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function escapeRegex(value) {
  return clean(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function participantView(row) {
  return {
    id: String(row._id),
    name: row.name || "",
    organization: row.organization || "",
    sex: row.sex || "",
    checkedInAt: row.attendance?.checkedInAt || null,
  };
}

/**
 * PUBLIC projector feed.
 * No phone numbers and no admin token are returned here.
 * This endpoint is intentionally read-only.
 */
router.get("/live", async (_req, res) => {
  try {
    const [totalRegistered, totalPresent, presentRows, absentRows] =
      await Promise.all([
        Booking.countDocuments({}),
        Booking.countDocuments({ "attendance.checkedIn": true }),
        Booking.find({ "attendance.checkedIn": true })
          .select("_id name organization sex attendance.checkedInAt")
          .sort({ "attendance.checkedInAt": 1, name: 1 })
          .lean(),
        Booking.find({ "attendance.checkedIn": { $ne: true } })
          .select("_id name organization sex")
          .sort({ organization: 1, name: 1 })
          .lean(),
      ]);

    const totalAbsent = Math.max(totalRegistered - totalPresent, 0);
    const presentPercent = totalRegistered ? Number(((totalPresent / totalRegistered) * 100).toFixed(1)) : 0;
    const absentPercent = totalRegistered ? Number(((totalAbsent / totalRegistered) * 100).toFixed(1)) : 0;

    const [organizationStats, sexStats] = await Promise.all([
      Booking.aggregate([
        { $group: { _id: { $ifNull: ["$organization", ""] }, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$attendance.checkedIn", true] }, 1, 0] } } } },
        { $sort: { present: -1, total: -1, _id: 1 } }, { $limit: 20 },
      ]),
      Booking.aggregate([
        { $group: { _id: { $ifNull: ["$sex", ""] }, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$attendance.checkedIn", true] }, 1, 0] } } } },
        { $sort: { present: -1, total: -1, _id: 1 } },
      ]),
    ]);
    const breakdown = (row, fallback) => {
      const total = Number(row.total || 0), present = Number(row.present || 0);
      return { label: String(row._id || fallback), total, present, absent: Math.max(total-present,0), presentPercent: total ? Number(((present/total)*100).toFixed(1)) : 0 };
    };

    return res.json({
      generatedAt: new Date(), totalRegistered, totalPresent, totalAbsent, presentPercent, absentPercent,
      present: presentRows.map(participantView), absent: absentRows.map(participantView),
      organizationStats: organizationStats.map(r => breakdown(r, "ሌላ ድርጅት / Other")),
      sexStats: sexStats.map(r => breakdown(r, "ያልተገለጸ / Unspecified")),
    });
  } catch (error) {
    console.error("GET /api/attendance/live error:", error);
    return res.status(500).json({ message: "Failed to load live attendance." });
  }
});

/**
 * PRIVATE operator feed.
 * Search/filter can be done server-side when the operator wants to identify
 * a participant quickly. Phone is included only for the authenticated admin.
 */
router.get("/operator", adminAuth, async (req, res) => {
  try {
    const q = clean(req.query.q);
    const status = clean(req.query.status || "all").toLowerCase();
    const organization = clean(req.query.organization);

    const query = {};

    if (q) {
      const safe = escapeRegex(q);
      query.$or = [
        { name: { $regex: safe, $options: "i" } },
        { organization: { $regex: safe, $options: "i" } },
        { phone: { $regex: safe, $options: "i" } },
      ];
    }

    if (organization) {
      query.organization = { $regex: `^${escapeRegex(organization)}$`, $options: "i" };
    }

    if (status === "present") query["attendance.checkedIn"] = true;
    if (status === "absent") query["attendance.checkedIn"] = { $ne: true };

    const rows = await Booking.find(query)
      .select("_id name organization phone sex attendance")
      .sort({ organization: 1, name: 1 })
      .lean();

    return res.json({
      total: rows.length,
      participants: rows.map((row) => ({
        ...participantView(row),
        phone: row.phone || "",
        status: row.attendance?.checkedIn ? "Present" : "Absent",
      })),
    });
  } catch (error) {
    console.error("GET /api/attendance/operator error:", error);
    return res.status(500).json({ message: "Failed to search attendance." });
  }
});

export default router;
