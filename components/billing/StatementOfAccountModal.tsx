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
  SegmentedControl,
  Popover,
  Checkbox,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconFileInvoice,
  IconDownload,
  IconPrinter,
  IconCheck,
  IconAlertTriangle,
  IconAdjustmentsHorizontal,
  IconEdit,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useUser } from "@clerk/nextjs";
import * as XLSX from "xlsx-js-style";
import { BillingRecord, isSubconRecord } from "@/app/(app)/billing/page";
import {
  updateBillingStatusAction,
  getNextSoaNumberAction,
} from "@/lib/actions/billing";
import { useQueryClient } from "@tanstack/react-query";
import { CLIENTS_QUERY_KEY, fetchMasterClients } from "@/hooks/useMasterData";
import { generateSoaNumber, capitalizeWords } from "@/lib/utils/stringFormat";
import {
  SOA_AVAILABLE_COLUMNS,
  DEFAULT_ENABLED_COLUMN_KEYS,
  IPI_SOA_COLUMN_KEYS,
  SoaColumnDefinition,
  isIpiClient as checkIsIpiClient,
} from "@/lib/utils/soaColumns";
import { EditBillingTripModal } from "./EditBillingTripModal";
import { calculateExcessDropFee } from "@/lib/utils/excessDrop";

interface StatementOfAccountModalProps {
  opened: boolean;
  onClose: () => void;
  selectedRecords: BillingRecord[];
  onSuccess: () => void;
  targetType?: "client" | "subcon";
  preparedBy?: string;
  preparedByRole?: string;
}

export function StatementOfAccountModal({
  opened,
  onClose,
  selectedRecords,
  onSuccess,
  targetType = "client",
  preparedBy: preparedByProp,
  preparedByRole: preparedByRoleProp,
}: StatementOfAccountModalProps) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const rawRole = (user?.publicMetadata?.role as string) || "";
  const dynamicUserName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "") ||
    preparedByProp ||
    "Billing Officer";
  const dynamicUserRole = rawRole
    ? `KTS - ${capitalizeWords(rawRole)}`
    : (preparedByRoleProp || "KTS - Billing Officer");

  const [preparedBy, setPreparedBy] = useState(dynamicUserName);
  const [preparedByRole, setPreparedByRole] = useState(dynamicUserRole);

  React.useEffect(() => {
    if (user?.fullName && (!preparedByProp || preparedBy === "Billing Officer")) {
      setPreparedBy(user.fullName);
    }
    if (rawRole && (!preparedByRoleProp || preparedByRole === "KTS - Billing Officer")) {
      setPreparedByRole(`KTS - ${capitalizeWords(rawRole)}`);
    }
  }, [user?.fullName, rawRole, preparedByProp, preparedByRoleProp]);
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
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  const [activeColumns, setActiveColumns] = useState<string[]>(DEFAULT_ENABLED_COLUMN_KEYS);

  const [displayRecords, setDisplayRecords] = useState<BillingRecord[]>(selectedRecords);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState<string>("0.00");
  const [editDrValue, setEditDrValue] = useState<string>("");
  const [isSavingRow, setIsSavingRow] = useState<boolean>(false);

  React.useEffect(() => {
    setDisplayRecords(selectedRecords);
  }, [selectedRecords]);

  // Derive Recipient Name based on SOA Target Type (Client vs Subcon)
  const recipientTitle = targetType === "subcon" ? "SUBCON TRUCKER" : "CLIENT";
  const clientName = targetType === "subcon"
    ? (displayRecords[0]?.trucker || displayRecords[0]?.driverName || displayRecords[0]?.driver || "SUBCON")
    : (displayRecords[0]?.client || displayRecords[0]?.clientName || "CLIENT");

  const isIpiClient = useMemo(() => {
    return checkIsIpiClient(clientName);
  }, [clientName]);

  // Maintain exact column order based on activeColumns array
  const activeColsList = useMemo(() => {
    return activeColumns
      .map((k) => SOA_AVAILABLE_COLUMNS.find((col) => col.key === k))
      .filter((col): col is SoaColumnDefinition => Boolean(col));
  }, [activeColumns]);

  // Total drops count across selected trips
  const totalDrops = useMemo(
    () =>
      displayRecords.reduce(
        (acc, curr) => acc + (curr.noOfDrops || (curr.rawDrops ? curr.rawDrops.length : 1)),
        0
      ),
    [displayRecords]
  );

  // Auto-load client SOA configuration (Orientation, Columns, Tax preferences)
  React.useEffect(() => {
    if (opened && clientName && targetType === "client") {
      queryClient
        .fetchQuery({
          queryKey: CLIENTS_QUERY_KEY,
          queryFn: fetchMasterClients,
          staleTime: 5 * 60 * 1000,
        })
        .then((clientList: any) => {
          const matching = (clientList as any[])?.find(
            (c: any) => c.clientName.trim().toLowerCase() === clientName.trim().toLowerCase()
          );
          if (matching?.soaConfig) {
            if (matching.soaConfig.orientation) {
              setOrientation(matching.soaConfig.orientation);
            }
            if (matching.soaConfig.columns && matching.soaConfig.columns.length > 0) {
              setActiveColumns(matching.soaConfig.columns);
            }
            if (typeof matching.soaConfig.includeVatDefault === "boolean") {
              setIncludeVat(matching.soaConfig.includeVatDefault);
            }
            if (typeof matching.soaConfig.includeEwtDefault === "boolean") {
              setIncludeEwt(matching.soaConfig.includeEwtDefault);
            }
          } else if (isIpiClient) {
            // Automatic preset for IPI Billing Statement layout
            setOrientation("landscape");
            setActiveColumns(IPI_SOA_COLUMN_KEYS);
            setIncludeVat(true);
            setIncludeEwt(true);
          }
        });
    }
  }, [opened, clientName, targetType, isIpiClient, queryClient]);

  // Auto-generate incremental SOA Number from DB when modal opens
  React.useEffect(() => {
    if (opened && displayRecords.length > 0 && !soaNumber) {
      // Immediate local fallback
      const existingSoas = displayRecords
        .map((r) => (targetType === "subcon" ? r.subconSoaNumber : r.soaNumber))
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0);
      setSoaNumber(generateSoaNumber(clientName, existingSoas));

      // Fast async DB lookup for true max sequence across all records
      getNextSoaNumberAction({ clientName, targetType }).then((res) => {
        if (res?.data?.success && res.data.soaNumber) {
          setSoaNumber(res.data.soaNumber);
        }
      });
    }
  }, [opened, displayRecords, clientName, soaNumber, targetType]);

  /* ── Financial Calculations ── */
  const calculations = useMemo(() => {
    let baseTotal = 0;
    let excessDropTotal = 0;

    displayRecords.forEach((r) => {
      const rawStr = targetType === "subcon" ? (r.truckerRate || r.tripRate || 0) : (r.tripRate || 0);
      const rawRate = Number(String(rawStr).replace(/,/g, "").trim()) || 0;
      const rate = isIpiClient && targetType !== "subcon"
        ? Number((rawRate / 1.12).toFixed(2))
        : rawRate;
      baseTotal += rate;

      const isSubTarget = targetType === "subcon";
      const excess = calculateExcessDropFee(
        r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1),
        isSubTarget,
        isIpiClient && !isSubTarget && r.excessDropRate && Number(r.excessDropRate) < 300 ? undefined : r.excessDropRate
      );
      excessDropTotal += excess;
    });

    const netOfVat = Number((baseTotal + excessDropTotal).toFixed(2));
    const vatAmount = includeVat ? Number((netOfVat * 0.12).toFixed(2)) : 0;
    const ewtAmount = includeEwt ? Number((netOfVat * 0.02).toFixed(2)) : 0;
    const totalDue = Number((netOfVat + vatAmount - ewtAmount).toFixed(2));

    return {
      baseTotal,
      excessDropTotal,
      netOfVat,
      vatAmount,
      ewtAmount,
      totalDue,
    };
  }, [displayRecords, includeVat, includeEwt, targetType, isIpiClient]);

  const [editTripModalOpen, setEditTripModalOpen] = useState(false);
  const [selectedEditRecord, setSelectedEditRecord] = useState<BillingRecord | null>(null);

  const handleOpenEditTripModal = (record: BillingRecord) => {
    setSelectedEditRecord(record);
    setEditTripModalOpen(true);
  };

  const handleTripUpdated = (updated: Partial<BillingRecord>) => {
    if (!selectedEditRecord) return;
    setDisplayRecords((prev) =>
      prev.map((r) => (String(r.id) === String(selectedEditRecord.id) ? { ...r, ...updated } : r))
    );
  };

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
        targetType,
        soaNumber: targetType === "client" ? soaNumber.trim().toUpperCase() : undefined,
        subconSoaNumber: targetType === "subcon" ? soaNumber.trim().toUpperCase() : undefined,
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
      alignment: { horizontal: "center", vertical: "top", wrapText: true },
      border: borderThin,
    };

    const dataCellLeft = {
      font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
      alignment: { horizontal: "left", vertical: "top", wrapText: true },
      border: borderThin,
    };

    const dataCellRight = {
      font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
      alignment: { horizontal: "right", vertical: "top" },
      border: borderThin,
      numFmt: "#,##0.00",
    };

    const dataCellRightBold = {
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
      alignment: { horizontal: "right", vertical: "top" },
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

    const lastColIndex = Math.max(activeColsList.length - 1, 0);

    // Company Header
    setCell(0, 0, "KRISDOMINGO TRUCKING SERVICES OPC", companyTitleStyle);
    setCell(1, 0, "Blk 15 Damayan Sitio Lumang Ilog Floodway Taytay Rizal", companySubStyle);
    setCell(2, 0, "TIN NO: 698-121-203-00000 | CONTACT: 0964-980-9864 | EMAIL: krisdomingo.ts@gmail.com", companySubStyle);

    // Document Banner
    const docTitle = isIpiClient ? "BILLING STATEMENT" : "STATEMENT OF ACCOUNT";
    for (let c = 0; c <= lastColIndex; c++) {
      setCell(4, c, c === 0 ? docTitle : "", bannerStyle);
    }

    const firstTripDate = displayRecords[0]?.pickUpDate || displayRecords[0]?.date || invoiceDate;
    let cutOffFormatted = "—";
    try {
      const d = new Date(firstTripDate);
      if (!isNaN(d.getTime())) {
        cutOffFormatted = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      }
    } catch {}

    // Meta details block
    setCell(6, 0, "Client:", labelBoldStyle);
    setCell(6, 2, clientName.toUpperCase(), labelBoldStyle);
    setCell(6, Math.max(lastColIndex - 3, 3), "Billing Date:", labelBoldStyle);
    setCell(6, lastColIndex, invoiceDate);

    setCell(7, 0, "Tin No:", labelBoldStyle);
    setCell(7, 2, isIpiClient ? "0000-309-701-00021" : "—", labelBoldStyle);
    setCell(7, Math.max(lastColIndex - 3, 3), "Cut off Date:", labelBoldStyle);
    setCell(7, lastColIndex, cutOffFormatted);

    setCell(8, 0, "SOA No:", labelBoldStyle);
    setCell(8, 2, soaNumber.toUpperCase(), labelBoldStyle);1
    setCell(8, lastColIndex, "");

    // Dynamic Table Headers
    activeColsList.forEach((col, colIdx) => {
      setCell(10, colIdx, col.label, headerStyle);
    });

    let currentRow = 11;
    let totalBase = 0;
    let totalExcess = 0;
    let totalGross = 0;

    selectedRecords.forEach((r, idx) => {
      const rawRate = targetType === "subcon"
        ? Number(r.truckerRate || r.tripRate || 0)
        : Number(r.tripRate || 0);
      const rate = isIpiClient && targetType !== "subcon"
        ? Number((rawRate / 1.12).toFixed(2))
        : rawRate;
      const isSubTarget = targetType === "subcon";
      const excess = calculateExcessDropFee(
        r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1),
        isSubTarget,
        isIpiClient && !isSubTarget && r.excessDropRate && Number(r.excessDropRate) < 300 ? undefined : r.excessDropRate
      );
      const total = Number((rate + excess).toFixed(2));

      totalBase += rate;
      totalExcess += excess;
      totalGross += total;

      activeColsList.forEach((col, colIdx) => {
        const rawVal = col.getValue(r, targetType, idx);
        let cellStyle: any = dataCellCenter;
        if (col.align === "left" || col.key === "ipiDropOff") {
          cellStyle = dataCellLeft;
        } else if (col.key === "invoices") {
          cellStyle = dataCellCenter;
        } else if (col.align === "right") {
          cellStyle = (col.key === "amount" || col.key === "totalAmount") ? dataCellRightBold : dataCellRight;
        }
        setCell(currentRow, colIdx, rawVal, cellStyle);
      });

      currentRow++;
    });

    // Table Totals Row (Matching printed photo)
    setCell(currentRow, 0, "Total:", labelBoldStyle);
    activeColsList.forEach((col, colIdx) => {
      if (col.key === "drops") {
        setCell(currentRow, colIdx, totalDrops, dataCellCenter);
      } else if (col.key === "rate" || col.key === "baseRate") {
        setCell(currentRow, colIdx, totalBase, dataCellRightBold);
      } else if (col.key === "excessDropAmount" || col.key === "excessDrop") {
        setCell(currentRow, colIdx, totalExcess, dataCellRightBold);
      } else if (col.key === "amount" || col.key === "totalAmount") {
        setCell(currentRow, colIdx, totalGross, dataCellRightBold);
      }
    });
    currentRow += 2;

    // Financial Breakdown at bottom right
    const summaryColLabel = Math.max(lastColIndex - 2, 0);
    const summaryColVal = lastColIndex;

    setCell(currentRow, summaryColLabel, "Amount: Net of VAT", totalRowLabel);
    setCell(currentRow, summaryColVal, calculations.netOfVat, dataCellRightBold);
    currentRow++;

    if (includeVat) {
      setCell(currentRow, summaryColLabel, isIpiClient ? "Add: VAT12 %" : "Add: 12% VAT", totalRowLabel);
      setCell(currentRow, summaryColVal, calculations.vatAmount, dataCellRightBold);
      currentRow++;
    }

    if (includeEwt) {
      setCell(currentRow, summaryColLabel, "EWT less 2%", totalRowLabel);
      setCell(currentRow, summaryColVal, calculations.ewtAmount, dataCellRightBold);
      currentRow++;
    }

    setCell(currentRow, summaryColLabel, "Total Amount Due:", totalRowLabel);
    setCell(currentRow, summaryColVal, calculations.totalDue, grandTotalStyle);
    currentRow += 2;

    // Signatories and Terms
    setCell(currentRow, 0, "Terms: 15 days", labelBoldStyle);
    currentRow += 2;

    const signatureUnderlineStyle = {
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
      border: { bottom: { style: "thin", color: { rgb: "1E293B" } } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    const roleStyle = {
      font: { name: "Calibri", sz: 9, italic: true, color: { rgb: "475569" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    setCell(currentRow, 1, preparedBy || "Billing Officer", signatureUnderlineStyle);
    setCell(currentRow, 4, "Kris R. Galon", signatureUnderlineStyle);
    setCell(currentRow, Math.max(lastColIndex - 2, 6), "", signatureUnderlineStyle);
    currentRow++;

    setCell(currentRow, 1, preparedByRole || "KTS - Billing Officer", roleStyle);
    setCell(currentRow, 4, "Checked By: President/Owner", roleStyle);
    setCell(currentRow, Math.max(lastColIndex - 2, 6), "Received By", roleStyle);

    ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: currentRow, c: lastColIndex });

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: lastColIndex } },
    ];

    ws["!cols"] = activeColsList.map((col) => {
      if (col.key === "index") return { wch: 6 };
      if (col.key === "date" || col.key === "dateShort") return { wch: 11 };
      if (col.key === "bookingDr" || col.key === "dcr") return { wch: 14 };
      if (col.key === "plateNo") return { wch: 12 };
      if (col.key === "fleetType") return { wch: 10 };
      if (col.key === "drops") return { wch: 8 };
      if (col.key === "ipiDropOff" || col.key === "dropOffLocation") return { wch: 45 };
      if (col.key === "invoices") return { wch: 16 };
      if (col.key === "rate" || col.key === "baseRate") return { wch: 14 };
      if (col.key === "excessDrop" || col.key === "excessDropAmount") return { wch: 14 };
      if (col.key === "amount" || col.key === "totalAmount") return { wch: 14 };
      return { wch: 16 };
    });

    ws["!pageSetup"] = { orientation: orientation };

    XLSX.utils.book_append_sheet(wb, ws, "Statement of Account");
    XLSX.writeFile(wb, `${soaNumber || "SOA"}_${clientName}.xlsx`);
  }

  // Handle Printable PDF/Print Window
  function handlePrint() {
    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const headersHtml = activeColsList
      .map((col) => `<th style="text-align: ${col.align || "left"}; padding: 6px 4px; border: 1px solid #111;">${col.label}</th>`)
      .join("");

    const rowsHtml = selectedRecords
      .map((r, idx) => {
        const cellsHtml = activeColsList
          .map((col) => {
            const rawVal = col.getValue(r, targetType, idx);

            if (col.key === "ipiDropOff") {
              const isIpi = checkIsIpiClient(r.client || r.clientName);
              const routeHdr = isIpi && r.ruta ? r.ruta.trim().toUpperCase() : "";
              const drops =
                r.rawDrops && r.rawDrops.length > 0
                  ? r.rawDrops.map((d: any) => d.locationName.trim()).filter(Boolean)
                  : r.dropOffLocation
                  ? r.dropOffLocation
                      .split(/[\n,]/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : [];
              return `
                <td style="text-align: left; vertical-align: top; border: 1px solid #111; padding: 4px 6px;">
                  ${routeHdr ? `<div style="color: #b91c1c; font-weight: bold; font-size: 9.5px; margin-bottom: 2px;">${routeHdr}</div>` : ""}
                  ${drops.map((d) => `<div style="font-size: 9px; line-height: 1.25; margin-bottom: 1px;">${d}</div>`).join("")}
                </td>
              `;
            }

            if (col.key === "invoices") {
              const isIpi = checkIsIpiClient(r.client || r.clientName);
              const routeHdr = isIpi && r.ruta ? r.ruta.trim().toUpperCase() : "";
              const hasDropInvoices = r.rawDrops && r.rawDrops.some((d: any) => Boolean(d.invoice?.trim()));
              const lines = hasDropInvoices && r.rawDrops
                ? r.rawDrops.flatMap((d: any) => {
                    const invs = d.invoice ? String(d.invoice).split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean) : [];
                    return invs.length > 0 ? invs : ["—"];
                  })
                : String(rawVal || "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
              return `
                <td style="text-align: center; vertical-align: top; border: 1px solid #111; padding: 4px 6px; font-family: monospace; font-size: 9px;">
                  ${routeHdr ? `<div style="visibility: hidden; font-weight: bold; font-size: 9.5px; margin-bottom: 2px;">&nbsp;</div>` : ""}
                  ${lines.map((inv) => `<div style="line-height: 1.25; margin-bottom: 1px;">${inv}</div>`).join("")}
                </td>
              `;
            }

            const formatted =
              col.isCurrency && typeof rawVal === "number"
                ? `₱${rawVal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                : rawVal;
            return `<td style="text-align: ${col.align || "left"}; vertical-align: top; border: 1px solid #111; padding: 4px 6px;">${formatted}</td>`;
          })
          .join("");
        return `<tr>${cellsHtml}</tr>`;
      })
      .join("");

    const firstTripDate = displayRecords[0]?.pickUpDate || displayRecords[0]?.date || invoiceDate;
    let cutOffFormatted = "—";
    try {
      const d = new Date(firstTripDate);
      if (!isNaN(d.getTime())) {
        cutOffFormatted = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      }
    } catch {}

    const tableTotalRowHtml = `
      <tr style="font-weight: bold; background: #fafafa;">
        ${activeColsList.map((col, cIdx) => {
          if (cIdx === 0) return `<td style="text-align: right; border: 1px solid #111; padding: 4px 6px;">Total:</td>`;
          if (col.key === "drops") return `<td style="text-align: center; border: 1px solid #111; padding: 4px 6px;">${totalDrops}</td>`;
          if (col.key === "rate" || col.key === "baseRate") return `<td style="text-align: right; border: 1px solid #111; padding: 4px 6px;">₱${calculations.baseTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>`;
          if (col.key === "excessDropAmount" || col.key === "excessDrop") return `<td style="text-align: right; border: 1px solid #111; padding: 4px 6px;">₱${calculations.excessDropTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>`;
          if (col.key === "amount" || col.key === "totalAmount") return `<td style="text-align: right; border: 1px solid #111; padding: 4px 6px;">₱${(calculations.baseTotal + calculations.excessDropTotal).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>`;
          return `<td style="border: 1px solid #111;"></td>`;
        }).join("")}
      </tr>
    `;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${isIpiClient ? "Billing Statement" : "Statement of Account"} — ${soaNumber}</title>
        <style>
          @page { size: ${orientation}; margin: 8mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 10px; color: #111; font-size: 10px; }
          .header-box { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
          .header-title { font-size: 17px; font-weight: 800; margin: 0 0 2px 0; letter-spacing: 0.5px; }
          .header-sub { font-size: 10px; color: #333; margin: 1px 0; }
          .banner { text-align: center; margin: 8px 0 10px 0; }
          .banner h3 { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: 2px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
          .meta-table td { border: 1px solid #111; padding: 4px 8px; line-height: 1.4; vertical-align: top; }
          table.main-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5px; }
          table.main-table th { background: #f2f2f2; text-transform: uppercase; font-size: 9px; font-weight: 800; }
          .summary-container { float: right; width: 310px; font-size: 10.5px; margin-top: 4px; }
          .summary-row { display: flex; justify-content: space-between; padding: 2px 0; }
          .summary-row.total { border-top: 1.5px solid #111; border-bottom: 3px double #111; font-weight: 800; font-size: 11.5px; margin-top: 4px; padding: 3px 0; }
          .signatories { clear: both; margin-top: 30px; }
          .sig-row { display: flex; justify-content: space-between; align-items: flex-start; text-align: center; font-size: 10px; }
          .sig-col { width: 28%; }
          .sig-line { border-bottom: 1px solid #111; padding-bottom: 3px; font-weight: bold; min-height: 16px; line-height: 16px; }
          .sig-role { font-size: 9.5px; color: #444; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div class="header-title">KRISDOMINGO TRUCKING SERVICES OPC</div>
            <div class="header-sub"><strong>ADDRESS:</strong> Blk 15 Damayan Sitio Lumang Ilog Floodway Taytay Rizal</div>
            <div class="header-sub"><strong>TIN NO:</strong> 698-121-203-00000</div>
          </div>
          <div style="text-align: right;">
            <div class="header-sub"><strong>CONTACT NO:</strong> 9649809864</div>
            <div class="header-sub"><strong>EMAIL:</strong> krisdomingo.ts@gmail.com</div>
          </div>
        </div>

        <div class="banner">
          <h3>${isIpiClient ? "BILLING STATEMENT" : `STATEMENT OF ACCOUNT - ${clientName.toUpperCase()}`}</h3>
        </div>

        <table class="meta-table">
          <tr>
            <td style="width: 50%;">
              <strong>Client:</strong> ${clientName.toUpperCase()}<br/>
              <strong>Tin No:</strong> ${isIpiClient ? "0000-309-701-00021" : "—"}<br/>
              <strong>SOA No:</strong> ${soaNumber.toUpperCase()}
            </td>
            <td style="width: 50%;">
              <strong>Billing Date:</strong> ${invoiceDate}<br/>
              <strong>Cut off Date:</strong> ${cutOffFormatted}<br/>
            </td>
          </tr>
        </table>

        <table class="main-table">
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${tableTotalRowHtml}
          </tbody>
        </table>

        <div class="summary-container">
          <div class="summary-row">
            <span>Amount: Net of VAT</span>
            <span>₱${calculations.netOfVat.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
          </div>
          ${includeVat ? `
            <div class="summary-row">
              <span>Add: 12% VAT:</span>
              <span>₱${calculations.vatAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
          ` : ""}
          ${includeEwt ? `
            <div class="summary-row">
              <span>EWT less 2%:</span>
              <span>-₱${calculations.ewtAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
          ` : ""}
          <div class="summary-row total">
            <span>Total Amount Due:</span>
            <span>₱${calculations.totalDue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="signatories">
          <div style="font-weight: bold; margin-bottom: 25px; font-size: 10px;">Terms: 15 days</div>
          <div class="sig-row">
            <div class="sig-col">
              <div class="sig-line">${preparedBy || "Billing Officer"}</div>
              <div class="sig-role">${preparedByRole || "KTS - Billing Officer"}</div>
            </div>
            <div class="sig-col">
              <div class="sig-line">Kris R. Galon</div>
              <div class="sig-role">Checked By:</div>
              <div class="sig-role">President/Owner</div>
            </div>
            <div class="sig-col">
              <div class="sig-line">&nbsp;</div>
              <div class="sig-role">Received By</div>
            </div>
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
          <IconFileInvoice size={18} color={targetType === "subcon" ? "var(--mantine-color-teal-6)" : "var(--mantine-color-blue-6)"} />
          <Text fw={800} style={{ fontSize: "14px" }} tt="uppercase" lts={0.5}>
            Generate Statement of Account — {targetType === "subcon" ? "Subcon Settlement" : "Client Billing"}
          </Text>
          <Badge color={targetType === "subcon" ? "teal" : "blue"} variant="light" size="xs">
            {targetType === "subcon" ? "Subcon Rate Applied" : "Client Rate Applied"}
          </Badge>
          {isIpiClient && (
            <Badge color="red" variant="filled" size="xs">
              IPI Format Active
            </Badge>
          )}
        </Group>
      }
      size="85%"
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
            icon={<IconFileInvoice size={16} />}
            radius="md"
            title="SOA Locked (Paid Record)"
            styles={{ title: { fontSize: "12px", fontWeight: 700 }, message: { fontSize: "11px" } }}
          >
            🔒 One or more selected records are marked as Paid. SOA numbers for Paid trips are permanently locked and cannot be edited.
          </Alert>
        ) : selectedRecords.some((r) => {
          const val = targetType === "subcon" ? r.subconSoaNumber : r.soaNumber;
          return val && val.trim().length > 0;
        }) ? (
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
          <SimpleGrid cols={{ base: 1, sm: 5 }} spacing="xs">
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
            <TextInput
              label="Prepared By"
              placeholder="Name of user"
              size="xs"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.currentTarget.value)}
            />
            <TextInput
              label="Role / Title"
              placeholder="e.g. KTS - Billing Officer"
              size="xs"
              value={preparedByRole}
              onChange={(e) => setPreparedByRole(e.currentTarget.value)}
            />
          </SimpleGrid>
        </Paper>

        {/* Selected Trips Table Preview */}
        <Stack gap={4}>
          <Group justify="space-between">
            <Group gap="xs">
              <Text style={{ fontSize: "11px" }} fw={700} c="dimmed" tt="uppercase" lts={0.5}>
                Selected Trips ({selectedRecords.length}) — {clientName}
              </Text>
              <Badge color={orientation === "landscape" ? "blue" : "indigo"} variant="outline" size="xs">
                {orientation === "landscape" ? "📄 Landscape Layout" : "📱 Portrait Layout"}
              </Badge>
            </Group>
            <Group gap="xs">
              <Popover position="bottom-end" shadow="md">
                <Popover.Target>
                  <Button
                    size="xs"
                    variant="light"
                    color="gray"
                    leftSection={<IconAdjustmentsHorizontal size={14} />}
                  >
                    Columns ({activeColumns.length})
                  </Button>
                </Popover.Target>
                <Popover.Dropdown p="xs">
                  <Stack gap={6} style={{ maxHeight: 280, overflowY: "auto", minWidth: 200 }}>
                    <Text size="xs" fw={700} c="dimmed">
                      Toggle Columns
                    </Text>
                    {SOA_AVAILABLE_COLUMNS.map((col) => (
                      <Checkbox
                        key={col.key}
                        label={col.label}
                        size="xs"
                        checked={activeColumns.includes(col.key)}
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;
                          setActiveColumns((prev) =>
                            checked ? [...prev, col.key] : prev.filter((k) => k !== col.key)
                          );
                        }}
                      />
                    ))}
                    {isIpiClient && (
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        mt="xs"
                        onClick={() => setActiveColumns(IPI_SOA_COLUMN_KEYS)}
                      >
                        Reset to IPI Layout
                      </Button>
                    )}
                  </Stack>
                </Popover.Dropdown>
              </Popover>

              <SegmentedControl
                size="xs"
                value={orientation}
                onChange={(v: any) => setOrientation(v)}
                data={[
                  { label: "Portrait", value: "portrait" },
                  { label: "Landscape", value: "landscape" },
                ]}
              />
              <Badge variant="light" color="blue" size="sm">
                {selectedRecords.length} Items Selected
              </Badge>
            </Group>
          </Group>

          <Paper withBorder radius="sm" style={{ overflow: "hidden" }}>
            <ScrollArea h={260}>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead bg="gray.1">
                  <Table.Tr>
                    <Table.Th style={{ fontSize: "9px", width: 50, textAlign: "center" }}>Action</Table.Th>
                    {activeColsList.map((col) => (
                      <Table.Th key={col.key} style={{ fontSize: "9px", textAlign: col.align || "left" }}>
                        {col.label}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {displayRecords.map((r, idx) => {
                    return (
                      <Table.Tr key={r.id}>
                        <Table.Td style={{ textAlign: "center", padding: "4px", verticalAlign: "top" }}>
                          <Tooltip label="Edit Trip & Billing Inputs" withArrow position="top">
                            <ActionIcon
                              size="xs"
                              color="blue"
                              variant="light"
                              onClick={() => handleOpenEditTripModal(r)}
                            >
                              <IconEdit size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                        {activeColsList.map((col) => {
                          const val = col.getValue(r, targetType, idx);

                          if (col.key === "ipiDropOff") {
                            const isIpi = checkIsIpiClient(r.client || r.clientName);
                            const routeHdr = isIpi && r.ruta ? r.ruta.trim().toUpperCase() : "";
                            const drops =
                              r.rawDrops && r.rawDrops.length > 0
                                ? r.rawDrops.map((d: any) => d.locationName.trim()).filter(Boolean)
                                : r.dropOffLocation
                                ? r.dropOffLocation
                                    .split(/[\n,]/)
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                : [];
                            return (
                              <Table.Td key={col.key} style={{ fontSize: "10px", textAlign: "left", verticalAlign: "top", minWidth: 220 }}>
                                {routeHdr && (
                                  <Text size="xs" fw={800} c="red.7" tt="uppercase" mb={2}>
                                    {routeHdr}
                                  </Text>
                                )}
                                {drops.length > 0 ? (
                                  drops.map((item, dIdx) => (
                                    <Text key={dIdx} size="xs" c="gray.8" style={{ lineHeight: 1.25 }}>
                                      {item}
                                    </Text>
                                  ))
                                ) : !routeHdr ? (
                                  <Text size="xs" c="dimmed">—</Text>
                                ) : null}
                              </Table.Td>
                            );
                          }

                          if (col.key === "invoices") {
                            const isIpi = checkIsIpiClient(r.client || r.clientName);
                            const routeHdr = isIpi && r.ruta ? r.ruta.trim().toUpperCase() : "";
                            const hasDropInvoices = r.rawDrops && r.rawDrops.some((d: any) => Boolean(d.invoice?.trim()));
                            const lines = hasDropInvoices && r.rawDrops
                              ? r.rawDrops.flatMap((d: any) => {
                                  const invs = d.invoice ? String(d.invoice).split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean) : [];
                                  return invs.length > 0 ? invs : ["—"];
                                })
                              : String(val || "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
                            return (
                              <Table.Td key={col.key} style={{ fontSize: "10px", textAlign: "center", verticalAlign: "top", minWidth: 100 }}>
                                {routeHdr && (
                                  <Text size="xs" fw={800} style={{ visibility: "hidden" }} mb={2}>
                                    &nbsp;
                                  </Text>
                                )}
                                {lines.length > 0 ? (
                                  lines.map((inv, iIdx) => (
                                    <Text key={iIdx} size="xs" ff="monospace" c="dark.4" style={{ lineHeight: 1.25 }}>
                                      {inv}
                                    </Text>
                                  ))
                                ) : (
                                  <Text size="xs" c="dimmed">—</Text>
                                )}
                              </Table.Td>
                            );
                          }

                          const formatted =
                            col.isCurrency && typeof val === "number"
                              ? `₱${val.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                              : val;

                          return (
                            <Table.Td
                              key={col.key}
                              style={{
                                fontSize: "10px",
                                textAlign: col.align || "left",
                                verticalAlign: "top",
                                whiteSpace: "pre-line",
                              }}
                            >
                              {formatted}
                            </Table.Td>
                          );
                        })}
                      </Table.Tr>
                    );
                  })}
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
                <Text style={{ fontSize: "11px" }} c="gray.7">Amount: Net of VAT:</Text>
                <Text style={{ fontSize: "11px" }} fw={700}>
                  ₱{calculations.netOfVat.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </Group>
              {includeVat && (
                <Group justify="space-between">
                  <Text style={{ fontSize: "11px" }} c="gray.7">{isIpiClient ? "Add: VAT12 %:" : "Add: 12% VAT:"}</Text>
                  <Text style={{ fontSize: "11px" }} fw={700} c="blue.7">
                    +₱{calculations.vatAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
              )}
              {includeEwt && (
                <Group justify="space-between">
                  <Text style={{ fontSize: "11px" }} c="gray.7">EWT less 2%:</Text>
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

      <EditBillingTripModal
        opened={editTripModalOpen}
        onClose={() => setEditTripModalOpen(false)}
        record={selectedEditRecord}
        onSuccess={handleTripUpdated}
      />
    </Modal>
  );
}
