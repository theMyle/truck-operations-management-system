'use client'

import { Modal, Button, TextInput, PasswordInput, Select, Stack, Group, Alert } from "@mantine/core";
import { useForm } from "@mantine/form";
import { CreateUserDto } from "@/lib/validations/user";
import { useCreateUser } from "@/app/hooks/use-users";
import { useAuth } from "@clerk/nextjs";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import { CreateUserErrorItem, UserRoles } from "@/types/user";
import z from "zod";
import { notifications } from "@mantine/notifications";

interface CreateUserModalProps {
    opened: boolean;
    onClose: () => void;
}

export function CreateUserModal({ opened, onClose }: CreateUserModalProps) {
    const { getToken } = useAuth();
    const [error, setError] = useState<CreateUserErrorItem[] | null>(null);

    const createUserMutation = useCreateUser({ getToken });

    const form = useForm<CreateUserDto & { confirmPassword?: string }>({
        initialValues: {
            username: "",
            password: "",
            confirmPassword: "",
            email: "",
            firstName: "",
            lastName: "",
            role: "",
        },
        validate: {
            username: (value) => {
                if (!value) {
                    return "Username is required"
                } else if (value.length < 4) {
                    return "Username must be at least 4 characters long"
                } else if (value.length > 64) {
                    return "Username must be at most 64 characters long"
                } else {
                    return null
                }
            },

            password: (value) => {
                if (!value) {
                    return "Password is required"
                } else if (value.length < 8) {
                    return "Password must be at least 8 characters long"
                } else {
                    return null
                }
            },

            confirmPassword: (value, values) => {
                if (!value) {
                    return "Please confirm your password";
                }
                if (value !== values.password) {
                    return "Passwords do not match";
                }
                return null;
            },

            email: (value) => {
                if (value) {
                    if (!z.email().safeParse(value).success) {
                        return "Must be a valid email address"
                    }
                }
                return null;
            },

            firstName: (value) => !value ? "First Name is required" : null,
            lastName: (value) => !value ? "Last Name is required" : null,
            role: (value) => !value ? "Role is required" : null,
        }
    });

    const handleSubmit = async (values: CreateUserDto & { confirmPassword?: string }) => {
        setError(null);
        try {
            // Strip confirmPassword before sending payload to API
            const { confirmPassword, ...submitValues } = values;
            await createUserMutation.mutateAsync(submitValues);
            
            notifications.show({
                title: "Account Created",
                message: `Successfully created account for ${submitValues.firstName || submitValues.username}`,
                color: "green",
            });

            form.reset();
            onClose();
        } catch (err: any) {
            console.log(err)
            setError(err || "Something went wrong.");
            
            // Pop a failure notification if it's a general non-validation error
            if (!Array.isArray(err)) {
                notifications.show({
                    title: "Failed to Create Account",
                    message: err.message || "Something went wrong.",
                    color: "red",
                });
            }
        }
    };

    const handleClose = () => {
        form.reset();
        setError(null);
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Create New User"
            centered
            radius="md"
            size="md"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    {error && (
                        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" radius="md">
                            <ul className="list-disc pl-5">
                                {
                                    error.map((err) => (
                                        <li key={err.code}>
                                            <strong>{err.paramName}</strong> - {err.message}
                                        </li>
                                    ))
                                }
                            </ul>
                        </Alert>
                    )}

                    <Group grow>
                        <TextInput
                            withAsterisk
                            label="First Name"
                            placeholder="John"
                            radius="md"
                            {...form.getInputProps("firstName")}
                        />
                        <TextInput
                            withAsterisk
                            label="Last Name"
                            placeholder="Doe"
                            radius="md"
                            {...form.getInputProps("lastName")}
                        />
                    </Group>

                    <TextInput
                        withAsterisk
                        label="Username"
                        placeholder="johndoe"
                        radius="md"
                        {...form.getInputProps("username")}
                    />

                    <TextInput
                        label="Email Address"
                        placeholder="john.doe@example.com"
                        radius="md"
                        {...form.getInputProps("email")}
                    />

                    <PasswordInput
                        withAsterisk
                        label="Password"
                        placeholder="Minimum 8 characters"
                        radius="md"
                        {...form.getInputProps("password")}
                    />

                    <PasswordInput
                        withAsterisk
                        label="Confirm Password"
                        placeholder="Re-enter password"
                        radius="md"
                        {...form.getInputProps("confirmPassword")}
                    />

                    <Select
                        withAsterisk
                        label="Role"
                        placeholder="Select a role"
                        radius="md"
                        data={[
                            { value: "dispatch officer", label: "Dispatch Officer" },
                            { value: "coordinator", label: "Coordinator" },
                            { value: "billing clerk", label: "Billing Clerk" },
                        ] as { value: UserRoles, label: string }[]}
                        {...form.getInputProps("role")}
                    />

                    <Group justify="flex-end" mt="lg">
                        <Button variant="subtle" color="gray" onClick={handleClose} radius="md">
                            Cancel
                        </Button>
                        <Button type="submit" loading={createUserMutation.isPending} radius="md">
                            Create User
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
