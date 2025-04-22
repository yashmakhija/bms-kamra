import { TicketDetails } from "../components/ticket/ticket-details";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";

export function TicketDetailsPage() {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();

  // If the route doesn't have a showId, redirect to home
  useEffect(() => {
    if (!showId) {
      navigate("/");
    }
  }, [showId, navigate]);

  return <TicketDetails />;
}
