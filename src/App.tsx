// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import  SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import MeetingPage from "./pages/Meeting";

function App() {
  const { isSignedIn } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={isSignedIn ? <Home /> : <Navigate to="/sign-in" />}
      />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/chat/:id" element={<Chat />} />
      {/* Optional: fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/meeting/:callId" element={<MeetingPage />} />
    </Routes>
  );
}

export default App;
