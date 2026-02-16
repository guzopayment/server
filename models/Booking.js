import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    fullName: String,
    organization: String,
    phone: String,
    participants: Number,
    paymentProof: String,
    status: { type: String, default: "Pending" },
  },

  { timestamps: true },
);

booking.status = "confirmed";
await booking.save();

export default mongoose.model("Booking", bookingSchema);
