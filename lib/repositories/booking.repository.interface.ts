import { BookingWithRelations, NewBooking } from "../db/schema/booking";
import { NewBookingDrop } from "../db/schema/bookingDrops";

export default interface IBookingRepository {
    getAll(deliveryStatus?: string): Promise<BookingWithRelations[]>,

    add(
        booking: NewBooking,
        drops?: Omit<NewBookingDrop, "bookingId">[],
        helperIds?: string[]
    ): Promise<BookingWithRelations>,

    update(
        id: string,
        booking: Partial<NewBooking>,
        drops?: NewBookingDrop[],
        helperIds?: string[]
    ): Promise<BookingWithRelations>,

    delete(id: string): Promise<boolean>,
}