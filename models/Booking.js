import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    organization: { type: String, default: "" },
    phone: { type: String, default: "" },
    participants: { type: Number, default: 0 },
    paymentProof: { type: String, default: "" },
    status: { type: String, default: "Pending" },
    action: { type: String, default: "No action" },
  },
  { timestamps: true },
);

export default mongoose.model("Booking", bookingSchema);
