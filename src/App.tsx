// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { FileText, Monitor, Video, Calendar, Folder, Settings } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import MeetingPage from "./pages/Meeting";
import LandingPage from "./pages/LandingPage";
import GroupListPage from "./pages/GroupListPage";
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

      {/* Sidebar nav stub routes */}
      <Route
        path="/chats"
        element={<Navigate to="/home" replace />}
      />
      <Route
        path="/notes"
        element={isAuthenticated
          ? <WorkspaceLayout><GroupListPage tab="notes" icon={FileText} label="Notes" description="Select a workspace to view and edit its notes." /></WorkspaceLayout>
          : <Navigate to="/sign-in" />}
      />
      <Route
        path="/whiteboards"
        element={isAuthenticated
          ? <WorkspaceLayout><GroupListPage tab="whiteboards" icon={Monitor} label="Whiteboards" description="Select a workspace to open its whiteboards." /></WorkspaceLayout>
          : <Navigate to="/sign-in" />}
      />
      <Route
        path="/meetings"
        element={isAuthenticated
          ? <WorkspaceLayout><GroupListPage tab="meetings" icon={Video} label="Meetings" description="Select a workspace to view and schedule meetings." /></WorkspaceLayout>
          : <Navigate to="/sign-in" />}
      />
      <Route
        path="/calendar"
        element={isAuthenticated
          ? <WorkspaceLayout><div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground"><Calendar className="w-10 h-10 opacity-20" /><p className="text-sm">Calendar coming soon</p></div></WorkspaceLayout>
          : <Navigate to="/sign-in" />}
      />
      <Route
        path="/files"
        element={isAuthenticated
          ? <WorkspaceLayout><div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground"><Folder className="w-10 h-10 opacity-20" /><p className="text-sm">Files coming soon</p></div></WorkspaceLayout>
          : <Navigate to="/sign-in" />}
      />
      <Route
        path="/settings"
        element={isAuthenticated
          ? <WorkspaceLayout><div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground"><Settings className="w-10 h-10 opacity-20" /><p className="text-sm">Settings coming soon</p></div></WorkspaceLayout>
          : <Navigate to="/sign-in" />}
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;