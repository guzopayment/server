import mongoose from "mongoose";

const schema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  organization: {
    type: String,
    default: "N/A",
  },
  phone: {
    type: String,
    default: "N/A",
  },
  participants: {
    type: Number,
    default: 0,
  },
  paymentProof: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Participant", schema);
