import z from "zod";

export const createUserSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(8),
    email: z.string().email().optional().or(z.literal("")),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.string().min(1),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;