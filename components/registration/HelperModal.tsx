"use client";

import { useState, useEffect } from "react";
import { Modal, TextInput, Button, Stack, Group, FileInput, SimpleGrid, Title, Image } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createHelper, updateHelper } from "@/actions/registration";
import { notifications } from "@mantine/notifications";
import { uploadFile, replaceFile } from "@/actions/file-upload";
import { IconUpload } from "@tabler/icons-react";
import type { Helper } from "@/lib/db/schema/helpers";

interface Props {
  opened: boolean;
  onClose: () => void;
  helper?: Helper | null;
}

export function HelperModal({ opened, onClose, helper }: Props) {
  const isEditMode = !!helper;

  const form = useForm({
    initialValues: { helperName: "", contactNumber: "", emergencyContact: "", address: "" },
    validate: {
      helperName: (v) => (v.trim().length < 1 ? "Helper name is required" : null),
      address: (v) => (v.trim().length < 1 ? "Address is required" : null),
    },
  });

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  // Sync state when modal opens or helper changes
  useEffect(() => {
    if (opened) {
      if (helper) {
        form.setValues({
          helperName: helper.helperName,
          contactNumber: helper.contactNumber || "",
          emergencyContact: helper.emergencyContact || "",
          address: helper.address || "",
        });
        setFrontPreview(helper.idFrontLink || null);
        setBackPreview(helper.idBackLink || null);
      } else {
        form.reset();
        setFrontPreview(null);
        setBackPreview(null);
      }
      setIdFront(null);
      setIdBack(null);
    }
  }, [opened, helper]);

  // Handle local file preview for Front ID
  useEffect(() => {
    if (idFront) {
      const url = URL.createObjectURL(idFront);
      setFrontPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (isEditMode && helper?.idFrontLink) {
      setFrontPreview(helper.idFrontLink);
    } else {
      setFrontPreview(null);
    }
  }, [idFront, helper, isEditMode]);

  // Handle local file preview for Back ID
  useEffect(() => {
    if (idBack) {
      const url = URL.createObjectURL(idBack);
      setBackPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (isEditMode && helper?.idBackLink) {
      setBackPreview(helper.idBackLink);
    } else {
      setBackPreview(null);
    }
  }, [idBack, helper, isEditMode]);

  const createAction = useAction(createHelper, {
    onSuccess: () => {
      notifications.show({ message: "Helper added!", color: "green" });
      form.reset();
      setIdFront(null);
      setIdBack(null);
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to add helper.", color: "red" });
    },
  });

  const updateAction = useAction(updateHelper, {
    onSuccess: () => {
      notifications.show({ message: "Helper updated!", color: "green" });
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to update helper.", color: "red" });
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsUploading(true);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
      let idFrontLink = isEditMode ? (helper?.idFrontLink || undefined) : undefined;
      let idBackLink = isEditMode ? (helper?.idBackLink || undefined) : undefined;

      // Handle Front ID upload/replace
      if (idFront) {
        const fd = new FormData();
        fd.append("file", idFront);
        fd.append("folder", "helpers/front-id");
        let res;
        if (isEditMode && helper?.idFrontLink) {
          fd.append("oldUrl", helper.idFrontLink);
          res = await replaceFile(fd);
        } else {
          res = await uploadFile(fd);
        }
        if (res.url) idFrontLink = res.url;
      }

      // Handle Back ID upload/replace
      if (idBack) {
        const fd = new FormData();
        fd.append("file", idBack);
        fd.append("folder", "helpers/back-id");
        let res;
        if (isEditMode && helper?.idBackLink) {
          fd.append("oldUrl", helper.idBackLink);
          res = await replaceFile(fd);
        } else {
          res = await uploadFile(fd);
        }
        if (res.url) idBackLink = res.url;
      }

      if (isEditMode && helper) {
        updateAction.execute({ id: helper.id, ...values, idFrontLink, idBackLink });
      } else {
        createAction.execute({ ...values, idFrontLink, idBackLink });
      }
    } catch (err) {
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
            <Title order={6} c="dimmed" tt="uppercase">Personal Details</Title>
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
          </Stack>

          <Stack gap="sm">
            <Title order={6} c="dimmed" tt="uppercase">ID Documents</Title>
            <FileInput
              label="Front ID"
              placeholder={isEditMode ? "Upload new front ID" : "Upload front of ID"}
              accept="image/png,image/jpeg,image/webp"
              leftSection={<IconUpload size={16} />}
              value={idFront}
              onChange={setIdFront}
            />
            {frontPreview && (
              <Image
                src={frontPreview}
                alt="Front ID preview"
                h={100}
                fit="contain"
                radius="md"
              />
            )}

            <FileInput
              label="Back ID"
              placeholder={isEditMode ? "Upload new back ID" : "Upload back of ID"}
              accept="image/png,image/jpeg,image/webp"
              leftSection={<IconUpload size={16} />}
              value={idBack}
              onChange={setIdBack}
            />
            {backPreview && (
              <Image
                src={backPreview}
                alt="Back ID preview"
                h={100}
                fit="contain"
                radius="md"
              />
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
