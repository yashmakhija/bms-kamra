import { useEffect } from "react";
import { useDashboardStore } from "../store/dashboard";
import { useShowsStore } from "../store/shows";
import { useVenuesStore } from "../store/venues";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Calendar,
  BarChart3,
  TicketIcon,
  Users,
  MapPin,
  Tag,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  Info,
  Clock,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@repo/ui/components/ui/skeleton";

// DashboardMetricCard component for cleaner code
const DashboardMetricCard = ({
  title,
  value,
  change,
  icon,
  color,
  description,
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}) => (
  <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-card text-card-foreground border-border relative">
    <div
      className={`absolute top-0 left-0 w-full h-1 ${color.replace("text-", "bg-").replace("bg-", "bg-")}`}
    />
    <CardContent className="p-6 pt-7">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`rounded-full p-2 ${color} dark:bg-opacity-20`}>
          {icon}
        </div>
      </div>
      <div
        className={`mt-3 text-xs flex items-center ${
          change >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {change >= 0 ? (
          <ChevronUp className="h-3.5 w-3.5 mr-1" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 mr-1" />
        )}
        <span>{Math.abs(change)}% from last month</span>
      </div>
    </CardContent>
  </Card>
);

// Loading Skeleton for metrics
const MetricSkeleton = () => (
  <Card className="shadow-sm bg-card h-[120px]">
    <div className="h-1 w-full bg-muted/20 animate-pulse" />
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-2/3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32 mt-4" />
    </CardContent>
  </Card>
);

export function DashboardPage() {
  const {
    metrics,
    bookingStatuses,
    recentShows,
    totalUsers,
    totalBookings,
    totalRevenue,
    activeShowsCount,
    activeVenuesCount,
    conversionRate,
    averageRevenuePerBooking,
    isLoading: isDashboardLoading,
    error: dashboardError,
    fetchDashboardData,
  } = useDashboardStore();

  const { shows, isLoading: isShowsLoading, fetchShows } = useShowsStore();

  const { venues, isLoading: isVenuesLoading, fetchVenues } = useVenuesStore();

  const loadData = async () => {
    await Promise.all([fetchDashboardData(), fetchShows(), fetchVenues()]);
  };

  useEffect(() => {
    loadData();
  }, [fetchDashboardData, fetchShows, fetchVenues]);

  const isLoading = isDashboardLoading || isShowsLoading || isVenuesLoading;
  const error = dashboardError;

  // Define the metric icons, colors and descriptions
  const metricConfigs = [
    {
      title: "Total Revenue",
      icon: <CreditCard className="h-5 w-5" />,
      color: "text-emerald-600 bg-emerald-100",
      description: "Sum of all paid bookings revenue",
    },
    {
      title: "Active Shows",
      icon: <Calendar className="h-5 w-5" />,
      color: "text-blue-600 bg-blue-100",
      description: "Currently scheduled and active shows",
    },
    {
      title: "Tickets Sold",
      icon: <TicketIcon className="h-5 w-5" />,
      color: "text-purple-600 bg-purple-100",
      description: "Total number of tickets sold",
    },
    {
      title: "Conversion Rate",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-amber-600 bg-amber-100",
      description: "Percentage of visitors who completed a booking",
    },
    {
      title: "Average Revenue",
      icon: <Tag className="h-5 w-5" />,
      color: "text-rose-600 bg-rose-100",
      description: "Average revenue per booking",
    },
    {
      title: "Active Venues",
      icon: <MapPin className="h-5 w-5" />,
      color: "text-indigo-600 bg-indigo-100",
      description: "Number of active venues available for booking",
    },
  ];

  // Enhance metrics with icons
  const metricsWithIcons = metrics.map((metric, index) => ({
    ...metric,
    icon: metricConfigs[index % metricConfigs.length].icon,
    color: metricConfigs[index % metricConfigs.length].color,
    description: metricConfigs[index % metricConfigs.length].description,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-6 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <MetricSkeleton key={i} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // All data is now fetched directly from the store
  const paidBookingsCount =
    bookingStatuses.find((s) => s.status === "Paid")?.count || 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Top gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />

      <div className="px-6 pt-12 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <Badge variant="outline" className="font-normal">
                <Clock className="h-3 w-3 mr-1" />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Welcome to your Kunal Kamra Shows admin dashboard
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="h-9"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" className="h-9" asChild>
              <Link to="/shows/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Show
              </Link>
            </Button>
          </div>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {metricsWithIcons.map((metric, index) => (
            <DashboardMetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              icon={metric.icon}
              color={metric.color}
              description={metric.description}
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Booking Status Chart */}
          <Card className="col-span-1 lg:col-span-2 bg-card text-card-foreground overflow-hidden shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-purple-500" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Booking Status</CardTitle>
                  <CardDescription>
                    Distribution of bookings by status
                  </CardDescription>
                </div>
                <Badge variant="outline" className="h-6">
                  {bookingStatuses.reduce(
                    (total, status) => total + status.count,
                    0
                  )}{" "}
                  Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <BookingStatusChart statuses={bookingStatuses} />
            </CardContent>
            <CardFooter className="pt-2 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <div className="flex gap-3">
                {bookingStatuses.map((status, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`h-2.5 w-2.5 rounded-full mr-1 ${status.color}`}
                    ></div>
                    <span>
                      {status.status}: {status.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardFooter>
          </Card>

          {/* Recent Shows Table */}
          <Card className="col-span-1 bg-card text-card-foreground overflow-hidden shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-rose-500" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Shows</CardTitle>
                  <CardDescription>Your latest scheduled shows</CardDescription>
                </div>
                <Badge variant="outline" className="h-6">
                  {recentShows.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <RecentShowsTable shows={recentShows} />
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-4 pb-4">
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <Link
                  to="/shows"
                  className="flex items-center text-xs font-medium"
                >
                  View all shows
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Actions Card */}
          <Card className="col-span-3 md:col-span-1 bg-card text-card-foreground overflow-hidden shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-400 to-cyan-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Manage your shows and venues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Button
                variant="outline"
                className="w-full justify-between group h-10 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
                asChild
              >
                <Link to="/shows/new">
                  <span className="flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Show
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between group h-10 hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700"
                asChild
              >
                <Link to="/shows">
                  <span className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    View All Shows
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between group h-10 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700"
                asChild
              >
                <Link to="/venues">
                  <span className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Manage Venues
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between group h-10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700"
                asChild
              >
                <Link to="/bookings">
                  <span className="flex items-center">
                    <TicketIcon className="mr-2 h-4 w-4" />
                    View Bookings
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between group h-10 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700"
                asChild
              >
                <Link to="/reports">
                  <span className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Generate Reports
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Status Card */}
          <Card className="col-span-3 md:col-span-2 bg-card text-card-foreground overflow-hidden shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">System Status</CardTitle>
                  <CardDescription>
                    Live stats of your ticketing platform
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                  All systems operational
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Shows
                    </p>
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">
                    {Array.isArray(shows) ? shows.length : 0}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1 mr-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    >
                      {activeShowsCount} Active
                    </Badge>
                    <span>
                      {Math.round(
                        (activeShowsCount / (shows?.length || 1)) * 100
                      )}
                      % active rate
                    </span>
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Venues
                    </p>
                    <MapPin className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold">
                    {Array.isArray(venues) ? venues.length : 0}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1 mr-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    >
                      {activeVenuesCount} Available
                    </Badge>
                    <span>Across {venues?.length || 0} locations</span>
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Bookings
                    </p>
                    <TicketIcon className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold">{totalBookings || 0}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1 mr-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                    >
                      {paidBookingsCount} Paid
                    </Badge>
                    <span>Total ticket sales</span>
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Revenue
                    </p>
                    <Tag className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold">
                    {totalRevenue.toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1 mr-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    >
                      {averageRevenuePerBooking.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      })}{" "}
                      Avg
                    </Badge>
                    <span>Per booking</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between w-full">
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date().toLocaleString()}
                </p>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5"></div>
                  <span className="text-xs text-muted-foreground">
                    All services running
                  </span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
