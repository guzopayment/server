import ExcelJS from "exceljs";

router.get("/export/:subCity", adminAuth, async (req, res) => {
  const data = await Questionnaire.find({ subCity: req.params.subCity });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");

  sheet.columns = [
    { header: "First Name", key: "firstName" },
    { header: "Phone", key: "phone" },
    { header: "Organization", key: "organization" },
    { header: "SubCity", key: "subCity" },
    { header: "Woreda", key: "woreda" },
  ];

  data.forEach((d) => sheet.addRow(d));

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  await workbook.xlsx.write(res);
  res.end();
});
