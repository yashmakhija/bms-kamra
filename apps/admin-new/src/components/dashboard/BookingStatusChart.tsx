import { BookingStatusCount } from "../../store/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";

interface BookingStatusChartProps {
  statuses: BookingStatusCount[];
}

export function BookingStatusChart({ statuses }: BookingStatusChartProps) {
  const totalTickets = getTotalTickets(statuses);

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Booking Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statuses.map((status, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-foreground">
                  {status.status}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {status.count}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className={`${status.color} h-2.5 rounded-full`}
                  style={{ width: `${(status.count / totalTickets) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            Total Tickets:{" "}
            <span className="font-medium text-foreground">
              {totalTickets.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTotalTickets(statuses: { count: number }[]): number {
  return statuses.reduce((total, status) => total + status.count, 0);
}
