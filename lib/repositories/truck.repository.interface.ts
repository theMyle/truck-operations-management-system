import { NewTruck, Truck, UpdateTruck } from "../db/schema";

export default interface ITruckRepository {
    getAll(): Promise<Truck[]>
    add(truck: NewTruck): Promise<Truck>
    update(plateNumber: string, updateData: UpdateTruck): Promise<Truck | null>
    delete(plateNumber: string): Promise<Truck | null>
}