import { useEffect, useMemo } from "react";
import { useDashboardStore } from "../store/dashboard";
import { useShowsStore } from "../store/shows";
import { useVenuesStore } from "../store/venues";
import { useBookingsStore, Booking } from "../store/bookings";
import { BookingStatusChart } from "../components/dashboard/BookingStatusChart";
import { RecentShowsTable } from "../components/dashboard/RecentShowsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Calendar,
  BarChart3,
  TicketIcon,
  HeartPulse,
  Users,
  MapPin,
  Tag,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const {
    metrics,
    bookingStatuses,
    recentShows,
    isLoading: isDashboardLoading,
    error: dashboardError,
    fetchDashboardData,
  } = useDashboardStore();

  const { shows, isLoading: isShowsLoading, fetchShows } = useShowsStore();

  const { venues, isLoading: isVenuesLoading, fetchVenues } = useVenuesStore();

  const {
    bookings,
    isLoading: isBookingsLoading,
    fetchAllBookings,
  } = useBookingsStore();

  const loadData = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchShows(),
      fetchVenues(),
      fetchAllBookings(),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [fetchDashboardData, fetchShows, fetchVenues, fetchAllBookings]);

  const isLoading =
    isDashboardLoading ||
    isShowsLoading ||
    isVenuesLoading ||
    isBookingsLoading;
  const error = dashboardError;

  // Calculate enhanced real-time metrics using memoization
  const realTimeMetrics = useMemo(() => {
    // Total bookings calculation
    const confirmedBookings = bookings.filter(
      (booking: Booking) => booking.status === "CONFIRMED"
    );

    // Total tickets calculation
    const totalTickets = bookings.reduce(
      (total: number, booking: Booking) => total + (booking.seats?.length || 0),
      0
    );

    // Total revenue calculation
    const totalRevenue = bookings.reduce(
      (total: number, booking: Booking) => total + (booking.totalAmount || 0),
      0
    );

    // Average ticket price
    const avgTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;

    // Conversion rate calculation
    const conversionRate = Math.round(
      (confirmedBookings.length / Math.max(bookings.length, 1)) * 100
    );

    return [
      {
        title: "Total Revenue",
        value: totalRevenue.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }),
        change: 12.5,
        icon: <BarChart3 className="h-6 w-6" />,
        color: "text-emerald-600 bg-emerald-100",
      },
      {
        title: "Active Shows",
        value: Array.isArray(shows)
          ? shows.filter((show) => show?.isActive).length
          : 0,
        change: 8.2,
        icon: <Calendar className="h-6 w-6" />,
        color: "text-blue-600 bg-blue-100",
      },
      {
        title: "Tickets Sold",
        value: totalTickets,
        change: 14.6,
        icon: <TicketIcon className="h-6 w-6" />,
        color: "text-purple-600 bg-purple-100",
      },
      {
        title: "Conversion Rate",
        value: `${conversionRate}%`,
        change: -2.4,
        icon: <HeartPulse className="h-6 w-6" />,
        color:
          conversionRate > 60
            ? "text-emerald-600 bg-emerald-100"
            : "text-amber-600 bg-amber-100",
      },
      {
        title: "Avg Ticket Price",
        value: avgTicketPrice.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }),
        change: 5.3,
        icon: <Tag className="h-6 w-6" />,
        color: "text-rose-600 bg-rose-100",
      },
      {
        title: "Available Venues",
        value: venues.length,
        change: 3.0,
        icon: <MapPin className="h-6 w-6" />,
        color: "text-amber-600 bg-amber-100",
      },
    ];
  }, [shows, venues, bookings]);

  // Generate booking status data for chart
  const bookingStatusData = useMemo(() => {
    const statusMap = {
      CONFIRMED: "Confirmed",
      PENDING: "Pending",
      CANCELLED: "Cancelled",
    } as const;

    const statusCounts = {
      Confirmed: 0,
      Pending: 0,
      Cancelled: 0,
    };

    bookings.forEach((booking: Booking) => {
      const status = statusMap[booking.status] || "Pending";
      statusCounts[status as keyof typeof statusCounts]++;
    });

    return [
      {
        status: "Confirmed",
        count: statusCounts.Confirmed,
        color: "bg-emerald-500",
      },
      { status: "Pending", count: statusCounts.Pending, color: "bg-amber-500" },
      {
        status: "Cancelled",
        count: statusCounts.Cancelled,
        color: "bg-rose-500",
      },
    ];
  }, [bookings]);

  // Process recent shows data
  const recentShowsData = useMemo(() => {
    if (!Array.isArray(shows) || shows.length === 0 || !Array.isArray(venues))
      return [];

    // Sort shows by creation date (newest first)
    const sortedShows = [...shows].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return sortedShows.slice(0, 5).map((show) => {
      // Get bookings for this show
      const showBookings = bookings.filter(
        (booking: Booking) => booking.showId === show.id
      );

      // Calculate ticket count and revenue
      const ticketsSold = showBookings.reduce(
        (sum, booking) => sum + (booking.seats?.length || 0),
        0
      );

      const revenue = showBookings.reduce(
        (sum, booking) => sum + (booking.totalAmount || 0),
        0
      );

      // Get venue name - Fixed: ensure venues is an array before using find
      const venue = Array.isArray(venues)
        ? venues.find((v) => v.id === show.venueId)
        : undefined;

      return {
        id: show.id,
        title: show.title,
        date: new Date(show.createdAt).toISOString().split("T")[0],
        time: "8:00 PM", // This would come from event data in a real app
        venue: venue?.name || "Unknown Venue",
        ticketsSold,
        revenue: revenue.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }),
      };
    });
  }, [shows, bookings, venues]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card p-6 rounded-lg shadow-sm max-w-md w-full border border-border">
          <div className="flex items-center text-rose-600 dark:text-rose-400 text-lg font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Error</span>
          </div>
          <p className="text-foreground">{error}</p>
          <Button onClick={loadData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-12 bg-background text-foreground p-6 pt-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome to your Kunal Kamra Shows admin dashboard
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Button asChild>
              <Link to="/shows/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Show
              </Link>
            </Button>
          </div>
        </header>

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {realTimeMetrics.map((metric, index) => (
            <Card
              key={index}
              className="shadow-sm hover:shadow-md transition-all duration-200 bg-card text-card-foreground"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metric.value}
                    </p>
                  </div>
                  <div
                    className={`rounded-full p-2 ${metric.color} dark:bg-opacity-20`}
                  >
                    {metric.icon}
                  </div>
                </div>
                <div
                  className={`mt-3 text-sm flex items-center ${
                    metric.change >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {metric.change >= 0 ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  <span>{Math.abs(metric.change)}% from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Booking Status Chart */}
          <BookingStatusChart statuses={bookingStatusData} />

          {/* Recent Shows Table */}
          <RecentShowsTable shows={recentShowsData} />
        </div>

        {/* Quick Actions & System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-3 md:col-span-1 bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Manage your shows and venues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <Link to="/shows/new">
                  <span className="flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Show
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <Link to="/shows">
                  <span className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    View All Shows
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <Link to="/venues">
                  <span className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Manage Venues
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <Link to="/bookings">
                  <span className="flex items-center">
                    <TicketIcon className="mr-2 h-4 w-4" />
                    View Bookings
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <Link to="/reports">
                  <span className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Generate Reports
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="col-span-3 md:col-span-2 bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">System Status</CardTitle>
              <CardDescription>
                Live stats of your ticketing platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Shows
                  </p>
                  <p className="text-2xl font-bold">
                    {Array.isArray(shows) ? shows.length : 0}
                  </p>
                  <p className="text-xs text-muted-foreground/70">All time</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Shows
                  </p>
                  <p className="text-2xl font-bold">
                    {Array.isArray(shows)
                      ? shows.filter((show) => show?.isActive).length
                      : 0}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Currently running
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Categories
                  </p>
                  <p className="text-2xl font-bold">
                    {Array.isArray(shows)
                      ? shows.reduce(
                          (sum, show) => sum + (show?.categories?.length || 0),
                          0
                        )
                      : 0}
                  </p>
                  <p className="text-xs text-muted-foreground/70">Seat types</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Bookings
                  </p>
                  <p className="text-2xl font-bold">
                    {Array.isArray(bookings) ? bookings.length : 0}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Total tickets booked
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
