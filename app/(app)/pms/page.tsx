"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Text,
  Paper,
  Group,
  Badge,
  TextInput,
  Select,
  Button,
  Table,
  ActionIcon,
  Modal,
  Stack,
  NumberInput,
  Textarea,
  Drawer,
  Center,
  Loader,
  Box,
  Pagination,
  ScrollArea,
  Menu,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconSearch,
  IconHistory,
  IconPlus,
  IconRefresh,
  IconTools,
  IconDownload,
  IconFileTypePdf,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import {
  getFleetPmsStatusAction,
  logCompletedPmsAction,
  getPmsHistoryAction,
  getPmsLogsByDateRangeAction,
} from "@/lib/actions/pms";
import type { TruckPmsStatus } from "@/lib/repositories/pms.repository";

const headerCellStyle: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "var(--mantine-color-gray-6)",
  whiteSpace: "nowrap",
  padding: "8px 12px",
  backgroundColor: "var(--mantine-color-gray-0)",
};

const cellStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  whiteSpace: "nowrap",
  padding: "8px 12px",
};

const PAGE_SIZE = 10;

export default function PmsPage() {
  const [fleet, setFleet] = useState<TruckPmsStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Date range filter for export
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Modal State for Logging PMS
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<TruckPmsStatus | null>(null);
  const [pmsDate, setPmsDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [pmsOdo, setPmsOdo] = useState<number>(0);
  const [serviceType, setServiceType] = useState("General PMS");
  const [cost, setCost] = useState<string>("0");
  const [performedBy, setPerformedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // History Drawer State
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyTruckPlate, setHistoryTruckPlate] = useState<string>("");
  const [pmsHistory, setPmsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchFleetStatus = async () => {
    setLoading(true);
    const res = await getFleetPmsStatusAction();
    if (res?.data?.success && res.data.data) {
      setFleet(res.data.data);
    } else {
      notifications.show({
        title: "Error loading PMS status",
        message: res?.data?.error || "Could not fetch fleet data",
        color: "red",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFleetStatus();
  }, []);

  const filteredFleet = useMemo(() => {
    return fleet.filter((truck) => {
      const matchSearch =
        truck.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
        (truck.fleetType && truck.fleetType.toLowerCase().includes(search.toLowerCase())) ||
        (truck.unitType && truck.unitType.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = !statusFilter || truck.pmsStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [fleet, search, statusFilter]);

  const pagedFleet = useMemo(() => {
    return filteredFleet.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredFleet, page]);

  const stats = useMemo(() => {
    const total = fleet.length;
    const ok = fleet.filter((t) => t.pmsStatus === "ok").length;
    const dueSoon = fleet.filter((t) => t.pmsStatus === "due_soon").length;
    const overdue = fleet.filter((t) => t.pmsStatus === "overdue").length;
    return { total, ok, dueSoon, overdue };
  }, [fleet]);

  const handleOpenLogModal = (truck: TruckPmsStatus) => {
    setSelectedTruck(truck);
    setPmsDate(new Date().toISOString().split("T")[0]);
    setPmsOdo(truck.currentOdo || truck.lastPmsOdo || 0);
    setServiceType("General PMS");
    setCost("0");
    setPerformedBy("");
    setRemarks("");
    setLogModalOpen(true);
  };

  const handleSavePmsLog = async () => {
    if (!selectedTruck || !pmsDate) return;
    setSubmitting(true);

    const formattedDate = pmsDate;
    const res = await logCompletedPmsAction({
      plateNumber: selectedTruck.plateNumber,
      pmsDate: formattedDate,
      pmsOdo: pmsOdo,
      serviceType,
      cost,
      performedBy: performedBy || undefined,
      remarks: remarks || undefined,
    });

    if (res?.data?.success) {
      notifications.show({
        title: "PMS Recorded",
        message: `Updated PMS date for ${selectedTruck.plateNumber}.`,
        color: "green",
      });
      setLogModalOpen(false);
      fetchFleetStatus();
    } else {
      notifications.show({
        title: "Error",
        message: res?.data?.error || "Failed to save PMS log.",
        color: "red",
      });
    }
    setSubmitting(false);
  };

  const handleOpenHistory = async (plateNumber: string) => {
    setHistoryTruckPlate(plateNumber);
    setHistoryDrawerOpen(true);
    setLoadingHistory(true);
    const res = await getPmsHistoryAction({ plateNumber });
    if (res?.data?.success && res.data.data) {
      setPmsHistory(res.data.data);
    } else {
      setPmsHistory([]);
    }
    setLoadingHistory(false);
  };

  // ── Export Helpers ──

  const fetchExportData = async () => {
    if (!startDate || !endDate) {
      notifications.show({
        title: "Date range required",
        message: "Please select both start and end dates.",
        color: "orange",
      });
      return null;
    }
    if (startDate > endDate) {
      notifications.show({
        title: "Invalid date range",
        message: "Start date cannot be after end date.",
        color: "orange",
      });
      return null;
    }

    const res = await getPmsLogsByDateRangeAction({ startDate, endDate });
    if (!res?.data?.success || !res.data.data || res.data.data.length === 0) {
      notifications.show({
        title: "No records found",
        message: "No PMS logs found for the selected date range.",
        color: "yellow",
      });
      return null;
    }
    return res.data.data;
  };

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      if (!data) return;

      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PMS Maintenance Report", 14, 14);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 20);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
      doc.text(`Total Records: ${data.length}`, 14, 30);

      const columns = [
        { header: "Plate Number", dataKey: "plateNumber" },
        { header: "Fleet / Unit", dataKey: "fleet" },
        { header: "PMS Date", dataKey: "pmsDate" },
        { header: "Odo (km)", dataKey: "pmsOdo" },
        { header: "Service Type", dataKey: "serviceType" },
        { header: "Cost (₱)", dataKey: "cost" },
        { header: "Mechanic / Shop", dataKey: "performedBy" },
        { header: "Remarks", dataKey: "remarks" },
      ];

      const body = data.map((row) => ({
        plateNumber: `${row.plateNumber}${row.isSubcon ? " (Subcon)" : ""}`,
        fleet: `${row.fleetType || "Standard"} ${row.unitType ? `(${row.unitType})` : ""}`.trim(),
        pmsDate: row.pmsDate,
        pmsOdo: Number(row.pmsOdo).toLocaleString(),
        serviceType: row.serviceType || "—",
        cost: `₱${Number(row.cost || 0).toLocaleString()}`,
        performedBy: row.performedBy || "—",
        remarks: row.remarks || "—",
      }));

      autoTable(doc, {
        columns,
        body,
        startY: 34,
        styles: { fontSize: 8, cellPadding: 1.5, valign: "middle", overflow: "linebreak" },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`pms-report-${startDate}-to-${endDate}.pdf`);
      notifications.show({ title: "PDF Exported", message: "File downloaded.", color: "green" });
    } catch (err) {
      notifications.show({ title: "Export failed", message: "Could not generate PDF.", color: "red" });
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate]);

  const handleExportXlsx = useCallback(async () => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      if (!data) return;

      const XLSX = await import("xlsx-js-style");

      const title = "PMS Maintenance Report";
      const headers = ["Plate Number", "Type", "Fleet / Unit", "PMS Date", "Odo (km)", "Service Type", "Cost (₱)", "Mechanic / Shop", "Remarks"];

      const exportRows = data.map((row) => [
        row.plateNumber,
        row.isSubcon ? "Subcon" : "Own",
        `${row.fleetType || "Standard"} ${row.unitType ? `(${row.unitType})` : ""}`.trim(),
        row.pmsDate,
        Number(row.pmsOdo).toLocaleString(),
        row.serviceType || "—",
        `₱${Number(row.cost || 0).toLocaleString()}`,
        row.performedBy || "—",
        row.remarks || "—",
      ]);

      const metaData: (string | number)[][] = [
        [title.toUpperCase()],
        ["Date Range:", `${startDate} to ${endDate}`],
        ["Generated:", new Date().toLocaleString()],
        ["Total Records:", data.length],
        [],
        headers,
      ];

      const allRows = [...metaData, ...exportRows];
      const ws = XLSX.utils.aoa_to_sheet(allRows);

      // Column widths
      ws["!cols"] = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...exportRows.map((r) => String(r[i] ?? "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
      });

      // Style title
      const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (!ws[titleRef]) ws[titleRef] = { v: title.toUpperCase(), t: "s" };
      ws[titleRef].s = {
        font: { bold: true, sz: 16, color: { rgb: "1a56db" } },
      };

      // Style header row
      const headerRowIdx = metaData.length - 1;
      headers.forEach((_, colIdx) => {
        const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
        if (!ws[ref]) return;
        ws[ref].s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1a56db" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: { bottom: { style: "thin", color: { rgb: "CCCCCC" } } },
        };
      });

      // Stripe data rows
      exportRows.forEach((_, rowOffset) => {
        const rowIdx = headerRowIdx + 1 + rowOffset;
        const isEven = rowOffset % 2 === 0;
        headers.forEach((_, colIdx) => {
          const ref = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
          if (!ws[ref]) return;
          ws[ref].s = {
            fill: isEven ? { fgColor: { rgb: "EEF4FF" } } : { fgColor: { rgb: "FFFFFF" } },
            font: { sz: 11 },
            alignment: { vertical: "center", wrapText: true },
            border: {
              bottom: { style: "hair", color: { rgb: "DDDDDD" } },
              right: { style: "hair", color: { rgb: "DDDDDD" } },
            },
          };
        });
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PMS Report");
      XLSX.writeFile(wb, `pms-report-${startDate}-to-${endDate}.xlsx`);
      notifications.show({ title: "XLSX Exported", message: "File downloaded.", color: "green" });
    } catch (err) {
      notifications.show({ title: "Export failed", message: "Could not generate XLSX.", color: "red" });
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate]);

  return (
    <Stack gap="md">
      {/* Simple Clean Header */}
      <Group justify="space-between" align="center">
        <div>
          <Text fw={800} size="xl" lh={1.2}>
            PMS Maintenance
          </Text>
          <Text size="xs" c="dimmed">
            Fleet preventive maintenance tracking & odometer log
          </Text>
        </div>
        <Button
          variant="light"
          size="xs"
          leftSection={<IconRefresh size={14} />}
          onClick={fetchFleetStatus}
          loading={loading}
        >
          Refresh
        </Button>
      </Group>

      {/* Toolbar & Filters */}
      <Paper withBorder radius="md" p="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <TextInput
              placeholder="Search plate or fleet..."
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="xs"
              style={{ width: 220 }}
            />
            <Select
              placeholder="All Statuses"
              clearable
              data={[
                { value: "ok", label: "OK" },
                { value: "due_soon", label: "Due Soon" },
                { value: "overdue", label: "Overdue" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              size="xs"
              style={{ width: 140 }}
            />
          </Group>
          <Group gap="xs">
            <Badge color="teal" variant="light" size="xs">
              OK: {stats.ok}
            </Badge>
            <Badge color="orange" variant="light" size="xs">
              Due Soon: {stats.dueSoon}
            </Badge>
            <Badge color="red" variant="light" size="xs">
              Overdue: {stats.overdue}
            </Badge>
          </Group>
        </Group>
      </Paper>

      {/* Date Range Export */}
      <Paper withBorder radius="md" p="sm">
        <Group justify="space-between">
          <Group gap="xs" align="flex-end">
            <TextInput
              type="date"
              label="From"
              value={startDate}
              onChange={(e) => setStartDate(e.currentTarget.value)}
              size="xs"
              style={{ width: 150 }}
            />
            <TextInput
              type="date"
              label="To"
              value={endDate}
              onChange={(e) => setEndDate(e.currentTarget.value)}
              size="xs"
              style={{ width: 150 }}
            />
          </Group>
          <Group gap="xs" align="flex-end">
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconFileTypePdf size={14} />}
              onClick={handleExportPdf}
              loading={exporting}
              disabled={!startDate || !endDate}
            >
              Export PDF
            </Button>
            <Button
              size="xs"
              variant="light"
              color="green"
              leftSection={<IconFileSpreadsheet size={14} />}
              onClick={handleExportXlsx}
              loading={exporting}
              disabled={!startDate || !endDate}
            >
              Export XLSX
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Main Table */}
      <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
        {loading ? (
          <Center p="xl">
            <Loader size="sm" />
          </Center>
        ) : filteredFleet.length === 0 ? (
          <Center p="xl">
            <Text size="xs" c="dimmed">No truck records found.</Text>
          </Center>
        ) : (
          <>
            <ScrollArea style={{ maxHeight: "calc(100vh - 380px)" }} type="auto">
              <Table verticalSpacing="xs" horizontalSpacing="sm" withColumnBorders striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={headerCellStyle}>Plate Number</Table.Th>
                    <Table.Th style={headerCellStyle}>Fleet / Unit</Table.Th>
                    <Table.Th style={headerCellStyle}>Last PMS Date</Table.Th>
                    <Table.Th style={headerCellStyle}>Last PMS Odo</Table.Th>
                    <Table.Th style={headerCellStyle}>Current Odo</Table.Th>
                    <Table.Th style={headerCellStyle}>KM Traveled</Table.Th>
                    <Table.Th style={headerCellStyle}>Status</Table.Th>
                    <Table.Th style={{ ...headerCellStyle, textAlign: "right" }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pagedFleet.map((t) => (
                    <Table.Tr key={t.plateNumber}>
                      <Table.Td style={cellStyle}>
                        <Group gap={6}>
                          <Text fw={700} style={{ fontSize: "11px" }}>
                            {t.plateNumber}
                          </Text>
                          {t.isSubcon && (
                            <Badge size="xs" color="gray" variant="light">
                              Subcon
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td style={cellStyle}>
                        {t.fleetType || "Standard"} {t.unitType ? `(${t.unitType})` : ""}
                      </Table.Td>
                      <Table.Td style={cellStyle}>
                        {t.lastPmsDate || "—"}
                      </Table.Td>
                      <Table.Td style={cellStyle}>
                        {t.lastPmsOdo.toLocaleString()} km
                      </Table.Td>
                      <Table.Td style={{ ...cellStyle, fontWeight: 700 }}>
                        {t.currentOdo.toLocaleString()} km
                      </Table.Td>
                      <Table.Td
                        style={{
                          ...cellStyle,
                          fontWeight: 700,
                          color:
                            t.pmsStatus === "overdue"
                              ? "var(--mantine-color-red-6)"
                              : t.pmsStatus === "due_soon"
                              ? "var(--mantine-color-orange-6)"
                              : "var(--mantine-color-teal-6)",
                        }}
                      >
                        {t.kmSinceLastPms.toLocaleString()} km
                      </Table.Td>
                      <Table.Td style={cellStyle}>
                        {t.pmsStatus === "overdue" ? (
                          <Badge color="red" size="xs">
                            Overdue
                          </Badge>
                        ) : t.pmsStatus === "due_soon" ? (
                          <Badge color="orange" size="xs">
                            Due Soon
                          </Badge>
                        ) : (
                          <Badge color="teal" size="xs" variant="light">
                            OK
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td style={{ ...cellStyle, textAlign: "right" }}>
                        <Group gap={4} justify="flex-end">
                          <Button
                            size="xs"
                            color="blue"
                            variant="light"
                            leftSection={<IconPlus size={12} />}
                            onClick={() => handleOpenLogModal(t)}
                            styles={{ root: { height: 22, fontSize: "10px", padding: "0 8px" } }}
                          >
                            Log PMS
                          </Button>
                          <ActionIcon
                            size="xs"
                            variant="default"
                            onClick={() => handleOpenHistory(t.plateNumber)}
                          >
                            <IconHistory size={12} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Box
              px="md"
              py={8}
              style={{
                borderTop: "1px solid var(--mantine-color-gray-2)",
                backgroundColor: "var(--mantine-color-gray-0)",
              }}
            >
              <Group justify="space-between" align="center">
                <Text style={{ fontSize: "10px" }} c="dimmed" fw={600}>
                  Showing{" "}
                  {filteredFleet.length === 0
                    ? 0
                    : Math.min((page - 1) * PAGE_SIZE + 1, filteredFleet.length)}{" "}
                  – {Math.min(page * PAGE_SIZE, filteredFleet.length)} of {filteredFleet.length} record
                  {filteredFleet.length !== 1 ? "s" : ""}
                </Text>
                <Pagination
                  total={Math.ceil(filteredFleet.length / PAGE_SIZE)}
                  value={page}
                  onChange={setPage}
                  size="xs"
                  radius="md"
                  styles={{
                    control: { fontSize: "10px", height: 24, minWidth: 24 },
                  }}
                />
              </Group>
            </Box>
          </>
        )}
      </Paper>

      {/* Record PMS Modal */}
      <Modal
        opened={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title={
          <Text fw={700} size="sm">
            Record PMS — {selectedTruck?.plateNumber}
          </Text>
        }
        centered
        radius="md"
        size="sm"
      >
        <Stack gap="xs">
          <TextInput
            type="date"
            label="PMS Date"
            value={pmsDate}
            onChange={(e) => setPmsDate(e.currentTarget.value)}
            size="xs"
            required
          />

          <NumberInput
            label="Odometer Reading (km)"
            value={pmsOdo}
            onChange={(val) => setPmsOdo(Number(val) || 0)}
            size="xs"
            min={0}
            required
          />

          <TextInput
            label="Service Details"
            value={serviceType}
            onChange={(e) => setServiceType(e.currentTarget.value)}
            size="xs"
          />

          <TextInput
            label="Cost (₱)"
            value={cost}
            onChange={(e) => setCost(e.currentTarget.value)}
            size="xs"
          />

          <TextInput
            label="Mechanic / Shop"
            value={performedBy}
            onChange={(e) => setPerformedBy(e.currentTarget.value)}
            size="xs"
          />

          <Textarea
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.currentTarget.value)}
            size="xs"
            rows={2}
          />

          <Group justify="flex-end" mt="xs">
            <Button size="xs" variant="default" onClick={() => setLogModalOpen(false)}>
              Cancel
            </Button>
            <Button size="xs" color="blue" onClick={handleSavePmsLog} loading={submitting}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* PMS History Drawer */}
      <Drawer
        opened={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        title={
          <Text fw={700} size="sm">
            PMS History — {historyTruckPlate}
          </Text>
        }
        position="right"
        size="md"
      >
        <Stack gap="xs" mt="sm">
          {loadingHistory ? (
            <Center p="md">
              <Loader size="xs" />
            </Center>
          ) : pmsHistory.length === 0 ? (
            <Text c="dimmed" size="xs" ta="center" py="md">
              No historical records.
            </Text>
          ) : (
            <Table verticalSpacing="xs">
              <Table.Thead bg="var(--mantine-color-dark-6)">
                <Table.Tr>
                  <Table.Th style={{ fontSize: "10px" }}>Date</Table.Th>
                  <Table.Th style={{ fontSize: "10px" }}>Odo</Table.Th>
                  <Table.Th style={{ fontSize: "10px" }}>Service</Table.Th>
                  <Table.Th style={{ fontSize: "10px" }}>Cost</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pmsHistory.map((h) => (
                  <Table.Tr key={h.id}>
                    <Table.Td style={{ fontSize: "11px" }}>{h.pmsDate}</Table.Td>
                    <Table.Td style={{ fontSize: "11px" }} fw={600}>
                      {Number(h.pmsOdo).toLocaleString()} km
                    </Table.Td>
                    <Table.Td style={{ fontSize: "11px" }}>{h.serviceType}</Table.Td>
                    <Table.Td style={{ fontSize: "11px" }}>₱{Number(h.cost || 0).toLocaleString()}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Drawer>
    </Stack>
  );
}
