"use client";

import { useState, useEffect } from "react";
import { Modal, TextInput, Button, Stack, Group, FileInput, SimpleGrid, Title, Image } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createDriver } from "@/actions/registration";
import { notifications } from "@mantine/notifications";
import { uploadFile } from "@/actions/file-upload";
import { IconUpload } from "@tabler/icons-react";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function AddDriverModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const form = useForm({
    initialValues: { driverName: "", contactNumber: "", emergencyContact: "", address: "" },
    validate: {
      driverName: (v) => (v.trim().length < 1 ? "Driver name is required" : null),
      address: (v) => (v.trim().length < 1 ? "Address is required" : null),
    },
  });

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  useEffect(() => {
    if (idFront) {
      const url = URL.createObjectURL(idFront);
      setFrontPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFrontPreview(null);
  }, [idFront]);

  useEffect(() => {
    if (idBack) {
      const url = URL.createObjectURL(idBack);
      setBackPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setBackPreview(null);
  }, [idBack]);

  const { execute, isPending } = useAction(createDriver, {
    onSuccess: () => {
      notifications.show({ message: "Driver added!", color: "green" });
      form.reset();
      setIdFront(null);
      setIdBack(null);
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to add driver.", color: "red" });
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsUploading(true);
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if ((idFront && idFront.size > MAX_FILE_SIZE) || (idBack && idBack.size > MAX_FILE_SIZE)) {
      notifications.show({ 
        title: "File Too Large", 
        message: "Images must be smaller than 10MB. Please select a smaller file.", 
        color: "red" 
      });
      setIsUploading(false);
      return;
    }

    try {
      let idFrontLink = undefined;
      let idBackLink = undefined;

      if (idFront) {
        const fd = new FormData();
        fd.append("file", idFront);
        fd.append("folder", "drivers/front-id");
        const res = await uploadFile(fd);
        if (res.url) idFrontLink = res.url;
      }

      if (idBack) {
        const fd = new FormData();
        fd.append("file", idBack);
        fd.append("folder", "drivers/back-id");
        const res = await uploadFile(fd);
        if (res.url) idBackLink = res.url;
      }

      execute({ ...values, idFrontLink, idBackLink });
    } catch (err) {
      notifications.show({ message: "Failed to upload ID images.", color: "red" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add New Driver" centered size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Stack gap="sm">
            <Title order={6} c="dimmed" tt="uppercase">Personal Details</Title>
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
            <Title order={6} c="dimmed" tt="uppercase">ID Documents</Title>
            <FileInput
              label="Front ID"
              placeholder="Upload front of ID"
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
              placeholder="Upload back of ID"
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
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending || isUploading}>
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
