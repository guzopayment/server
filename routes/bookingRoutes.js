import express from "express";
import Booking from "../models/Booking.js";
import History from "../models/History.js";
import { getIO } from "../utils/socket.js";
import uploadProof from "../middleware/uploadProof.js";

const router = express.Router();

router.post(
  "/",
  (req, res, next) => {
    uploadProof.single("paymentProof")(req, res, (err) => {
      if (err) {
        return res.status(err.status || 400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Payment proof image is required" });
      }

      // ✅ If you are still using local disk uploads, STOP using memoryStorage.
      // memoryStorage means req.file.buffer exists, but no filename/path.
      // So choose ONE approach:
      // A) Local disk upload (multer.diskStorage) OR
      // B) Cloudinary upload (upload req.file.buffer)
      //
      // Right now this code expects Cloudinary.
      return res.status(500).json({
        message:
          "Your server is using memoryStorage but you didn't upload to Cloudinary here. Choose diskStorage OR Cloudinary.",
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message });
    }
  },
);

export default router;
