import { count, eq } from "drizzle-orm";
import { db } from "../db";
import { bookingToHelpers, Helper, helpers, NewHelper } from "../db/schema";
import { throwIfDeleteBlocked } from "./delete-guards";

export const makeHelperRepository = (database = db) => {
    return {
        getAll: async function (): Promise<Helper[]> {
            return await database.select().from(helpers);
        },

        getByName: async function (name: string): Promise<Helper | null> {
            const [helper] = await database.select().from(helpers).where(eq(helpers.helperName, name)).limit(1);
            return helper ?? null;
        },

        add: async function (helper: NewHelper): Promise<Helper> {
            const [newHelper] = await database.insert(helpers).values(helper).returning();
            return newHelper;
        },

        update: async function (id: string, updateData: Partial<NewHelper>): Promise<Helper | null> {
            const [updated] = await database
                .update(helpers)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(helpers.id, id))
                .returning();

            return updated ?? null;
        },

        delete: async function (id: string): Promise<Helper | null> {
            const [{ count: assignmentCount }] = await database
                .select({ count: count() })
                .from(bookingToHelpers)
                .where(eq(bookingToHelpers.helperId, id));

            throwIfDeleteBlocked("helper", [
                { count: assignmentCount, singular: "booking assignment" },
            ]);

            const [deleted] = await database
                .delete(helpers)
                .where(eq(helpers.id, id))
                .returning();

            if (!deleted) {
                throw new Error("Helper was not found or has already been deleted.");
            }

            return deleted ?? null;
        }
    }
}

export const helperRepository = makeHelperRepository();
