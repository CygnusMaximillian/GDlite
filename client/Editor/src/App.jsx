import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import Register from "./pages/Register";
import { isAuthenticated } from "./utils/auth";

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

export default function App() {

  console.log("App rendered");
  return (
    
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/editor/:id"
          element={
            <PrivateRoute>
              <Editor />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/register" />} />
      </Routes>
    </BrowserRouter>
  );
}
