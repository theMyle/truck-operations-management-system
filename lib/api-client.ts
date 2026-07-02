const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchWithAUth(
    path: string,
    getToken: () => Promise<string | null>,
    options: RequestInit
) {
    const token = await getToken();
    const { headers, ...restOptions } = options;
    return fetch(`${BASE_URL}${path}`, {
        ...restOptions,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            ...headers
        },
    })
}
