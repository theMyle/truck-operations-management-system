"use client";

import React, { useEffect, useState } from "react";
import {
  Stack,
  Paper,
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
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconSend,
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

export function RecordIncidentTab() {
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
  const [drivers, setDrivers] = useState<{ value: string; label: string }[]>(
    []
  );
  const [helpers, setHelpers] = useState<{ value: string; label: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Live score preview
  const [scorePreview, setScorePreview] = useState<{
    totalDemerits: number;
    score: number;
    rating: string;
  } | null>(null);

  useEffect(() => {
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
          driverList
            .filter((d: any) => d.isActive !== false)
            .map((d: any) => ({
              value: d.id,
              label: d.driverName || d.driver_name || d.name,
            }))
        );
      }
      if (hRes?.data) {
        const helperList = Array.isArray(hRes.data) ? hRes.data : [];
        setHelpers(
          helperList
            .filter((h: any) => h.isActive !== false)
            .map((h: any) => ({
              value: h.id,
              label: h.helperName || h.helper_name || h.name,
            }))
        );
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Live score preview when person changes
  useEffect(() => {
    if (!personId) {
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
  }, [personId]);

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
    } else {
      notifications.show({
        title: "Error",
        message: res?.data?.error || "Failed to record violation",
        color: "red",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Center h={200}>
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <Paper withBorder radius="md" p="lg" maw={600}>
      <Text fw={700} size="lg" mb="md">
        Record New Violation
      </Text>

      <Stack gap="md">
        <SegmentedControl
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

        <Select
          label="Select Person"
          placeholder={`Choose a ${personType}...`}
          data={personOptions}
          value={personId}
          onChange={setPersonId}
          searchable
          clearable
          required
        />

        <Select
          label="Violation Type"
          placeholder="Choose violation..."
          data={violationTypes.map((v) => ({
            value: v.id,
            label: `${v.name} — ${v.points} pts (${v.category})`,
          }))}
          value={violationTypeId}
          onChange={setViolationTypeId}
          searchable
          clearable
          required
        />

        <TextInput
          label="Date of Incident"
          type="date"
          value={incidentDate}
          onChange={(e) => setIncidentDate(e.target.value)}
          required
        />

        <TextInput
          label="Reported By"
          placeholder="e.g. Ma'am Kris"
          value={reportedBy}
          onChange={(e) => setReportedBy(e.target.value)}
        />

        <Textarea
          label="Notes"
          placeholder="Additional details about the incident..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        {/* Live Score Preview */}
        {selectedViolation && scorePreview && (
          <Alert
            color={getRatingColor(
              projectedScore !== null
                ? projectedScore >= 90
                  ? "Excellent"
                  : projectedScore >= 80
                  ? "Good"
                  : projectedScore >= 70
                  ? "Needs Improvement"
                  : "Poor"
                : scorePreview.rating
            )}
            variant="light"
            icon={<IconAlertTriangle size={16} />}
          >
            <Group gap="xs" align="center">
              <Text size="sm" fw={600}>
                Points to deduct: {selectedViolation.points} pts
              </Text>
              <Text size="sm" c="dimmed">|</Text>
              <Text size="sm">
                Current: {scorePreview.score}
              </Text>
              <Text size="sm" c="dimmed">→</Text>
              <Text size="sm" fw={700}>
                {projectedScore}
              </Text>
              <Badge
                color={getRatingColor(
                  projectedScore !== null
                    ? projectedScore >= 90
                      ? "Excellent"
                      : projectedScore >= 80
                      ? "Good"
                      : projectedScore >= 70
                      ? "Needs Improvement"
                      : "Poor"
                    : scorePreview.rating
                )}
                size="sm"
                variant="light"
              >
                {projectedScore !== null
                  ? projectedScore >= 90
                    ? "Excellent"
                    : projectedScore >= 80
                    ? "Good"
                    : projectedScore >= 70
                    ? "Needs Improvement"
                    : "Poor"
                  : scorePreview.rating}
              </Badge>
            </Group>
          </Alert>
        )}

        <Group justify="flex-end" mt="sm">
          <Button
            leftSection={<IconSend size={14} />}
            onClick={handleSubmit}
            loading={saving}
            disabled={!personId || !violationTypeId}
          >
            Submit Violation
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
