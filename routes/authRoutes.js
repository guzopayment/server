import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import logHistory from "../utils/logHistory.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: String(email).trim() });

    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // plain password check (use bcrypt if your project uses hashed passwords)
    if (admin.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    await logHistory("Admin Login", `${admin.email} logged in successfully`, {
      actor: "admin",
      entityType: "auth",
      entityId: String(admin._id),
    });

    return res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error("AUTH LOGIN ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
