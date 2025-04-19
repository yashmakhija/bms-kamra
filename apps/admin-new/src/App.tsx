import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Navbar } from "./components/layout/navbar/navbar";
import { Footer } from "./components/layout/footer";

import { DashboardPage } from "./pages/dashboard";
import { ShowsPage } from "./pages/shows";
import { AuthProvider } from "./providers/auth-provider";
import { ThemeProvider } from "./providers/theme-provider";
import { ProtectedRoute } from "./components/auth/protected-route";
import { ShowWizardPage } from "./pages/show-wizard";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shows"
              element={
                <ProtectedRoute>
                  <ShowsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shows/new"
              element={
                <ProtectedRoute>
                  <ShowWizardPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
