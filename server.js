import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import historyRoutes from "./routes/history.js";
import questionnaireRoutes from "./routes/questionnaire.js";
import optionsRoutes from "./routes/options.js";

import reportRoutes from "./routes/reports.js";
import adminRoutes from "./routes/admin.js";
import adminDebugRoutes from "./routes/adminDebug.js";
import adminCleanupRoutes from "./routes/adminCleanup.js";
import { initSocket } from "./utils/socket.js";

console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("MONGO_URI preview:", process.env.MONGO_URI?.slice(0, 25));

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://economybetesebsocialdeputiespage.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
initSocket(io);

app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);
app.use("api/options", optionsRoutes);
app.use("/api/questionnaire", questionnaireRoutes);
app.use("/api/participants", bookingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/debug", adminDebugRoutes);
app.use("/api/admin", adminCleanupRoutes);

app.get("/api/test-db", async (req, res) => {
  res.json({ message: "Database connection working ✅" });
});

app.get("/", (_, res) => {
  res.send("✅ API running...");
});

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
    path: req.originalUrl,
  });
});

server.listen(process.env.PORT || 10000, () =>
  console.log("✅Server running on port", process.env.PORT || 10000),
);
