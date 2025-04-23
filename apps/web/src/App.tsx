import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/home";
import { Navbar } from "./components/layout/navbar/navbar";
import { Footer } from "./components/layout/footer";
import { TicketDetailsPage } from "./pages/ticket-details";
import { ProfilePage } from "./pages/profile";
import BookingSuccessPage from "./pages/booking-success";
import { AuthProvider } from "./providers/auth-provider";
import { ProtectedRoute } from "./components/auth/protected-route";
import PaymentProcessingPage from "./pages/payment";
import PaymentSuccessPage from "./pages/payment/success";
import PaymentCancelPage from "./pages/payment/cancel";
import Tickets from "./pages/tickets";
import Podcasts from "./pages/podcasts";
import LatestUploads from "./pages/latest-uploads";
import TicketViewPage from "./pages/ticket/view";
import { ErrorPage } from "./components/errorPage";
import ComingSoon from "./components/comingSoon";
import { BookingsPage } from "./pages/bookings";
function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />

          {/* Protected routes */}
          <Route path="/shows/:showId" element={<TicketDetailsPage />} />

          <Route
            path="/booking/:bookingId/success"
            element={
              <ProtectedRoute>
                <BookingSuccessPage />
              </ProtectedRoute>
            }
          />

          <Route path="/settings" element={<ComingSoon />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Ticket routes */}
          <Route
            path="/ticket/view/:bookingId"
            element={
              <ProtectedRoute>
                <TicketViewPage />
              </ProtectedRoute>
            }
          />

          {/* Payment routes */}
          <Route
            path="/payment/success/:bookingId?"
            element={
              <ProtectedRoute>
                <PaymentSuccessPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment/cancel/:bookingId?"
            element={
              <ProtectedRoute>
                <PaymentCancelPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment/:bookingId"
            element={
              <ProtectedRoute>
                <PaymentProcessingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/podcasts" element={<Podcasts />} />
          <Route path="/latest-uploads" element={<LatestUploads />} />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          {/* Fallback route */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
