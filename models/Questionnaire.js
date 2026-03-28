// import mongoose from "mongoose";

// const questionnaireSchema = new mongoose.Schema(
//   {
//     firstName: { type: String, required: true, trim: true },
//     middleName: { type: String, required: true, trim: true },
//     lastName: { type: String, required: true, trim: true },

//     normalizedFirstName: { type: String, required: true, trim: true },
//     normalizedMiddleName: { type: String, required: true, trim: true },
//     normalizedLastName: { type: String, required: true, trim: true },

//     phone: { type: String, required: true, trim: true },
//     normalizedPhone: { type: String, required: true, trim: true },

//     altPhone: { type: String, default: "", trim: true },
//     normalizedAltPhone: { type: String, default: "", trim: true },

//     organization: { type: String, required: true, trim: true },
//     sex: { type: String, required: true, trim: true },

//     graduatedField: { type: String, required: true, trim: true },
//     currentJob: { type: String, required: true, trim: true },

//     subCity: { type: String, required: true, trim: true },
//     woreda: { type: String, required: true, trim: true },
//     kebele: { type: String, default: "", trim: true },

//     specificPlace: { type: String, required: true, trim: true },
//     nearChurch: { type: String, required: true, trim: true },

//     houseType: { type: String, required: true, trim: true },
//   },
//   { timestamps: true },
// );

// questionnaireSchema.index(
//   {
//     normalizedFirstName: 1,
//     normalizedMiddleName: 1,
//     normalizedLastName: 1,
//   },
//   { unique: true, name: "unique_person_full_name" },
// );

// const Questionnaire = mongoose.model("Questionnaire", questionnaireSchema);

// export default Questionnaire;
import mongoose from "mongoose";

const questionnaireSchema = new mongoose.Schema(
  {
    questionnaireId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    normalizedFirstName: { type: String, required: true, trim: true },
    normalizedMiddleName: { type: String, required: true, trim: true },
    normalizedLastName: { type: String, required: true, trim: true },

    phone: { type: String, required: true, trim: true },
    normalizedPhone: { type: String, required: true, trim: true },

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

questionnaireSchema.index(
  {
    normalizedFirstName: 1,
    normalizedMiddleName: 1,
    normalizedLastName: 1,
  },
  { unique: true, name: "unique_person_full_name" },
);

const Questionnaire = mongoose.model("Questionnaire", questionnaireSchema);

export default Questionnaire;
