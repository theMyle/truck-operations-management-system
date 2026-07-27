"use server";

import { createSafeActionClient } from "next-safe-action";
import z from "zod";
import { getKrisdomingoKpiReport } from "../repositories/queries/kpi";

const actionClient = createSafeActionClient();

const GetKpiReportSchema = z.object({
  year: z.number().optional(),
});

export const getKrisdomingoKpiReportAction = actionClient
  .schema(GetKpiReportSchema)
  .action(async ({ parsedInput }) => {
    try {
      const data = await getKrisdomingoKpiReport(parsedInput.year);
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to generate Krisdomingo KPI report",
      };
    }
  });
