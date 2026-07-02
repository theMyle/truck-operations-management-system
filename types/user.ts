
export type User = {
    id: string
    username: string | null
    firstName: string | null
    lastName: string | null
    createdAt: Date
    updatedAt: Date
    primaryEmailAddress: string
    role: string | null
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