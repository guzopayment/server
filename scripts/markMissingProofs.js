// markMissingProofs.js
import "dotenv/config";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected");

  const bad = await Booking.find({
    paymentProof: { $exists: true, $ne: "" },
    paymentProof: { $not: /^https?:\/\//i }, // not a URL
  });

  console.log("Bad proofs:", bad.length);

  for (const b of bad) {
    b.paymentProof = ""; // or "MISSING"
    await b.save();
  }

  console.log("✅ Updated:", bad.length);
  await mongoose.disconnect();
}
run().catch(console.error);
