import { eq } from "drizzle-orm";
import { db } from "../db";
import { Helper, helpers, NewHelper } from "../db/schema";
import IHelperRepository from "./helper.repository.interface";

export const makeHelperRepository = (database = db): IHelperRepository => {
    return {
        getAll: async function (): Promise<Helper[]> {
            return await database.select().from(helpers);
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
            const [deleted] = await database
                .delete(helpers)
                .where(eq(helpers.id, id))
                .returning();
            return deleted ?? null;
        }
    }
}

export const helperRepository = makeHelperRepository();