import express from "express";
import ExcelJS from "exceljs";
import Questionnaire from "../models/Questionnaire.js";
import authMiddleware from "../middleware/authMiddleware.js";
import PDFDocument from "pdfkit";
import normalizePhone from "../utils/normalizePhone.js";

const router = express.Router();

const safeFilePart = (value = "") =>
  String(value || "all")
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "all";

/* =========================
   CREATE QUESTIONNAIRE
========================= */
router.post("/", async (req, res) => {
  try {
    const rawPhone = (req.body.phone || "").trim();
    const rawAltPhone = (req.body.altPhone || "").trim();

    const payload = {
      firstName: (req.body.firstName || "").trim(),
      middleName: (req.body.middleName || "").trim(),
      lastName: (req.body.lastName || "").trim(),

      phone: rawPhone,
      normalizedPhone: normalizePhone(rawPhone),

      altPhone: rawAltPhone,
      normalizedAltPhone: rawAltPhone ? normalizePhone(rawAltPhone) : "",

      organization: (req.body.organization || "").trim(),
      sex: (req.body.sex || "").trim(),
      graduatedField: (req.body.graduatedField || "").trim(),
      currentJob: (req.body.currentJob || "").trim(),
      subCity: (req.body.subCity || "").trim(),
      woreda: (req.body.woreda || "").trim(),
      kebele: (req.body.kebele || "").trim(),
      specificPlace: (req.body.specificPlace || "").trim(),
      nearChurch: (req.body.nearChurch || "").trim(),
      houseType: (req.body.houseType || "").trim(),
    };

    if (
      !payload.firstName ||
      !payload.middleName ||
      !payload.lastName ||
      !payload.phone ||
      !payload.organization ||
      !payload.sex ||
      !payload.graduatedField ||
      !payload.currentJob ||
      !payload.subCity ||
      !payload.woreda ||
      !payload.specificPlace ||
      !payload.nearChurch ||
      !payload.houseType
    ) {
      return res.status(400).json({ message: "⚠️ እባክዎ ሁሉንም ቅጾች ይሙሉ  !⚠️" });
    }

    const existing = await Questionnaire.findOne({
      firstName: payload.firstName,
      middleName: payload.middleName,
      lastName: payload.lastName,
      normalizedPhone: payload.normalizedPhone,
    });

    if (existing) {
      return res.status(409).json({ message: "⚠️ ይህን መረጃ ከዚህ በፊት ሞልተዋል !⚠️" });
    }

    const created = await Questionnaire.create(payload);

    return res.status(201).json({
      message: "✅ መጠይቁን በትክክል ሞልተው አስገብተዋል! ✅",
      data: created,
    });
  } catch (err) {
    console.error("QUESTIONNAIRE CREATE ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =========================
   GET ALL QUESTIONNAIRES
========================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const list = await Questionnaire.find().sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    console.error("QUESTIONNAIRE LIST ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =========================
   UPDATE QUESTIONNAIRE
========================= */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updateData = {
      ...(req.body.firstName !== undefined
        ? { firstName: String(req.body.firstName).trim() }
        : {}),
      ...(req.body.middleName !== undefined
        ? { middleName: String(req.body.middleName).trim() }
        : {}),
      ...(req.body.lastName !== undefined
        ? { lastName: String(req.body.lastName).trim() }
        : {}),
      ...(req.body.phone !== undefined
        ? {
            phone: String(req.body.phone).trim(),
            normalizedPhone: normalizePhone(req.body.phone),
          }
        : {}),
      ...(req.body.altPhone !== undefined
        ? {
            altPhone: String(req.body.altPhone).trim(),
            normalizedAltPhone: req.body.altPhone
              ? normalizePhone(req.body.altPhone)
              : "",
          }
        : {}),
      ...(req.body.organization !== undefined
        ? { organization: String(req.body.organization).trim() }
        : {}),
      ...(req.body.sex !== undefined
        ? { sex: String(req.body.sex).trim() }
        : {}),
      ...(req.body.graduatedField !== undefined
        ? { graduatedField: String(req.body.graduatedField).trim() }
        : {}),
      ...(req.body.currentJob !== undefined
        ? { currentJob: String(req.body.currentJob).trim() }
        : {}),
      ...(req.body.subCity !== undefined
        ? { subCity: String(req.body.subCity).trim() }
        : {}),
      ...(req.body.woreda !== undefined
        ? { woreda: String(req.body.woreda).trim() }
        : {}),
      ...(req.body.kebele !== undefined
        ? { kebele: String(req.body.kebele).trim() }
        : {}),
      ...(req.body.specificPlace !== undefined
        ? { specificPlace: String(req.body.specificPlace).trim() }
        : {}),
      ...(req.body.nearChurch !== undefined
        ? { nearChurch: String(req.body.nearChurch).trim() }
        : {}),
      ...(req.body.houseType !== undefined
        ? { houseType: String(req.body.houseType).trim() }
        : {}),
    };

    const updated = await Questionnaire.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Questionnaire not found" });
    }

    return res.json({ message: "Updated", data: updated });
  } catch (err) {
    console.error("QUESTIONNAIRE UPDATE ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =========================
   DELETE QUESTIONNAIRE
========================= */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Questionnaire.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Questionnaire not found" });
    }

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("QUESTIONNAIRE DELETE ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =========================
   GET GROUPED QUESTIONNAIRES
========================= */
router.get("/grouped/all", authMiddleware, async (req, res) => {
  try {
    const items = await Questionnaire.find().sort({
      subCity: 1,
      woreda: 1,
      nearChurch: 1,
      createdAt: -1,
    });

    const grouped = items.reduce((acc, item) => {
      const subCity = item.subCity || "Unknown";
      const woreda = item.woreda || "Unknown";
      const nearChurch = item.nearChurch || "Unknown";

      if (!acc[subCity]) acc[subCity] = {};
      if (!acc[subCity][woreda]) acc[subCity][woreda] = {};
      if (!acc[subCity][woreda][nearChurch])
        acc[subCity][woreda][nearChurch] = [];

      acc[subCity][woreda][nearChurch].push(item);
      return acc;
    }, {});

    return res.json(grouped);
  } catch (err) {
    console.error("QUESTIONNAIRE GROUP ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =========================
   EXPORT HELPERS
========================= */
const addQuestionnaireSheet = (sheet, rows) => {
  sheet.columns = [
    { header: "First Name", key: "firstName", width: 18 },
    { header: "Middle Name", key: "middleName", width: 18 },
    { header: "Last Name", key: "lastName", width: 18 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Alt Phone", key: "altPhone", width: 18 },
    { header: "Organization", key: "organization", width: 30 },
    { header: "Sex", key: "sex", width: 12 },
    { header: "Graduated Field", key: "graduatedField", width: 22 },
    { header: "Current Job", key: "currentJob", width: 22 },
    { header: "Sub City", key: "subCity", width: 18 },
    { header: "Woreda", key: "woreda", width: 12 },
    { header: "Kebele", key: "kebele", width: 12 },
    { header: "Specific Place", key: "specificPlace", width: 28 },
    { header: "Near Church", key: "nearChurch", width: 24 },
    { header: "House Type", key: "houseType", width: 14 },
    { header: "Created At", key: "createdAt", width: 22 },
  ];

  rows.forEach((item) => {
    sheet.addRow({
      firstName: item.firstName || "",
      middleName: item.middleName || "",
      lastName: item.lastName || "",
      phone: item.phone || "",
      altPhone: item.altPhone || "",
      organization: item.organization || "",
      sex: item.sex || "",
      graduatedField: item.graduatedField || "",
      currentJob: item.currentJob || "",
      subCity: item.subCity || "",
      woreda: item.woreda || "",
      kebele: item.kebele || "",
      specificPlace: item.specificPlace || "",
      nearChurch: item.nearChurch || "",
      houseType: item.houseType || "",
      createdAt: item.createdAt
        ? new Date(item.createdAt).toLocaleString()
        : "",
    });
  });

  sheet.getRow(1).font = { bold: true };
};

/* =========================
   EXPORT ALL TO EXCEL
========================= */
router.get("/export/excel/all", authMiddleware, async (req, res) => {
  try {
    const rows = await Questionnaire.find().sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Questionnaires");

    addQuestionnaireSheet(sheet, rows);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="questionnaires-all.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("QUESTIONNAIRE EXPORT ALL ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =========================
   EXPORT BY SUB-CITY TO EXCEL
========================= */
router.get("/export/excel/by-subcity", authMiddleware, async (req, res) => {
  try {
    const rows = await Questionnaire.find().sort({
      subCity: 1,
      woreda: 1,
      nearChurch: 1,
      createdAt: -1,
    });

    const workbook = new ExcelJS.Workbook();

    const grouped = rows.reduce((acc, item) => {
      const key = item.subCity || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const keys = Object.keys(grouped);

    if (keys.length === 0) {
      const emptySheet = workbook.addWorksheet("Questionnaires");
      addQuestionnaireSheet(emptySheet, []);
    } else {
      keys.forEach((key) => {
        const safeSheetName = safeFilePart(key).slice(0, 31) || "Sheet";
        const sheet = workbook.addWorksheet(safeSheetName);
        addQuestionnaireSheet(sheet, grouped[key]);
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="questionnaires-by-subcity.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("QUESTIONNAIRE EXPORT BY SUBCITY ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =========================
   EXPORT GROUP TO EXCEL
========================= */
router.get("/export/excel/group", authMiddleware, async (req, res) => {
  try {
    const subCity = String(req.query.subCity || "").trim();
    const woreda = String(req.query.woreda || "").trim();
    const nearChurch = String(req.query.nearChurch || "").trim();

    const filter = {};
    if (subCity) filter.subCity = subCity;
    if (woreda) filter.woreda = woreda;
    if (nearChurch) filter.nearChurch = nearChurch;

    const rows = await Questionnaire.find(filter).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Grouped_Report");

    addQuestionnaireSheet(sheet, rows);

    const fileName = `questionnaire-group-${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("QUESTIONNAIRE EXPORT GROUP ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});
/* =========================
   EXPORT GROUP TO PDF
========================= */
router.get("/export/pdf/group", authMiddleware, async (req, res) => {
  try {
    const subCity = String(req.query.subCity || "").trim();
    const woreda = String(req.query.woreda || "").trim();
    const nearChurch = String(req.query.nearChurch || "").trim();

    const filter = {};
    if (subCity) filter.subCity = subCity;
    if (woreda) filter.woreda = woreda;
    if (nearChurch) filter.nearChurch = nearChurch;

    const rows = await Questionnaire.find(filter).sort({ createdAt: -1 });

    const fileName = `questionnaire-group-${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text("Questionnaire Group Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Sub City: ${subCity || "All"}`);
    doc.text(`Woreda: ${woreda || "All"}`);
    doc.text(`Near Church: ${nearChurch || "All"}`);
    doc.text(`Total Records: ${rows.length}`);
    doc.moveDown();

    rows.forEach((row, index) => {
      const fullName =
        `${row.firstName || ""} ${row.middleName || ""} ${row.lastName || ""}`.trim();

      doc.fontSize(11).text(`${index + 1}. ${fullName || "N/A"}`, {
        underline: true,
      });

      doc.fontSize(10).text(`Phone: ${row.phone || ""}`);
      doc.text(`Alt Phone: ${row.altPhone || ""}`);
      doc.text(`Organization: ${row.organization || ""}`);
      doc.text(`Sex: ${row.sex || ""}`);
      doc.text(`Graduated Field: ${row.graduatedField || ""}`);
      doc.text(`Current Job: ${row.currentJob || ""}`);
      doc.text(`Sub City: ${row.subCity || ""}`);
      doc.text(`Woreda: ${row.woreda || ""}`);
      doc.text(`Kebele: ${row.kebele || ""}`);
      doc.text(`Specific Place: ${row.specificPlace || ""}`);
      doc.text(`Near Church: ${row.nearChurch || ""}`);
      doc.text(`House Type: ${row.houseType || ""}`);
      doc.text(
        `Submitted: ${
          row.createdAt ? new Date(row.createdAt).toLocaleString() : ""
        }`,
      );

      doc.moveDown();

      if (index < rows.length - 1) {
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown();
      }
    });

    doc.end();
  } catch (err) {
    console.error("QUESTIONNAIRE PDF EXPORT ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});
/* =========================
   ANALYTICS SUMMARY
========================= */
router.get("/analytics/summary", authMiddleware, async (req, res) => {
  try {
    const total = await Questionnaire.countDocuments();

    const bySubCityAgg = await Questionnaire.aggregate([
      {
        $group: {
          _id: "$subCity",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const bySexAgg = await Questionnaire.aggregate([
      {
        $group: {
          _id: "$sex",
          count: { $sum: 1 },
        },
      },
    ]);

    const byHouseTypeAgg = await Questionnaire.aggregate([
      {
        $group: {
          _id: "$houseType",
          count: { $sum: 1 },
        },
      },
    ]);

    const byOrganizationAgg = await Questionnaire.aggregate([
      {
        $group: {
          _id: "$organization",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      total,
      bySubCity: bySubCityAgg.map((x) => ({
        name: x._id || "Unknown",
        count: x.count,
      })),
      bySex: bySexAgg.map((x) => ({
        name: x._id || "Unknown",
        count: x.count,
      })),
      byHouseType: byHouseTypeAgg.map((x) => ({
        name: x._id || "Unknown",
        count: x.count,
      })),
      topOrganizations: byOrganizationAgg.map((x) => ({
        name: x._id || "Unknown",
        count: x.count,
      })),
    });
  } catch (err) {
    console.error("QUESTIONNAIRE ANALYTICS ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
