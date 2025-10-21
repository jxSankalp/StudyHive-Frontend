// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import MeetingPage from "./pages/Meeting";
import LandingPage from "./pages/LandingPage"; // Import the new landing page

function App() {
  const { isSignedIn } = useAuth();

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route
        path="/"
        element={isSignedIn ? <Navigate to="/home" /> : <LandingPage />}
      />

      {/* Auth Routes */}
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={isSignedIn ? <Home /> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/profile"
        element={isSignedIn ? <Profile /> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/chat/:id"
        element={isSignedIn ? <Chat /> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/meeting/:callId"
        element={isSignedIn ? <MeetingPage /> : <Navigate to="/sign-in" />}
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;