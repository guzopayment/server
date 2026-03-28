// Y3gn@b3t$3w@m0ng0
import express from "express";
import ExcelJS from "exceljs";
import Questionnaire from "../models/Questionnaire.js";
import authMiddleware from "../middleware/authMiddleware.js";
import PDFDocument from "pdfkit";
import normalizePhone from "../utils/normalizePhone.js";
import logHistory from "../utils/logHistory.js";

const router = express.Router();

/* =========================
   EXCEL SAFE SHEET NAME
   - keeps Amharic
   - removes only Excel-forbidden chars
   - max 31 chars
========================= */
const makeUniqueSheetName = (rawName, usedNames, fallbackIndex = 1) => {
  let baseName = String(rawName || "").trim();

  if (!baseName) {
    baseName = `Sheet_${fallbackIndex}`;
  }

  // Excel forbidden characters: []:*?/\
  baseName = baseName.replace(/[\[\]\:\*\?\/\\]/g, "").trim();

  if (!baseName) {
    baseName = `Sheet_${fallbackIndex}`;
  }

  // Excel max sheet name length = 31
  baseName = baseName.slice(0, 31);

  let finalName = baseName;
  let counter = 1;

  while (usedNames.has(finalName)) {
    const suffix = `_${counter}`;
    finalName = `${baseName.slice(0, 31 - suffix.length)}${suffix}`;
    counter += 1;
  }

  usedNames.add(finalName);
  return finalName;
};

const safeFilePart = (value = "") =>
  String(value || "all")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "all";

const normalizeName = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

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
    { header: "Sub City", key: "subCity", width: 22 },
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

      normalizedFirstName: normalizeName(req.body.firstName),
      normalizedMiddleName: normalizeName(req.body.middleName),
      normalizedLastName: normalizeName(req.body.lastName),

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
      !payload.firstName &&
      !payload.middleName &&
      !payload.lastName &&
      !payload.phone &&
      !payload.organization &&
      !payload.sex &&
      !payload.graduatedField &&
      !payload.currentJob &&
      !payload.subCity &&
      !payload.woreda &&
      !payload.specificPlace &&
      !payload.nearChurch &&
      !payload.houseType
    ) {
      return res.status(400).json({ message: "⚠️ እባክዎ ሁሉንም ቅጾች ይሙሉ ! ⚠️" });
    }

    const existing = await Questionnaire.findOne({
      normalizedFirstName: payload.normalizedFirstName,
      normalizedMiddleName: payload.normalizedMiddleName,
      normalizedLastName: payload.normalizedLastName,
    });

    if (existing) {
      return res.status(409).json({ message: "⚠️ ይህን መረጃ ከዚህ በፊት ሞልተዋል ! ⚠️" });
    }

    const created = await Questionnaire.create(payload);
    await logHistory(
      "Questionnaire Submitted",
      `${created.firstName} ${created.middleName} ${created.lastName} submitted questionnaire`,
      {
        actor: "user",
        entityType: "questionnaire",
        entityId: String(created._id),
      },
    );
    return res.status(201).json({
      message: "✅ መጠይቁን በትክክል ሞልተው አስገብተዋል! ✅",
      data: created,
    });
  } catch (err) {
    console.error("QUESTIONNAIRE CREATE ERROR:", err);

    if (
      err?.code === 11000 &&
      (err?.keyPattern?.normalizedFirstName ||
        err?.keyPattern?.normalizedMiddleName ||
        err?.keyPattern?.normalizedLastName)
    ) {
      return res.status(409).json({
        message: "⚠️ ይህ ሰው ከዚህ በፊት ተመዝግቧል! ⚠️",
      });
    }

    return res.status(500).json({
      message: "የኢንተርኔት ግንኙነት ተቋርጧል ወይም የተሳሳተ ነገር ተከስቷል።  እባክዎ እንደገና ይሞክሩ።",
    });
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
        ? {
            firstName: String(req.body.firstName).trim(),
            normalizedFirstName: normalizeName(req.body.firstName),
          }
        : {}),
      ...(req.body.middleName !== undefined
        ? {
            middleName: String(req.body.middleName).trim(),
            normalizedMiddleName: normalizeName(req.body.middleName),
          }
        : {}),
      ...(req.body.lastName !== undefined
        ? {
            lastName: String(req.body.lastName).trim(),
            normalizedLastName: normalizeName(req.body.lastName),
          }
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

    const current = await Questionnaire.findById(req.params.id);

    if (!current) {
      return res.status(404).json({ message: "Questionnaire not found" });
    }

    const nextFirstName =
      updateData.normalizedFirstName || current.normalizedFirstName;
    const nextMiddleName =
      updateData.normalizedMiddleName || current.normalizedMiddleName;
    const nextLastName =
      updateData.normalizedLastName || current.normalizedLastName;

    const duplicateByName = await Questionnaire.findOne({
      _id: { $ne: req.params.id },
      normalizedFirstName: nextFirstName,
      normalizedMiddleName: nextMiddleName,
      normalizedLastName: nextLastName,
    });

    if (duplicateByName) {
      return res.status(409).json({
        message: "⚠️ ይህ ሰው ከዚህ በፊት ተመዝግቧል! ⚠️",
      });
    }

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

    if (
      err?.code === 11000 &&
      (err?.keyPattern?.normalizedFirstName ||
        err?.keyPattern?.normalizedMiddleName ||
        err?.keyPattern?.normalizedLastName)
    ) {
      return res.status(409).json({
        message: "⚠️ ይህ ሰው ከዚህ በፊት ተመዝግቧል! ⚠️",
      });
    }

    return res.status(500).json({
      message: "የኢንተርኔት ግንኙነት ተቋርጧል ወይም የተሳሳተ ነገር ተከስቷል። እባክዎ እንደገና ይሞክሩ።",
    });
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
    await logHistory(
      "Questionnaire Deleted",
      `${deleted.firstName} ${deleted.middleName} ${deleted.lastName} record was deleted`,
      {
        actor: "admin",
        entityType: "questionnaire",
        entityId: String(deleted._id),
      },
    );
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
      if (!acc[subCity][woreda][nearChurch]) {
        acc[subCity][woreda][nearChurch] = [];
      }

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
    await logHistory(
      "Export All Questionnaire Excel",
      "Admin exported all questionnaire data to Excel",
      {
        actor: "admin",
        entityType: "export",
      },
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
      const key = (item.subCity || "Unknown").trim() || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const usedSheetNames = new Set();
    const keys = Object.keys(grouped);

    if (keys.length === 0) {
      const sheet = workbook.addWorksheet("Questionnaires");
      addQuestionnaireSheet(sheet, []);
    } else {
      keys.forEach((subCity, index) => {
        let baseName = String(subCity || "Unknown").trim();
        if (!baseName) baseName = "Unknown";

        // Excel forbidden characters only
        baseName = baseName.replace(/[\[\]\:\*\?\/\\]/g, "").trim();

        if (!baseName) {
          baseName = `Sheet_${index + 1}`;
        }

        baseName = baseName.slice(0, 25);

        let sheetName = baseName;
        let counter = 1;

        while (usedSheetNames.has(sheetName)) {
          const suffix = `_${counter}`;
          sheetName = `${baseName.slice(0, 31 - suffix.length)}${suffix}`;
          counter += 1;
        }

        usedSheetNames.add(sheetName);

        const sheet = workbook.addWorksheet(sheetName);
        addQuestionnaireSheet(sheet, grouped[subCity]);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    res.status(200);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="questionnaires-by-subcity.xlsx"',
    );
    await logHistory(
      "Export Questionnaire By Sub-City",
      "Admin exported questionnaire data grouped by sub-city to Excel",
      {
        actor: "admin",
        entityType: "export",
      },
    );

    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("QUESTIONNAIRE EXPORT BY SUBCITY ERROR:", err);
    return res.status(500).json({
      message: err.message || "Server error",
    });
  }
});

/* =========================
   EXPORT BY SUBCITY TO EXCEL IN ONE SHEET
========================= */
router.get(
  "/export/excel/by-subcity-one-sheet",
  authMiddleware,
  async (req, res) => {
    try {
      const rows = await Questionnaire.find().sort({
        subCity: 1,
        woreda: 1,
        nearChurch: 1,
        createdAt: -1,
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("By_Sub_City");

      sheet.columns = [
        { header: "Sub City", key: "subCity", width: 22 },
        { header: "First Name", key: "firstName", width: 18 },
        { header: "Middle Name", key: "middleName", width: 18 },
        { header: "Last Name", key: "lastName", width: 18 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "Organization", key: "organization", width: 30 },
        { header: "Current Job", key: "currentJob", width: 22 },
        { header: "Woreda", key: "woreda", width: 12 },
        { header: "Near Church", key: "nearChurch", width: 24 },
        { header: "Created At", key: "createdAt", width: 22 },
      ];

      rows.forEach((item) => {
        sheet.addRow({
          subCity: item.subCity || "",
          firstName: item.firstName || "",
          middleName: item.middleName || "",
          lastName: item.lastName || "",
          phone: item.phone || "",
          organization: item.organization || "",
          currentJob: item.currentJob || "",
          woreda: item.woreda || "",
          nearChurch: item.nearChurch || "",
          createdAt: item.createdAt
            ? new Date(item.createdAt).toLocaleString()
            : "",
        });
      });

      sheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();

      res.status(200);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="questionnaires-by-subcity-one-sheet.xlsx"',
      );

      return res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("EXPORT BY SUBCITY ONE SHEET ERROR:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  },
);
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

    const fileName = `questionnaire_${safeFilePart(subCity)}_${safeFilePart(woreda)}_${safeFilePart(nearChurch)}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();

    res.status(200);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("QUESTIONNAIRE EXPORT GROUP ERROR:", err);
    return res.status(500).send(err.message || "Server error");
  }
});
/* =========================
   EXPORT SUB-CITY TO PDF
========================= */
router.get("/export/pdf/by-subcity", authMiddleware, async (req, res) => {
  try {
    const rows = await Questionnaire.find().sort({
      subCity: 1,
      woreda: 1,
      nearChurch: 1,
      createdAt: -1,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="questionnaires-by-subcity.pdf"',
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text("Questionnaire By Sub City Report", {
      align: "center",
    });
    doc.moveDown();

    let currentSubCity = "";

    rows.forEach((row, index) => {
      if (row.subCity !== currentSubCity) {
        currentSubCity = row.subCity || "Unknown";
        doc.moveDown();
        doc.fontSize(14).text(`Sub City: ${currentSubCity}`, {
          underline: true,
        });
        doc.moveDown(0.5);
      }

      const fullName =
        `${row.firstName || ""} ${row.middleName || ""} ${row.lastName || ""}`.trim();

      doc
        .fontSize(10)
        .text(
          `${index + 1}. ${fullName} | ${row.phone || ""} | ${row.organization || ""} | ${row.currentJob || ""}`,
        );
    });

    doc.end();
  } catch (err) {
    console.error("EXPORT PDF BY SUBCITY ERROR:", err);
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

    const fileName = `questionnaire_${safeFilePart(subCity)}_${safeFilePart(woreda)}_${safeFilePart(nearChurch)}.pdf`;

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
    await logHistory(
      "Export Questionnaire Group PDF",
      `Admin exported PDF for ${subCity || "All"} / ${woreda || "All"} / ${nearChurch || "All"}`,
      {
        actor: "admin",
        entityType: "export",
      },
    );
    doc.end();
  } catch (err) {
    console.error("QUESTIONNAIRE PDF EXPORT ERROR:", err);
    return res.status(500).send(err.message || "Server error");
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
