import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";

dotenv.config();
await connectDB();

const createAdmin = async () => {
  const hashed = await bcrypt.hash("Admin23c0n0myb3t343b", 10);

  await User.create({
    name: "Admin",
    email: "admin@economybeteseb.com",
    password: hashed,
    role: "admin",
  });

  console.log("Admin created");
};

createAdmin();
