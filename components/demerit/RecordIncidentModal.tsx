"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Stack,
  Select,
  TextInput,
  Textarea,
  Button,
  Group,
  Alert,
  Text,
  Badge,
  SegmentedControl,
  Center,
  Loader,
  Paper,
  Box,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconSend,
  IconAlertOctagon,
  IconUserCheck,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  getViolationTypesAction,
  createDemeritRecordAction,
  getPersonMonthScoreAction,
} from "@/lib/actions/demerit";
import { getDriverAction } from "@/lib/actions/drivers";
import { getHelperAction } from "@/lib/actions/helpers";
import type { ViolationType } from "@/lib/db/schema";

interface RecordIncidentModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function getRatingColor(rating: string) {
  switch (rating) {
    case "Excellent":
      return "teal";
    case "Good":
      return "blue";
    case "Needs Improvement":
      return "orange";
    case "Poor":
      return "red";
    default:
      return "gray";
  }
}

export function RecordIncidentModal({
  opened,
  onClose,
  onSuccess,
}: RecordIncidentModalProps) {
  const [personType, setPersonType] = useState<"driver" | "helper">("driver");
  const [personId, setPersonId] = useState<string | null>(null);
  const [violationTypeId, setViolationTypeId] = useState<string | null>(null);
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportedBy, setReportedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [drivers, setDrivers] = useState<{ value: string; label: string }[]>([]);
  const [helpers, setHelpers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Live score preview
  const [scorePreview, setScorePreview] = useState<{
    totalDemerits: number;
    score: number;
    rating: string;
  } | null>(null);

  useEffect(() => {
    if (!opened) return;
    async function loadData() {
      setLoading(true);
      const [vtRes, dRes, hRes] = await Promise.all([
        getViolationTypesAction(),
        getDriverAction(),
        getHelperAction(),
      ]);

      if (vtRes?.data?.success && vtRes.data.data) {
        setViolationTypes(vtRes.data.data);
      }
      if (dRes?.data) {
        const driverList = Array.isArray(dRes.data) ? dRes.data : [];
        setDrivers(
          driverList.map((d: any) => ({
            value: d.id,
            label: d.driverName || d.driver_name || d.name,
          }))
        );
      }
      if (hRes?.data) {
        const helperList = Array.isArray(hRes.data) ? hRes.data : [];
        setHelpers(
          helperList.map((h: any) => ({
            value: h.id,
            label: h.helperName || h.helper_name || h.name,
          }))
        );
      }
      setLoading(false);
    }
    loadData();
  }, [opened]);

  // Live score preview when person changes
  useEffect(() => {
    if (!personId || !opened) {
      setScorePreview(null);
      return;
    }
    const now = new Date();
    getPersonMonthScoreAction({
      personId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }).then((res) => {
      if (res?.data?.success && res.data.data) {
        setScorePreview(res.data.data);
      }
    });
  }, [personId, opened]);

  const selectedViolation = violationTypes.find(
    (v) => v.id === violationTypeId
  );
  const personOptions = personType === "driver" ? drivers : helpers;
  const selectedPerson = personOptions.find((p) => p.value === personId);

  // Projected score after this incident
  const projectedScore =
    scorePreview && selectedViolation
      ? Math.max(0, scorePreview.score - selectedViolation.points)
      : null;

  const projectedRating =
    projectedScore !== null
      ? projectedScore >= 90
        ? "Excellent"
        : projectedScore >= 80
        ? "Good"
        : projectedScore >= 70
        ? "Needs Improvement"
        : "Poor"
      : scorePreview?.rating || "Excellent";

  const handleSubmit = async () => {
    if (!personId || !violationTypeId || !selectedViolation || !selectedPerson)
      return;

    setSaving(true);
    const res = await createDemeritRecordAction({
      personId,
      personType,
      personName: selectedPerson.label,
      violationTypeId,
      points: selectedViolation.points,
      incidentDate,
      reportedBy: reportedBy || undefined,
      notes: notes || undefined,
    });

    if (res?.data?.success) {
      notifications.show({
        title: "Violation Recorded",
        message: `${selectedViolation.points} demerit points recorded for ${selectedPerson.label}.`,
        color: "orange",
        icon: <IconAlertTriangle size={16} />,
      });
      // Reset form
      setPersonId(null);
      setViolationTypeId(null);
      setReportedBy("");
      setNotes("");
      setScorePreview(null);
      onClose();
      if (onSuccess) onSuccess();
    } else {
      notifications.show({
        title: "Error",
        message: res?.data?.error || "Failed to record violation",
        color: "red",
      });
    }
    setSaving(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="var(--mantine-color-orange-6)" />
          <Text fw={700} size="md">
            Record Violation Incident
          </Text>
        </Group>
      }
      centered
      size="md"
      radius="md"
    >
      {loading ? (
        <Center h={180}>
          <Loader size="sm" />
        </Center>
      ) : (
        <Stack gap="sm">
          <Box>
            <Text size="xs" fw={700} c="dimmed" mb={4}>
              PERSONNEL ROLE
            </Text>
            <SegmentedControl
              fullWidth
              value={personType}
              onChange={(val) => {
                setPersonType(val as "driver" | "helper");
                setPersonId(null);
                setScorePreview(null);
              }}
              data={[
                { label: "Driver", value: "driver" },
                { label: "Helper", value: "helper" },
              ]}
              size="xs"
            />
          </Box>

          <Select
            label="Select Person"
            placeholder={`Choose a ${personType}...`}
            data={personOptions}
            value={personId}
            onChange={setPersonId}
            searchable
            clearable
            required
            size="xs"
          />

          <Select
            label="Violation Type"
            placeholder="Choose violation from catalog..."
            data={violationTypes.map((v) => ({
              value: v.id,
              label: `${v.name} — ${v.points} pts (${v.category})`,
            }))}
            value={violationTypeId}
            onChange={setViolationTypeId}
            searchable
            clearable
            required
            size="xs"
          />

          <TextInput
            label="Date of Incident"
            type="date"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            required
            size="xs"
          />

          <TextInput
            label="Reported By"
            placeholder="e.g. Ma'am Kris"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            size="xs"
          />

          <Textarea
            label="Notes"
            placeholder="Additional details about the incident..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            size="xs"
          />

          {/* Live Impact Score Card */}
          {selectedViolation && scorePreview && (
            <Paper withBorder p="xs" radius="sm" bg="orange.0">
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <IconAlertOctagon size={16} color="var(--mantine-color-orange-7)" />
                  <div>
                    <Text size="xs" fw={700} c="orange.9">
                      Deducting {selectedViolation.points} Demerit Points
                    </Text>
                    <Text size="11px" c="dimmed">
                      Current Score: {scorePreview.score} → Projected Score:{" "}
                      <strong>{projectedScore}</strong>
                    </Text>
                  </div>
                </Group>
                <Badge color={getRatingColor(projectedRating)} size="sm" variant="filled">
                  {projectedRating}
                </Badge>
              </Group>
            </Paper>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" size="xs" onClick={onClose}>
              Cancel
            </Button>
            <Button
              leftSection={<IconSend size={14} />}
              size="xs"
              color="orange"
              onClick={handleSubmit}
              loading={saving}
              disabled={!personId || !violationTypeId}
            >
              Submit Violation
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
