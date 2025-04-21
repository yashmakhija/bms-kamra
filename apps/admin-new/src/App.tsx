import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Layout } from "./components/layout/layout";
import { ProtectedRoute } from "./components/auth/protected-route";
import { ThemeProvider } from "./providers/theme-provider";
import { AuthProvider } from "./providers/auth-provider";

import { DashboardPage } from "./pages/dashboard";
import { ShowsPage } from "./pages/shows";
import { ShowWizardPage } from "./pages/show-wizard";
import { VenuesPage } from "./pages/venues";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected Admin Routes - with Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/shows" element={<ShowsPage />} />
              <Route path="/shows/new" element={<ShowWizardPage />} />
              <Route path="/venues" element={<VenuesPage />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
