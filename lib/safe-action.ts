import { auth } from "@clerk/nextjs/server";
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient().use(async ({ next }) => {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const userRole = sessionClaims?.metadata?.role || "";

    return next({
        ctx: {
            userId,
            role: userRole,
        }
    });
});

export function hasPermission(userRole: string, allowedRoles: string[]) {
    return allowedRoles.includes(userRole);
}