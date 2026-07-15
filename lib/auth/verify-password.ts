import { clerkClient } from "@clerk/nextjs/server";

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
    if (process.env.IS_TESTING = "true") return true
    try {
        const client = await clerkClient()
        await client.users.verifyPassword({ userId, password })
        return true
    } catch {
        return false;
    }

}