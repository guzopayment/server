import mongoose from "mongoose";

const participantDetailSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    organization: { type: String, trim: true, default: "" },
    sex: { type: String, trim: true, default: "" },
    // subCity: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    sex: { type: String, trim: true, default: "" },
    qrToken: { type: String, trim: true, unique: true, sparse: true, default: null },
    // subCity: { type: String, trim: true, default: "" },
    // participants: { type: Number, required: true, min: 1 },

    // participantDetails: {
    //   type: [participantDetailSchema],
    //   default: [],
    // },

    // paymentProof: { type: String, required: true },
    // paymentProofPublicId: { type: String, default: null },
    // paymentProofStorageType: {
    //   type: String,
    //   enum: ["local", "cloudinary"],
    //   default: "local",
    // },

    // status: {
    //   type: String,
    //   enum: ["Pending", "Confirmed", "Rejected"],
    //   default: "Pending",
    // },
    action: {
      type: String,
      default: "Submitted",
    },

    // Admin-created guests are registered and marked present immediately,
    // so they count in the live attendance without scanning a QR code.
    specialGuest: { type: Boolean, default: false },
    statusUpdatedAt: { type: Date, default: null },

    // Event attendance
    attendance: {
      checkedIn: { type: Boolean, default: false },
      checkedInAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
