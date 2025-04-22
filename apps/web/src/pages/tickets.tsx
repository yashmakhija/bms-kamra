import { Hero } from "../components/tickets/hero";
import { ShowTickets } from "../components/tickets/showTickets";
export default function Tickets() {
  return (
    <div className="bg-neutral-900 min-h-screen overflow-y-auto">
      <Hero />
      <ShowTickets />
    </div>
  );
}
