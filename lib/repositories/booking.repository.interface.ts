import { BookingWithRelations, NewBooking } from "../db/schema/booking";
import { NewBookingDrop } from "../db/schema/bookingDrops";

export default interface IBookingRepository {
    getAll(): Promise<BookingWithRelations[]>,

    add(
        booking: NewBooking,
        drops?: NewBookingDrop[],
        helperIds?: string[]
    ): Promise<BookingWithRelations>,

    update(
        id: string,
        booking: Partial<NewBooking>,
        drops?: NewBookingDrop[],
        helperIds?: string[]
    ): Promise<BookingWithRelations>,

    delete(id: string): Boolean,
}