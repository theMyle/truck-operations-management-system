"use client";

import React, { useState, useMemo } from "react";
import {
  Alert,
  Modal,
  Stack,
  Group,
  Text,
  TextInput,
  Button,
  Paper,
  Table,
  Badge,
  Switch,
  Divider,
  ScrollArea,
  SimpleGrid,
} from "@mantine/core";
import {
  IconFileInvoice,
  IconDownload,
  IconPrinter,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import * as XLSX from "xlsx-js-style";
import { BillingRecord } from "@/app/(app)/billing/page";
import { updateBillingStatusAction } from "@/lib/actions/billing";
import { generateSoaNumber } from "@/lib/utils/stringFormat";

interface StatementOfAccountModalProps {
  opened: boolean;
  onClose: () => void;
  selectedRecords: BillingRecord[];
  onSuccess: () => void;
}

export function StatementOfAccountModal({
  opened,
  onClose,
  selectedRecords,
  onSuccess,
}: StatementOfAccountModalProps) {
  const [soaNumber, setSoaNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [includeVat, setIncludeVat] = useState(true);
  const [includeEwt, setIncludeEwt] = useState(true);
  const [saving, setSaving] = useState(false);

  // Derive Client Name from first record
  const clientName = selectedRecords[0]?.clientName || selectedRecords[0]?.client || "CLIENT";

  // Auto-generate SOA Number if empty when modal opens
  React.useEffect(() => {
    if (opened && selectedRecords.length > 0 && !soaNumber) {
      const existingSoas = selectedRecords
        .map((r) => r.soaNumber)
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0);
      setSoaNumber(generateSoaNumber(clientName, existingSoas));
    }
  }, [opened, selectedRecords, clientName, soaNumber]);

  /* ── Financial Calculations ── */
  const calculations = useMemo(() => {
    let baseTotal = 0;
    let excessDropTotal = 0;

    selectedRecords.forEach((r) => {
      const rate = Number(r.tripRate || 0);
      baseTotal += rate;
      // Optional excess drop calculation
      const drops = r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1);
      if (drops > 1) {
        excessDropTotal += (drops - 1) * 300; // 300 per excess drop standard
      }
    });

    const netOfVat = baseTotal + excessDropTotal;
    const vatAmount = includeVat ? netOfVat * 0.12 : 0;
    const ewtAmount = includeEwt ? netOfVat * 0.02 : 0;
    const totalDue = netOfVat + vatAmount - ewtAmount;

    return {
      baseTotal,
      excessDropTotal,
      netOfVat,
      vatAmount,
      ewtAmount,
      totalDue,
    };
  }, [selectedRecords, includeVat, includeEwt]);

  // Handle Save SOA to Database
  async function handleSaveSoa() {
    if (!soaNumber.trim()) {
      notifications.show({
        title: "SOA Number Required",
        message: "Please enter or confirm an SOA Number.",
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await updateBillingStatusAction({
        bookingIds: selectedRecords.map((r) => String(r.id)),
        soaNumber: soaNumber.trim().toUpperCase(),
        invoiceDate,
        dueDate,
      });

      if (res?.data?.success) {
        notifications.show({
          title: "SOA Generated",
          message: `Successfully issued ${soaNumber.toUpperCase()} for ${selectedRecords.length} trip(s).`,
          color: "green",
          icon: <IconCheck size={16} />,
        });
        onSuccess();
        onClose();
      } else {
        notifications.show({
          title: "Error",
          message: "Failed to update SOA details.",
          color: "red",
        });
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "An unexpected error occurred.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  }

  // Export Excel Matching Client Sample Sheet Layout
  function handleExportExcel() {
    const wb = XLSX.utils.book_new();

    const borderThin = {
      top: { style: "thin", color: { rgb: "CBD5E1" } },
      bottom: { style: "thin", color: { rgb: "CBD5E1" } },
      left: { style: "thin", color: { rgb: "CBD5E1" } },
      right: { style: "thin", color: { rgb: "CBD5E1" } },
    };

    const headerStyle = {
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E3A8A" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: borderThin,
    };

    const companyTitleStyle = {
      font: { name: "Calibri", sz: 14, bold: true, color: { rgb: "1E3A8A" } },
      alignment: { horizontal: "left", vertical: "center" },
    };

    const companySubStyle = {
      font: { name: "Calibri", sz: 9, italic: true, color: { rgb: "475569" } },
      alignment: { horizontal: "left", vertical: "center" },
    };

    const bannerStyle = {
      font: { name: "Calibri", sz: 13, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    const labelBoldStyle = {
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
    };

    const dataCellCenter = {
      font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: borderThin,
    };

    const dataCellLeft = {
      font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: borderThin,
    };

    const dataCellRight = {
      font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: borderThin,
      numFmt: "#,##0.00",
    };

    const dataCellRightBold = {
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: borderThin,
      numFmt: "#,##0.00",
    };

    const totalRowLabel = {
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
      alignment: { horizontal: "right", vertical: "center" },
    };

    const grandTotalStyle = {
      font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "1E3A8A" } },
      fill: { fgColor: { rgb: "FEF08A" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "1E3A8A" } },
        bottom: { style: "double", color: { rgb: "1E3A8A" } },
        left: { style: "thin", color: { rgb: "1E3A8A" } },
        right: { style: "thin", color: { rgb: "1E3A8A" } },
      },
      numFmt: "₱#,##0.00",
    };

    const ws: XLSX.WorkSheet = {};

    function setCell(r: number, c: number, val: any, style?: any, type?: string) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      ws[cellRef] = {
        v: val,
        t: type || (typeof val === "number" ? "n" : "s"),
        s: style,
      };
    }

    // Company Header
    setCell(0, 0, "KRISDOMINGO TRUCKING SERVICES OPC", companyTitleStyle);
    setCell(1, 0, "Blk 15 Damayan Sitio Lumang Ilog Floodway B. Damayan San Juan, Taytay Rizal", companySubStyle);
    setCell(2, 0, "TIN NO: 698-121-203-00000 | CONTACT: 0964-980-9864 | EMAIL: krisdomingo.ts@gmail.com", companySubStyle);

    // Banner
    for (let c = 0; c < 11; c++) {
      setCell(4, c, c === 0 ? "STATEMENT OF ACCOUNT" : "", bannerStyle);
    }

    // Billing Info Meta
    setCell(6, 0, "Client:", labelBoldStyle);
    setCell(6, 2, clientName.toUpperCase(), labelBoldStyle);
    setCell(6, 7, "Billing Date:", labelBoldStyle);
    setCell(6, 9, invoiceDate);

    setCell(7, 0, "SOA No:", labelBoldStyle);
    setCell(7, 2, soaNumber.toUpperCase(), labelBoldStyle);
    setCell(7, 7, "Due Date:", labelBoldStyle);
    setCell(7, 9, dueDate);

    // Table Headers
    const headers = [
      "#", "Date", "DR / Booking #", "Plate #", "Fleet Type",
      "Pickup Location", "# Drops", "Drop-Off Location",
      "Base Rate (₱)", "Excess Drop (₱)", "Amount (₱)"
    ];

    headers.forEach((h, colIdx) => {
      setCell(9, colIdx, h, headerStyle);
    });

    let currentRow = 10;
    let totalBase = 0;
    let totalExcess = 0;
    let totalGross = 0;

    selectedRecords.forEach((r, idx) => {
      const rate = Number(r.tripRate || 0);
      const drops = r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1);
      const excess = drops > 1 ? (drops - 1) * 300 : 0;
      const total = rate + excess;

      totalBase += rate;
      totalExcess += excess;
      totalGross += total;

      setCell(currentRow, 0, idx + 1, dataCellCenter);
      setCell(currentRow, 1, r.pickUpDate || r.date || "—", dataCellCenter);
      setCell(currentRow, 2, r.bookingDRNo || r.bookingDr || "—", dataCellCenter);
      setCell(currentRow, 3, r.plateNo || "—", dataCellCenter);
      setCell(currentRow, 4, r.fleetType || r.unit || "—", dataCellCenter);
      setCell(currentRow, 5, r.pickLocation || "—", dataCellLeft);
      setCell(currentRow, 6, drops, dataCellCenter);
      setCell(currentRow, 7, (r.dropOffLocation || "—").replace(/\n/g, ", "), dataCellLeft);
      setCell(currentRow, 8, rate, dataCellRight);
      setCell(currentRow, 9, excess, dataCellRight);
      setCell(currentRow, 10, total, dataCellRightBold);

      currentRow++;
    });

    // Table Total Row
    setCell(currentRow, 0, "Total:", totalRowLabel);
    setCell(currentRow, 8, totalBase, dataCellRightBold);
    setCell(currentRow, 9, totalExcess, dataCellRightBold);
    setCell(currentRow, 10, totalGross, dataCellRightBold);
    currentRow += 2;

    // Financial Breakdown
    setCell(currentRow, 8, "Net of VAT:", totalRowLabel);
    setCell(currentRow, 10, calculations.netOfVat, dataCellRightBold);
    currentRow++;

    if (includeVat) {
      setCell(currentRow, 8, "Add: 12% VAT:", totalRowLabel);
      setCell(currentRow, 10, calculations.vatAmount, dataCellRightBold);
      currentRow++;
    }

    if (includeEwt) {
      setCell(currentRow, 8, "Less: 2% EWT:", totalRowLabel);
      setCell(currentRow, 10, calculations.ewtAmount, dataCellRightBold);
      currentRow++;
    }

    setCell(currentRow, 8, "TOTAL AMOUNT DUE:", totalRowLabel);
    setCell(currentRow, 10, calculations.totalDue, grandTotalStyle);
    currentRow += 3;

    // Signatures
    setCell(currentRow, 0, "Prepared By:", labelBoldStyle);
    setCell(currentRow, 6, "Approved By Client:", labelBoldStyle);
    currentRow += 2;

    setCell(currentRow, 0, "Roselyn D. Panong", labelBoldStyle);
    setCell(currentRow, 6, "_______________________", labelBoldStyle);
    currentRow++;

    setCell(currentRow, 0, "KTS - Billing Officer", companySubStyle);
    setCell(currentRow, 6, "Authorized Signature", companySubStyle);

    ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: currentRow, c: 10 });

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 10 } },
    ];

    ws["!cols"] = [
      { wch: 5 },  // #
      { wch: 12 }, // Date
      { wch: 16 }, // DR #
      { wch: 12 }, // Plate #
      { wch: 10 }, // Fleet
      { wch: 22 }, // Pickup
      { wch: 8 },  // Drops
      { wch: 35 }, // Drop-off
      { wch: 14 }, // Base Rate
      { wch: 14 }, // Excess
      { wch: 16 }, // Amount
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Statement of Account");
    XLSX.writeFile(wb, `${soaNumber || "SOA"}_${clientName}.xlsx`);
  }

  // Handle Printable PDF/Print Window
  function handlePrint() {
    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const rowsHtml = selectedRecords
      .map((r, idx) => {
        const rate = Number(r.tripRate || 0);
        const drops = r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1);
        const excess = drops > 1 ? (drops - 1) * 300 : 0;
        const total = rate + excess;

        return `
        <tr>
          <td>${idx + 1}</td>
          <td>${r.pickUpDate || r.date || "—"}</td>
          <td>${r.bookingDRNo || r.bookingDr || "—"}</td>
          <td>${r.plateNo || "—"}</td>
          <td>${r.fleetType || r.unit || "—"}</td>
          <td>${r.pickLocation || "—"}</td>
          <td>${drops}</td>
          <td>₱${rate.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
          <td>₱${excess.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
          <td><strong>₱${total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong></td>
        </tr>`;
      })
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Statement of Account — ${soaNumber}</title>
        <style>
          body { font-family: sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 20px; text-transform: uppercase; }
          .header p { margin: 3px 0; font-size: 11px; color: #666; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f4f4f4; text-transform: uppercase; font-size: 10px; }
          .summary { float: right; width: 300px; font-size: 12px; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .summary-row.total { border-top: 2px solid #333; font-weight: bold; font-size: 14px; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>KRISDOMINGO TRUCKING SERVICES OPC</h2>
          <p>Blk 15 Damayan Sitio Lumang Ilog Floodway B. Damayan San Juan, Taytay Rizal</p>
          <p>TIN: 698-121-203-00000 | Contact: 0964-980-9864 | Email: krisdomingo.ts@gmail.com</p>
          <h3 style="margin-top: 15px; letter-spacing: 1px;">STATEMENT OF ACCOUNT</h3>
        </div>

        <div class="meta">
          <div>
            <strong>CLIENT:</strong> ${clientName.toUpperCase()}<br/>
            <strong>DATE ISSUED:</strong> ${invoiceDate}
          </div>
          <div style="text-align: right;">
            <strong>SOA NO:</strong> ${soaNumber.toUpperCase()}<br/>
            <strong>DUE DATE:</strong> ${dueDate}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>DR / Booking #</th>
              <th>Plate #</th>
              <th>Fleet</th>
              <th>Pickup Location</th>
              <th>Drops</th>
              <th>Base Rate</th>
              <th>Excess Drop</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Net of VAT:</span>
            <span>₱${calculations.netOfVat.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
          </div>
          ${includeVat
        ? `<div class="summary-row">
                  <span>Add: 12% VAT:</span>
                  <span>₱${calculations.vatAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                </div>`
        : ""
      }
          ${includeEwt
        ? `<div class="summary-row">
                  <span>Less: 2% EWT:</span>
                  <span>-₱${calculations.ewtAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                </div>`
        : ""
      }
          <div class="summary-row total">
            <span>TOTAL AMOUNT DUE:</span>
            <span>₱${calculations.totalDue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconFileInvoice size={18} color="var(--mantine-color-blue-6)" />
          <Text fw={800} style={{ fontSize: "14px" }} tt="uppercase" lts={0.5}>
            Generate Statement of Account (SOA)
          </Text>
        </Group>
      }
      size="70%"
      radius="md"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {selectedRecords.some(
          (r) =>
            r.billingStatus === "paid" ||
            (Number(r.amountPaid || 0) >= Number(r.tripRate || 0) && Number(r.tripRate || 0) > 0)
        ) ? (
          <Alert
            color="red"
            icon={<IconAlertTriangle size={16} />}
            radius="md"
            title="SOA Locked (Paid Record)"
            styles={{ title: { fontSize: "12px", fontWeight: 700 }, message: { fontSize: "11px" } }}
          >
            🔒 One or more selected records are marked as Paid. SOA numbers for Paid trips are permanently locked and cannot be edited.
          </Alert>
        ) : selectedRecords.some((r) => r.soaNumber && r.soaNumber.trim().length > 0) ? (
          <Alert
            color="orange"
            icon={<IconAlertTriangle size={16} />}
            radius="md"
            title="Existing SOA Detected"
            styles={{ title: { fontSize: "12px", fontWeight: 700 }, message: { fontSize: "11px" } }}
          >
            One or more selected records already have a generated Statement of Account (SOA). Saving will update/revise the existing SOA details instead of issuing a new one.
          </Alert>
        ) : null}
        {/* Header Controls */}
        <Paper withBorder p="sm" radius="sm" bg="gray.0">
          <SimpleGrid cols={3} spacing="sm">
            <TextInput
              label="SOA Number"
              placeholder="e.g. KTS-IPI-2026-010"
              size="xs"
              value={soaNumber}
              disabled={selectedRecords.some(
                (r) =>
                  r.billingStatus === "paid" ||
                  (Number(r.amountPaid || 0) >= Number(r.tripRate || 0) && Number(r.tripRate || 0) > 0)
              )}
              onChange={(e) => setSoaNumber(e.currentTarget.value.toUpperCase())}
            />
            <TextInput
              label="Invoice / Billing Date"
              type="date"
              size="xs"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.currentTarget.value)}
            />
            <TextInput
              label="Due Date"
              type="date"
              size="xs"
              value={dueDate}
              onChange={(e) => setDueDate(e.currentTarget.value)}
            />
          </SimpleGrid>
        </Paper>

        {/* Selected Trips Table Preview */}
        <Stack gap={4}>
          <Group justify="space-between">
            <Text style={{ fontSize: "11px" }} fw={700} c="dimmed" tt="uppercase" lts={0.5}>
              Selected Trips ({selectedRecords.length}) — {clientName}
            </Text>
            <Badge variant="light" color="blue" size="sm">
              {selectedRecords.length} Items Selected
            </Badge>
          </Group>

          <Paper withBorder radius="sm" style={{ overflow: "hidden" }}>
            <ScrollArea h={200}>
              <Table striped highlightOnHover>
                <Table.Thead bg="gray.1">
                  <Table.Tr>
                    <Table.Th style={{ fontSize: "9px" }}>#</Table.Th>
                    <Table.Th style={{ fontSize: "9px" }}>Date</Table.Th>
                    <Table.Th style={{ fontSize: "9px" }}>DR / Booking #</Table.Th>
                    <Table.Th style={{ fontSize: "9px" }}>Plate #</Table.Th>
                    <Table.Th style={{ fontSize: "9px" }}>Fleet</Table.Th>
                    <Table.Th style={{ fontSize: "9px" }}>Pickup</Table.Th>
                    <Table.Th style={{ fontSize: "9px" }}>Rate</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedRecords.map((r, idx) => (
                    <Table.Tr key={r.id}>
                      <Table.Td style={{ fontSize: "10px" }}>{idx + 1}</Table.Td>
                      <Table.Td style={{ fontSize: "10px" }}>{r.pickUpDate || r.date || "—"}</Table.Td>
                      <Table.Td style={{ fontSize: "10px" }}>{r.bookingDRNo || r.bookingDr || "—"}</Table.Td>
                      <Table.Td style={{ fontSize: "10px", fontFamily: "monospace" }}>{r.plateNo || "—"}</Table.Td>
                      <Table.Td style={{ fontSize: "10px" }}>{r.fleetType || r.unit || "—"}</Table.Td>
                      <Table.Td style={{ fontSize: "10px" }}>{r.pickLocation || "—"}</Table.Td>
                      <Table.Td style={{ fontSize: "10px", fontWeight: 700 }}>
                        ₱{Number(r.tripRate || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        </Stack>

        {/* Tax Options & Calculations */}
        <SimpleGrid cols={2} spacing="md">
          <Paper withBorder p="sm" radius="sm">
            <Text style={{ fontSize: "11px" }} fw={700} tt="uppercase" c="dimmed" mb="xs">
              Tax & Addon Adjustments
            </Text>
            <Stack gap="xs">
              <Switch
                label="Add 12% VAT"
                size="xs"
                checked={includeVat}
                onChange={(e) => setIncludeVat(e.currentTarget.checked)}
              />
              <Switch
                label="Deduct 2% EWT (Withholding Tax)"
                size="xs"
                checked={includeEwt}
                onChange={(e) => setIncludeEwt(e.currentTarget.checked)}
              />
            </Stack>
          </Paper>

          <Paper withBorder p="sm" radius="sm" bg="blue.0">
            <Stack gap={4}>
              <Group justify="space-between">
                <Text style={{ fontSize: "11px" }} c="gray.7">Net of VAT:</Text>
                <Text style={{ fontSize: "11px" }} fw={700}>
                  ₱{calculations.netOfVat.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </Group>
              {includeVat && (
                <Group justify="space-between">
                  <Text style={{ fontSize: "11px" }} c="gray.7">Add: 12% VAT:</Text>
                  <Text style={{ fontSize: "11px" }} fw={700} c="blue.7">
                    +₱{calculations.vatAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
              )}
              {includeEwt && (
                <Group justify="space-between">
                  <Text style={{ fontSize: "11px" }} c="gray.7">Less: 2% EWT:</Text>
                  <Text style={{ fontSize: "11px" }} fw={700} c="red.7">
                    -₱{calculations.ewtAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
              )}
              <Divider my={4} />
              <Group justify="space-between">
                <Text style={{ fontSize: "13px" }} fw={900} c="blue.9" tt="uppercase">
                  Total Amount Due:
                </Text>
                <Text style={{ fontSize: "15px" }} fw={900} c="blue.9">
                  ₱{calculations.totalDue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </Group>
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* Modal Actions */}
        <Group justify="space-between" mt="xs">
          <Group gap="xs">
            <Button
              size="xs"
              variant="outline"
              color="green"
              leftSection={<IconDownload size={14} />}
              onClick={handleExportExcel}
            >
              Export Excel SOA
            </Button>
            <Button
              size="xs"
              variant="outline"
              color="dark"
              leftSection={<IconPrinter size={14} />}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
          </Group>

          <Group gap="xs">
            <Button size="xs" variant="subtle" color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="xs"
              color="blue"
              leftSection={<IconCheck size={14} />}
              loading={saving}
              onClick={handleSaveSoa}
            >
              Generate & Issue SOA
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
