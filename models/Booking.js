
import mongoose from "mongoose";

const participantDetailSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    organization: { type: String, trim: true, default: "" },
    sex: { type: String, trim: true, default: "" },
    subCity: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    sex: { type: String, trim: true, default: "" },
    subCity: { type: String, trim: true, default: "" },
    participants: { type: Number, required: true, min: 1 },

    participantDetails: {
      type: [participantDetailSchema],
      default: [],
    },

    paymentProof: { type: String, required: true },
    paymentProofPublicId: { type: String, default: null },
    paymentProofStorageType: {
      type: String,
      enum: ["local", "cloudinary"],
      default: "local",
    },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Rejected"],
      default: "Pending",
    },
    action: {
      type: String,
      default: "Submitted",
    },
    statusUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Booking", bookingSchema);
