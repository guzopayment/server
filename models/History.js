import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: String,
    message: String,
  },
  { timestamps: true },
);

export default mongoose.model("History", schema);
