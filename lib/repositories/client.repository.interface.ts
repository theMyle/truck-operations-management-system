import { Client, ClientWithRoutes, NewClient } from "../db/schema";

export type RouteInput = { route: string };
export default interface IClientRepository {
  getAll(): Promise<ClientWithRoutes[]>;
  add(client: NewClient, routes: RouteInput[]): Promise<Client>;
  update(
    id: string,
    updateData: Partial<NewClient>,
    routes?: RouteInput[],
  ): Promise<Client | null>;
  delete(id: string): Promise<Client | null>;
}
