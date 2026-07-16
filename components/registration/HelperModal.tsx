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
  Switch,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAction } from "next-safe-action/hooks";
import { IconUpload } from "@tabler/icons-react";
import { createHelperAction, updateHelperAction } from "@/lib/actions/helpers";
import { replaceFile, uploadFile } from "@/lib/actions/file-upload";
import type { Helper } from "@/lib/db/schema/helpers";

interface Props {
  opened: boolean;
  onClose: () => void;
  helper?: Helper | null;
}

export function HelperModal({ opened, onClose, helper }: Props) {
  const isEditMode = !!helper;
  const frontPreviewRef = useRef<string | null>(null);
  const backPreviewRef = useRef<string | null>(null);

  const form = useForm({
    initialValues: {
      helperName: helper?.helperName ?? "",
      contactNumber: helper?.contactNumber ?? "",
      emergencyContact: helper?.emergencyContact ?? "",
      address: helper?.address ?? "",
      isActive: helper?.isActive ?? true,
    },
    validate: {
      helperName: (value) => (value.trim().length < 1 ? "Helper name is required" : null),
      address: (value) => (value.trim().length < 1 ? "Address is required" : null),
    },
  });

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(helper?.idFrontLink ?? null);
  const [backPreview, setBackPreview] = useState<string | null>(helper?.idBackLink ?? null);
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

  const createAction = useAction(createHelperAction, {
    onSuccess: () => {
      notifications.show({ message: "Helper added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: ({ error }) => {
      notifications.show({ message: error.serverError || "Failed to add helper.", color: "red" });
    },
  });

  const updateAction = useAction(updateHelperAction, {
    onSuccess: () => {
      notifications.show({ message: "Helper updated!", color: "green" });
      onClose();
    },
    onError: ({ error }) => {
      notifications.show({ message: error.serverError || "Failed to update helper.", color: "red" });
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
      setFrontPreview(helper?.idFrontLink ?? null);
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
      setBackPreview(helper?.idBackLink ?? null);
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
      let idFrontLink = helper?.idFrontLink ?? undefined;
      let idBackLink = helper?.idBackLink ?? undefined;

      if (idFront) {
        const fd = new FormData();
        fd.append("file", idFront);
        fd.append("folder", "helpers/front-id");

        const res = helper?.idFrontLink
          ? await (fd.append("oldUrl", helper.idFrontLink), replaceFile(fd))
          : await uploadFile(fd);

        if (res.url) idFrontLink = res.url;
      }

      if (idBack) {
        const fd = new FormData();
        fd.append("file", idBack);
        fd.append("folder", "helpers/back-id");

        const res = helper?.idBackLink
          ? await (fd.append("oldUrl", helper.idBackLink), replaceFile(fd))
          : await uploadFile(fd);

        if (res.url) idBackLink = res.url;
      }

      if (isEditMode && helper) {
        updateAction.execute({ id: helper.id, ...values, idFrontLink, idBackLink });
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
      title={isEditMode ? "Edit Helper" : "Add New Helper"}
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
              id="input-helper-name"
              label="Helper Name"
              placeholder="e.g. Pedro Santos"
              {...form.getInputProps("helperName")}
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
            <Switch
              label="Active Status"
              description="Disable if the helper has resigned or is inactive"
              checked={form.values.isActive}
              {...form.getInputProps("isActive", { type: "checkbox" })}
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
