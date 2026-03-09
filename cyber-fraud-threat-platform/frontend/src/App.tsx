import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReportIncident from "./pages/ReportIncident";
import History from "./pages/History";
import AdminDashboard from "./pages/AdminDashboard";
import Layout from "./components/Layout";

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* User Routes - No Authentication */}
      <Route path="/dashboard" element={<Layout><Dashboard onReport={() => navigate("/report")} /></Layout>} />
      <Route path="/report" element={<Layout><ReportIncident onBack={() => navigate("/")} /></Layout>} />
      <Route path="/history" element={<Layout><History /></Layout>} />

      {/* Admin Routes - No Authentication */}
      <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />

      {/* Root & Fallback */}
      <Route path="/" element={<Layout><Dashboard onReport={() => navigate("/report")} /></Layout>} />
      <Route path="/get-started" element={<Layout><Dashboard onReport={() => navigate("/report")} /></Layout>} />
      <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px' }}>
        <h1>404 - Page Not Found</h1>
        <a href="/" style={{ color: '#667eea' }}>Return to Dashboard</a>
      </div>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;