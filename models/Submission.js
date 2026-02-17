import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    name: String,
    organization: String,
    phone: String,

    participants: {
      type: Number,
      default: 0,
    },

    paymentProof: String,

    status: {
      type: String,
      default: "Pending",
    },
    action: {
      type: Boolean,
      default: "No action",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Submission", submissionSchema);
