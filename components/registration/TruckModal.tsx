"use client";

import {
  Modal,
  TextInput,
  Button,
  Stack,
  Group,
  Select,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createTruckAction, updateTruckAction } from "@/lib/actions/trucks";
import { notifications } from "@mantine/notifications";
import type { Truck } from "@/lib/db/schema/trucks";
import {
  TRUCK_STATUS_OPTIONS,
  type TruckStatus,
} from "@/lib/utils/truckStatus";

interface Props {
  opened: boolean;
  onClose: () => void;
  truck?: Truck | null;
}

export function TruckModal({ opened, onClose, truck }: Props) {
  const isEditMode = !!truck;

  const form = useForm({
    initialValues: {
      plateNumber: truck?.plateNumber ?? "",
      fleetType: truck?.fleetType ?? "",
      unitType: truck?.unitType ?? "",
      rate: truck?.rate ?? "",
      isSubcon: truck?.isSubcon ?? false,
      status: (truck?.status ?? "available") as TruckStatus,
      isActive: truck?.isActive ?? true,
    },
    validate: {
      plateNumber: (v) =>
        v.trim().length < 1 ? "Plate number is required" : null,
    },
  });

  const createAction = useAction(createTruckAction, {
    onSuccess: () => {
      notifications.show({ message: "Truck added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to add truck.", color: "red" });
    },
  });

  const updateAction = useAction(updateTruckAction, {
    onSuccess: () => {
      notifications.show({ message: "Truck updated!", color: "green" });
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to update truck.", color: "red" });
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    const payload = {
      ...values,
      fleetType: values.fleetType || null,
      unitType: values.unitType || null,
      rate: values.rate || null,
    };

    if (isEditMode && truck) {
      updateAction.execute(payload);
    } else {
      createAction.execute(payload);
    }
  });

  const isPending = createAction.isPending || updateAction.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditMode ? "Edit Truck" : "Add New Truck"}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            id="input-truck-plate"
            label="Plate Number"
            placeholder="e.g. CAL6890"
            disabled={isEditMode}
            variant={isEditMode ? "filled" : "default"}
            {...form.getInputProps("plateNumber")}
          />
          <TextInput
            id="input-truck-fleet-type"
            label="Fleet Type"
            placeholder="e.g. 6W CV, 10W"
            {...form.getInputProps("fleetType")}
          />
          <TextInput
            id="input-trucker-type"
            label="Trucker"
            placeholder="e.g. Krisdomingo, Lito Diana"
            {...form.getInputProps("unitType")}
          />
          <TextInput
            id="input-trucker-rate"
            label="Trucker Rate"
            placeholder="e.g. 5000"
            {...form.getInputProps("rate")}
          />

           <Switch
            id="input-truck-is-subcon"
            label="Is Subcontractor?"
            {...form.getInputProps("isSubcon", { type: "checkbox" })}
          />

          <Switch
            id="input-truck-is-active"
            label="Active Status"
            description="Disable if the truck is retired or out of service"
            checked={form.values.isActive}
            {...form.getInputProps("isActive", { type: "checkbox" })}
          />
          {isEditMode && (
            <Select
              label="Status"
              data={TRUCK_STATUS_OPTIONS}
              {...form.getInputProps("status")}
            />
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isEditMode ? "Update" : "Save"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
