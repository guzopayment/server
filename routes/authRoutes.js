import express from "express";
import jwt from "jsonwebtoken";
import { registerUser, loginUser } from "../controllers/authController.js";
import logHistory from "../utils/logHistory.js";
import Admin from "../models/Admin.js";
const router = express.Router();
// ፍ
const showModal = (title, message, type = "info") => {
  setModalTitle(title);
  setModalMessage(message);
  setModalType(type);
  setModalOpen(true);
};

router.post("/register", registerUser);
router.post("/login", loginUser, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        message: "እባክዎ ኢሜል እና የይለፍ ቃል ያስገቡ!",
      });
    }
    const admin = await Admin.findOne({ email: String(email).trim() });
    if (!admin || admin.password !== password) {
      return res.status(401).json({
        message: "ኢሜይል ወይም የይለፍ ቃል ትክክል አይደለም",
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7m",
    });

    await logHistory("Admin Login", `${admin.email} logged in successfully`, {
      actor: "admin",
      entityType: "auth",
      entityId: String(admin._id),
    });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: err.message });
    showModal("Error", "Failed to login", "error");
  }
});

export default router;
