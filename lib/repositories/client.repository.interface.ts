import { Client, NewClient, } from "../db/schema";

export default interface IClientRepository {
    getAll(): Promise<Client[]>
    add(client: NewClient): Promise<Client>
    update(id: string, updateData: Partial<NewClient>): Promise<Client | null>
    delete(id: string): Promise<Client | null>
}
