// import express from "express";
// import jwt from "jsonwebtoken";
// import Admin from "../models/Admin.js";
// import logHistory from "../utils/logHistory.js";

// const router = express.Router();

// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body || {};
//     if (!email) {
//       return res.status(400).json({
//         message: "እባክዎ ኢሜል ያስገቡ!",
//       });
//     }
//     if (!password) {
//       return res.status(400).json({
//         message: "እባክዎ ኢሜል ያስገቡ!",
//       });
//     }
//     if (!password && !email) {
//       return res.status(400).json({
//         message: "እባክዎ ኢሜል እና የይለፍ ቃል ያስገቡ!",
//       });
//     }

//     const admin = await Admin.findOne({ email: String(email).trim() });

//     if (!admin || admin.password !== password) {
//       return res.status(401).json({
//         message: " ያስገቡት የይለፍ ቃል ትክክል አይደለም",
//       });
//     }
//     if (!admin || admin.email !== email) {
//       return res.status(401).json({
//         message: "ያስገቡት ኢሜይ ትክክል አይደለም",
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: admin._id,
//         name: admin.name,
//         email: admin.email,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7m" },
//     );

//     await logHistory("Admin Login", `${admin.email} logged in successfully`, {
//       actor: "admin",
//       entityType: "auth",
//       entityId: String(admin._id),
//     });

//     return res.json({
//       token,
//       user: {
//         id: admin._id,
//         name: admin.name,
//         email: admin.email,
//       },
//     });
//   } catch (err) {
//     console.error("AUTH LOGIN ERROR:", err);
//     return res.status(500).json({
//       message: err.message || "Server error",
//     });
//   }
// });

// export default router;
import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import logHistory from "../utils/logHistory.js";
import { useNavigate } from "react-router-dom";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "እባክዎ ኢሜል እና የይለፍ ቃል ያስገቡ!",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const admin = await Admin.findOne({ email: cleanEmail });

    console.log("LOGIN ATTEMPT EMAIL:", cleanEmail);
    console.log("ADMIN FOUND:", !!admin);
    console.log(
      "PASSWORD MATCH:",
      admin ? admin.password === cleanPassword : false,
    );

    if (!admin || admin.password !== cleanPassword) {
      return res.status(401).json({
        message: "ኢሜይል ወይም የይለፍ ቃል ትክክል አይደለም",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7m" },
    );

    const navigate = useNavigate();

    if (expiresIn === true) {
      navigate("/admin-login");
    }

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
    return res.status(500).json({
      message: err.message || "Server error",
    });
  }
});

// temporary file to test if the admin present or not
router.get("/debug-admins", async (req, res) => {
  try {
    const admins = await Admin.find().select("-_v");
    return res.json(admins);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});
export default router;
