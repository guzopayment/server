import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    name: String,
    organization: String,
    phone: String,
    participants: Number,
    paymentProof: String,
    status: { type: String, default: "Pending" },
    action: { type: Boolean, default: "No action" },
  },
  { timestamps: true },
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
