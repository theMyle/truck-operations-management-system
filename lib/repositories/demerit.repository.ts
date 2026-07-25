import { db } from "@/lib/db";
import { violationTypes, demeritRecords } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql, asc } from "drizzle-orm";

// ── Violation Types (Catalog) ──

export const demeritRepository = {
  // Get all active violation types
  async getViolationTypes() {
    return db
      .select()
      .from(violationTypes)
      .where(eq(violationTypes.isActive, true))
      .orderBy(asc(violationTypes.category), asc(violationTypes.name));
  },

  // Create a new violation type
  async createViolationType(data: {
    name: string;
    category: string;
    points: number;
  }) {
    const [result] = await db
      .insert(violationTypes)
      .values(data)
      .returning();
    return result;
  },

  // Update a violation type
  async updateViolationType(
    id: string,
    data: { name?: string; category?: string; points?: number }
  ) {
    const [result] = await db
      .update(violationTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(violationTypes.id, id))
      .returning();
    return result;
  },

  // Soft-delete a violation type
  async deleteViolationType(id: string) {
    const [result] = await db
      .update(violationTypes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(violationTypes.id, id))
      .returning();
    return result;
  },

  // ── Demerit Records ──

  // Record a new violation incident
  async createDemeritRecord(data: {
    personId: string;
    personType: string;
    personName: string;
    violationTypeId: string;
    points: number;
    incidentDate: string;
    reportedBy?: string;
    notes?: string;
  }) {
    const [result] = await db
      .insert(demeritRecords)
      .values(data)
      .returning();
    return result;
  },

  // Get demerit log with optional filters
  async getDemeritLog(filters?: {
    from?: string;
    to?: string;
    personName?: string;
    category?: string;
  }) {
    const conditions = [];

    if (filters?.from) {
      conditions.push(gte(demeritRecords.incidentDate, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(demeritRecords.incidentDate, filters.to));
    }

    const rows = await db
      .select({
        id: demeritRecords.id,
        personId: demeritRecords.personId,
        personType: demeritRecords.personType,
        personName: demeritRecords.personName,
        violationTypeId: demeritRecords.violationTypeId,
        violationName: violationTypes.name,
        violationCategory: violationTypes.category,
        points: demeritRecords.points,
        incidentDate: demeritRecords.incidentDate,
        reportedBy: demeritRecords.reportedBy,
        notes: demeritRecords.notes,
        createdAt: demeritRecords.createdAt,
      })
      .from(demeritRecords)
      .innerJoin(
        violationTypes,
        eq(demeritRecords.violationTypeId, violationTypes.id)
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(demeritRecords.incidentDate), desc(demeritRecords.createdAt));

    // Apply client-side filters for personName and category
    let filtered = rows;
    if (filters?.personName) {
      const search = filters.personName.toLowerCase();
      filtered = filtered.filter((r) =>
        r.personName.toLowerCase().includes(search)
      );
    }
    if (filters?.category) {
      filtered = filtered.filter(
        (r) => r.violationCategory === filters.category
      );
    }

    return filtered;
  },

  // Get monthly scoreboard: all drivers+helpers with total demerits and scores
  async getMonthlyScoreboard(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    // Get all demerit records for the month
    const records = await db
      .select({
        personId: demeritRecords.personId,
        personType: demeritRecords.personType,
        personName: demeritRecords.personName,
        totalDemerits: sql<number>`sum(${demeritRecords.points})::int`,
      })
      .from(demeritRecords)
      .where(
        and(
          gte(demeritRecords.incidentDate, startDate),
          lte(demeritRecords.incidentDate, endDate)
        )
      )
      .groupBy(
        demeritRecords.personId,
        demeritRecords.personType,
        demeritRecords.personName
      );

    // Build scoreboard: include all active drivers + helpers, even those with 0 demerits
    const { drivers } = await import("@/lib/db/schema");
    const { helpers } = await import("@/lib/db/schema");

    const allDrivers = await db
      .select({ id: drivers.id, name: drivers.driverName })
      .from(drivers)
      .where(eq(drivers.isActive, true));

    const allHelpers = await db
      .select({ id: helpers.id, name: helpers.helperName })
      .from(helpers)
      .where(eq(helpers.isActive, true));

    const demeritMap = new Map(
      records.map((r) => [r.personId, r.totalDemerits])
    );

    const scoreboard = [
      ...allDrivers.map((d) => ({
        personId: d.id,
        personName: d.name,
        personType: "driver" as const,
        totalDemerits: demeritMap.get(d.id) || 0,
        score: Math.max(0, 100 - (demeritMap.get(d.id) || 0)),
      })),
      ...allHelpers.map((h) => ({
        personId: h.id,
        personName: h.name,
        personType: "helper" as const,
        totalDemerits: demeritMap.get(h.id) || 0,
        score: Math.max(0, 100 - (demeritMap.get(h.id) || 0)),
      })),
    ];

    // Sort by score descending (best first)
    scoreboard.sort((a, b) => b.score - a.score);

    // Add rating
    return scoreboard.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      rating: getRating(entry.score),
    }));
  },

  // Get team average score for dashboard widget
  async getTeamAverageScore(year: number, month: number) {
    const scoreboard = await this.getMonthlyScoreboard(year, month);
    if (scoreboard.length === 0) {
      return { average: 100, rating: "Excellent", counts: { excellent: 0, good: 0, needsImprovement: 0, poor: 0 }, total: 0 };
    }

    const avg =
      scoreboard.reduce((sum, e) => sum + e.score, 0) / scoreboard.length;

    const counts = {
      excellent: scoreboard.filter((e) => e.score >= 90).length,
      good: scoreboard.filter((e) => e.score >= 80 && e.score < 90).length,
      needsImprovement: scoreboard.filter((e) => e.score >= 70 && e.score < 80).length,
      poor: scoreboard.filter((e) => e.score < 70).length,
    };

    return {
      average: Math.round(avg * 10) / 10,
      rating: getRating(avg),
      counts,
      total: scoreboard.length,
    };
  },

  // Get person's current month score (for live preview in form)
  async getPersonMonthScore(personId: string, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const [result] = await db
      .select({
        totalDemerits: sql<number>`coalesce(sum(${demeritRecords.points}), 0)::int`,
      })
      .from(demeritRecords)
      .where(
        and(
          eq(demeritRecords.personId, personId),
          gte(demeritRecords.incidentDate, startDate),
          lte(demeritRecords.incidentDate, endDate)
        )
      );

    const demerits = result?.totalDemerits || 0;
    const score = Math.max(0, 100 - demerits);
    return { totalDemerits: demerits, score, rating: getRating(score) };
  },
};

// ── Helpers ──

function getRating(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Needs Improvement";
  return "Poor";
}
