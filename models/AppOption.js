import mongoose from "mongoose";

const appOptionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

appOptionSchema.index({ type: 1, value: 1 }, { unique: true });

export default mongoose.model("AppOption", appOptionSchema);
