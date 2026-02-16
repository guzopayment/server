import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";

dotenv.config();
await connectDB();

const createAdmin = async () => {
  const hashed = await bcrypt.hash("admin123", 10);

  await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: hashed,
    role: "admin",
  });

  console.log("Admin created");
};

createAdmin();
