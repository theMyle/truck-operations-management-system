"use client";

import { useState } from "react";
import { Modal, Stack, Group, SimpleGrid, Title, Text, Image, Paper, Box, ThemeIcon, Divider } from "@mantine/core";
import { IconHelmet, IconPhone, IconAlertCircle, IconMapPin, IconId, IconEye } from "@tabler/icons-react";
import type { Helper } from "@/lib/db/schema/helpers";

interface Props {
  opened: boolean;
  onClose: () => void;
  helper: Helper | null;
}

function IdCard({
  label,
  src,
  alt,
  name,
  onPreview,
}: {
  label: string;
  src: string | null | undefined;
  alt: string;
  name: string;
  onPreview: (img: { src: string; title: string }) => void;
}) {
  return (
    <Stack gap={6}>
      <Text size="xs" c="dimmed" fw={600} ta="center" tt="uppercase">
        {label}
      </Text>
      {src ? (
        <Box
          style={{
            cursor: "pointer",
            position: "relative",
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
            border: "1px solid var(--mantine-color-gray-2)",
            transition: "transform 0.18s ease, box-shadow 0.18s ease",
          }}
          onClick={() => onPreview({ src, title: `${label} — ${name}` })}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow = "var(--mantine-shadow-md)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Image src={src} alt={alt} h={180} fit="cover" fallbackSrc="https://placehold.co/600x400?text=No+Preview" />
          <Box
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
              padding: "12px 8px 6px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "4px",
              color: "white",
            }}
          >
            <IconEye size={13} />
            <Text size="xs" fw={600}>
              Click to enlarge
            </Text>
          </Box>
        </Box>
      ) : (
        <Paper
          withBorder
          radius="md"
          style={{ borderStyle: "dashed", height: 180 }}
          display="flex"
        >
          <Stack gap={6} align="center" justify="center" style={{ width: "100%", height: "100%" }}>
            <IconId size={28} color="var(--mantine-color-gray-4)" />
            <Text size="xs" c="dimmed" ta="center">
              No {label} uploaded
            </Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

function InfoField({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <Group gap="sm" align="flex-start" wrap="nowrap">
      <ThemeIcon variant="light" color={iconColor} size="sm" radius="sm" mt={2}>
        {icon}
      </ThemeIcon>
      <Box>
        <Text size="xs" c="dimmed" fw={500} lh={1.2}>
          {label}
        </Text>
        <Text size="sm" fw={600} c="gray.8" lh={1.4} style={{ whiteSpace: "pre-wrap" }}>
          {value}
        </Text>
      </Box>
    </Group>
  );
}

export function ViewHelperModal({ opened, onClose, helper }: Props) {
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  if (!helper) return null;

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="sm">
            <ThemeIcon variant="light" size="lg" radius="md" color="blue">
              <IconHelmet size={18} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fw={700} size="md" lh={1.2}>
                {helper.helperName}
              </Text>
              <Text size="xs" c="dimmed">
                Helper Profile
              </Text>
            </Stack>
          </Group>
        }
        centered
        size="xl"
        radius="md"
        styles={{
          header: {
            borderBottom: "1px solid var(--mantine-color-gray-2)",
            paddingBottom: "var(--mantine-spacing-md)",
          },
          body: {
            paddingTop: "var(--mantine-spacing-xl)",
            paddingBottom: "var(--mantine-spacing-xl)",
          },
        }}
      >
        <Stack gap="xl">
          {/* Personal Details */}
          <Stack gap="md">
            <Group gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="blue" lts="0.05em">
                Personal Details
              </Text>
              <Divider style={{ flex: 1 }} />
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <InfoField
                icon={<IconHelmet size={12} />}
                iconColor="blue"
                label="Full Name"
                value={helper.helperName}
              />
              <InfoField
                icon={<IconMapPin size={12} />}
                iconColor="teal"
                label="Address"
                value={helper.address}
              />
              <InfoField
                icon={<IconPhone size={12} />}
                iconColor="indigo"
                label="Contact Number"
                value={helper.contactNumber || "N/A"}
              />
              <InfoField
                icon={<IconAlertCircle size={12} />}
                iconColor="red"
                label="Emergency Contact"
                value={helper.emergencyContact || "N/A"}
              />
            </SimpleGrid>
          </Stack>

          {/* ID Documents */}
          <Stack gap="md">
            <Group gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="blue" lts="0.05em">
                ID Documents
              </Text>
              <Divider style={{ flex: 1 }} />
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <IdCard
                label="Front ID"
                src={helper.idFrontLink}
                alt="Front ID"
                name={helper.helperName}
                onPreview={setPreviewImage}
              />
              <IdCard
                label="Back ID"
                src={helper.idBackLink}
                alt="Back ID"
                name={helper.helperName}
                onPreview={setPreviewImage}
              />
            </SimpleGrid>
          </Stack>
        </Stack>
      </Modal>

      {/* Full-size image preview */}
      <Modal
        opened={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.title}
        centered
        size="xl"
        radius="md"
        overlayProps={{ backgroundOpacity: 0.6, blur: 4 }}
      >
        {previewImage && (
          <Image
            src={previewImage.src}
            alt={previewImage.title}
            fit="contain"
            style={{ maxHeight: "75vh" }}
            radius="md"
          />
        )}
      </Modal>
    </>
  );
}
