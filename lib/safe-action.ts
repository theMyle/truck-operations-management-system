import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
    handleServerError(e) {
        return e.message;
    }
}).use(async ({ next }) => {
    if (process.env.IS_TESTING === "true") {
        return next({
            ctx: {
                userId: "test_user_id",
                role: "admin",
            }
        });
    }

    const { auth } = await import("@clerk/nextjs/server");
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