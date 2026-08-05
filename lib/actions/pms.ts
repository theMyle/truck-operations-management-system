"use server";

import { actionClient } from "@/lib/safe-action";
import { pmsRepository } from "@/lib/repositories/pms.repository";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const getFleetPmsStatusAction = actionClient
  .action(async () => {
    try {
      const statusList = await pmsRepository.getFleetPmsStatus();
      return { success: true, data: statusList };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to fetch fleet PMS status" };
    }
  });

const LogPmsSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required"),
  pmsDate: z.string().min(1, "PMS date is required"),
  pmsOdo: z.number().min(0, "Odometer reading must be 0 or higher"),
  serviceType: z.string().optional(),
  cost: z.string().optional(),
  performedBy: z.string().optional(),
  remarks: z.string().optional(),
});

export const logCompletedPmsAction = actionClient
  .schema(LogPmsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const log = await pmsRepository.logCompletedPms(parsedInput);
      revalidatePath("/pms");
      revalidatePath("/dashboard");
      return { success: true, data: log };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to log PMS entry" };
    }
  });

export const getPmsHistoryAction = actionClient
  .schema(z.object({ plateNumber: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const history = await pmsRepository.getPmsHistory(parsedInput.plateNumber);
      return { success: true, data: history };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to fetch PMS history" };
    }
  });

export const getPmsLogsByDateRangeAction = actionClient
  .schema(z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const logs = await pmsRepository.getPmsLogsByDateRange(
        parsedInput.startDate,
        parsedInput.endDate
      );
      return { success: true, data: logs };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to fetch PMS logs" };
    }
  });

const UpdatePmsSchema = z.object({
  id: z.string().min(1, "Log ID is required"),
  pmsDate: z.string().min(1, "PMS date is required"),
  pmsOdo: z.number().min(0, "Odometer reading must be 0 or higher"),
  serviceType: z.string().optional(),
  cost: z.string().optional(),
  performedBy: z.string().optional(),
  remarks: z.string().optional(),
});

export const updatePmsLogAction = actionClient
  .schema(UpdatePmsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      const updated = await pmsRepository.updatePmsLog(id, data);
      revalidatePath("/pms");
      revalidatePath("/dashboard");
      return { success: true, data: updated };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update PMS entry" };
    }
  });

const UpdateTruckOdoSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required"),
  lastPmsOdo: z.number().min(0).optional(),
  lastPmsDate: z.string().nullable().optional(),
  pmsIntervalKm: z.number().min(100).optional(),
  latestTripOdoOverride: z.number().min(0).optional(),
});

export const updateTruckOdoBaselineAction = actionClient
  .schema(UpdateTruckOdoSchema)
  .action(async ({ parsedInput }) => {
    try {
      await pmsRepository.updateTruckOdoBaseline(parsedInput);
      revalidatePath("/pms");
      revalidatePath("/dashboard");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update truck odometer details" };
    }
  });
