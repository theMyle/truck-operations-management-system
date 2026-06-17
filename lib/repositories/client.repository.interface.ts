import { Client, ClientWithRoutes, NewClient } from "../db/schema";

export type RouteInput = { route: string, rate?:string };
export default interface IClientRepository {
  getAll(): Promise<ClientWithRoutes[]>;
  getByName(name: string): Promise<ClientWithRoutes | null>;
  add(client: NewClient, routes: RouteInput[]): Promise<Client>;
  update(
    id: string,
    updateData: Partial<NewClient>,
    routes?: RouteInput[],
  ): Promise<Client | null>;
  delete(id: string): Promise<Client | null>;
}
