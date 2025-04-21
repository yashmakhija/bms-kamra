import { useEffect, useRef } from "react";
import { BookingStatusCount } from "../../store/dashboard";
import { Card, CardContent } from "@repo/ui/components/ui/card";

export interface BookingStatusChartProps {
  statuses: BookingStatusCount[];
}

export function BookingStatusChart({ statuses }: BookingStatusChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Calculate total for percentages
  const total = statuses.reduce((sum, status) => sum + status.count, 0);

  useEffect(() => {
    // Clean up any existing chart content
    if (chartRef.current) {
      chartRef.current.innerHTML = "";
    }

    // Only create chart if we have data and the element exists
    if (statuses.length > 0 && chartRef.current && total > 0) {
      renderChart();
    }
  }, [statuses]);

  const renderChart = () => {
    // Create SVG for bar chart
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "250");
    svg.setAttribute("viewBox", "0 0 300 250");

    // Create a group for labels
    const labels = document.createElementNS("http://www.w3.org/2000/svg", "g");
    labels.setAttribute("transform", "translate(0, 230)"); // Position at bottom

    // Create bars and labels
    const barWidth = 60;
    const gapWidth = 25;
    const maxBarHeight = 180;

    statuses.forEach((status, index) => {
      const percentage = (status.count / total) * 100;
      const barHeight = Math.max((percentage / 100) * maxBarHeight, 10); // Min height of 10px
      const x = index * (barWidth + gapWidth) + 30; // Start with some margin
      const y = maxBarHeight - barHeight + 20; // Position from top

      // Create bar
      const bar = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      bar.setAttribute("x", `${x}`);
      bar.setAttribute("y", `${y}`);
      bar.setAttribute("width", `${barWidth}`);
      bar.setAttribute("height", `${barHeight}`);
      bar.setAttribute("rx", "6"); // Rounded corners
      bar.setAttribute("class", `${status.color} dark:opacity-80`);

      // Create value label (number)
      const valueLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      valueLabel.setAttribute("x", `${x + barWidth / 2}`);
      valueLabel.setAttribute("y", `${y - 10}`);
      valueLabel.setAttribute("text-anchor", "middle");
      valueLabel.setAttribute("class", "text-xs font-medium fill-foreground");
      valueLabel.textContent = status.count.toString();

      // Create percentage label
      const percentLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      percentLabel.setAttribute("x", `${x + barWidth / 2}`);
      percentLabel.setAttribute("y", `${y - 25}`);
      percentLabel.setAttribute("text-anchor", "middle");
      percentLabel.setAttribute("class", "text-xs fill-muted-foreground");
      percentLabel.textContent = `${percentage.toFixed(1)}%`;

      // Create status label
      const statusLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      statusLabel.setAttribute("x", `${x + barWidth / 2}`);
      statusLabel.setAttribute("y", "16"); // Position below the x-axis
      statusLabel.setAttribute("text-anchor", "middle");
      statusLabel.setAttribute(
        "class",
        "text-xs font-medium fill-muted-foreground"
      );
      statusLabel.textContent = status.status;

      // Add all elements to SVG
      svg.appendChild(bar);
      svg.appendChild(valueLabel);
      svg.appendChild(percentLabel);
      labels.appendChild(statusLabel);
    });

    // Add the labels group to the SVG
    svg.appendChild(labels);

    // Add the SVG to the chart container
    chartRef.current?.appendChild(svg);
  };

  // If no data, show a message
  if (statuses.length === 0 || total === 0) {
  return (
      <Card className="col-span-1 lg:col-span-2">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p>No booking data available</p>
        </div>
      </CardContent>
    </Card>
  );
}

  return <div className="w-full h-full" ref={chartRef}></div>;
}
