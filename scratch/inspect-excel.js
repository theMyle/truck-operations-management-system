const XLSX = require("xlsx");
const path = "D:\\ely edit\\Billing_XMD_Logistics_2026-07-12_2026-07-19.xlsx";

try {
  const wb = XLSX.readFile(path, { cellDates: true, cellStyles: true, cellFormulas: true });
  console.log("Sheet Names:", wb.SheetNames);
  
  wb.SheetNames.forEach((sheetName) => {
    console.log(`\n================ SHEET: ${sheetName} ================`);
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
    for (let i = 0; i < Math.min(data.length, 30); i++) {
      console.log(`Row ${i + 1}:`, JSON.stringify(data[i]));
    }
  });
} catch (err) {
  console.error("Error reading file:", err);
}
