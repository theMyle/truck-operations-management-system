import { User } from "@/types/user";
import { useQuery } from "@tanstack/react-query";

interface UseUsersProps {
    getToken: () => Promise<string | null>;
    enabled: boolean;
}

export function useUsers({ getToken, enabled }: UseUsersProps) {
    return useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })

            if (!res) throw new Error('Failed to fetch users');

            const rawData = await res.json()

            return rawData.map((user: any) => ({
                ...user,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt),
            } as User))
        },
        enabled: enabled,
    })
}

