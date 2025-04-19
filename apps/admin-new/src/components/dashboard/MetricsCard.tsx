import { DashboardMetric } from "../../store/dashboard";
import { DollarSign, Package, Ticket, BarChart3 } from "lucide-react";

interface MetricsCardProps {
  metric: DashboardMetric;
}

export function MetricsCard({ metric }: MetricsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-zinc-500 text-sm font-medium">{metric.title}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {metric.value}
          </p>
        </div>
        <div className="rounded-full bg-purple-100 p-2 text-purple-600">
          {getIconForMetric(metric.title)}
        </div>
      </div>
      <div
        className={`mt-3 text-sm ${metric.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}
      >
        {metric.change >= 0 ? "↑" : "↓"} {Math.abs(metric.change)}% from last
        month
      </div>
    </div>
  );
}

function getIconForMetric(title: string): React.ReactNode {
  switch (title) {
    case "Total Revenue":
      return <DollarSign className="h-6 w-6" />;
    case "Total Shows":
      return <Package className="h-6 w-6" />;
    case "Tickets Sold":
      return <Ticket className="h-6 w-6" />;
    case "Conversion Rate":
      return <BarChart3 className="h-6 w-6" />;
    default:
      return <BarChart3 className="h-6 w-6" />;
  }
}
