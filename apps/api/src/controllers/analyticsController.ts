import { Request, Response } from "express";
import { AuthRequest } from "../types";
import { prisma } from "@repo/database";
import { StatusCodes } from "http-status-codes";
import { createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("analytics-controller");

/**
 * Get dashboard statistics for admin
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const user = req.user;
    if (!user || !user.isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "Admin access required",
      });
    }

    const totalBookings = await prisma.booking.count();

    const revenueResult = await prisma.booking.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: "PAID",
      },
    });

    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

    const totalUsers = await prisma.user.count();

    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tickets: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const upcomingShows = await prisma.show.findMany({
      where: {
        isActive: true,
        events: {
          some: {
            date: {
              gte: new Date(),
            },
            isActive: true,
          },
        },
      },
      take: 10,
      orderBy: [
        {
          events: {
            _count: "desc",
          },
        },
        {
          createdAt: "desc",
        },
      ],
      include: {
        events: {
          where: {
            date: {
              gte: new Date(),
            },
            isActive: true,
          },
          orderBy: {
            date: "asc",
          },
          include: {
            showtimes: {
              take: 1,
              orderBy: {
                startTime: "asc",
              },
            },
          },
        },
        venue: true,
      },
    });

    return res.status(StatusCodes.OK).json({
      totalBookings,
      totalRevenue,
      totalUsers,
      recentBookings,
      upcomingShows,
    });
  } catch (error) {
    logger.error(
      "Error fetching dashboard stats:",
      error as Record<string, any>
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch dashboard statistics",
    });
  }
};

/**
 * Get booking analytics
 */
export const getBookingAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "Admin access required",
      });
    }

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().setDate(new Date().getDate() - 30));

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const bookingStatusCounts = await prisma.booking.groupBy({
      by: ["status"],
      _count: true,
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const bookingsByStatus = bookingStatusCounts.map((statusCount) => ({
      status: statusCount.status,
      count: statusCount._count,
    }));

    const bookingsByDate = await prisma.booking.groupBy({
      by: ["createdAt"],
      _count: true,
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dailyBookingsMap = new Map();
    bookingsByDate.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split("T")[0];
      const currentCount = dailyBookingsMap.get(dateKey) || 0;
      dailyBookingsMap.set(dateKey, currentCount + item._count);
    });

    const dailyBookings = Array.from(dailyBookingsMap.entries()).map(
      ([date, count]) => ({
        date,
        count,
      })
    );

    const ticketsWithBookings = await prisma.ticket.findMany({
      where: {
        bookings: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      select: {
        section: {
          select: {
            showtime: {
              select: {
                event: {
                  select: {
                    show: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const showBookingsMap = new Map();

    ticketsWithBookings.forEach((ticket) => {
      if (ticket.section?.showtime?.event?.show) {
        const { id, title } = ticket.section.showtime.event.show;
        const showKey = `${id}|${title}`;
        const currentCount = showBookingsMap.get(showKey) || 0;
        showBookingsMap.set(showKey, currentCount + 1);
      }
    });

    const bookingsByShow = Array.from(showBookingsMap.entries())
      .map(([showKey, count]) => {
        const [showId, showTitle] = showKey.split("|");
        return { showId, showTitle, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.status(StatusCodes.OK).json({
      dailyBookings,
      bookingsByStatus,
      bookingsByShow,
    });
  } catch (error) {
    logger.error(
      "Error fetching booking analytics:",
      error as Record<string, any>
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch booking analytics",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getRevenueStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "Admin access required",
      });
    }

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().setDate(new Date().getDate() - 30));

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const revenueResult = await prisma.booking.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: "PAID",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

    const bookingsByDate = await prisma.booking.findMany({
      where: {
        status: "PAID",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dailyRevenueMap = new Map();
    bookingsByDate.forEach((booking) => {
      const dateKey = booking.createdAt.toISOString().split("T")[0];
      const currentAmount = dailyRevenueMap.get(dateKey) || 0;
      dailyRevenueMap.set(dateKey, currentAmount + Number(booking.totalAmount));
    });

    const dailyRevenue = Array.from(dailyRevenueMap.entries()).map(
      ([date, amount]) => ({
        date,
        amount,
      })
    );

    // First get all tickets with their booking information in our date range
    const ticketsWithRevenueData = await prisma.ticket.findMany({
      where: {
        bookings: {
          some: {
            status: "PAID",
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      select: {
        price: true,
        section: {
          select: {
            showtime: {
              select: {
                event: {
                  select: {
                    show: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
            priceTier: {
              select: {
                category: {
                  select: {
                    type: true,
                  },
                },
              },
            },
          },
        },
        bookings: {
          where: {
            status: "PAID",
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            totalAmount: true,
          },
        },
      },
    });

    const showRevenueMap = new Map();
    const categoryRevenueMap = new Map();

    ticketsWithRevenueData.forEach((ticket) => {
      const price = Number(ticket.price);

      if (ticket.section?.showtime?.event?.show) {
        const { id, title } = ticket.section.showtime.event.show;
        const showKey = `${id}|${title}`;
        const currentAmount = showRevenueMap.get(showKey) || 0;
        showRevenueMap.set(showKey, currentAmount + price);
      }

      if (ticket.section?.priceTier?.category?.type) {
        const categoryType = ticket.section.priceTier.category.type;
        const currentAmount = categoryRevenueMap.get(categoryType) || 0;
        categoryRevenueMap.set(categoryType, currentAmount + price);
      }
    });

    const revenueByShow = Array.from(showRevenueMap.entries())
      .map(([showKey, amount]) => {
        const [showId, showTitle] = showKey.split("|");
        return { showId, showTitle, amount };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const revenueByCategory = Array.from(categoryRevenueMap.entries())
      .map(([categoryType, amount]) => ({ categoryType, amount }))
      .sort((a, b) => b.amount - a.amount);

    return res.status(StatusCodes.OK).json({
      totalRevenue,
      dailyRevenue,
      revenueByShow,
      revenueByCategory,
    });
  } catch (error) {
    logger.error(
      "Error fetching revenue statistics:",
      error as Record<string, any>
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch revenue statistics",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "Admin access required",
      });
    }

    const usersByDate = await prisma.user.groupBy({
      by: ["createdAt"],
      _count: true,
      orderBy: {
        createdAt: "asc",
      },
      take: 100,
    });

    const userGrowthMap = new Map();
    usersByDate.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split("T")[0];
      const currentCount = userGrowthMap.get(dateKey) || 0;
      userGrowthMap.set(dateKey, currentCount + item._count);
    });

    const userGrowth = Array.from(userGrowthMap.entries())
      .map(([date, count]) => ({ date, count }))
      .slice(-30);

    const activeUsersCount = await prisma.user.count({
      where: {
        OR: [{ emailVerified: { not: null } }, { phoneVerified: true }],
      },
    });

    const totalUsersCount = await prisma.user.count();

    const inactiveUsersCount = totalUsersCount - activeUsersCount;

    const usersByStatus = [
      { isActive: true, count: activeUsersCount },
      { isActive: false, count: inactiveUsersCount },
    ];

    const usersWithBookingCount = await prisma.user.findMany({
      where: {
        bookings: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        bookings: {
          _count: "desc",
        },
      },
      take: 10,
    });

    const topBookingUsers = usersWithBookingCount.map((user) => ({
      userId: user.id,
      userName: user.name || "Unknown User",
      bookings: user._count.bookings,
    }));

    return res.status(StatusCodes.OK).json({
      userGrowth,
      usersByStatus,
      topBookingUsers,
    });
  } catch (error) {
    logger.error(
      "Error fetching user statistics:",
      error as Record<string, any>
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch user statistics",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
