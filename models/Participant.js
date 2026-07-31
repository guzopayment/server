// import mongoose from "mongoose";

// const schema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   organization: {
//     type: String,
//     default: "N/A",
//   },
//   phone: {
//     type: String,
//     default: "N/A",
//   },
//   participants: {
//     type: Number,
//     default: 0,
//   },
//   paymentProof: {
//     type: String,
//     default: "",
//   },
//   status: {
//     type: String,
//     default: "Pending",
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// export default mongoose.model("Participants", schema);
import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    sex: { type: String, required: true, trim: true }, // "ወንድ" | "ሴት"
  },
  { timestamps: true },
);

export default mongoose.model("Participant", participantSchema);
