import { Driver, NewDriver } from "../db/schema";

export default interface IDriverRepository {
    getAll(): Promise<Driver[]>
    getByName(name: string): Promise<Driver | null>
    add(driver: NewDriver): Promise<Driver>
    update(id: string, updateData: Partial<NewDriver>): Promise<Driver | null>
    delete(id: string): Promise<Driver | null>
}
