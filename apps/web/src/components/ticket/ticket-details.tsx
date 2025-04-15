import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTicketStore } from "../../store/tickets";
import { Calendar, Clock, MapPin, ChevronDown } from "lucide-react";
import { latestShows } from "../../data/upload";
import { LatestUploads } from "../home/latestupload";

export function TicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { ticket, isLoading, hasError, loadTicket } = useTicketStore();

  useEffect(() => {
    if (ticketId) {
      loadTicket(ticketId);
    }
  }, [ticketId, loadTicket]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="w-6 h-6 border-2 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasError || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#0f0f0f]">
        <h2 className="text-2xl font-bold text-red-600">Ticket not found</h2>
        <p className="mt-2 text-gray-400">
          The ticket you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f0f] pt-24 min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg">
              <img
                src={ticket.thumbnailUrl}
                alt={ticket.title}
                className="w-full object-cover h-auto"
              />
            </div>

            <h1 className="text-3xl text-neutral-100 font-semibold mt-8 mb-6 leading-10">
              {ticket.title} | {ticket.subtitle}
            </h1>

            <div className="mb-8 text-lg leading-relaxed">
              {ticket.description.map((paragraph, index) => (
                <p key={index} className="text-gray-300 mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 text-lg leading-relaxed mb-8">
              <p className="text-gray-300">Age Limit: {ticket.ageLimit}</p>
              <p className="text-gray-300">Language: {ticket.language}</p>
            </div>
          </div>

          <div className="bg-[#1e1e1e] rounded-3xl p-8 lg:max-w-sm lg:self-start">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <Calendar size={22} color="#ff3b30" className="mt-1 shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white text-xl mt-1">26 Jan 2026</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock size={22} color="#ff3b30" className="mt-1 shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white text-xl mt-1">90 mins</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock size={22} color="#ff3b30" className="mt-1 shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Time</p>
                  <p className="text-white text-xl mt-1">8:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin size={22} color="#ff3b30" className="mt-1 shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Venue</p>
                  <p className="text-white text-xl mt-1">
                    Emirates Theatre, Dubai
                  </p>
                </div>
              </div>

              <div className="mt-2">
                <button className="w-50 bg-neutral-900 text-neutral-100 text-left px-4 py-3 rounded-lg flex justify-between items-center">
                  <span>2 tickets</span>
                  <ChevronDown
                    size={18}
                    strokeWidth={2}
                    className="text-white"
                  />
                </button>
              </div>

              <div className="mt-2">
                <h3 className="text-4xl font-bold">
                  ₹7,998
                  <span className="text-xs text-gray-400 ml-2">
                    (excl. taxes)
                  </span>
                </h3>
              </div>
            </div>

            <div className="w-full h-px bg-[#333333] my-8"></div>

            <button className="w-full py-4 bg-[#e30613] text-white text-lg font-medium rounded-2xl hover:bg-red-700 transition-colors">
              Purchase
            </button>
          </div>
        </div>
      </div>
      <LatestUploads shows={latestShows} className="bg-[#0f0f0f]" />
    </div>
  );
}
