// import express from "express";
// import Booking from "../models/Booking.js";

// const router = express.Router();

// router.get("/confirmed", async (req, res) => {
//   try {
//     const data = await Booking.find({ status: "Confirmed" }).sort({
//       createdAt: -1,
//     });
//     res.json(data);
//   } catch (err) {
//     console.error("REPORT /confirmed error:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

// router.get("/export/pdf", async (req, res) => {
//   try {
//     const data = await Booking.find({ status: "Confirmed" }).sort({
//       createdAt: -1,
//     });
//     // (you’re not generating a real PDF yet — you return JSON. fine for now)
//     res.setHeader("Content-Type", "application/json");
//     res.send(JSON.stringify(data, null, 2));
//   } catch (err) {
//     console.error("REPORT /export/pdf error:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

// router.get("/export/excel", async (req, res) => {
//   try {
//     const data = await Booking.find({ status: "Confirmed" }).sort({
//       createdAt: -1,
//     });
//     res.setHeader("Content-Type", "application/json");
//     res.send(JSON.stringify(data, null, 2));
//   } catch (err) {
//     console.error("REPORT /export/excel error:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

// export default router;
import express from "express";
import Booking from "../models/Booking.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Data used by the report page table
router.get("/confirmed", auth, async (_req, res) => {
  try {
    const data = await Booking.find({ status: "Confirmed" }).sort({
      createdAt: -1,
    });
    res.json(data);
  } catch (err) {
    console.error("Report confirmed error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Export PDF
router.get("/export/pdf", auth, async (_req, res) => {
  try {
    const rows = await Booking.find({ status: "Confirmed" }).sort({
      createdAt: -1,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=confirmed-report.pdf",
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text("Confirmed Bookings Report", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(11).text(`Total Records: ${rows.length}`);
    doc.moveDown(1);

    // Table header
    doc.fontSize(12).text("Name", 40, doc.y, { continued: true });
    doc.text("Organization", 180, doc.y, { continued: true });
    doc.text("Phone", 330, doc.y, { continued: true });
    doc.text("Participants", 440, doc.y);
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    // Rows
    doc.fontSize(10);
    for (const r of rows) {
      const y = doc.y;
      if (y > 760) doc.addPage();

      doc.text(r.name || "—", 40, doc.y, { width: 130, continued: true });
      doc.text(r.organization || "—", 180, doc.y, {
        width: 140,
        continued: true,
      });
      doc.text(r.phone || "—", 330, doc.y, { width: 100, continued: true });
      doc.text(String(r.participants ?? 0), 440, doc.y);
      doc.moveDown(0.4);
    }

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Export Excel
router.get("/export/excel", auth, async (_req, res) => {
  try {
    const rows = await Booking.find({ status: "Confirmed" }).sort({
      createdAt: -1,
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Confirmed");

    ws.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Organization", key: "organization", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Participants", key: "participants", width: 12 },
      { header: "Created At", key: "createdAt", width: 22 },
    ];

    rows.forEach((r) => {
      ws.addRow({
        name: r.name || "",
        organization: r.organization || "",
        phone: r.phone || "",
        participants: r.participants ?? 0,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
      });
    });

    ws.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=confirmed-report.xlsx",
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
