"use client";

import {
  Box,
  Group,
  Modal,
  Textarea,
  Text,
  Stack,
  Divider,
  Button,
  Select,
  SimpleGrid,
  Paper,
  ThemeIcon,
  ActionIcon,
  Tooltip,
  Alert,
  TextInput,
  Progress,
  Image,
} from "@mantine/core";
import { DispatchRecord } from "@/app/(app)/constant";
import {
  useState,
  useMemo,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconClock,
  IconEye,
  IconFileDescription,
  IconRoute,
  IconTrash,
  IconTruck,
  IconTruckDelivery,
  IconUpload,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { uploadFile, replaceFile } from "@/lib/actions/file-upload";
import { compressImage } from "@/lib/utils/imageUtils";
import { inputStyles } from "@/app/(app)/dispatch/page";

export interface TripDetailsForm {
  pickUpTime: string;
  arrivalPickup: string;
  loadingStart: string;
  loadingEnd: string;
  departurePickup: string;
  finishDelivery: string;
  deliveryStatus: string;
  podFile: string;
  podFileUrl: string;
  podFileType: string;
  tripRemarks: string;
  bookingDRNo: string;
}

/* ── Constants ── */
const DELIVERY_STATUS_OPTIONS = [
  { value: "Completed", label: "Completed" },
  { value: "Foul Trip", label: "Foul Trip" },
  { value: "Incomplete", label: "Incomplete" },
  { value: "In Transit", label: "In Transit" },
  { value: "Cancel/No Show", label: "Cancel / No Show" },
];

export const deliveryStatusColor: Record<string, string> = {
  Completed: "green",
  "Foul Trip": "red",
  Incomplete: "orange",
  "In Transit": "blue",
  "Cancel/No Show": "gray",
};

export const STATUS_META: Record<
  string,
  { color: string; icon: React.ReactNode }
> = {
  Completed: { color: "green", icon: <IconCheck size={11} /> },
  "Foul Trip": { color: "red", icon: <IconX size={11} /> },
  Incomplete: { color: "orange", icon: <IconAlertTriangle size={11} /> },
  "In Transit": { color: "blue", icon: <IconTruck size={11} /> },
  "Cancel/No Show": { color: "gray", icon: <IconBan size={11} /> },
};

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  // parse existing HH:mm value into parts
  const toHour12 = (hh: number) => {
    if (hh === 0) return "12";
    if (hh > 12) return String(hh - 12).padStart(2, "0");
    return String(hh).padStart(2, "0");
  };

  const parsed = value ? value.split(":") : [];
  const rawHour = parsed[0] ? parseInt(parsed[0]) : null;

  const initHour = rawHour !== null ? toHour12(rawHour) : null;
  const initMinute = parsed[1] ?? null;
  const initPeriod = rawHour !== null ? (rawHour >= 12 ? "PM" : "AM") : null;

  const [hour, setHour] = useState<string | null>(initHour);
  const [minute, setMinute] = useState<string | null>(initMinute);
  const [period, setPeriod] = useState<string | null>(initPeriod);

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const emit = (h: string | null, m: string | null, p: string | null) => {
    if (!h || !m || !p) return;
    let hh = parseInt(h);
    if (p === "AM" && hh === 12) hh = 0;
    if (p === "PM" && hh !== 12) hh += 12;
    onChange(`${String(hh).padStart(2, "0")}:${m}`);
  };

  const handleClear = () => {
    setHour(null);
    setMinute(null);
    setPeriod(null);
    onChange("");
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--mantine-color-gray-7)",
    marginBottom: 4,
  };

  const selectStyles = {
    input: {
      fontSize: "13px",
      fontWeight: 700,
      textAlign: "center" as const,
      borderColor: value ? "var(--mantine-color-blue-3)" : undefined,
      backgroundColor: value ? "var(--mantine-color-blue-0)" : undefined,
      color: value ? "var(--mantine-color-blue-7)" : undefined,
    },
  };

  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text style={labelStyle}>{label}</Text>
        {value && (
          <Tooltip label="Clear" withArrow fz={10}>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              onClick={handleClear}
            >
              <IconX size={11} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      <Group gap={4} wrap="nowrap">
        <Select
          placeholder="HH"
          data={hours}
          value={hour}
          onChange={(v) => {
            setHour(v);
            emit(v, minute, period);
          }}
          styles={selectStyles}
          radius="md"
          w={70}
          comboboxProps={{ width: 80 }}
          allowDeselect={false}
        />
        <Text fw={800} c="dimmed" style={{ fontSize: "16px" }}>
          :
        </Text>
        <Select
          placeholder="MM"
          data={minutes}
          value={minute}
          onChange={(v) => {
            setMinute(v);
            emit(hour, v, period);
          }}
          styles={selectStyles}
          radius="md"
          w={70}
          comboboxProps={{ width: 80 }}
          allowDeselect={false}
        />
        <Select
          placeholder="AM"
          data={["AM", "PM"]}
          value={period}
          onChange={(v) => {
            setPeriod(v);
            emit(hour, minute, v);
          }}
          styles={selectStyles}
          radius="md"
          w={75}
          allowDeselect={false}
        />
      </Group>
    </Stack>
  );
}

function PodUploadField({
  fileName,
  fileUrl,
  fileType,
  isUploading,
  onUploadClick,
  onFileChange,
  onClear,
  onPreview,
}: {
  fileName: string;
  fileUrl: string;
  fileType: string;
  isUploading: boolean;
  onUploadClick: () => void;
  onFileChange: (file: File | null) => void;
  onClear: () => void;
  onPreview: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const isImage = fileType.startsWith("image/");

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    onFileChange(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <Stack gap={6} mt="sm">
      <Text style={{ fontSize: "11px", fontWeight: 600 }} c="gray.7">
        POD
      </Text>
      <Box
        role="button"
        tabIndex={0}
        onClick={isUploading ? undefined : onUploadClick}
        onKeyDown={(event) => {
          if (!isUploading && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onUploadClick();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={isUploading ? undefined : handleDrop}
        style={{
          minHeight: 98,
          border: `1px dashed ${
            isDragging
              ? "var(--mantine-color-blue-5)"
              : "var(--mantine-color-blue-4)"
          }`,
          borderRadius: 8,
          background: isDragging
            ? "var(--mantine-color-blue-0)"
            : "var(--mantine-color-gray-0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isUploading ? "not-allowed" : "pointer",
          opacity: isUploading ? 0.6 : 1,
          transition: "border-color 0.15s ease, background-color 0.15s ease",
        }}
      >
        {isUploading ? (
          <Stack align="center" gap={8} style={{ width: "65%" }}>
            <Text style={{ fontSize: "11px" }} fw={800} c="blue.7">
              Uploading…
            </Text>
            <Progress
              value={100}
              animated
              color="blue.5"
              size={4}
              radius="xl"
              style={{ width: "100%" }}
            />
          </Stack>
        ) : (
          <Stack align="center" gap={6}>
            <ThemeIcon color="blue" variant="light" radius="xl" size={30}>
              <IconUpload size={15} />
            </ThemeIcon>
            <Text style={{ fontSize: "11px" }} fw={800} c="blue.7">
              Upload File
            </Text>
            <Text style={{ fontSize: "10px" }} c="dimmed" fw={500}>
              JPG, PNG or WEBP
            </Text>
          </Stack>
        )}
      </Box>

      {fileName && (
        <Group
          justify="space-between"
          wrap="nowrap"
          gap={8}
          px={8}
          py={5}
          style={{
            borderRadius: 999,
            background: "var(--mantine-color-blue-0)",
            border: "1px solid var(--mantine-color-blue-1)",
          }}
        >
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            {isImage && fileUrl ? (
              <Image
                src={fileUrl}
                alt={fileName}
                w={24}
                h={24}
                radius={4}
                fit="cover"
                style={{ flexShrink: 0, cursor: "pointer" }}
                onClick={(event) => {
                  event.stopPropagation();
                  onPreview();
                }}
              />
            ) : (
              <IconFileDescription
                size={13}
                color="var(--mantine-color-blue-6)"
              />
            )}
            <Text
              style={{
                fontSize: "10px",
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              c="gray.8"
            >
              {fileName}
            </Text>
            {!isUploading && (
              <ThemeIcon
                size={13}
                radius="xl"
                color="green"
                variant="light"
                style={{ flexShrink: 0 }}
              >
                <IconCheck size={9} />
              </ThemeIcon>
            )}
          </Group>

          <Group gap={4} wrap="nowrap">
            {isImage && fileUrl && !isUploading && (
              <Tooltip label="Preview POD" withArrow fz={10}>
                <ActionIcon
                  size="sm"
                  radius="xl"
                  color="gray"
                  variant="light"
                  aria-label="Preview POD file"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPreview();
                  }}
                >
                  <IconEye size={12} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="Remove POD" withArrow fz={10}>
              <ActionIcon
                size="sm"
                radius="xl"
                color="blue"
                variant="filled"
                aria-label="Remove POD file"
                disabled={isUploading}
                onClick={(event) => {
                  event.stopPropagation();
                  onClear();
                }}
              >
                <IconTrash size={12} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      )}
    </Stack>
  );
}

/* ── Main Modal ── */
export function TripDetailsModal({
  opened,
  onClose,
  record,
  onSave,
}: {
  opened: boolean;
  onClose: () => void;
  record: DispatchRecord | null;
  onSave: (id: string | number, form: TripDetailsForm) => void;
}) {
  const initial = useMemo(
    () => ({
      pickUpTime: record?.pickUpTime ?? "",
      arrivalPickup: record?.arrivalPickup ?? "",
      loadingStart: record?.loadingStart ?? "",
      loadingEnd: record?.loadingEnd ?? "",
      departurePickup: record?.departurePickup ?? "",
      finishDelivery: record?.finishDelivery ?? "",
      deliveryStatus: record?.deliveryStatus ?? "",
      podFile: record?.podFile ?? "",
      podFileUrl: record?.podFileUrl ?? "",
      podFileType: record?.podFileType ?? "",
      tripRemarks: record?.tripRemarks ?? "",
      bookingDRNo: record?.bookingDRNo ?? "",
    }),
    [record],
  );

  const [form, setForm] = useState<TripDetailsForm>(initial);
  // The actual File object for the pending upload — separate from form
  // because form.podFileUrl is just a blob preview URL (not uploadable)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const podInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof TripDetailsForm, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handlePodChange = (file: File | null) => {
    setUploadError(null);
    if (!file) {
      setPendingFile(null);
      setForm((prev) => ({
        ...prev,
        podFile: "",
        podFileUrl: "",
        podFileType: "",
      }));
      return;
    }

    setPendingFile(file);
    setForm((prev) => ({
      ...prev,
      podFile: file.name,
      // blob URL for preview only — gets replaced by real URL on save
      podFileUrl: URL.createObjectURL(file),
      podFileType: file.type,
    }));
  };

  const handlePodInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handlePodChange(event.currentTarget.files?.[0] ?? null);
    event.currentTarget.value = "";
  };

  const isFormValid =
    !!form.deliveryStatus &&
    (form.deliveryStatus === "Completed"
      ? !!form.arrivalPickup &&
        !!form.loadingStart &&
        !!form.loadingEnd &&
        !!form.departurePickup &&
        form.finishDelivery
      : true);

  if (!record) return null;

  const handleClose = () => {
    setForm(initial);
    setPendingFile(null);
    setUploadError(null);
    onClose();
  };

  const handleSave = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      let finalPodUrl = form.podFileUrl;

      if (pendingFile) {
        const compressed = await compressImage(pendingFile);

        // e.g. "Lazada_2025-06-13_DR-00421.jpg"
        const safeName = [
          record.clientName ?? record.client,
          record.pickUpDate ?? record.date,
          record.bookingDRNo ?? record.bookingDr,
        ]
          .map((s) =>
            String(s ?? "")
              .replace(/[^a-zA-Z0-9-]/g, "_")
              .trim(),
          )
          .join("_");

        const ext = compressed.name.split(".").pop() ?? "jpg";

        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("folder", "pod");
        fd.append("name", `${safeName}.${ext}`); // ← custom name

        let res: { success?: boolean; url?: string; error?: string };

        if (record.podFileUrl && record.podFileUrl.startsWith("http")) {
          fd.append("oldUrl", record.podFileUrl);
          res = await replaceFile(fd);
        } else {
          res = await uploadFile(fd);
        }

        if (res.error || !res.url) {
          setUploadError(res.error ?? "Upload failed. Try again.");
          return;
        }

        finalPodUrl = res.url;
      }

      onSave(record.id, { ...form, podFileUrl: finalPodUrl });
      onClose();
    } catch (err) {
      setUploadError("Unexpected error during upload.");
      console.error("POD upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Modal
        key={record.id}
        opened={opened}
        onClose={handleClose}
        title={
          <Stack gap={2}>
            <Group gap={8}>
              <IconClock size={15} color="var(--mantine-color-blue-6)" />
              <Text
                fw={800}
                style={{ fontSize: "12px" }}
                tt="uppercase"
                lts={0.8}
                c="blue.7"
              >
                Delivery Monitoring
              </Text>
              <Text fw={600} style={{ fontSize: "12px" }} c="gray.5">
                #{record.id}
              </Text>
            </Group>
            <Group gap={12} ml={23}>
              <Group gap={4}>
                <IconUser size={11} color="var(--mantine-color-gray-5)" />
                <Text style={{ fontSize: "10px" }} c="dimmed" fw={600}>
                  {record.driver}
                </Text>
              </Group>
              <Group gap={4}>
                <IconRoute size={11} color="var(--mantine-color-gray-5)" />
                <Text style={{ fontSize: "10px" }} c="dimmed" fw={600}>
                  {record.ruta}
                </Text>
              </Group>
            </Group>
          </Stack>
        }
        size="lg"
        radius="md"
        centered
      >
        <Stack gap="md">
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
          >
            <Text
              fw={800}
              style={{ fontSize: "9px" }}
              tt="uppercase"
              lts={1}
              c="blue.6"
              mb="sm"
            >
              Timeline
            </Text>
            <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
              <TimeField
                label="Arrival at Pick Up"
                value={form.arrivalPickup}
                onChange={(v) => set("arrivalPickup", v)}
              />
              <TimeField
                label="Loading Start"
                value={form.loadingStart}
                onChange={(v) => set("loadingStart", v)}
              />
              <TimeField
                label="Loading End"
                value={form.loadingEnd}
                onChange={(v) => set("loadingEnd", v)}
              />
              <TimeField
                label="Departure from Pick Up"
                value={form.departurePickup}
                onChange={(v) => set("departurePickup", v)}
              />
            </SimpleGrid>
            <Divider mt="10px" mb="10px" />
            <TimeField
              label="Finish Delivery Time"
              value={form.finishDelivery}
              onChange={(v) => set("finishDelivery", v)}
            />
          </Paper>
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{ background: "var(--mantine-color-gray-0)" }}
          >
            <Text
              fw={800}
              style={{ fontSize: "9px" }}
              tt="uppercase"
              lts={1}
              c="blue.6"
              mb="sm"
            >
              Booking DR / #
            </Text>
            <TextInput
              placeholder="Enter booking DR / #"
              style={{ inputStyles }}
              value={form.bookingDRNo}
              onChange={(e) => set("bookingDRNo", e.currentTarget.value)}
            />
          </Paper>
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
          >
            <Text
              fw={800}
              style={{ fontSize: "9px" }}
              tt="uppercase"
              lts={1}
              c="blue.6"
              mb="sm"
            >
              Delivery Outcome
            </Text>
            <Select
              label="Delivery Status"
              placeholder="Select a status..."
              data={DELIVERY_STATUS_OPTIONS}
              value={form.deliveryStatus || null}
              onChange={(val) => set("deliveryStatus", val ?? "")}
              renderOption={({ option }) => {
                const meta = STATUS_META[option.value];
                return (
                  <Group gap={8} wrap="nowrap">
                    <ThemeIcon
                      size={20}
                      radius="xl"
                      variant="light"
                      color={meta.color}
                    >
                      {meta.icon}
                    </ThemeIcon>
                    <Text style={{ fontSize: "12px" }} fw={600}>
                      {option.label}
                    </Text>
                  </Group>
                );
              }}
              styles={{
                label: { fontSize: "11px", fontWeight: 600 },
                input: {
                  fontSize: "12px",
                  fontWeight: 700,
                  borderColor: form.deliveryStatus
                    ? `var(--mantine-color-${STATUS_META[form.deliveryStatus]?.color}-4)`
                    : undefined,
                  color: form.deliveryStatus
                    ? `var(--mantine-color-${STATUS_META[form.deliveryStatus]?.color}-7)`
                    : undefined,
                },
              }}
              radius="md"
            />
            <input
              ref={podInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePodInputChange}
              style={{ display: "none" }}
            />
            <PodUploadField
              fileName={form.podFile}
              fileUrl={form.podFileUrl}
              fileType={form.podFileType}
              isUploading={isUploading}
              onUploadClick={() => podInputRef.current?.click()}
              onFileChange={handlePodChange}
              onClear={() => handlePodChange(null)}
              onPreview={() => setPreviewOpen(true)}
            />

            {/* Upload error inline — user stays on modal to retry */}
            {uploadError && (
              <Alert
                color="red"
                mt="xs"
                radius="md"
                styles={{ message: { fontSize: "11px" } }}
              >
                {uploadError}
              </Alert>
            )}

            <Textarea
              label="Trip Remarks"
              placeholder="Any notes about this trip..."
              value={form.tripRemarks}
              onChange={(e) => set("tripRemarks", e.currentTarget.value)}
              minRows={3}
              mt="sm"
              styles={{ label: { fontSize: "11px", fontWeight: 600 } }}
              radius="md"
            />
          </Paper>

          <Divider />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              color="gray"
              disabled={isUploading}
              styles={{
                root: { height: 34 },
                label: { fontSize: "11px", fontWeight: 700 },
              }}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              color="blue.6"
              leftSection={<IconTruckDelivery size={14} />}
              disabled={!isFormValid || isUploading}
              loading={isUploading}
              styles={{
                root: { height: 34 },
                label: { fontSize: "11px", fontWeight: 700 },
              }}
              onClick={handleSave}
            >
              {isUploading ? "Saving…" : "Save Trip Details"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={
          <Text
            fw={800}
            style={{ fontSize: "12px" }}
            tt="uppercase"
            lts={0.8}
            c="blue.7"
          >
            POD Preview
          </Text>
        }
        size="lg"
        radius="md"
        centered
        zIndex={1000}
      >
        <Image
          src={form.podFileUrl}
          alt={form.podFile}
          radius="md"
          fit="contain"
          mah={600}
        />
        <Group justify="space-between" mt="sm">
          <Text style={{ fontSize: "11px" }} c="dimmed" fw={600}>
            {form.podFile}
          </Text>
          <Button
            component="a"
            href={form.podFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            size="xs"
            styles={{ label: { fontSize: "11px", fontWeight: 700 } }}
          >
            Open Original
          </Button>
        </Group>
      </Modal>
    </>
  );
}
