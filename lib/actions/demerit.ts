"use server";

import { actionClient } from "@/lib/safe-action";
import { demeritRepository } from "@/lib/repositories/demerit.repository";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ── Violation Types (Catalog) ──

export const getViolationTypesAction = actionClient.action(async () => {
  try {
    const types = await demeritRepository.getViolationTypes();
    return { success: true, data: types };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to fetch violation types",
    };
  }
});

const CreateViolationTypeSchema = z.object({
  name: z.string().min(1, "Violation name is required"),
  category: z.string().min(1, "Category is required"),
  points: z.number().min(1, "Points must be at least 1"),
});

export const createViolationTypeAction = actionClient
  .schema(CreateViolationTypeSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await demeritRepository.createViolationType(parsedInput);
      revalidatePath("/demerit");
      return { success: true, data: result };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to create violation type",
      };
    }
  });

const UpdateViolationTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  points: z.number().min(1).optional(),
});

export const updateViolationTypeAction = actionClient
  .schema(UpdateViolationTypeSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    try {
      const result = await demeritRepository.updateViolationType(id, data);
      revalidatePath("/demerit");
      return { success: true, data: result };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to update violation type",
      };
    }
  });

export const deleteViolationTypeAction = actionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    try {
      await demeritRepository.deleteViolationType(parsedInput.id);
      revalidatePath("/demerit");
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to delete violation type",
      };
    }
  });

// ── Demerit Records ──

const CreateDemeritRecordSchema = z.object({
  personId: z.string().uuid(),
  personType: z.enum(["driver", "helper"]),
  personName: z.string().min(1),
  violationTypeId: z.string().uuid(),
  points: z.number().min(1),
  incidentDate: z.string().min(1, "Incident date is required"),
  reportedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const createDemeritRecordAction = actionClient
  .schema(CreateDemeritRecordSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await demeritRepository.createDemeritRecord(parsedInput);
      revalidatePath("/demerit");
      revalidatePath("/dashboard");
      return { success: true, data: result };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to record violation",
      };
    }
  });

const GetDemeritLogSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  personName: z.string().optional(),
  category: z.string().optional(),
});

export const getDemeritLogAction = actionClient
  .schema(GetDemeritLogSchema)
  .action(async ({ parsedInput }) => {
    try {
      const log = await demeritRepository.getDemeritLog(parsedInput);
      return { success: true, data: log };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to fetch demerit log",
      };
    }
  });

// ── Scoreboard ──

const GetScoreboardSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
});

export const getMonthlyScoreboardAction = actionClient
  .schema(GetScoreboardSchema)
  .action(async ({ parsedInput }) => {
    try {
      const scoreboard = await demeritRepository.getMonthlyScoreboard(
        parsedInput.year,
        parsedInput.month
      );
      return { success: true, data: scoreboard };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to fetch scoreboard",
      };
    }
  });

export const getTeamAverageAction = actionClient
  .schema(GetScoreboardSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await demeritRepository.getTeamAverageScore(
        parsedInput.year,
        parsedInput.month
      );
      return { success: true, data: result };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to fetch team average",
      };
    }
  });

// ── Person Month Score (for live preview) ──

const GetPersonScoreSchema = z.object({
  personId: z.string().uuid(),
  year: z.number(),
  month: z.number().min(1).max(12),
});

export const getPersonMonthScoreAction = actionClient
  .schema(GetPersonScoreSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await demeritRepository.getPersonMonthScore(
        parsedInput.personId,
        parsedInput.year,
        parsedInput.month
      );
      return { success: true, data: result };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to fetch person score",
      };
    }
  });
