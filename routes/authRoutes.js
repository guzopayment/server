import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import logHistory from "../utils/logHistory.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
await logHistory("Admin Login", `${admin.email} logged in successfully`, {
  actor: "admin",
  entityType: "auth",
  entityId: String(admin._id),
});
export default router;
