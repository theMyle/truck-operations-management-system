import { useQuery } from "@tanstack/react-query";
import { getTruckAction } from "@/lib/actions/trucks";
import { getClientAction } from "@/lib/actions/clients";

export const TRUCKS_QUERY_KEY = ["master-trucks"] as const;
export const CLIENTS_QUERY_KEY = ["master-clients"] as const;

export async function fetchMasterTrucks() {
  const res = await getTruckAction();
  return res?.data ?? [];
}

export async function fetchMasterClients() {
  const res = await getClientAction();
  return res?.data ?? [];
}

export function useTrucks() {
  return useQuery({
    queryKey: TRUCKS_QUERY_KEY,
    queryFn: fetchMasterTrucks,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClients() {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: fetchMasterClients,
    staleTime: 5 * 60 * 1000,
  });
}
