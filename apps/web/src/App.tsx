import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
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
import { PaymentCancelPage } from "./pages/payment/cancel";
import Tickets from "./pages/tickets";
import Podcasts from "./pages/podcasts";
import LatestUploads from "./pages/latest-uploads";
import TicketViewPage from "./pages/ticket/view";
import { ErrorPage } from "./components/errorPage";
import ComingSoon from "./components/comingSoon";
import { BookingsPage } from "./pages/bookings";
import { LoginPage } from "./pages/auth/login";
import { SignupPage } from "./pages/auth/signup";
import Privacy from "./pages/privacy";
// Layout component to conditionally render navbar and footer
function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth/');

  return (
    <>
      {!isAuthPage && <Navbar />}
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
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
        <Route path="/privacy" element={<Privacy />} />
        {/* Fallback route */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
      {!isAuthPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
