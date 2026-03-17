// import dotenv from "dotenv";
// import connectDB from "./config/db.js";
// import User from "./models/User.js";
// import bcrypt from "bcrypt";

// dotenv.config();
// await connectDB();

// const createAdmin = async () => {
//   const hashed = await bcrypt.hash("Admin23c0n0myb3t343b", 10);

//   await User.create({
//     name: "Admin",
//     email: "admin@economybeteseb.com",
//     password: hashed,
//     role: "admin",
//   });

//   console.log("Admin created");
// };

// createAdmin();
import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";
// import bcrypt from "bcrypt";

dotenv.config();

const run = async () => {
  // const hashed = await bcrypt.hash("Admin23c0n0myb3t343b", 10);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const email = "admin@economybeteseb.com";
    const existing = await Admin.findOne({ email });

    if (existing) {
      console.log("Admin already exists:", existing.email);
      process.exit(0);
    }

    const admin = await Admin.create({
      name: "Admin",
      email: email.toLowerCase(),
      password: "Admin23c0n0myb3t343b",
    });

    console.log("Admin created:", admin);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
