'use client'

import { Modal, Button, TextInput, PasswordInput, Select, Stack, Group, Alert } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useUpdateUser } from "@/app/hooks/use-users";
import { useAuth } from "@clerk/nextjs";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { CreateUserErrorItem, UserRoles, User } from "@/types/user";
import z from "zod";
import { notifications } from "@mantine/notifications";

interface EditUserModalProps {
    user: User | null;
    onClose: () => void;
}

interface EditFormValues {
    username: string;
    firstName: string;
    lastName: string;
    password?: string;
    confirmPassword?: string;
    role: string;
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
    const { getToken } = useAuth();
    const [error, setError] = useState<CreateUserErrorItem[] | null>(null);

    const updateUserMutation = useUpdateUser({ getToken });

    const form = useForm<EditFormValues>({
        initialValues: {
            username: "",
            firstName: "",
            lastName: "",
            password: "",
            confirmPassword: "",
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
                // Password is optional during edit. Only validate if they type something.
                if (value && value.length < 8) {
                    return "Password must be at least 8 characters long"
                }
                return null;
            },

            confirmPassword: (value, values) => {
                if (values.password && !value) {
                    return "Please confirm your new password";
                }
                if (value !== values.password) {
                    return "Passwords do not match";
                }
                return null;
            },

            firstName: (value) => !value ? "First Name is required" : null,
            lastName: (value) => !value ? "Last Name is required" : null,
            role: (value) => !value ? "Role is required" : null,
        }
    });

    // Populate the form when the user prop changes
    useEffect(() => {
        if (user) {
            form.initialize({
                username: user.username || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                password: "",
                confirmPassword: "",
                role: user.role || "",
            });
        }
    }, [user]);

    const handleSubmit = async (values: EditFormValues) => {
        if (!user) return;
        setError(null);
        try {
            // Build the update payload (omit confirmPassword, and only include password if typed)
            const payload: Partial<CreateUserDto> = {
                username: values.username,
                firstName: values.firstName,
                lastName: values.lastName,
                role: values.role,
            };

            if (values.password) {
                payload.password = values.password;
            }

            await updateUserMutation.mutateAsync({
                id: user.id,
                data: payload,
            });

            notifications.show({
                title: "Account Updated",
                message: `Successfully updated account for ${values.firstName || values.username}`,
                color: "green",
            });

            form.reset();
            onClose();
        } catch (err) {
            console.log(err)
            setError(err as string | null);

            if (!Array.isArray(err)) {
                notifications.show({
                    title: "Failed to Update Account",
                    message: (err as { message?: string })?.message || "Something went wrong.",
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
            opened={!!user}
            onClose={handleClose}
            title="Edit User Account"
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

                    <TextInput
                        label="Email Address"
                        value={user?.primaryEmailAddress || ""}
                        disabled
                        description="Email address cannot be changed."
                        radius="md"
                    />

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

                    <PasswordInput
                        label="New Password"
                        placeholder="Leave blank to keep current password"
                        radius="md"
                        {...form.getInputProps("password")}
                    />

                    <PasswordInput
                        label="Confirm New Password"
                        placeholder="Confirm new password"
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
                        <Button type="submit" loading={updateUserMutation.isPending} radius="md">
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
