'use client'

import { Modal, Button, Text, Group, Stack } from "@mantine/core";
import { useDeleteUser } from "@/app/hooks/use-users";
import { useAuth } from "@clerk/nextjs";
import { notifications } from "@mantine/notifications";
import { User } from "@/types/user";

interface DeleteUserModalProps {
    user: User | null;
    onClose: () => void;
}

export function DeleteUserModal({ user, onClose }: DeleteUserModalProps) {
    const { getToken } = useAuth();
    const deleteUserMutation = useDeleteUser({ getToken });

    const handleDelete = async () => {
        if (!user) return;
        try {
            await deleteUserMutation.mutateAsync(user.id);
            notifications.show({
                title: "Account Deleted",
                message: `Successfully deleted account for ${user.firstName || user.username || "user"}`,
                color: "green",
            });
            onClose();
        } catch (err: any) {
            notifications.show({
                title: "Error",
                message: err.message || "Failed to delete user account.",
                color: "red",
            });
        }
    };

    return (
        <Modal
            opened={!!user}
            onClose={onClose}
            title="Confirm Account Deletion"
            centered
            radius="md"
        >
            <Stack gap="md">
                <Text size="sm">
                    Are you sure you want to delete the account for{" "}
                    <strong>
                        {user?.firstName || user?.lastName
                            ? `${user.firstName ?? ""} ${user.lastName ?? ""}`
                            : user?.username || user?.primaryEmailAddress}
                    </strong>
                    ? This action cannot be undone.
                </Text>
                <Group justify="flex-end">
                    <Button variant="subtle" color="gray" onClick={onClose} radius="md">
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={handleDelete}
                        loading={deleteUserMutation.isPending}
                        radius="md"
                    >
                        Delete Account
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
