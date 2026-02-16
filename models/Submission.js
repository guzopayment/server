import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    fullName: String,
    organization: String,
    phone: String,

    participantsCount: {
      type: Number,
      default: 1,
    },

    paymentProof: String,

    paymentStatus: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Submission", submissionSchema);
