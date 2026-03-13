import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    actor: { type: String, default: "" }, // admin/user/system
    entityType: { type: String, default: "" }, // booking/questionnaire/report/auth
    entityId: { type: String, default: "" },
  },
  { timestamps: true },
);

const History = mongoose.model("History", historySchema);
export default History;
