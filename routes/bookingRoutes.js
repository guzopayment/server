import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import Booking from "../models/Booking.js";
import adminAuth from "../middleware/adminAuth.js";
import { getIO } from "../utils/socket.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const useLocalUpload =
  process.env.LOCAL_FILE_UPLOAD === "true" ||
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET;

function safeFileName(name = "proof.jpg") {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function storePaymentProof(file) {
  if (!file) throw new Error("Verification image file is required");

  if (useLocalUpload) {
    const uploadDir = path.join(process.cwd(), "uploads", "payment-proofs");
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${safeFileName(file.originalname || "proof.jpg")}`;
    await fs.writeFile(path.join(uploadDir, fileName), file.buffer);

    const baseUrl =
      process.env.SERVER_BASE_URL ||
      `http://localhost:${process.env.PORT || 10000}`;

    return {
      secure_url: `${baseUrl}/uploads/payment-proofs/${fileName}`,
      public_id: null,
      storageType: "local",
    };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "guzo-payment/payment-proofs",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          storageType: "cloudinary",
        });
      },
    );

    stream.end(file.buffer);
  });
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildClientStatusMessage(booking) {
  if (booking.status === "Confirmed") {
    return `${booking.name || "የማረጋገጫ ምስልዎ"}, ያስገቡት የጉዞ ማረጋገጫ ምስል በአስተዳድሩ ተረጋግጦ ጸድቋል። | Your booking verification image has been approved by the admin team.`;
  }
  if (booking.status === "Rejected") {
    return `${booking.name || "የማረጋገጫ ምስልዎ"}, ያስገቡት የጉዞ ማረጋገጫ ምስል ውድቅ ሆኗል። እባክዎ ትክክለኛውን ምስል እንደገና ያስገቡ። | Your booking verification image was rejected. Please resubmit the correct image.`;
  }
  return `${booking.name || "የማረጋገጫ ምስልዎ"}, ያስገቡት የጉዞ ማረጋገጫ ምስል አሁንም የአስተዳድሩን ምርመራ እየጠበቀ ነው። | Your booking verification image is still waiting for admin review.`;
}

const publicProjection = {
  name: 1,
  organization: 1,
  phone: 1,
  subCity: 1,
  participants: 1,
  participantDetails: 1,
  status: 1,
  updatedAt: 1,
  createdAt: 1,
};
router.post("/", upload.single("paymentProof"), async (req, res) => {
  try {
    const {
      name,
      organization,
      phone,
      sex,
      subCity,
      participants,
      participantDetails,
      additionalParticipants,
    } = req.body;

    if (!name || !organization || !phone || !participants) {
      return res
        .status(400)
        .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "የማረጋገጫ ምስል ያስፈልጋል | Verification image is required" });
    }

    const parsedParticipants = Number(participants || 0);
    if (!Number.isFinite(parsedParticipants) || parsedParticipants <= 0) {
      return res.status(400).json({
        message:
          " የተሳታፊ ቁጥር አንድ እና ከአንድ በላይ መሆን አለበት | Participants must be greater than 0",
      });
    }

    const participantPayload =
      participantDetails || additionalParticipants || "[]";
    let parsedParticipantDetails = [];
    try {
      parsedParticipantDetails =
        typeof participantPayload === "string"
          ? JSON.parse(participantPayload)
          : participantPayload;
    } catch {
      parsedParticipantDetails = [];
    }

    const cleanedParticipantDetails = Array.isArray(parsedParticipantDetails)
      ? parsedParticipantDetails.map((participant) => ({
          name: normalizeText(participant?.name),
          phone: normalizeText(participant?.phone),
          organization:
            normalizeText(participant?.organization) ||
            normalizeText(organization),
          sex: normalizeText(participant?.sex),
          subCity:
            normalizeText(participant?.subCity) || normalizeText(subCity),
        }))
      : [];

    const uploadResult = await storePaymentProof(req.file);

    const booking = await Booking.create({
      name: normalizeText(name),
      organization: normalizeText(organization),
      phone: normalizeText(phone),
      sex: normalizeText(sex),
      subCity: normalizeText(subCity),
      participants: parsedParticipants,
      participantDetails: cleanedParticipantDetails,
      paymentProof: uploadResult.secure_url,
      paymentProofPublicId: uploadResult.public_id,
      paymentProofStorageType: uploadResult.storageType,
      status: "Pending",
      action: "Submitted",
      statusUpdatedAt: new Date(),
    });

    const io = getIO?.();
    if (io) {
      io.emit("newBooking", booking);
      io.emit("booking:created", {
        bookingId: booking._id,
        name: booking.name,
        organization: booking.organization,
        participants: booking.participants,
        status: booking.status,
      });
    }

    return res.status(201).json({
      message: "Booking verification submitted successfully",
      booking,
    });
  } catch (error) {
    console.error("BOOKING VERIFICATION CREATE ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to submit booking verification",
    });
  }
});

router.post("/statuses", async (req, res) => {
  try {
    const bookingIds = Array.isArray(req.body?.bookingIds)
      ? req.body.bookingIds.filter(Boolean)
      : [];

    if (bookingIds.length === 0) return res.json({ bookings: [] });

    const rows = await Booking.find({ _id: { $in: bookingIds } })
      .select("_id name status action statusUpdatedAt updatedAt createdAt")
      .lean();

    return res.json({
      bookings: rows.map((booking) => ({
        bookingId: String(booking._id),
        name: booking.name || "",
        status: booking.status || "Pending",
        action: booking.action || "",
        updatedAt:
          booking.statusUpdatedAt || booking.updatedAt || booking.createdAt,
        message: buildClientStatusMessage(booking),
      })),
    });
  } catch (err) {
    console.error("POST /bookings/statuses error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

router.get("/", adminAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "50", 10), 1);
    const skip = (page - 1) * limit;
    const q = normalizeText(req.query.q || "");
    const status = normalizeText(req.query.status || "All");

    const query = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { organization: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { sex: { $regex: q, $options: "i" } },
        { subCity: { $regex: q, $options: "i" } },
        { "participantDetails.name": { $regex: q, $options: "i" } },
        { "participantDetails.phone": { $regex: q, $options: "i" } },
        { "participantDetails.organization": { $regex: q, $options: "i" } },
        { "participantDetails.sex": { $regex: q, $options: "i" } },
        { "participantDetails.subCity": { $regex: q, $options: "i" } },
      ];
    }

    if (status && status !== "All") query.status = status;

    const [total, bookings, summary] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Booking.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalParticipants: { $sum: "$participants" },
            pendingCount: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            confirmedCount: {
              $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] },
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const summaryRow = summary[0] || {
      totalParticipants: 0,
      pendingCount: 0,
      confirmedCount: 0,
      rejectedCount: 0,
    };

    res.json({
      bookings,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      totalParticipants: summaryRow.totalParticipants,
      pendingCount: summaryRow.pendingCount,
      confirmedCount: summaryRow.confirmedCount,
      rejectedCount: summaryRow.rejectedCount,
    });
  } catch (err) {
    console.error("GET /bookings error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/public/recent", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "12", 10), 1),
      40,
    );
    const rows = await Booking.find({}, publicProjection)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
    res.json(
      rows.map((row) => ({
        ...row,
        message: buildClientStatusMessage(row),
      })),
    );
  } catch (err) {
    console.error("GET /bookings/public/recent error:", err);
    res
      .status(500)
      .json({ message: err.message || "የሲስተም ችግር። | Server error" });
  }
});

router.get("/public/status", async (req, res) => {
  try {
    const name = normalizeText(req.query.name || "");
    const phone = normalizeText(req.query.phone || "")
      .replace(/\D/g, "")
      .slice(0, 10);
    const organization = normalizeText(req.query.organization || "");

    const query = {};
    if (name) query.name = new RegExp(`^${name}$`, "i");
    if (phone) query.phone = phone;
    if (organization) query.organization = organization;

    if (!Object.keys(query).length) {
      return res.status(400).json({
        message:
          "እባክዎ ቢያንስ አንዱን ቦታ ይሙሉ።| Please enter at least one field to check status.",
      });
    }

    const rows = await Booking.find(query, publicProjection)
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    if (!rows.length) {
      let missing =
        "ይህ የቤተሰብ ጉዞ መረጃ አልተመዘገበም። | This booking information is not registered.";
      if (phone)
        missing = "ይህ ስልክ ቁጥር አልተመዘገበም። | This phone number is not registered.";
      else if (name) missing = "ይህ ስም አልተመዘገበም። | This name is not registered.";
      // else if (organization)
      //   missing = "ይህን ድርጅት አልተመዘገበም። | This organization is not registered.";
      return res.status(404).json({ message: missing });
    }

    res.json(
      rows.map((row) => ({ ...row, message: buildClientStatusMessage(row) })),
    );
  } catch (err) {
    console.error("GET /bookings/public/status error:", err);
    res
      .status(500)
      .json({ message: err.message || "የሲስተም ችግር | Server error" });
  }
});

export default router;
