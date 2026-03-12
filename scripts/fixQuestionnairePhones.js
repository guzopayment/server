import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Questionnaire from "../models/Questionnaire.js";
import normalizePhone from "../utils/normalizePhone.js";

dotenv.config();

async function run() {
  try {
    console.log(
      "Using MONGO_URI:",
      process.env.MONGO_URI ? "FOUND" : "MISSING",
    );

    await connectDB();
    console.log("Mongo connected");

    const rows = await Questionnaire.find();

    for (const row of rows) {
      row.normalizedPhone = normalizePhone(row.phone || "");
      row.normalizedAltPhone = row.altPhone ? normalizePhone(row.altPhone) : "";
      await row.save();
    }

    console.log(`Updated ${rows.length} questionnaire records`);
    process.exit(0);
  } catch (err) {
    console.error("FIX QUESTIONNAIRE PHONES ERROR:", err);
    process.exit(1);
  }
}

run();
