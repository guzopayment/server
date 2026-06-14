// import mongoose from "mongoose";

// const schema = new mongoose.Schema(
//   {
//     title: String,
//     message: String,
//   },
//   { timestamps: true },
// );

// export default mongoose.model("History", schema);
import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    actor: { type: String, default: "system" },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("History", historySchema);
