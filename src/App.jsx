import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import VenueDetailPage from "./pages/VenueDetailPage";
import AnalyzePage from "./pages/AnalyzePage";
import AddVenuePage from "./pages/AddVenuePage";
import DashboardPage from "./pages/DashboardPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StubPage from "./pages/StubPage";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes — anonymous browsing is a feature. */}
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="venue/:id" element={<VenueDetailPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* Protected routes — anything that writes to the DB. */}
            <Route element={<RequireAuth />}>
              <Route path="analyze" element={<AnalyzePage />} />
              <Route path="add-venue" element={<AddVenuePage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route
                path="upload"
                element={<StubPage title="Photo Upload" owner="Brandon" />}
              />
              <Route
                path="profile"
                element={<StubPage title="Profile & Settings" owner="Brandon" />}
              />
            </Route>

            <Route path="*" element={<StubPage title="Page not found" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
