import { makeQrToken, qrDataUrlForBooking } from "../utils/qrService.js";
// // // // import express from "express";
// // // // import multer from "multer";
// // // // import fs from "fs/promises";
// // // // import path from "path";
// // // // import { v2 as cloudinary } from "cloudinary";
// // // // import Booking from "../models/Booking.js";
// // // // import adminAuth from "../middleware/adminAuth.js";
// // // // import { getIO } from "../utils/socket.js";

// // // // const router = express.Router();
// // // // // const upload = multer({ storage: multer.memoryStorage() });

// // // // // cloudinary.config({
// // // // //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
// // // // //   api_key: process.env.CLOUDINARY_API_KEY,
// // // // //   api_secret: process.env.CLOUDINARY_API_SECRET,
// // // // // });

// // // // // const useLocalUpload =
// // // // //   process.env.LOCAL_FILE_UPLOAD === "true" ||
// // // // //   !process.env.CLOUDINARY_CLOUD_NAME ||
// // // // //   !process.env.CLOUDINARY_API_KEY ||
// // // // //   !process.env.CLOUDINARY_API_SECRET;

// // // // // function safeFileName(name = "proof.jpg") {
// // // // //   return name.replace(/[^a-zA-Z0-9._-]/g, "_");
// // // // // }

// // // // // async function storePaymentProof(file) {
// // // // //   if (!file) throw new Error("Verification image file is required");

// // // // //   if (useLocalUpload) {
// // // // //     const uploadDir = path.join(process.cwd(), "uploads", "payment-proofs");
// // // // //     await fs.mkdir(uploadDir, { recursive: true });

// // // // //     const fileName = `${Date.now()}-${safeFileName(file.originalname || "proof.jpg")}`;
// // // // //     await fs.writeFile(path.join(uploadDir, fileName), file.buffer);

// // // // //     const baseUrl =
// // // // //       process.env.SERVER_BASE_URL ||
// // // // //       `http://localhost:${process.env.PORT || 10000}`;

// // // // //     return {
// // // // //       secure_url: `${baseUrl}/uploads/payment-proofs/${fileName}`,
// // // // //       public_id: null,
// // // // //       storageType: "local",
// // // // //     };
// // // // //   }

// // // // //   return new Promise((resolve, reject) => {
// // // // //     const stream = cloudinary.uploader.upload_stream(
// // // // //       {
// // // // //         folder: "guzo-payment/payment-proofs",
// // // // //         resource_type: "image",
// // // // //       },
// // // // //       (error, result) => {
// // // // //         if (error) return reject(error);
// // // // //         resolve({
// // // // //           secure_url: result.secure_url,
// // // // //           public_id: result.public_id,
// // // // //           storageType: "cloudinary",
// // // // //         });
// // // // //       },
// // // // //     );

// // // // //     stream.end(file.buffer);
// // // // //   });
// // // // // }

// // // // function normalizeText(value) {
// // // //   return String(value || "")
// // // //     .replace(/\s+/g, " ")
// // // //     .trim();
// // // // }

// // // // // function buildClientStatusMessage(booking) {
// // // // //   if (booking.status === "Confirmed") {
// // // // //     return `${booking.name || "የማረጋገጫ ምስልዎ"}, ያስገቡት የጉዞ ማረጋገጫ ምስል በአስተዳድሩ ተረጋግጦ ጸድቋል። | Your booking verification image has been approved by the admin team.`;
// // // // //   }
// // // // //   if (booking.status === "Rejected") {
// // // // //     return `${booking.name || "የማረጋገጫ ምስልዎ"}, ያስገቡት የጉዞ ማረጋገጫ ምስል ውድቅ ሆኗል። እባክዎ ትክክለኛውን ምስል እንደገና ያስገቡ። | Your booking verification image was rejected. Please resubmit the correct image.`;
// // // // //   }
// // // // //   return `${booking.name || "የማረጋገጫ ምስልዎ"}, ያስገቡት የጉዞ ማረጋገጫ ምስል አሁንም የአስተዳድሩን ምርመራ እየጠበቀ ነው። | Your booking verification image is still waiting for admin review.`;
// // // // // }

// // // // // const publicProjection = {
// // // // //   name: 1,
// // // // //   organization: 1,
// // // // //   phone: 1,
// // // // //   subCity: 1,
// // // // //   participants: 1,
// // // // //   participantDetails: 1,
// // // // //   status: 1,
// // // // //   updatedAt: 1,
// // // // //   createdAt: 1,
// // // // // };
// // // // // router.post("/", upload.single("paymentProof"), async (req, res) => {
// // // // //   try {
// // // // //     const {
// // // // //       name,
// // // // //       organization,
// // // // //       phone,
// // // // //       sex,
// // // // //       // subCity,
// // // // //       participants,
// // // // //       participantDetails,
// // // // //       // additionalParticipants,
// // // // //     } = req.body;

// // // // //     if (!name || !organization || !phone) {
// // // // //       //|| !participants
// // // // //       return res
// // // // //         .status(400)
// // // // //         .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
// // // // //     }

// // // // //     // if (!req.file) {
// // // // //     //   return res.status(400).json({
// // // // //     //     message: "የማረጋገጫ ምስል ያስፈልጋል | Verification image is required",
// // // // //     //   });
// // // // //     // }

// // // // //     // const parsedParticipants = Number(participants || 0);
// // // // //     // if (!Number.isFinite(parsedParticipants) || parsedParticipants <= 0) {
// // // // //     //   return res.status(400).json({
// // // // //     //     message:
// // // // //     //       " የተሳታፊ ቁጥር አንድ እና ከአንድ በላይ መሆን አለበት | Participants must be greater than 0",
// // // // //     //   });
// // // // //     // }

// // // // //     const participantPayload =
// // // // //       participantDetails || additionalParticipants || "[]";
// // // // //     let parsedParticipantDetails = [];
// // // // //     try {
// // // // //       parsedParticipantDetails =
// // // // //         typeof participantPayload === "string"
// // // // //           ? JSON.parse(participantPayload)
// // // // //           : participantPayload;
// // // // //     } catch {
// // // // //       parsedParticipantDetails = [];
// // // // //     }

// // // // //     const cleanedParticipantDetails = Array.isArray(parsedParticipantDetails)
// // // // //       ? parsedParticipantDetails.map((participant) => ({
// // // // //           name: normalizeText(participant?.name),
// // // // //           phone: normalizeText(participant?.phone),
// // // // //           organization:
// // // // //             normalizeText(participant?.organization) ||
// // // // //             normalizeText(organization),
// // // // //           sex: normalizeText(participant?.sex),
// // // // //           // subCity:
// // // // //           //   normalizeText(participant?.subCity) || normalizeText(subCity),
// // // // //         }))
// // // // //       : [];

// // // // //     // const uploadResult = await storePaymentProof(req.file);

// // // // //     const booking = await Booking.create({
// // // // //       name: normalizeText(name),
// // // // //       organization: normalizeText(organization),
// // // // //       phone: normalizeText(phone),
// // // // //       sex: normalizeText(sex),
// // // // //       // subCity: normalizeText(subCity),
// // // // //       // participants: parsedParticipants,
// // // // //       participantDetails: cleanedParticipantDetails,
// // // // //       // paymentProof: uploadResult.secure_url,
// // // // //       // paymentProofPublicId: uploadResult.public_id,
// // // // //       // paymentProofStorageType: uploadResult.storageType,
// // // // //       // status: "Pending",
// // // // //       // action: "Submitted",
// // // // //       // statusUpdatedAt: new Date(),
// // // // //     });

// // // // //     const io = getIO?.();
// // // // //     if (io) {
// // // // //       io.emit("newBooking", booking);
// // // // //       io.emit("booking:created", {
// // // // //         bookingId: booking._id,
// // // // //         name: booking.name,
// // // // //         organization: booking.organization,
// // // // //         participants: booking.participants,
// // // // //         // status: booking.status,
// // // // //       });
// // // // //     }

// // // // //     return res.status(201).json({
// // // // //       message: "Booking verification submitted successfully",
// // // // //       booking,
// // // // //     });
// // // // //   } catch (error) {
// // // // //     console.error("BOOKING VERIFICATION CREATE ERROR:", error);
// // // // //     return res.status(500).json({
// // // // //       message: error.message || "Failed to submit booking verification",
// // // // //     });
// // // // //   }
// // // // // });

// // // // // router.post("/statuses", async (req, res) => {
// // // // //   try {
// // // // //     const bookingIds = Array.isArray(req.body?.bookingIds)
// // // // //       ? req.body.bookingIds.filter(Boolean)
// // // // //       : [];

// // // // //     if (bookingIds.length === 0) return res.json({ bookings: [] });

// // // // //     const rows = await Booking.find({ _id: { $in: bookingIds } })
// // // // //       .select("_id name status action statusUpdatedAt updatedAt createdAt")
// // // // //       .lean();

// // // // //     return res.json({
// // // // //       bookings: rows.map((booking) => ({
// // // // //         bookingId: String(booking._id),
// // // // //         name: booking.name || "",
// // // // //         // status: booking.status || "Pending",
// // // // //         // action: booking.action || "",
// // // // //         updatedAt:
// // // // //           booking.statusUpdatedAt || booking.updatedAt || booking.createdAt,
// // // // //         message: buildClientStatusMessage(booking),
// // // // //       })),
// // // // //     });
// // // // //   } catch (err) {
// // // // //     console.error("POST /bookings/statuses error:", err);
// // // // //     return res.status(500).json({ message: err.message || "Server error" });
// // // // //   }
// // // // // });

// // // // router.get("/", adminAuth, async (req, res) => {
// // // //   try {
// // // //     const page = Math.max(parseInt(req.query.page || "1", 10), 1);
// // // //     const limit = Math.max(parseInt(req.query.limit || "50", 10), 1);
// // // //     const skip = (page - 1) * limit;
// // // //     const q = normalizeText(req.query.q || "");
// // // //     const status = normalizeText(req.query.status || "All");

// // // //     const query = {};

// // // //     if (q) {
// // // //       query.$or = [
// // // //         { name: { $regex: q, $options: "i" } },
// // // //         { organization: { $regex: q, $options: "i" } },
// // // //         { phone: { $regex: q, $options: "i" } },
// // // //         { sex: { $regex: q, $options: "i" } },
// // // //         // { subCity: { $regex: q, $options: "i" } },
// // // //         // { "participantDetails.name": { $regex: q, $options: "i" } },
// // // //         // { "participantDetails.phone": { $regex: q, $options: "i" } },
// // // //         // { "participantDetails.organization": { $regex: q, $options: "i" } },
// // // //         // { "participantDetails.sex": { $regex: q, $options: "i" } },
// // // //         // { "participantDetails.subCity": { $regex: q, $options: "i" } },
// // // //       ];
// // // //     }

// // // //     if (status && status !== "All") query.status = status;

// // // //     const [total, bookings, summary] = await Promise.all([
// // // //       Booking.countDocuments(query),
// // // //       Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
// // // //       // Booking.aggregate([
// // // //       //   { $match: query },
// // // //       //   {
// // // //       //     // $group: {
// // // //       //     //   _id: null,
// // // //       //     //   totalParticipants: { $sum: "$participants" },
// // // //       //     //   pendingCount: {
// // // //       //     //     $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
// // // //       //     //   },
// // // //       //     //   confirmedCount: {
// // // //       //     //     $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] },
// // // //       //     //   },
// // // //       //     //   rejectedCount: {
// // // //       //     //     $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
// // // //       //     //   },
// // // //       //     // },
// // // //       //   },
// // // //       // ]),
// // // //     ]);

// // // //     const summaryRow = summary[0] || {
// // // //       totalParticipants: 0,
// // // //       // pendingCount: 0,
// // // //       // confirmedCount: 0,
// // // //       // rejectedCount: 0,
// // // //     };

// // // //     res.json({
// // // //       bookings,
// // // //       total,
// // // //       currentPage: page,
// // // //       totalPages: Math.ceil(total / limit) || 1,
// // // //       totalParticipants: summaryRow.totalParticipants,
// // // //       // pendingCount: summaryRow.pendingCount,
// // // //       // confirmedCount: summaryRow.confirmedCount,
// // // //       // rejectedCount: summaryRow.rejectedCount,
// // // //     });
// // // //   } catch (err) {
// // // //     console.error("GET /bookings error:", err);
// // // //     res.status(500).json({ message: err.message });
// // // //   }
// // // // });

// // // // // router.get("/public/recent", async (req, res) => {
// // // // //   try {
// // // // //     const limit = Math.min(
// // // // //       Math.max(parseInt(req.query.limit || "12", 10), 1),
// // // // //       40,
// // // // //     );
// // // // //     const rows = await Booking.find({}, publicProjection)
// // // // //       .sort({ updatedAt: -1 })
// // // // //       .limit(limit)
// // // // //       .lean();
// // // // //     res.json(
// // // // //       rows.map((row) => ({
// // // // //         ...row,
// // // // //         message: buildClientStatusMessage(row),
// // // // //       })),
// // // // //     );
// // // // //   } catch (err) {
// // // // //     console.error("GET /bookings/public/recent error:", err);
// // // // //     res
// // // // //       .status(500)
// // // // //       .json({ message: err.message || "የሲስተም ችግር። | Server error" });
// // // // //   }
// // // // // });

// // // // // router.get("/public/status", async (req, res) => {
// // // // //   try {
// // // // //     const name = normalizeText(req.query.name || "");
// // // // //     const phone = normalizeText(req.query.phone || "")
// // // // //       .replace(/\D/g, "")
// // // // //       .slice(0, 10);
// // // // //     const organization = normalizeText(req.query.organization || "");

// // // // //     const query = {};
// // // // //     if (name) query.name = new RegExp(`^${name}$`, "i");
// // // // //     if (phone) query.phone = phone;
// // // // //     if (organization) query.organization = organization;

// // // // //     if (!Object.keys(query).length) {
// // // // //       return res.status(400).json({
// // // // //         message:
// // // // //           "እባክዎ ቢያንስ አንዱን ቦታ ይሙሉ።| Please enter at least one field to check status.",
// // // // //       });
// // // // //     }

// // // // //     // const rows = await Booking.find(query, publicProjection)
// // // // //     //   .sort({ updatedAt: -1 })
// // // // //     //   .limit(20)
// // // // //     //   .lean();

// // // // //     // if (!rows.length) {
// // // // //     //   let missing =
// // // // //     //     "ይህ የቤተሰብ ጉዞ መረጃ አልተመዘገበም። | This booking information is not registered.";
// // // // //     //   if (phone)
// // // // //     //     missing = "ይህ ስልክ ቁጥር አልተመዘገበም። | This phone number is not registered.";
// // // // //     //   else if (name) missing = "ይህ ስም አልተመዘገበም። | This name is not registered.";
// // // // //     //   // else if (organization)
// // // // //     //   //   missing = "ይህን ድርጅት አልተመዘገበም። | This organization is not registered.";
// // // // //     //   return res.status(404).json({ message: missing });
// // // // //     // }

// // // // //   //   res.json(
// // // // //   //     rows.map((row) => ({ ...row, message: buildClientStatusMessage(row) })),
// // // // //   //   );
// // // // //   // } catch (err) {
// // // // //   //   console.error("GET /bookings/public/status error:", err);
// // // // //   //   res
// // // // //   //     .status(500)
// // // // //   //     .json({ message: err.message || "የሲስተም ችግር | Server error" });
// // // // //   // }
// // // // // });

// // // // export default router;
// // // import express from "express";
// // // import Booking from "../models/Booking.js";
// // // import adminAuth from "../middleware/adminAuth.js";
// // // import { getIO } from "../utils/socket.js";

// // // const router = express.Router();

// // // function normalizeText(value) {
// // //   return String(value || "")
// // //     .replace(/\s+/g, " ")
// // //     .trim();
// // // }

// // // const PHONE_REGEX = /^09\d{8}$/;

// // // /**
// // //  * PUBLIC: create a participant booking.
// // //  * Matches the simplified form: name, organization, phone, sex.
// // //  */
// // // router.post("/", async (req, res) => {
// // //   try {
// // //     const { name, organization, phone, sex } = req.body;

// // //     const cleanName = normalizeText(name);
// // //     const cleanOrganization = normalizeText(organization);
// // //     const cleanPhone = normalizeText(phone);
// // //     const cleanSex = normalizeText(sex);

// // //     if (!cleanName || !cleanOrganization || !cleanPhone) {
// // //       return res
// // //         .status(400)
// // //         .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
// // //     }

// // //     if (!PHONE_REGEX.test(cleanPhone)) {
// // //       return res.status(400).json({
// // //         message:
// // //           "ትክክለኛ ስልክ ቁጥር ያስፈልጋል | A valid phone number is required (09XXXXXXXX)",
// // //       });
// // //     }

// // //     const booking = await Booking.create({
// // //       name: cleanName,
// // //       organization: cleanOrganization,
// // //       phone: cleanPhone,
// // //       sex: cleanSex,
// // //     });

// // //     const io = getIO?.();
// // //     if (io) {
// // //       io.emit("newBooking", booking);
// // //       io.emit("booking:created", {
// // //         bookingId: booking._id,
// // //         name: booking.name,
// // //         organization: booking.organization,
// // //       });
// // //     }

// // //     return res.status(201).json({
// // //       message: "Booking submitted successfully",
// // //       booking,
// // //     });
// // //   } catch (error) {
// // //     console.error("BOOKING CREATE ERROR:", error);
// // //     return res.status(500).json({
// // //       message: error.message || "Failed to submit booking",
// // //     });
// // //   }
// // // });

// // // /**
// // //  * ADMIN: paginated list + summary stats + per-organization breakdown.
// // //  * Query params: page, limit, q (search), organization (exact filter)
// // //  */
// // // router.get("/", adminAuth, async (req, res) => {
// // //   try {
// // //     const page = Math.max(parseInt(req.query.page || "1", 10), 1);
// // //     const limit = Math.max(parseInt(req.query.limit || "50", 10), 1);
// // //     const skip = (page - 1) * limit;
// // //     const q = normalizeText(req.query.q || "");
// // //     const organization = normalizeText(req.query.organization || "");

// // //     const query = {};

// // //     if (q) {
// // //       query.$or = [
// // //         { name: { $regex: q, $options: "i" } },
// // //         { organization: { $regex: q, $options: "i" } },
// // //         { phone: { $regex: q, $options: "i" } },
// // //         { sex: { $regex: q, $options: "i" } },
// // //       ];
// // //     }

// // //     if (organization) {
// // //       query.organization = organization;
// // //     }

// // //     const [total, bookings, statsAgg, orgSummaryAgg] = await Promise.all([
// // //       Booking.countDocuments(query),
// // //       Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
// // //       Booking.aggregate([
// // //         { $match: query },
// // //         {
// // //           $group: {
// // //             _id: null,
// // //             total: { $sum: 1 },
// // //             men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
// // //             women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
// // //             organizations: { $addToSet: "$organization" },
// // //           },
// // //         },
// // //       ]),
// // //       Booking.aggregate([
// // //         { $match: query },
// // //         {
// // //           $group: {
// // //             _id: "$organization",
// // //             count: { $sum: 1 },
// // //             men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
// // //             women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
// // //           },
// // //         },
// // //         { $sort: { count: -1 } },
// // //       ]),
// // //     ]);

// // //     const statsRow = statsAgg[0] || {
// // //       total: 0,
// // //       men: 0,
// // //       women: 0,
// // //       organizations: [],
// // //     };

// // //     res.json({
// // //       bookings,
// // //       total,
// // //       currentPage: page,
// // //       totalPages: Math.ceil(total / limit) || 1,
// // //       stats: {
// // //         total: statsRow.total,
// // //         men: statsRow.men,
// // //         women: statsRow.women,
// // //         organizations: statsRow.organizations.length,
// // //       },
// // //       orgSummary: orgSummaryAgg.map((row) => ({
// // //         organization: row._id || "ሌላ ያልተገለጸ",
// // //         count: row.count,
// // //         men: row.men,
// // //         women: row.women,
// // //       })),
// // //     });
// // //   } catch (err) {
// // //     console.error("GET /bookings error:", err);
// // //     res.status(500).json({ message: err.message });
// // //   }
// // // });

// // // /**
// // //  * ADMIN: full (unpaginated) list for export purposes.
// // //  * Supports the same q / organization filters as the list endpoint.
// // //  */
// // // router.get("/export/all", adminAuth, async (req, res) => {
// // //   try {
// // //     const q = normalizeText(req.query.q || "");
// // //     const organization = normalizeText(req.query.organization || "");

// // //     const query = {};
// // //     if (q) {
// // //       query.$or = [
// // //         { name: { $regex: q, $options: "i" } },
// // //         { organization: { $regex: q, $options: "i" } },
// // //         { phone: { $regex: q, $options: "i" } },
// // //         { sex: { $regex: q, $options: "i" } },
// // //       ];
// // //     }
// // //     if (organization) query.organization = organization;

// // //     const bookings = await Booking.find(query).sort({
// // //       organization: 1,
// // //       createdAt: -1,
// // //     });
// // //     res.json({ bookings });
// // //   } catch (err) {
// // //     console.error("GET /bookings/export/all error:", err);
// // //     res.status(500).json({ message: err.message });
// // //   }
// // // });

// // // export default router;

// // import express from "express";
// // import Booking from "../models/Booking.js";
// // import adminAuth from "../middleware/adminAuth.js";
// // import { getIO } from "../utils/socket.js";

// // const router = express.Router();

// // function normalizeText(value) {
// //   return String(value || "")
// //     .replace(/\s+/g, " ")
// //     .trim();
// // }

// // const PHONE_REGEX = /^09\d{8}$/;

// // /**
// //  * PUBLIC: create a participant booking.
// //  * Matches the simplified form: name, organization, phone, sex.
// //  */
// // router.post("/", async (req, res) => {
// //   try {
// //     const { name, organization, phone, sex } = req.body;

// //     const cleanName = normalizeText(name);
// //     const cleanOrganization = normalizeText(organization);
// //     const cleanPhone = normalizeText(phone);
// //     const cleanSex = normalizeText(sex);

// //     if (!cleanName || !cleanOrganization || !cleanPhone) {
// //       return res
// //         .status(400)
// //         .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
// //     }

// //     if (!PHONE_REGEX.test(cleanPhone)) {
// //       return res.status(400).json({
// //         message:
// //           "ትክክለኛ ስልክ ቁጥር ያስፈልጋል | A valid phone number is required (09XXXXXXXX)",
// //       });
// //     }

// //     const existing = await Booking.findOne({
// //       cleanName,
// //       cleanOrganization,
// //       cleanPhone,
// //       cleanSex,
// //     });

// //     if (existing) {
// //       return res.status(409).json({
// //         message: "⚠️ ይህ ስም ከዚህ በፊት ተመዝግቧል! ⚠️",
// //       });
// //     }

// //     const io = getIO?.();
// //     if (io) {
// //       io.emit("newBooking", booking);
// //       io.emit("booking:created", {
// //         bookingId: booking._id,
// //         name: booking.name,
// //         organization: booking.organization,
// //       });
// //     }

// //     return res.status(201).json({
// //       message: "Booking submitted successfully",
// //       booking,
// //     });
// //   } catch (error) {
// //     console.error("BOOKING CREATE ERROR:", error);
// //     return res.status(500).json({
// //       message: error.message || "Failed to submit booking",
// //     });
// //   }
// // });

// // /**
// //  * ADMIN: paginated list + summary stats + per-organization breakdown.
// //  * Query params: page, limit, q (search), organization (exact filter)
// //  */
// // router.get("/", adminAuth, async (req, res) => {
// //   try {
// //     const page = Math.max(parseInt(req.query.page || "1", 10), 1);
// //     const limit = Math.max(parseInt(req.query.limit || "50", 10), 1);
// //     const skip = (page - 1) * limit;
// //     const q = normalizeText(req.query.q || "");
// //     const organization = normalizeText(req.query.organization || "");

// //     const query = {};

// //     if (q) {
// //       query.$or = [
// //         { name: { $regex: q, $options: "i" } },
// //         { organization: { $regex: q, $options: "i" } },
// //         { phone: { $regex: q, $options: "i" } },
// //         { sex: { $regex: q, $options: "i" } },
// //       ];
// //     }

// //     if (organization) {
// //       query.organization = organization;
// //     }

// //     const [total, bookings, statsAgg, orgSummaryAgg] = await Promise.all([
// //       Booking.countDocuments(query),
// //       Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
// //       Booking.aggregate([
// //         { $match: query },
// //         {
// //           $group: {
// //             _id: null,
// //             total: { $sum: 1 },
// //             men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
// //             women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
// //             organizations: { $addToSet: "$organization" },
// //           },
// //         },
// //       ]),
// //       Booking.aggregate([
// //         { $match: query },
// //         {
// //           $group: {
// //             _id: "$organization",
// //             count: { $sum: 1 },
// //             men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
// //             women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
// //           },
// //         },
// //         { $sort: { count: -1 } },
// //       ]),
// //     ]);

// //     const statsRow = statsAgg[0] || {
// //       total: 0,
// //       men: 0,
// //       women: 0,
// //       organizations: [],
// //     };

// //     res.json({
// //       bookings,
// //       total,
// //       currentPage: page,
// //       totalPages: Math.ceil(total / limit) || 1,
// //       stats: {
// //         total: statsRow.total,
// //         men: statsRow.men,
// //         women: statsRow.women,
// //         organizations: statsRow.organizations.length,
// //       },
// //       orgSummary: orgSummaryAgg.map((row) => ({
// //         organization: row._id || "ሌላ ያልተገለጸ",
// //         count: row.count,
// //         men: row.men,
// //         women: row.women,
// //       })),
// //     });
// //   } catch (err) {
// //     console.error("GET /bookings error:", err);
// //     res.status(500).json({ message: err.message });
// //   }
// // });

// // /**
// //  * ADMIN: full (unpaginated) list for export purposes.
// //  * Supports the same q / organization filters as the list endpoint.
// //  */
// // router.get("/export/all", adminAuth, async (req, res) => {
// //   try {
// //     const q = normalizeText(req.query.q || "");
// //     const organization = normalizeText(req.query.organization || "");

// //     const query = {};
// //     if (q) {
// //       query.$or = [
// //         { name: { $regex: q, $options: "i" } },
// //         { organization: { $regex: q, $options: "i" } },
// //         { phone: { $regex: q, $options: "i" } },
// //         { sex: { $regex: q, $options: "i" } },
// //       ];
// //     }
// //     if (organization) query.organization = organization;

// //     const bookings = await Booking.find(query).sort({
// //       organization: 1,
// //       createdAt: -1,
// //     });
// //     res.json({ bookings });
// //   } catch (err) {
// //     console.error("GET /bookings/export/all error:", err);
// //     res.status(500).json({ message: err.message });
// //   }
// // });

// // /**
// //  * PUBLIC: recent submissions feed for the home page.
// //  * Only exposes non-sensitive fields (no phone number).
// //  */
// // router.get("/public/recent", async (req, res) => {
// //   try {
// //     const limit = Math.min(
// //       Math.max(parseInt(req.query.limit || "12", 10), 1),
// //       40,
// //     );

// //     const rows = await Booking.find(
// //       {},
// //       { name: 1, organization: 1, sex: 1, createdAt: 1 },
// //     )
// //       .sort({ createdAt: -1 })
// //       .limit(limit)
// //       .lean();

// //     res.json(rows);
// //   } catch (err) {
// //     console.error("GET /bookings/public/recent error:", err);
// //     res
// //       .status(500)
// //       .json({ message: err.message || "የሲስተም ችግር። | Server error" });
// //   }
// // });

// // export default router;

// // // import express from "express";
// // // import Booking from "../models/Booking.js";
// // // import adminAuth from "../middleware/adminAuth.js";
// // // import { getIO } from "../utils/socket.js";

// // // const router = express.Router();

// // // function normalizeText(value) {
// // //   return String(value || "")
// // //     .replace(/\s+/g, " ")
// // //     .trim();
// // // }

// // // const PHONE_REGEX = /^09\d{8}$/;

// // // /**
// // //  * PUBLIC: create a participant booking.
// // //  * Matches the simplified form: name, organization, phone, sex.
// // //  */
// // // router.post("/", async (req, res) => {
// // //   try {
// // //     const { name, organization, phone, sex } = req.body;

// // //     const cleanName = normalizeText(name);
// // //     const cleanOrganization = normalizeText(organization);
// // //     const cleanPhone = normalizeText(phone);
// // //     const cleanSex = normalizeText(sex);

// // //     if (!cleanName || !cleanOrganization || !cleanPhone) {
// // //       return res
// // //         .status(400)
// // //         .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
// // //     }

// // //     if (!PHONE_REGEX.test(cleanPhone)) {
// // //       return res.status(400).json({
// // //         message:
// // //           "ትክክለኛ ስልክ ቁጥር ያስፈልጋል | A valid phone number is required (09XXXXXXXX)",
// // //       });
// // //     }

// // //     const booking = await Booking.create({
// // //       name: cleanName,
// // //       organization: cleanOrganization,
// // //       phone: cleanPhone,
// // //       sex: cleanSex,
// // //     });

// // //     const io = getIO?.();
// // //     if (io) {
// // //       io.emit("newBooking", booking);
// // //       io.emit("booking:created", {
// // //         bookingId: booking._id,
// // //         name: booking.name,
// // //         organization: booking.organization,
// // //       });
// // //     }

// // //     return res.status(201).json({
// // //       message: "Booking submitted successfully",
// // //       booking,
// // //     });
// // //   } catch (error) {
// // //     console.error("BOOKING CREATE ERROR:", error);
// // //     return res.status(500).json({
// // //       message: error.message || "Failed to submit booking",
// // //     });
// // //   }
// // // });

// // // /**
// // //  * ADMIN: paginated list + summary stats + per-organization breakdown.
// // //  * Query params: page, limit, q (search), organization (exact filter)
// // //  */
// // // router.get("/", adminAuth, async (req, res) => {
// // //   try {
// // //     const page = Math.max(parseInt(req.query.page || "1", 10), 1);
// // //     const limit = Math.max(parseInt(req.query.limit || "50", 10), 1);
// // //     const skip = (page - 1) * limit;
// // //     const q = normalizeText(req.query.q || "");
// // //     const organization = normalizeText(req.query.organization || "");

// // //     const query = {};

// // //     if (q) {
// // //       query.$or = [
// // //         { name: { $regex: q, $options: "i" } },
// // //         { organization: { $regex: q, $options: "i" } },
// // //         { phone: { $regex: q, $options: "i" } },
// // //         { sex: { $regex: q, $options: "i" } },
// // //       ];
// // //     }

// // //     if (organization) {
// // //       query.organization = organization;
// // //     }

// // //     const [total, bookings, statsAgg, orgSummaryAgg] = await Promise.all([
// // //       Booking.countDocuments(query),
// // //       Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
// // //       Booking.aggregate([
// // //         { $match: query },
// // //         {
// // //           $group: {
// // //             _id: null,
// // //             total: { $sum: 1 },
// // //             men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
// // //             women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
// // //             organizations: { $addToSet: "$organization" },
// // //           },
// // //         },
// // //       ]),
// // //       Booking.aggregate([
// // //         { $match: query },
// // //         {
// // //           $group: {
// // //             _id: "$organization",
// // //             count: { $sum: 1 },
// // //             men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
// // //             women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
// // //           },
// // //         },
// // //         { $sort: { count: -1 } },
// // //       ]),
// // //     ]);

// // //     const statsRow = statsAgg[0] || {
// // //       total: 0,
// // //       men: 0,
// // //       women: 0,
// // //       organizations: [],
// // //     };

// // //     res.json({
// // //       bookings,
// // //       total,
// // //       currentPage: page,
// // //       totalPages: Math.ceil(total / limit) || 1,
// // //       stats: {
// // //         total: statsRow.total,
// // //         men: statsRow.men,
// // //         women: statsRow.women,
// // //         organizations: statsRow.organizations.length,
// // //       },
// // //       orgSummary: orgSummaryAgg.map((row) => ({
// // //         organization: row._id || "ሌላ ያልተገለጸ",
// // //         count: row.count,
// // //         men: row.men,
// // //         women: row.women,
// // //       })),
// // //     });
// // //   } catch (err) {
// // //     console.error("GET /bookings error:", err);
// // //     res.status(500).json({ message: err.message });
// // //   }
// // // });

// // // /**
// // //  * ADMIN: full (unpaginated) list for export purposes.
// // //  * Supports the same q / organization filters as the list endpoint.
// // //  */
// // // router.get("/export/all", adminAuth, async (req, res) => {
// // //   try {
// // //     const q = normalizeText(req.query.q || "");
// // //     const organization = normalizeText(req.query.organization || "");

// // //     const query = {};
// // //     if (q) {
// // //       query.$or = [
// // //         { name: { $regex: q, $options: "i" } },
// // //         { organization: { $regex: q, $options: "i" } },
// // //         { phone: { $regex: q, $options: "i" } },
// // //         { sex: { $regex: q, $options: "i" } },
// // //       ];
// // //     }
// // //     if (organization) query.organization = organization;

// // //     const bookings = await Booking.find(query).sort({
// // //       organization: 1,
// // //       createdAt: -1,
// // //     });
// // //     res.json({ bookings });
// // //   } catch (err) {
// // //     console.error("GET /bookings/export/all error:", err);
// // //     res.status(500).json({ message: err.message });
// // //   }
// // // });

// // // /**
// // //  * PUBLIC: recent submissions feed for the home page.
// // //  * Only exposes non-sensitive fields (no phone number).
// // //  */
// // // router.get("/public/recent", async (req, res) => {
// // //   try {
// // //     const limit = Math.min(
// // //       Math.max(parseInt(req.query.limit || "12", 10), 1),
// // //       40,
// // //     );

// // //     const rows = await Booking.find(
// // //       {},
// // //       { name: 1, organization: 1, sex: 1, createdAt: 1 },
// // //     )
// // //       .sort({ createdAt: -1 })
// // //       .limit(limit)
// // //       .lean();

// // //     res.json(rows);
// // //   } catch (err) {
// // //     console.error("GET /bookings/public/recent error:", err);
// // //     res
// // //       .status(500)
// // //       .json({ message: err.message || "የሲስተም ችግር። | Server error" });
// // //   }
// // // });

// // // /**
// // //  * ADMIN: update a single participant's details.
// // //  */
// // // router.put("/:id", adminAuth, async (req, res) => {
// // //   try {
// // //     const { name, organization, phone, sex } = req.body || {};

// // //     const cleanName = normalizeText(name);
// // //     const cleanOrganization = normalizeText(organization);
// // //     const cleanPhone = normalizeText(phone);
// // //     const cleanSex = normalizeText(sex);

// // //     if (!cleanName || !cleanOrganization || !cleanPhone) {
// // //       return res
// // //         .status(400)
// // //         .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
// // //     }

// // //     if (!PHONE_REGEX.test(cleanPhone)) {
// // //       return res.status(400).json({
// // //         message:
// // //           "ትክክለኛ ስልክ ቁጥር ያስፈልጋል | A valid phone number is required (09XXXXXXXX)",
// // //       });
// // //     }

// // //     const booking = await Booking.findByIdAndUpdate(
// // //       req.params.id,
// // //       {
// // //         name: cleanName,
// // //         organization: cleanOrganization,
// // //         phone: cleanPhone,
// // //         sex: cleanSex,
// // //       },
// // //       { new: true, runValidators: true },
// // //     );

// // //     if (!booking) {
// // //       return res
// // //         .status(404)
// // //         .json({ message: "ተሳታፊ አልተገኘም | Participant not found" });
// // //     }

// // //     const io = getIO?.();
// // //     if (io) io.emit("bookingUpdated", booking);

// // //     res.json({ message: "Updated successfully", booking });
// // //   } catch (err) {
// // //     console.error("PUT /bookings/:id error:", err);
// // //     res
// // //       .status(500)
// // //       .json({ message: err.message || "Failed to update participant" });
// // //   }
// // // });

// // // /**
// // //  * ADMIN: delete a single participant.
// // //  */
// // // router.delete("/:id", adminAuth, async (req, res) => {
// // //   try {
// // //     const booking = await Booking.findByIdAndDelete(req.params.id);

// // //     if (!booking) {
// // //       return res
// // //         .status(404)
// // //         .json({ message: "ተሳታፊ አልተገኘም | Participant not found" });
// // //     }

// // //     const io = getIO?.();
// // //     if (io) io.emit("bookingDeleted", { bookingId: req.params.id });

// // //     res.json({ message: "Deleted successfully" });
// // //   } catch (err) {
// // //     console.error("DELETE /bookings/:id error:", err);
// // //     res
// // //       .status(500)
// // //       .json({ message: err.message || "Failed to delete participant" });
// // //   }
// // // });

// // // export default router;
// import express from "express";
// import Booking from "../models/Booking.js";
// import adminAuth from "../middleware/adminAuth.js";
// import { getIO } from "../utils/socket.js";

// const router = express.Router();

// function normalizeText(value) {
//   return String(value || "")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// function escapeRegex(value) {
//   return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// const PHONE_REGEX = /^09\d{8}$/;

// /**
//  * PUBLIC: create a participant booking.
//  * Matches the simplified form: name, organization, phone, sex.
//  * Rejects duplicate submissions (same name + organization + phone).
//  */
// router.post("/", async (req, res) => {
//   try {
//     const { name, organization, phone, sex } = req.body || {};

//     const cleanName = normalizeText(name);
//     const cleanOrganization = normalizeText(organization);
//     const cleanPhone = normalizeText(phone);
//     const cleanSex = normalizeText(sex);

//     if (!cleanName || !cleanOrganization || !cleanPhone) {
//       return res
//         .status(400)
//         .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
//     }

//     if (!PHONE_REGEX.test(cleanPhone)) {
//       return res.status(400).json({
//         message:
//           "ትክክለኛ ስልክ ቁጥር ያስፈልጋል | A valid phone number is required (09XXXXXXXX)",
//       });
//     }

//     // Duplicate check: same person (name + organization) with the same phone.
//     // Name match is case-insensitive since the same person may type casing differently.
//     const existing = await Booking.findOne({
//       name: new RegExp(`^${escapeRegex(cleanName)}$`, "i"),
//       organization: cleanOrganization,
//       phone: cleanPhone,
//     });

//     if (existing) {
//       return res.status(409).json({
//         message:
//           "⚠️ ይህ ስም ቀደም ብሎ ተመዝግቧል | This participant has already been registered.",
//       });
//     }

//     const booking = await Booking.create({
//       name: cleanName,
//       organization: cleanOrganization,
//       phone: cleanPhone,
//       sex: cleanSex,
//     });

//     const io = getIO?.();
//     if (io) {
//       io.emit("newBooking", booking);
//       io.emit("booking:created", {
//         bookingId: booking._id,
//         name: booking.name,
//         organization: booking.organization,
//       });
//     }

//     return res.status(201).json({
//       message: "Booking submitted successfully",
//       booking,
//     });
//   } catch (error) {
//     console.error("BOOKING CREATE ERROR:", error);
//     return res.status(500).json({
//       message: error.message || "Failed to submit booking",
//     });
//   }
// });

// /**
//  * ADMIN: paginated list + summary stats + per-organization breakdown.
//  * Query params: page, limit, q (search), organization (exact filter)
//  */
// router.get("/", adminAuth, async (req, res) => {
//   try {
//     const page = Math.max(parseInt(req.query.page || "1", 10), 1);
//     const limit = Math.max(parseInt(req.query.limit || "50", 10), 1);
//     const skip = (page - 1) * limit;
//     const q = normalizeText(req.query.q || "");
//     const organization = normalizeText(req.query.organization || "");

//     const query = {};

//     if (q) {
//       query.$or = [
//         { name: { $regex: q, $options: "i" } },
//         { organization: { $regex: q, $options: "i" } },
//         { phone: { $regex: q, $options: "i" } },
//         { sex: { $regex: q, $options: "i" } },
//       ];
//     }

//     if (organization) {
//       query.organization = organization;
//     }

//     const [total, bookings, statsAgg, orgSummaryAgg] = await Promise.all([
//       Booking.countDocuments(query),
//       Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
//       Booking.aggregate([
//         { $match: query },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: 1 },
//             men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
//             women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
//             organizations: { $addToSet: "$organization" },
//           },
//         },
//       ]),
//       Booking.aggregate([
//         { $match: query },
//         {
//           $group: {
//             _id: "$organization",
//             count: { $sum: 1 },
//             men: { $sum: { $cond: [{ $eq: ["$sex", "ወንድ"] }, 1, 0] } },
//             women: { $sum: { $cond: [{ $eq: ["$sex", "ሴት"] }, 1, 0] } },
//           },
//         },
//         { $sort: { count: -1 } },
//       ]),
//     ]);

//     const statsRow = statsAgg[0] || {
//       total: 0,
//       men: 0,
//       women: 0,
//       organizations: [],
//     };

//     res.json({
//       bookings,
//       total,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit) || 1,
//       stats: {
//         total: statsRow.total,
//         men: statsRow.men,
//         women: statsRow.women,
//         organizations: statsRow.organizations.length,
//       },
//       orgSummary: orgSummaryAgg.map((row) => ({
//         organization: row._id || "ሌላ ያልተገለጸ",
//         count: row.count,
//         men: row.men,
//         women: row.women,
//       })),
//     });
//   } catch (err) {
//     console.error("GET /bookings error:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

// /**
//  * ADMIN: full (unpaginated) list for export purposes.
//  * Supports the same q / organization filters as the list endpoint.
//  */
// router.get("/export/all", adminAuth, async (req, res) => {
//   try {
//     const q = normalizeText(req.query.q || "");
//     const organization = normalizeText(req.query.organization || "");

//     const query = {};
//     if (q) {
//       query.$or = [
//         { name: { $regex: q, $options: "i" } },
//         { organization: { $regex: q, $options: "i" } },
//         { phone: { $regex: q, $options: "i" } },
//         { sex: { $regex: q, $options: "i" } },
//       ];
//     }
//     if (organization) query.organization = organization;

//     const bookings = await Booking.find(query).sort({
//       organization: 1,
//       createdAt: -1,
//     });
//     res.json({ bookings });
//   } catch (err) {
//     console.error("GET /bookings/export/all error:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

// /**
//  * PUBLIC: recent submissions feed for the home page.
//  * Only exposes non-sensitive fields (no phone number).
//  */
// router.get("/public/recent", async (req, res) => {
//   try {
//     const limit = Math.min(
//       Math.max(parseInt(req.query.limit || "12", 10), 1),
//       40,
//     );

//     const rows = await Booking.find(
//       {},
//       { name: 1, organization: 1, sex: 1, createdAt: 1 },
//     )
//       .sort({ createdAt: -1 })
//       .limit(limit)
//       .lean();

//     res.json(rows);
//   } catch (err) {
//     console.error("GET /bookings/public/recent error:", err);
//     res
//       .status(500)
//       .json({ message: err.message || "የሲስተም ችግር። | Server error" });
//   }
// });

// /**
//  * ADMIN: update a single participant's details.
//  */
// router.put("/:id", adminAuth, async (req, res) => {
//   try {
//     const { name, organization, phone, sex } = req.body || {};

//     const cleanName = normalizeText(name);
//     const cleanOrganization = normalizeText(organization);
//     const cleanPhone = normalizeText(phone);
//     const cleanSex = normalizeText(sex);

//     if (!cleanName || !cleanOrganization || !cleanPhone) {
//       return res
//         .status(400)
//         .json({ message: "አስፈላጊ ፊልዶች አልተሟሉም | Missing required fields" });
//     }

//     if (!PHONE_REGEX.test(cleanPhone)) {
//       return res.status(400).json({
//         message:
//           "ትክክለኛ ስልክ ቁጥር ያስፈልጋል | A valid phone number is required (09XXXXXXXX)",
//       });
//     }

//     // Guard against renaming/re-numbering into a collision with another existing record.
//     const duplicate = await Booking.findOne({
//       _id: { $ne: req.params.id },
//       name: new RegExp(`^${escapeRegex(cleanName)}$`, "i"),
//       organization: cleanOrganization,
//       phone: cleanPhone,
//     });

//     if (duplicate) {
//       return res.status(409).json({
//         message:
//           "⚠️ ይህ ስም ቀደም ብሎ ተመዝግቧል | Another participant already has these details.",
//       });
//     }

//     const booking = await Booking.findByIdAndUpdate(
//       req.params.id,
//       {
//         name: cleanName,
//         organization: cleanOrganization,
//         phone: cleanPhone,
//         sex: cleanSex,
//       },
//       { new: true, runValidators: true },
//     );

//     if (!booking) {
//       return res
//         .status(404)
//         .json({ message: "ተሳታፊ አልተገኘም | Participant not found" });
//     }

//     const io = getIO?.();
//     if (io) io.emit("bookingUpdated", booking);

//     res.json({ message: "Updated successfully", booking });
//   } catch (err) {
//     console.error("PUT /bookings/:id error:", err);
//     res
//       .status(500)
//       .json({ message: err.message || "Failed to update participant" });
//   }
// });

// /**
//  * ADMIN: delete a single participant.
//  */
// router.delete("/:id", adminAuth, async (req, res) => {
//   try {
//     const booking = await Booking.findByIdAndDelete(req.params.id);

//     if (!booking) {
//       return res
//         .status(404)
//         .json({ message: "ተሳታፊ አልተገኘም | Participant not found" });
//     }

//     const io = getIO?.();
//     if (io) io.emit("bookingDeleted", { bookingId: req.params.id });

//     res.json({ message: "Deleted successfully" });
//   } catch (err) {
//     console.error("DELETE /bookings/:id error:", err);
//     res
//       .status(500)
//       .json({ message: err.message || "Failed to delete participant" });
//   }
// });

// export default router;
import express from "express";
import Booking from "../models/Booking.js";
import adminAuth from "../middleware/adminAuth.js";
import { getIO } from "../utils/socket.js";

const router = express.Router();

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

    const booking = await Booking.create({
      name: cleanName,
      organization: cleanOrganization,
      phone: cleanPhone,
      sex: cleanSex,
    });

    if (!booking.qrToken) {
      booking.qrToken = makeQrToken(booking._id);
      await booking.save();
    }

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
      qrData: `GUBAE-EVENT:${booking._id}`,
      qrDataUrl: await qrDataUrlForBooking(booking),
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

/** STAFF: mark a registered participant present from a QR code. */
router.post("/attendance/scan", adminAuth, async (req, res) => {
  try {
    const raw = normalizeText(req.body?.qrData);
    const match = raw.match(/^GUBAE-EVENT:([a-f0-9]{24})$/i);
    if (!match)
      return res.status(400).json({ message: "Invalid participant QR code." });
    const participant = await Booking.findById(match[1]);
    if (!participant)
      return res
        .status(404)
        .json({ message: "Participant is not registered in this system." });
    if (participant.attendance?.checkedIn) {
      return res.json({
        success: true,
        alreadyCheckedIn: true,
        message: "Participant is already marked present.",
        participant: {
          id: String(participant._id),
          name: participant.name,
          organization: participant.organization,
          sex: participant.sex,
          checkedInAt: participant.attendance.checkedInAt,
        },
      });
    }
    participant.attendance = { checkedIn: true, checkedInAt: new Date() };
    await participant.save();
    const io = getIO?.();
    if (io)
      io.emit("participantCheckedIn", {
        participantId: String(participant._id),
        name: participant.name,
        organization: participant.organization,
        sex: participant.sex,
        checkedInAt: participant.attendance.checkedInAt,
      });
    return res.json({
      success: true,
      alreadyCheckedIn: false,
      message: "Participant marked present.",
      participant: {
        id: String(participant._id),
        name: participant.name,
        organization: participant.organization,
        sex: participant.sex,
        checkedInAt: participant.attendance.checkedInAt,
      },
    });
  } catch (error) {
    console.error("POST /bookings/attendance/scan error:", error);
    return res.status(500).json({ message: "Failed to record attendance." });
  }
});

/** STAFF: complete attendance list for Excel/export. */
router.get("/attendance/list", adminAuth, async (_req, res) => {
  try {
    const rows = await Booking.find({})
      .select("_id name organization phone sex attendance")
      .sort({ organization: 1, name: 1 })
      .lean();

    const participants = rows.map((row, index) => ({
      number: index + 1,
      id: String(row._id),
      name: row.name || "",
      organization: row.organization || "Unknown",
      phone: row.phone || "",
      sex: row.sex || "",
      status: row.attendance?.checkedIn ? "Present" : "Absent",
      checkedInAt: row.attendance?.checkedInAt || null,
    }));

    const byOrganizationMap = new Map();
    for (const row of participants) {
      const organization =
        String(row.organization || "Unknown").trim() || "Unknown";
      if (!byOrganizationMap.has(organization)) {
        byOrganizationMap.set(organization, {
          organization,
          totalRegistered: 0,
          totalPresent: 0,
          totalAbsent: 0,
          men: 0,
          women: 0,
        });
      }
      const item = byOrganizationMap.get(organization);
      item.totalRegistered += 1;
      if (row.status === "Present") item.totalPresent += 1;
      else item.totalAbsent += 1;

      const sex = String(row.sex || "")
        .trim()
        .toLowerCase();
      if (sex === "male" || sex === "ወንድ") item.men += 1;
      if (sex === "female" || sex === "ሴት") item.women += 1;
    }

    const total = participants.length;
    const present = participants.filter((p) => p.status === "Present").length;

    return res.json({
      generatedAt: new Date(),
      total,
      present,
      absent: total - present,
      participants,
      byOrganization: Array.from(byOrganizationMap.values()),
    });
  } catch (error) {
    console.error("GET /bookings/attendance/list error:", error);
    return res.status(500).json({ message: "Failed to load attendance list." });
  }
});

/** STAFF: reset ALL attendance records after explicit two-factor confirmation. */
router.post("/attendance/reset", adminAuth, async (req, res) => {
  try {
    const confirmation = String(req.body?.confirmation || "").trim();
    const expectedPresent = Number(req.body?.expectedPresent);

    if (confirmation !== "RESET ATTENDANCE") {
      return res.status(400).json({
        message: 'Type exactly "RESET ATTENDANCE" to confirm this action.',
      });
    }

    if (!Number.isInteger(expectedPresent) || expectedPresent < 0) {
      return res.status(400).json({
        message: "The current Present count is required for confirmation.",
      });
    }

    const actualPresent = await Booking.countDocuments({
      "attendance.checkedIn": true,
    });
    if (actualPresent !== expectedPresent) {
      return res.status(409).json({
        message: `Attendance changed while you were confirming. Current Present count is ${actualPresent}. Refresh and try again.`,
        currentPresent: actualPresent,
      });
    }

    if (actualPresent === 0) {
      return res.json({
        message: "No attendance records were marked present.",
        resetCount: 0,
      });
    }

    const result = await Booking.updateMany(
      { "attendance.checkedIn": true },
      { $unset: { attendance: "" } },
    );

    const io = getIO?.();
    if (io) io.emit("attendance:reset", { resetCount: result.modifiedCount });

    return res.json({
      message: `Attendance reset successfully for ${result.modifiedCount} participant(s).`,
      resetCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("POST /bookings/attendance/reset error:", error);
    return res.status(500).json({ message: "Failed to reset attendance." });
  }
});

/** STAFF: live attendance summary. */
router.get("/attendance/summary", adminAuth, async (_req, res) => {
  try {
    const [totalRegistered, totalPresent, rows] = await Promise.all([
      Booking.countDocuments({}),
      Booking.countDocuments({ "attendance.checkedIn": true }),
      Booking.aggregate([
        { $match: { "attendance.checkedIn": true } },
        {
          $group: {
            _id: { organization: "$organization", sex: "$sex" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.organization": 1, count: -1 } },
      ]),
    ]);
    const byOrganization = {};
    let men = 0,
      women = 0;
    for (const row of rows) {
      const org = row._id.organization || "Unknown";
      const sex = String(row._id.sex || "Unknown").trim();
      if (!byOrganization[org])
        byOrganization[org] = { organization: org, total: 0, men: 0, women: 0 };
      byOrganization[org].total += row.count;
      if (sex === "ወንድ" || sex.toLowerCase() === "male") {
        byOrganization[org].men += row.count;
        men += row.count;
      } else if (sex === "ሴት" || sex.toLowerCase() === "female") {
        byOrganization[org].women += row.count;
        women += row.count;
      }
    }
    return res.json({
      totalRegistered,
      totalPresent,
      totalAbsent: Math.max(totalRegistered - totalPresent, 0),
      men,
      women,
      byOrganization: Object.values(byOrganization),
    });
  } catch (error) {
    console.error("GET /bookings/attendance/summary error:", error);
    return res
      .status(500)
      .json({ message: "Failed to load attendance summary." });
  }
});

export default router;
