import express from "express";
import Booking from "../models/Booking.js";
import adminAuth from "../middleware/adminAuth.js";
import { getIO } from "../utils/socket.js";
import { makeQrToken, qrDataUrlForToken } from "../utils/qrService.js";

const router = express.Router();

/**
 * ADMIN: scan a participant QR token and mark the participant present.
 * The scanner sends only the QR token; participant details stay in MongoDB.
 */
router.post("/attendance/scan", adminAuth, async (req, res) => {
  try {
    const qrData = normalizeText(req.body?.qrData || "");
    if (!qrData) {
      return res
        .status(400)
        .json({ message: "QR code data is required | የኪውአር ኮድ መረጃ ያስፈልጋል " });
    }

    const booking = await Booking.findOne({ qrToken: qrData });
    if (!booking) {
      return res.status(404).json({
        message:
          "Participant not registered or QR code is invalid | ተሳታፊው  አልተመዘገበም ወይም ኪውአር ኮድ የተሳሳተው ነው",
      });
    }

    if (booking.attendance?.checkedIn) {
      return res.json({
        alreadyCheckedIn: true,
        message:
          "This participant is already marked present.| ይህ ተሳታፊ አስቀድመው እንደተገኘ ምልክት ተደርጓል ተመዝግቧል",
        participant: {
          id: booking._id,
          name: booking.name,
          organization: booking.organization,
          sex: booking.sex,
          checkedInAt: booking.attendance.checkedInAt,
        },
      });
    }

    booking.attendance.checkedIn = true;
    booking.attendance.checkedInAt = new Date();
    await booking.save();

    const io = getIO?.();
    if (io) {
      io.emit("attendance:checked-in", {
        bookingId: booking._id,
        name: booking.name,
        organization: booking.organization,
        sex: booking.sex,
        checkedInAt: booking.attendance.checkedInAt,
      });
    }

    return res.json({
      alreadyCheckedIn: false,
      message:
        "Participant marked present successfully. | ተሳታፊው እንደተገኘ በትክክል ምልክት ተደርጓል ተመዝግቧል",
      participant: {
        id: booking._id,
        name: booking.name,
        organization: booking.organization,
        sex: booking.sex,
        checkedInAt: booking.attendance.checkedInAt,
      },
    });
  } catch (err) {
    console.error("POST /bookings/attendance/scan error:", err);
    return res.status(500).json({
      message:
        err.message ||
        "Failed to record attendance | ይህም መረጃ ስላልተመዘገበ ተሳታፊው እንደተገኘ ማስመዝገብ አልተቻለም",
    });
  }
});

/**
 * ADMIN: live attendance summary.
 */
router.get("/attendance/summary", adminAuth, async (_req, res) => {
  try {
    const rows = await Booking.find(
      {},
      {
        organization: 1,
        sex: 1,
        "attendance.checkedIn": 1,
      },
    ).lean();

    const total = rows.length;
    const totalPresent = rows.filter(
      (r) => r.attendance?.checkedIn === true,
    ).length;
    const totalAbsent = total - totalPresent;

    const normalizeSex = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();
    const isMale = (value) =>
      ["male", "m", "ወንድ", "ወንድ ልጅ"].includes(normalizeSex(value));
    const isFemale = (value) =>
      ["female", "f", "የሴት", "ሴት"].includes(normalizeSex(value));

    const men = rows.filter(
      (r) => isMale(r.sex) && r.attendance?.checkedIn === true,
    ).length;
    const women = rows.filter(
      (r) => isFemale(r.sex) && r.attendance?.checkedIn === true,
    ).length;

    const orgMap = new Map();
    for (const row of rows) {
      const org = String(row.organization || "Unknown").trim() || "Unknown";
      if (!orgMap.has(org)) {
        orgMap.set(org, { organization: org, total: 0, men: 0, women: 0 });
      }
      const item = orgMap.get(org);
      if (row.attendance?.checkedIn === true) {
        item.total += 1;
        if (isMale(row.sex)) item.men += 1;
        if (isFemale(row.sex)) item.women += 1;
      }
    }

    const byOrganization = [...orgMap.values()].sort(
      (a, b) =>
        b.total - a.total || a.organization.localeCompare(b.organization),
    );

    return res.json({
      total,
      totalPresent,
      totalAbsent,
      men,
      women,
      byOrganization,
    });
  } catch (err) {
    console.error("GET /bookings/attendance/summary error:", err);
    return res.status(500).json({
      message:
        err.message ||
        "Failed to load attendance summary | የተገኘ ምንባብ ማጠቃለያ ማስመዝገብ አልቻለም",
    });
  }
});

/**
 * ADMIN: complete attendance list for export.
 * Returns every registered participant with Present/Absent status.
 */
router.get("/attendance/list", adminAuth, async (_req, res) => {
  try {
    const rows = await Booking.find(
      {},
      {
        name: 1,
        organization: 1,
        phone: 1,
        sex: 1,
        "attendance.checkedIn": 1,
        "attendance.checkedInAt": 1,
      },
    )
      .sort({ name: 1 })
      .lean();

    const attendance = rows.map((row, index) => ({
      number: index + 1,
      name: row.name || "",
      organization: row.organization || "",
      phone: row.phone || "",
      sex: row.sex || "",
      status: row.attendance?.checkedIn === true ? "Present" : "Absent",
      checkedInAt: row.attendance?.checkedInAt || null,
    }));

    return res.json({
      generatedAt: new Date().toISOString(),
      total: attendance.length,
      present: attendance.filter((row) => row.status === "Present").length,
      absent: attendance.filter((row) => row.status === "Absent").length,
      participants: attendance,
    });
  } catch (err) {
    console.error("GET /bookings/attendance/list error:", err);
    return res.status(500).json({
      message: err.message || "Failed to load attendance list",
    });
  }
});

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PHONE_REGEX = /^09\d{8}$/;

/**
 * PUBLIC: create a participant booking.
 * Matches the simplified form: name, organization, phone, sex.
 * Rejects duplicate submissions (same name + organization + phone).
 */
router.post("/", async (req, res) => {
  try {
    const { name, organization, phone, sex } = req.body || {};

    const cleanName = normalizeText(name);
    const cleanOrganization = normalizeText(organization);
    const cleanPhone = normalizeText(phone);
    const cleanSex = normalizeText(sex);

    if (!cleanName || !cleanOrganization || !cleanPhone) {
      return res
        .status(400)
        .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
    }

    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        message:
          "ትክክለኛ ስልክ ቁጥር ያስፈልጋል | A valid phone number is required (09XXXXXXXX)",
      });
    }

    // Duplicate check: same person (name + organization) with the same phone.
    // Name match is case-insensitive since the same person may type casing differently.
    const existing = await Booking.findOne({
      name: new RegExp(`^${escapeRegex(cleanName)}$`, "i"),
      // organization: cleanOrganization,
      phone: cleanPhone,
    });

    if (existing) {
      return res.status(409).json({
        message:
          "⚠️ ይህ ስም ቀደም ብሎ ተመዝግቧል | This participant has already been registered.",
      });
    }

    const qrToken = makeQrToken();
    const booking = await Booking.create({
      name: cleanName,
      organization: cleanOrganization,
      phone: cleanPhone,
      sex: cleanSex,
      qrToken,
    });

    const qrDataUrl = await qrDataUrlForToken(qrToken);

    const io = getIO?.();
    if (io) {
      io.emit("newBooking", booking);
      io.emit("booking:created", {
        bookingId: booking._id,
        name: booking.name,
        organization: booking.organization,
      });
    }

    return res.status(201).json({
      message: "Booking submitted successfully",
      booking,
      qrDataUrl,
    });
  } catch (error) {
    console.error("BOOKING CREATE ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to submit booking",
    });
  }
});

/**
 * ADMIN: paginated list + summary stats + per-organization breakdown.
 * Query params: page, limit, q (search), organization (exact filter)
 */
router.get("/", adminAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "50", 10), 1);
    const skip = (page - 1) * limit;
    const q = normalizeText(req.query.q || "");
    const organization = normalizeText(req.query.organization || "");

    const query = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { organization: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { sex: { $regex: q, $options: "i" } },
      ];
    }

    if (organization) {
      query.organization = organization;
    }

    const [total, bookings, statsAgg, orgSummaryAgg] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Booking.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
            women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
            organizations: { $addToSet: "$organization" },
          },
        },
      ]),
      Booking.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$organization",
            count: { $sum: 1 },
            men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
            women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const statsRow = statsAgg[0] || {
      total: 0,
      men: 0,
      women: 0,
      organizations: [],
    };

    res.json({
      bookings,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        total: statsRow.total,
        men: statsRow.men,
        women: statsRow.women,
        organizations: statsRow.organizations.length,
      },
      orgSummary: orgSummaryAgg.map((row) => ({
        organization: row._id || "ሌላ ያልተገለጸ",
        count: row.count,
        men: row.men,
        women: row.women,
      })),
    });
  } catch (err) {
    console.error("GET /bookings error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ADMIN: full (unpaginated) list for export purposes.
 * Supports the same q / organization filters as the list endpoint.
 */
router.get("/export/all", adminAuth, async (req, res) => {
  try {
    const q = normalizeText(req.query.q || "");
    const organization = normalizeText(req.query.organization || "");

    const query = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { organization: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { sex: { $regex: q, $options: "i" } },
      ];
    }
    if (organization) query.organization = organization;

    const bookings = await Booking.find(query).sort({
      organization: 1,
      createdAt: -1,
    });
    res.json({ bookings });
  } catch (err) {
    console.error("GET /bookings/export/all error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUBLIC: recent submissions feed for the home page.
 * Only exposes non-sensitive fields (no phone number).
 */
router.get("/public/recent", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "12", 10), 1),
      40,
    );

    const rows = await Booking.find(
      {},
      { name: 1, organization: 1, sex: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(rows);
  } catch (err) {
    console.error("GET /bookings/public/recent error:", err);
    res
      .status(500)
      .json({ message: err.message || "የሲስተም ችግር። | Server error" });
  }
});

/**
 * ADMIN: update a single participant's details.
 */
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { name, organization, phone, sex } = req.body || {};

    const cleanName = normalizeText(name);
    const cleanOrganization = normalizeText(organization);
    const cleanPhone = normalizeText(phone);
    const cleanSex = normalizeText(sex);
    if (!cleanName || !cleanOrganization || !cleanPhone) {
      return res
        .status(400)
        .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
    }

    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        message:
          "ትክክለኛ ስልክ ቁጥር ያስፈልጋል | A valid phone number is required (09XXXXXXXX)",
      });
    }

    // Guard against renaming/re-numbering into a collision with another existing record.
    const duplicate = await Booking.findOne({
      _id: { $ne: req.params.id },
      name: new RegExp(`^${escapeRegex(cleanName)}$`, "i"),
      // organization: cleanOrganization,
      phone: cleanPhone,
    });

    if (duplicate) {
      return res.status(409).json({
        message:
          "⚠️ ይህ ስም ቀደም ብሎ ተመዝግቧል | Another participant already has these details.",
      });
    }

    const existingBooking = await Booking.findById(req.params.id);
    if (!existingBooking) {
      return res
        .status(404)
        .json({ message: "ተሳታፊ አልተገኘም | Participant not found" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        name: cleanName,
        organization: cleanOrganization,
        phone: cleanPhone,
        sex: cleanSex,
      },
      { new: true, runValidators: true },
    );

    if (!booking) {
      return res
        .status(404)
        .json({ message: "ተሳታፊ አልተገኘም | Participant not found" });
    }

    const io = getIO?.();
    if (io) io.emit("bookingUpdated", booking);

    res.json({ message: "Updated successfully", booking });
  } catch (err) {
    console.error("PUT /bookings/:id error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to update participant" });
  }
});

/**
 * ADMIN: delete every participant record.
 * Requires the exact confirmation phrase in the body as a server-side
 * safety net, independent of whatever confirmation the UI does.
 */
router.delete("/clear-all", adminAuth, async (req, res) => {
  try {
    const confirm = normalizeText(req.body?.confirm || "");
    if (confirm !== "DELETE ALL") {
      return res.status(400).json({
        message: 'ማረጋገጫ ያስፈልጋል | Send { "confirm": "DELETE ALL" } to proceed.',
      });
    }

    const result = await Booking.deleteMany({});

    const io = getIO?.();
    if (io) io.emit("bookingsCleared", { deletedCount: result.deletedCount });

    res.json({
      message: "All participant records deleted",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("DELETE /bookings/clear-all error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to clear participant data" });
  }
});

/**
 * ADMIN: delete a single participant.
 */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res
        .status(404)
        .json({ message: "ተሳታፊ አልተገኘም | Participant not found" });
    }

    const io = getIO?.();
    if (io) io.emit("bookingDeleted", { bookingId: req.params.id });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE /bookings/:id error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to delete participant" });
  }
});

export default router;
