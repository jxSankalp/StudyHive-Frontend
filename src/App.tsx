// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import MeetingPage from "./pages/Meeting";
import LandingPage from "./pages/LandingPage"; // Import the new landing page

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/home" /> : <LandingPage />}
      />

      {/* Auth Routes */}
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={isAuthenticated ? <Home /> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <Profile /> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/chat/:id"
        element={isAuthenticated ? <Chat /> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/meeting/:callId"
        element={isAuthenticated ? <MeetingPage /> : <Navigate to="/sign-in" />}
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;