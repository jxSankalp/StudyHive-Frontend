// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import  SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import { useAuth } from "@clerk/clerk-react";

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
      {/* Optional: fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
