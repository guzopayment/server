import express from "express";
import archiver from "archiver";
import Booking from "../models/Booking.js";
import adminAuth from "../middleware/adminAuth.js";
import { ensureQrToken, makeQrToken, qrPngFor, safeFileName } from "../utils/qrService.js";

const router = express.Router();

function publicQrStats(rows) {
  const total = rows.length;
  const generated = rows.filter((r) => r.qrToken).length;
  return { total, generated, notGenerated: total - generated };
}

async function ensureAllTokens(bookings) {
  const operations = [];
  for (const booking of bookings) {
    if (!booking.qrToken) {
      const token = makeQrToken();
      booking.qrToken = token;
      operations.push({
        updateOne: {
          filter: { _id: booking._id, $or: [{ qrToken: { $exists: false } }, { qrToken: null }, { qrToken: "" }] },
          update: { $set: { qrToken: token } },
        },
      });
    }
  }
  if (operations.length) await Booking.bulkWrite(operations, { ordered: false });
}


router.get("/status", adminAuth, async (_req, res) => {
  try {
    const rows = await Booking.find({}, { qrToken: 1 }).lean();
    res.json(publicQrStats(rows));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load QR status" });
  }
});

router.post("/generate-all", adminAuth, async (_req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: 1 });
    await ensureAllTokens(bookings);
    const rows = await Booking.find({}, { qrToken: 1 }).lean();
    res.json({ message: `QR codes are ready for ${rows.length} participants.`, ...publicQrStats(rows) });
  } catch (err) {
    console.error("QR GENERATE ALL ERROR", err);
    res.status(500).json({ message: err.message || "Failed to generate QR codes" });
  }
});

router.get("/download-all", adminAuth, async (_req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: 1 });
    await ensureAllTokens(bookings);

    res.status(200);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="gubae-participant-qr-codes.zip"');

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => {
      console.error("QR ZIP ERROR", err);
      if (!res.headersSent) res.status(500).json({ message: err.message });
      else res.end();
    });
    archive.pipe(res);

    for (let i = 0; i < bookings.length; i += 1) {
      const booking = bookings[i];
      const png = await qrPngFor(booking);
      const number = String(i + 1).padStart(4, "0");
      archive.append(png, {
        name: `${number}_${safeFileName(booking.name)}_${booking._id}.png`,
      });
    }

    await archive.finalize();
  } catch (err) {
    console.error("DOWNLOAD QR ZIP ERROR", err);
    if (!res.headersSent) res.status(500).json({ message: err.message || "Failed to download QR codes" });
  }
});

router.get("/:id", adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Participant not found" });
    await ensureQrToken(booking);
    const png = await qrPngFor(booking);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName(booking.name)}-qr.png"`);
    res.send(png);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to generate QR" });
  }
});

export default router;
