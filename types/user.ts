
export type User = {
    id: string
    username: string | null
    firstName: string | null
    lastName: string | null
    createdAt: Date
    updatedAt: Date
    primaryEmailAddress: string | null
    role: string | null
}

export enum UserRole {
    ADMIN = "admin",
    DISPATCH_OFFICER = "dispatch officer",
    COORDINATOR = "coordinator",
    BILLING_CLERK = "billing clerk",
}

export type UserRoles = "admin"
    | "dispatch officer"
    | "coordinator"
    | "billing clerk"

export type CreateUserErrorItem = {
    code: string
    message: string
    paramName: string
}