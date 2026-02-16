import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    action: String,
    adminId: String,
    details: String,
  },
  { timestamps: true },
);

export default mongoose.model("History", historySchema);
