import { RecentShow } from "../../store/dashboard";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";

interface RecentShowsTableProps {
  shows: RecentShow[];
}

export function RecentShowsTable({ shows }: RecentShowsTableProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Recent Shows</CardTitle>
          <Link
            to="/shows"
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Show</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Tickets Sold</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No recent shows found
                  </TableCell>
                </TableRow>
              ) : (
                shows.map((show) => (
                  <TableRow key={show.id}>
                    <TableCell className="font-medium">{show.title}</TableCell>
                    <TableCell>
                      {new Date(show.date).toLocaleDateString()} • {show.time}
                    </TableCell>
                    <TableCell>{show.venue}</TableCell>
                    <TableCell>{show.ticketsSold}</TableCell>
                    <TableCell className="font-medium">
                      {show.revenue}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
