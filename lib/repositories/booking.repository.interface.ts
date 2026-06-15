import { BookingWithRelations, NewBooking, UpdateTripMonitoringInput, UpdateTripDetailsInput } from "../db/schema/booking";
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

    updateTripDetails(data: UpdateTripMonitoringInput): Promise<void>,

    updateTripFinanceOdo(data: UpdateTripDetailsInput): Promise<void>,

    delete(id: string): Promise<boolean>,
}