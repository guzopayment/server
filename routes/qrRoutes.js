import express from "express";
import archiver from "archiver";
import Booking from "../models/Booking.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  ensureQrToken,
  makeQrToken,
  qrPngFor,
  safeFileName,
} from "../utils/qrService.js";

const router = express.Router();

function publicQrStats(rows) {
  const total = rows.length;
  const generated = rows.filter((r) => r.qrToken).length;
  return { total, generated, notGenerated: total - generated };
}

async function ensureAllTokens(bookings) {
  const operations = [];
  for (const booking of bookings) {
    const expected = makeQrToken(booking._id);
    if (booking.qrToken !== expected) {
      operations.push({
        updateOne: {
          filter: { _id: booking._id },
          update: { $set: { qrToken: expected } },
        },
      });
    }
  }
  if (operations.length)
    await Booking.bulkWrite(operations, { ordered: false });
}

router.get("/status", adminAuth, async (_req, res) => {
  try {
    const rows = await Booking.find({}, { qrToken: 1 }).lean();
    res.json(publicQrStats(rows));
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Failed to load QR status" });
  }
});

router.post("/generate-all", adminAuth, async (req, res) => {
  try {
    const organization = String(req.body?.organization || "").trim();
    const filter = organization ? { organization } : {};
    const bookings = await Booking.find(filter).sort({ createdAt: 1 });
    await ensureAllTokens(bookings);
    const rows = await Booking.find(filter, { qrToken: 1 }).lean();
    res.json({
      message: organization
        ? `QR codes are ready for ${rows.length} participants in ${organization}.`
        : `QR codes are ready for ${rows.length} participants.`,
      ...publicQrStats(rows),
      organization: organization || null,
    });
  } catch (err) {
    console.error("QR GENERATE ALL ERROR", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to generate QR codes" });
  }
});

router.post("/generate-missing", adminAuth, async (req, res) => {
  try {
    const organization = String(req.body?.organization || "").trim();
    const filter = {
      ...(organization ? { organization } : {}),
      $or: [
        { qrToken: { $exists: false } },
        { qrToken: null },
        { qrToken: "" },
      ],
    };

    const missing = await Booking.find(filter).sort({ createdAt: 1 });
    const operations = missing.map((booking) => ({
      updateOne: {
        filter: { _id: booking._id },
        update: { $set: { qrToken: makeQrToken(booking._id) } },
      },
    }));

    if (operations.length)
      await Booking.bulkWrite(operations, { ordered: false });

    const rows = await Booking.find(organization ? { organization } : {}, {
      qrToken: 1,
    }).lean();
    res.json({
      message: organization
        ? `${missing.length} missing QR codes generated for ${organization}.`
        : `${missing.length} missing QR codes generated.`,
      generatedMissing: missing.length,
      ...publicQrStats(rows),
      organization: organization || null,
    });
  } catch (err) {
    console.error("QR GENERATE MISSING ERROR", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to generate missing QR codes" });
  }
});

router.get("/download-all", adminAuth, async (_req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: 1 });
    await ensureAllTokens(bookings);

    res.status(200);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="gubae-participant-qr-codes.zip"',
    );

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => {
      console.error("QR ZIP ERROR", err);
      if (!res.headersSent) res.status(500).json({ message: err.message });
      else res.end();
    });
    archive.pipe(res);

    const usedNames = new Map();
    for (const booking of bookings) {
      const png = await qrPngFor(booking);
      const base = safeFileName(booking.name);
      const count = (usedNames.get(base) || 0) + 1;
      usedNames.set(base, count);
      const fileName = count === 1 ? `${base}.png` : `${base} (${count}).png`;
      archive.append(png, { name: fileName });
    }

    await archive.finalize();
  } catch (err) {
    console.error("DOWNLOAD QR ZIP ERROR", err);
    if (!res.headersSent)
      res
        .status(500)
        .json({ message: err.message || "Failed to download QR codes" });
  }
});

router.get("/download-organization", adminAuth, async (req, res) => {
  try {
    const organization = String(req.query.organization || "").trim();
    if (!organization)
      return res
        .status(400)
        .json({ message: "Organization is required | ድርጅት መምረጥ ግዴታ ነው። " });

    const bookings = await Booking.find({ organization }).sort({
      createdAt: 1,
    });
    await ensureAllTokens(bookings);

    res.status(200);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName(organization)}-qr-codes.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => {
      console.error("QR ORGANIZATION ZIP ERROR", err);
      if (!res.headersSent) res.status(500).json({ message: err.message });
      else res.end();
    });
    archive.pipe(res);

    const usedNames = new Map();
    for (const booking of bookings) {
      const png = await qrPngFor(booking);
      const base = safeFileName(booking.name);
      const count = (usedNames.get(base) || 0) + 1;
      usedNames.set(base, count);
      const fileName = count === 1 ? `${base}.png` : `${base} (${count}).png`;
      archive.append(png, { name: fileName });
    }

    await archive.finalize();
  } catch (err) {
    console.error("DOWNLOAD ORGANIZATION QR ZIP ERROR", err);
    if (!res.headersSent)
      res.status(500).json({
        message:
          err.message ||
          "Failed to download organization QR codes | የድርጅት QR ኮድ ማውረድ አልተቻለም ። ",
      });
  }
});

router.get("/:id", adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Participant not found" });
    await ensureQrToken(booking);
    const png = await qrPngFor(booking);
    // Keep the HTTP response header ASCII-safe. The React client already
    // chooses the participant-specific Unicode filename when downloading/sharing.
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  } catch (err) {
    console.error("GET /api/qr/:id ERROR:", {
      id: req.params.id,
      message: err.message,
      stack: err.stack,
    });

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          err.message ||
          "Failed to generate QR | QR ኮድ መፍጠር አልተቻለም",
      });
    }

    return res.end();
  }
});

export default router;
