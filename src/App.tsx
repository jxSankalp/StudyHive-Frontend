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
import { WorkspaceLayout } from "./components/layout/WorkspaceLayout";

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

      {/* Protected Routes wrapped in WorkspaceLayout */}
      <Route
        path="/home"
        element={isAuthenticated ? <WorkspaceLayout><Home /></WorkspaceLayout> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <WorkspaceLayout><Profile /></WorkspaceLayout> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/chat/:id"
        element={isAuthenticated ? <Chat /> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/meeting/:callId"
        element={isAuthenticated ? <MeetingPage /> : <Navigate to="/sign-in" />}
      />

      {/* Additional mock routes for sidebar navigation */}
      <Route
        path="/chats"
        element={isAuthenticated ? <WorkspaceLayout><div className="p-8"><h1 className="text-2xl font-bold">All Chats</h1></div></WorkspaceLayout> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/notes"
        element={isAuthenticated ? <WorkspaceLayout><div className="p-8"><h1 className="text-2xl font-bold">Notes</h1></div></WorkspaceLayout> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/whiteboards"
        element={isAuthenticated ? <WorkspaceLayout><div className="p-8"><h1 className="text-2xl font-bold">Whiteboards</h1></div></WorkspaceLayout> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/meetings"
        element={isAuthenticated ? <WorkspaceLayout><div className="p-8"><h1 className="text-2xl font-bold">Meetings</h1></div></WorkspaceLayout> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/calendar"
        element={isAuthenticated ? <WorkspaceLayout><div className="p-8"><h1 className="text-2xl font-bold">Calendar</h1></div></WorkspaceLayout> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/files"
        element={isAuthenticated ? <WorkspaceLayout><div className="p-8"><h1 className="text-2xl font-bold">Files</h1></div></WorkspaceLayout> : <Navigate to="/sign-in" />}
      />
      <Route
        path="/settings"
        element={isAuthenticated ? <WorkspaceLayout><div className="p-8"><h1 className="text-2xl font-bold">Settings</h1></div></WorkspaceLayout> : <Navigate to="/sign-in" />}
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;