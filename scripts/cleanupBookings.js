import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/Booking.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo connected");

    const junkQuery = {
      $or: [
        // name missing / null / empty / spaces
        { name: { $exists: false } },
        { name: null },
        { name: "" },
        { name: { $regex: /^\s*$/ } },

        // organization missing / null / empty / spaces
        { organization: { $exists: false } },
        { organization: null },
        { organization: "" },
        { organization: { $regex: /^\s*$/ } },

        // phone missing / null / empty / spaces
        { phone: { $exists: false } },
        { phone: null },
        { phone: "" },
        { phone: { $regex: /^\s*$/ } },

        // participants missing / null / 0
        { participants: { $exists: false } },
        { participants: null },
        { participants: 0 },
      ],
    };

    const toDelete = await Booking.countDocuments(junkQuery);
    console.log("Junk records found:", toDelete);

    const result = await Booking.deleteMany(junkQuery);
    console.log("Deleted records:", result.deletedCount);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
