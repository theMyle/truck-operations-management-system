import { fetchWithAUth } from "@/lib/api-client";
import { CreateUserDto } from "@/lib/validations/user";
import { User } from "@/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface UserHookProps {
    getToken: () => Promise<string | null>;
}

// ==========================================
// 1. READ (List all users)
// ==========================================
interface UseUsersProps extends UserHookProps {
    enabled: boolean;
}

export function useUsers({ getToken, enabled }: UseUsersProps) {
    return useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetchWithAUth("/users", getToken, { method: 'GET' });
            if (!res.ok) throw new Error('Failed to fetch users');

            const rawData = await res.json();
            return rawData.map((user: any) => ({
                ...user,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt),
            } as User));
        },
        enabled: enabled,
    });
}

// ==========================================
// 2. CREATE
// ==========================================
export function useCreateUser({ getToken }: UserHookProps) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newUser: CreateUserDto) => {
            const res = await fetchWithAUth('/users', getToken, {
                method: 'POST',
                body: JSON.stringify(newUser)
            });

            console.log(res.status)

            if (!res.ok) {
                if (res.status === 422) {
                    const errorData = await res.json();
                    console.log(errorData);
                    throw errorData.errors || errorData;
                }
            }

            const rawData = await res.json();
            console.log(rawData)

            return {
                ...rawData,
                createdAt: new Date(rawData.createdAt),
                updatedAt: new Date(rawData.updatedAt),
            } as User;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
}

// ==========================================
// 3. UPDATE
// ==========================================
export function useUpdateUser({ getToken }: UserHookProps) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreateUserDto> & { primaryEmailAddressID?: string } }) => {
            const res = await fetchWithAUth(`/users/${id}`, getToken, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                if (res.status === 422) {
                    const errorData = await res.json();
                    throw errorData.errors || errorData;
                }
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to update user');
            }

            const rawData = await res.json();
            return {
                ...rawData,
                createdAt: new Date(rawData.createdAt),
                updatedAt: new Date(rawData.updatedAt),
            } as User;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
}

// ==========================================
// 4. DELETE
// ==========================================
export function useDeleteUser({ getToken }: UserHookProps) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetchWithAUth(`/users/${id}`, getToken, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to delete user');
            }

            return;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
}