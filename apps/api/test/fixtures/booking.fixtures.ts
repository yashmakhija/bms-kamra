// @ts-nocheck
import {
  Booking,
  BookingStatus,
  PaymentMethod,
  Ticket,
  TicketStatus,
} from "@repo/database";

// Create a mock pending booking
export const createMockPendingBooking = (
  userId: string,
  ticketIds: string[] = []
): Booking => {
  return {
    id: `booking-${Date.now()}`,
    status: BookingStatus.PENDING,
    totalAmount: 100.0 as any,
    currency: "INR",
    paymentMethod: null,
    paymentId: null,
    paymentDate: null,
    refundId: null,
    refundDate: null,
    refundReason: null,
    refundedBy: null,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
    metadata: {},
    tickets: ticketIds.map((id) => createMockTicket(id)) as any,
  };
};

// Create a mock paid booking
export const createMockPaidBooking = (
  userId: string,
  ticketIds: string[] = []
): Booking => {
  return {
    id: `booking-${Date.now()}`,
    status: BookingStatus.PAID,
    totalAmount: 100.0 as any,
    currency: "INR",
    paymentMethod: PaymentMethod.CREDIT_CARD,
    paymentId: `payment-${Date.now()}`,
    paymentDate: new Date(),
    refundId: null,
    refundDate: null,
    refundReason: null,
    refundedBy: null,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
    metadata: {},
    tickets: ticketIds.map((id) => createMockTicket(id)) as any,
  };
};

// Create a mock ticket
export const createMockTicket = (id?: string): Ticket => {
  return {
    id: id || `ticket-${Date.now()}`,
    seatNumber: `A-${Math.floor(Math.random() * 100)}`,
    code: `CODE-${Date.now()}`,
    status: TicketStatus.AVAILABLE,
    price: 25.0 as any,
    currency: "INR",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    sectionId: `section-${Date.now()}`,
  };
};
