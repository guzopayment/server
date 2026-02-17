import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import historyRoutes from "./routes/history.js";
import reportRoutes from "./routes/reports.js";
import adminRoutes from "./routes/admin.js";
import { initSocket } from "./utils/socket.js";

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: "https://betesebguzopayment.vercel.app",
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
initSocket(io);

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/participants", bookingRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use((err, req, res, next) => {
  console.error("🔥 UNHANDLED ERROR:", err);
  res.status(500).json({ message: err.message || "Server error" });
});

app.get("/api/test-db", async (req, res) => {
  res.json({ message: "Database connection working ✅" });
});

app.get("/", (_, res) => {
  res.send("✅ API running...");
});

server.listen(process.env.PORT, () =>
  console.log("✅Server running on port", process.env.PORT),
);
