/**
 * Transform a booking entity for user response
 * @param booking The booking entity from the database
 * @returns Formatted booking object
 */
export function formatBooking(booking: any) {
  if (!booking) return null;

  return {
    id: booking.id,
    userId: booking.userId,
    status: booking.paymentStatus || booking.status,
    totalAmount: parseFloat(booking.totalAmount.toString()),
    currency: booking.currency,
    paymentMethod: booking.paymentMethod,
    paymentId: booking.paymentId,
    paymentDate: booking.paymentDate,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,

    // Seat information
    seats:
      booking.seats?.map((seat: any) => ({
        id: seat.id,
        seatNumber: seat.seatNumber,
      })) || [],

    // Show information if available
    show: booking.show
      ? {
          id: booking.show.id,
          title: booking.show.title,
          imageUrl: booking.show.imageUrl,
          startTime: booking.show.startTime,
          endTime: booking.show.endTime,

          // Movie information if available
          movie: booking.show.movie
            ? {
                id: booking.show.movie.id,
                title: booking.show.movie.title,
                posterUrl: booking.show.movie.posterUrl,
              }
            : null,

          // Venue information if available
          venue: booking.show.venue
            ? {
                id: booking.show.venue.id,
                name: booking.show.venue.name,
                address: booking.show.venue.address,
                city: booking.show.venue.city,
              }
            : null,
        }
      : null,

    // Tickets information if available (for new schema)
    tickets:
      booking.tickets?.map((ticket: any) => ({
        id: ticket.id,
        seatNumber: ticket.seatNumber,
        code: ticket.code,
        price: parseFloat(ticket.price.toString()),
        currency: ticket.currency,
        status: ticket.status,

        // Section information if available
        section: ticket.section
          ? {
              id: ticket.section.id,
              name: ticket.section.name,

              // Showtime information if available
              showtime: ticket.section.showtime
                ? {
                    id: ticket.section.showtime.id,
                    startTime: ticket.section.showtime.startTime,
                    endTime: ticket.section.showtime.endTime,

                    // Event information if available
                    event: ticket.section.showtime.event
                      ? {
                          id: ticket.section.showtime.event.id,
                          date: ticket.section.showtime.event.date,

                          // Show information if available
                          show: ticket.section.showtime.event.show
                            ? {
                                id: ticket.section.showtime.event.show.id,
                                title: ticket.section.showtime.event.show.title,
                                imageUrl:
                                  ticket.section.showtime.event.show.imageUrl,
                                venue: ticket.section.showtime.event.show.venue
                                  ? {
                                      id: ticket.section.showtime.event.show
                                        .venue.id,
                                      name: ticket.section.showtime.event.show
                                        .venue.name,
                                      address:
                                        ticket.section.showtime.event.show.venue
                                          .address,
                                      city: ticket.section.showtime.event.show
                                        .venue.city,
                                    }
                                  : null,
                              }
                            : null,
                        }
                      : null,
                  }
                : null,
            }
          : null,
      })) || [],
  };
}

/**
 * Transform a booking entity for admin response
 * Includes more details than the user response
 * @param booking The booking entity from the database
 * @returns Formatted booking object with admin details
 */
export function formatBookingForAdmin(booking: any) {
  if (!booking) return null;

  // Start with the basic booking format
  const formattedBooking = formatBooking(booking);

  // Add admin-specific fields
  return {
    ...formattedBooking,

    // User information if available
    user: booking.user
      ? {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email,
          phone: booking.user.phone,
        }
      : null,

    // Additional metrics for admin
    metrics: {
      ticketCount: booking._count?.tickets || booking.tickets?.length || 0,
      expiresAt: booking.expiresAt,
    },
  };
}
