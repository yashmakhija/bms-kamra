import { RecentShow } from "../../store/dashboard";
import { Calendar, MapPin, Tag } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Link } from "react-router-dom";

export interface RecentShowsTableProps {
  shows: RecentShow[];
}

export function RecentShowsTable({ shows }: RecentShowsTableProps) {
  if (!shows || shows.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground text-sm">No recent shows found</p>
        <Button variant="link" size="sm" className="mt-2" asChild>
          <Link to="/shows/new">Create your first show</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shows.slice(0, 5).map((show) => (
          <Link
          key={show.id}
          to={`/shows/${show.id}`}
          className="block p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border"
        >
          <div className="mb-1">
            <h3 className="font-medium text-sm text-foreground line-clamp-1">
              {show.title}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {show.date}
            </div>
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              {show.venue}
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border text-xs">
            <div className="text-muted-foreground">
              Tickets sold:{" "}
              <span className="font-medium">{show.ticketsSold}</span>
        </div>
            <div className="flex items-center text-foreground font-medium">
              <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {show.revenue}
            </div>
          </div>
        </Link>
      ))}
        </div>
  );
}
