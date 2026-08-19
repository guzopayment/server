import dotenv from "dotenv";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("Missing MONGODB_URI or MONGO_URI in environment.");
  process.exit(1);
}

try {
  await mongoose.connect(uri);
  const result = await Booking.collection.updateMany(
    {},
    {
      $unset: {
        email: "",
        qrSentAt: "",
        qrSendStatus: "",
        qrLastSendError: "",
        qrGeneratedAt: "",
      },
    },
  );
  console.log(`Cleaned QR/email fields from ${result.modifiedCount} participant records.`);
} catch (error) {
  console.error("Cleanup failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
