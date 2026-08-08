"use server";

import { actionClient } from "../safe-action";
import { z } from "zod";
import { getOnTimeDeliveryStats } from "../repositories/queries/dashboard";

export const getOnTimeDeliveryStatsAction = actionClient
  .inputSchema(
    z.object({
      year: z.number().optional(),
      month: z.number().optional(),
      includeToday: z.boolean().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const stats = await getOnTimeDeliveryStats(
        parsedInput.year,
        parsedInput.month,
        parsedInput.includeToday ?? false
      );
      return { success: true, data: stats };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to fetch on-time stats" };
    }
  });
