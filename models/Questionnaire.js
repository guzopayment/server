import mongoose from "mongoose";

const questionnaireSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    phone: { type: String, required: true, trim: true },
    normalizedPhone: { type: String, required: true, unique: true, trim: true },

    altPhone: { type: String, default: "", trim: true },
    normalizedAltPhone: { type: String, default: "", trim: true },

    organization: { type: String, required: true, trim: true },
    sex: { type: String, required: true, trim: true },

    graduatedField: { type: String, required: true, trim: true },
    currentJob: { type: String, required: true, trim: true },

    subCity: { type: String, required: true, trim: true },
    woreda: { type: String, required: true, trim: true },
    kebele: { type: String, default: "", trim: true },

    specificPlace: { type: String, required: true, trim: true },
    nearChurch: { type: String, required: true, trim: true },

    houseType: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const Questionnaire = mongoose.model("Questionnaire", questionnaireSchema);

export default Questionnaire;
