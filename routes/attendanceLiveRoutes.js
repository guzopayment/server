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

/**
 * Normalize every sex value stored in Booking.
 * The database currently contains Amharic values (ወንድ / ሴት), but these
 * aliases also make the live screen safe if an admin-created guest uses
 * English values.
 */
function normalizeSex(value) {
  const sex = clean(value).toLowerCase();
  if (["ወንድ", "male", "m", "man", "men"].includes(sex)) return "male";
  if (["ሴት", "female", "f", "woman", "women"].includes(sex)) return "female";
  return "unknown";
}

function bucket() {
  return { total: 0, male: 0, female: 0, unknown: 0 };
}

function withPercentages(value = {}) {
  const total = Number(value.total || 0);
  const male = Number(value.male || 0);
  const female = Number(value.female || 0);
  const unknown = Number(value.unknown || 0);

  return {
    total,
    male,
    female,
    unknown,
    malePercent: total ? Number(((male / total) * 100).toFixed(1)) : 0,
    femalePercent: total ? Number(((female / total) * 100).toFixed(1)) : 0,
  };
}

function addToBucket(target, row) {
  const sex = normalizeSex(row?.sex);
  target.total += 1;
  target[sex] += 1;
}

function participantView(row) {
  return {
    id: String(row._id),
    name: row.name || "",
    organization: row.organization || "",
    phone: row.phone || "",
    sex: row.sex || "",
    status: row.attendance?.checkedIn === true ? "Present" : "Absent",
    checkedInAt: row.attendance?.checkedInAt || null,
  };
}

/*
 * PUBLIC PROJECTOR FEED
 *
 * All four analytics cards are calculated from the SAME Booking documents
 * that contain the attendance state. There is no frontend/mock counter here.
 *
 * 1. registered = every Booking in the database
 * 2. present    = Booking.attendance.checkedIn === true
 * 3. absent     = every registered Booking that is not present
 * 4. recent     = the organization of the most recent present participant,
 *                 with all currently-present people from that organization
 *
 * This guarantees that 9 present participants, for example, cannot produce
 * unrelated zero cards on the projector.
 */
router.get("/live", async (_req, res) => {
  try {
    const allBookings = await Booking.find({})
      .select("_id name organization phone sex attendance specialGuest createdAt")
      .lean();

    const totalRegistered = allBookings.length;

    const presentRows = allBookings
      .filter((row) => row.attendance?.checkedIn === true)
      .sort((a, b) => {
        const aTime = a.attendance?.checkedInAt
          ? new Date(a.attendance.checkedInAt).getTime()
          : 0;
        const bTime = b.attendance?.checkedInAt
          ? new Date(b.attendance.checkedInAt).getTime()
          : 0;
        return bTime - aTime;
      });

    const absentRows = allBookings
      .filter((row) => row.attendance?.checkedIn !== true)
      .sort((a, b) =>
        clean(a.organization).localeCompare(clean(b.organization), "am") ||
        clean(a.name).localeCompare(clean(b.name), "am")
      );

    const totalPresent = presentRows.length;
    const totalAbsent = Math.max(totalRegistered - totalPresent, 0);
    const presentPercent = totalRegistered
      ? Number(((totalPresent / totalRegistered) * 100).toFixed(1))
      : 0;
    const absentPercent = totalRegistered
      ? Number(((totalAbsent / totalRegistered) * 100).toFixed(1))
      : 0;

    // EXACT GLOBAL DATABASE TOTALS.
    const registered = bucket();
    const present = bucket();
    const absent = bucket();

    for (const row of allBookings) {
      addToBucket(registered, row);
      if (row.attendance?.checkedIn === true) addToBucket(present, row);
      else addToBucket(absent, row);
    }

    // The fourth card: most recently checked-in organization.
    let recent = {
      organization: "ድርጅት አልተገኘም / No organization",
      present: bucket(),
      latestParticipant: null,
    };

    if (presentRows.length > 0) {
      const latest = presentRows[0];
      const latestOrganization = clean(latest.organization);

      const organizationPresentRows = presentRows.filter(
        (row) => clean(row.organization) === latestOrganization
      );

      const recentBucket = bucket();
      for (const row of organizationPresentRows) addToBucket(recentBucket, row);

      recent = {
        organization:
          latestOrganization || "ድርጅት አልተገኘም / No organization",
        present: withPercentages(recentBucket),
        latestParticipant: participantView(latest),
      };
    } else {
      recent.present = withPercentages(recent.present);
    }

    const analytics = {
      registered: withPercentages(registered),
      present: withPercentages(present),
      absent: withPercentages(absent),
      recent,
    };

    // Keep organization-level data available for future operator/report views.
    const organizationMap = new Map();
    for (const row of allBookings) {
      const organization =
        clean(row.organization) || "ያልተገለጸ ድርጅት / Unknown organization";
      if (!organizationMap.has(organization)) {
        organizationMap.set(organization, {
          organization,
          registered: bucket(),
          present: bucket(),
          absent: bucket(),
        });
      }
      const item = organizationMap.get(organization);
      addToBucket(item.registered, row);
      if (row.attendance?.checkedIn === true) addToBucket(item.present, row);
      else addToBucket(item.absent, row);
    }

    const organizationStats = [...organizationMap.values()]
      .sort((a, b) => b.registered.total - a.registered.total)
      .map((item) => ({
        organization: item.organization,
        organizationName: item.organization,
        registered: withPercentages(item.registered),
        present: withPercentages(item.present),
        absent: withPercentages(item.absent),
      }));

    return res.json({
      generatedAt: new Date(),
      source: "Booking collection",
      totalRegistered,
      totalPresent,
      totalAbsent,
      presentPercent,
      absentPercent,
      // New canonical object used by the four projector cards.
      analytics,
      // Keep these fields for backward compatibility with other clients.
      genderTotals: {
        registered: analytics.registered,
        present: analytics.present,
        absent: analytics.absent,
      },
      recentPresentOrganization: recent,
      organizationStats,
      present: presentRows.map(participantView),
      absent: absentRows.map(participantView),
    });
  } catch (error) {
    console.error("GET /api/attendance/live error:", error);
    return res.status(500).json({
      message: "Failed to load live attendance.",
      ...(process.env.NODE_ENV !== "production"
        ? { details: error?.message || String(error) }
        : {}),
    });
  }
});

/** PRIVATE OPERATOR FEED */
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
        { sex: { $regex: safe, $options: "i" } },
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
      participants: rows.map(participantView),
    });
  } catch (error) {
    console.error("GET /api/attendance/operator error:", error);
    return res.status(500).json({ message: "Failed to search attendance." });
  }
});

export default router;
