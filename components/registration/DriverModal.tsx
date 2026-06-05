"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  FileInput,
  Group,
  Image,
  Modal,
  SimpleGrid,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAction } from "next-safe-action/hooks";
import { IconUpload } from "@tabler/icons-react";
import { createDriverAction, updateDriverAction } from "@/lib/actions/drivers";
import { replaceFile, uploadFile } from "@/lib/actions/file-upload";
import type { Driver } from "@/lib/db/schema/drivers";

interface Props {
  opened: boolean;
  onClose: () => void;
  driver?: Driver | null;
}

export function DriverModal({ opened, onClose, driver }: Props) {
  const isEditMode = !!driver;
  const frontPreviewRef = useRef<string | null>(null);
  const backPreviewRef = useRef<string | null>(null);

  const form = useForm({
    initialValues: {
      driverName: driver?.driverName ?? "",
      contactNumber: driver?.contactNumber ?? "",
      emergencyContact: driver?.emergencyContact ?? "",
      address: driver?.address ?? "",
    },
    validate: {
      driverName: (value) => (value.trim().length < 1 ? "Driver name is required" : null),
      address: (value) => (value.trim().length < 1 ? "Address is required" : null),
    },
  });

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(driver?.idFrontLink ?? null);
  const [backPreview, setBackPreview] = useState<string | null>(driver?.idBackLink ?? null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (frontPreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(frontPreviewRef.current);
      }
      if (backPreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(backPreviewRef.current);
      }
    };
  }, []);

  const createAction = useAction(createDriverAction, {
    onSuccess: () => {
      notifications.show({ message: "Driver added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to add driver.", color: "red" });
    },
  });

  const updateAction = useAction(updateDriverAction, {
    onSuccess: () => {
      notifications.show({ message: "Driver updated!", color: "green" });
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to update driver.", color: "red" });
    },
  });

  const setFrontIdFile = (file: File | null) => {
    if (frontPreviewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(frontPreviewRef.current);
      frontPreviewRef.current = null;
    }

    setIdFront(file);

    if (file) {
      const url = URL.createObjectURL(file);
      frontPreviewRef.current = url;
      setFrontPreview(url);
    } else {
      setFrontPreview(driver?.idFrontLink ?? null);
    }
  };

  const setBackIdFile = (file: File | null) => {
    if (backPreviewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(backPreviewRef.current);
      backPreviewRef.current = null;
    }

    setIdBack(file);

    if (file) {
      const url = URL.createObjectURL(file);
      backPreviewRef.current = url;
      setBackPreview(url);
    } else {
      setBackPreview(driver?.idBackLink ?? null);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    setIsUploading(true);

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if ((idFront && idFront.size > MAX_FILE_SIZE) || (idBack && idBack.size > MAX_FILE_SIZE)) {
      notifications.show({
        title: "File Too Large",
        message: "Images must be smaller than 10MB. Please select a smaller file.",
        color: "red",
      });
      setIsUploading(false);
      return;
    }

    try {
      let idFrontLink = driver?.idFrontLink ?? undefined;
      let idBackLink = driver?.idBackLink ?? undefined;

      if (idFront) {
        const fd = new FormData();
        fd.append("file", idFront);
        fd.append("folder", "drivers/front-id");

        const res = driver?.idFrontLink
          ? await (fd.append("oldUrl", driver.idFrontLink), replaceFile(fd))
          : await uploadFile(fd);

        if (res.url) idFrontLink = res.url;
      }

      if (idBack) {
        const fd = new FormData();
        fd.append("file", idBack);
        fd.append("folder", "drivers/back-id");

        const res = driver?.idBackLink
          ? await (fd.append("oldUrl", driver.idBackLink), replaceFile(fd))
          : await uploadFile(fd);

        if (res.url) idBackLink = res.url;
      }

      if (isEditMode && driver) {
        updateAction.execute({ id: driver.id, ...values, idFrontLink, idBackLink });
      } else {
        createAction.execute({ ...values, idFrontLink, idBackLink });
      }
    } catch {
      notifications.show({ message: "Failed to upload ID images.", color: "red" });
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = createAction.isPending || updateAction.isPending || isUploading;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditMode ? "Edit Driver" : "Add New Driver"}
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Stack gap="sm">
            <Title order={6} c="dimmed" tt="uppercase">
              Personal Details
            </Title>
            <TextInput
              id="input-driver-name"
              label="Driver Name"
              placeholder="e.g. Juan dela Cruz"
              {...form.getInputProps("driverName")}
            />
            <TextInput
              label="Contact Number"
              placeholder="e.g. 0912 345 6789"
              {...form.getInputProps("contactNumber")}
            />
            <TextInput
              label="Emergency Contact"
              placeholder="e.g. 0912 345 6789"
              {...form.getInputProps("emergencyContact")}
            />
            <TextInput
              label="Address"
              placeholder="e.g. 123 Main St, Manila"
              {...form.getInputProps("address")}
            />
          </Stack>

          <Stack gap="sm">
            <Title order={6} c="dimmed" tt="uppercase">
              ID Documents
            </Title>
            <FileInput
              label="Front ID"
              placeholder={isEditMode ? "Upload new front ID" : "Upload front of ID"}
              accept="image/png,image/jpeg,image/webp"
              leftSection={<IconUpload size={16} />}
              value={idFront}
              onChange={setFrontIdFile}
            />
            {frontPreview && (
              <Image src={frontPreview} alt="Front ID preview" h={100} fit="contain" radius="md" />
            )}

            <FileInput
              label="Back ID"
              placeholder={isEditMode ? "Upload new back ID" : "Upload back of ID"}
              accept="image/png,image/jpeg,image/webp"
              leftSection={<IconUpload size={16} />}
              value={idBack}
              onChange={setBackIdFile}
            />
            {backPreview && (
              <Image src={backPreview} alt="Back ID preview" h={100} fit="contain" radius="md" />
            )}
          </Stack>
        </SimpleGrid>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEditMode ? "Update" : "Save"}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
