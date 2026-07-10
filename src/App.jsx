import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import socket from "./socket";
import ProtectedRoute
from "./components/ProtectedRoute";

import LoginAndRegister from "./pages/LoginAndRegister";
import Dashboard from "./pages/Dashboard";
import AlbumPage from "./pages/AlbumPage";

function App() {
  useEffect(() => {

    socket.on("connect", () => {
        console.log("Connected:", socket.id);
        socket.emit("registerUser", {
            userId: JSON.parse(localStorage.getItem("user"))?.id
        });
    });

    return () => {
        socket.off("connect");
    };

}, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<LoginAndRegister />}
        />

        <Route
          path="/dashboard"
          element={<ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>}
        />
        <Route
          path="/album/:albumId"
          element={<ProtectedRoute>
            <AlbumPage />
        </ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;