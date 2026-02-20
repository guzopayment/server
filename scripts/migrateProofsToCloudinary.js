import "dotenv/config";
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import cloudinary from "../utils/cloudinary.js";

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  if (!MONGO_URI) {
    console.error("❌ Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Mongo connected");

  // find bookings that still store local filenames
  const bookings = await Booking.find({
    paymentProof: { $exists: true, $ne: "" },
    $or: [
      { paymentProof: { $regex: /^uploads\// } },
      {
        paymentProof: {
          $regex: /^[0-9]+-paymentProof\.(jpg|jpeg|png|webp|gif)$/i,
        },
      },
      { paymentProof: { $regex: /\.jpg$|\.jpeg$|\.png$|\.webp$|\.gif$/i } },
    ],
  });

  console.log(`Found ${bookings.length} bookings with local proofs`);

  let migrated = 0;
  let skipped = 0;

  for (const b of bookings) {
    try {
      // if already cloudinary/http, skip
      if (
        typeof b.paymentProof === "string" &&
        b.paymentProof.startsWith("http")
      ) {
        skipped++;
        continue;
      }

      // normalize filename
      const filename = b.paymentProof.replace(/^uploads\//, "");
      const localPath = path.join(process.cwd(), "uploads", filename);

      // check file exists
      await fs.access(localPath);

      // upload to cloudinary
      const result = await cloudinary.uploader.upload(localPath, {
        folder: "guzo-payment-proofs",
        resource_type: "image",
      });

      // update booking
      b.paymentProof = result.secure_url;
      await b.save();

      // delete local file (optional but recommended)
      await fs.unlink(localPath);

      migrated++;
      console.log(`✅ Migrated ${b._id} -> ${result.secure_url}`);
    } catch (err) {
      console.log(`⚠️ Skipped ${b._id}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nDONE ✅ migrated=${migrated} skipped=${skipped}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("❌ Migration crashed:", e);
  process.exit(1);
});
