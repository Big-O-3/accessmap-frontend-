import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import VenueDetailPage from "./pages/VenueDetailPage";
import AnalyzePage from "./pages/AnalyzePage";
import AddVenuePage from "./pages/AddVenuePage";
import StubPage from "./pages/StubPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="venue/:id" element={<VenueDetailPage />} />
          <Route path="analyze" element={<AnalyzePage />} />
          <Route
            path="upload"
            element={<StubPage title="Photo Upload" owner="Brandon" />}
          />
          <Route path="add-venue" element={<AddVenuePage />} />
          <Route
            path="dashboard"
            element={<StubPage title="Dashboard" owner="Brandon" />}
          />
          <Route
            path="profile"
            element={<StubPage title="Profile & Settings" owner="Brandon" />}
          />
          <Route path="about" element={<StubPage title="About AccessMap" />} />
          <Route path="*" element={<StubPage title="Page not found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
