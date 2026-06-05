import { Helper, NewHelper } from "../db/schema";

export default interface IHelperRepository {
    getAll(): Promise<Helper[]>
    add(helper: NewHelper): Promise<Helper>
    update(id: string, updateData: Partial<NewHelper>): Promise<Helper | null>
    delete(id: string): Promise<Helper | null>
}
