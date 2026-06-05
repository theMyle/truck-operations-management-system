import { Driver, NewDriver } from "../db/schema";

export default interface IDriverRepository {
    getAll(): Promise<Driver[]>
    add(driver: NewDriver): Promise<Driver>
    update(id: string, updateData: Partial<NewDriver>): Promise<Driver | null>
    delete(id: string): Promise<Driver | null>
}
