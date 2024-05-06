import { NextUIProvider } from "@nextui-org/react";
import { Dashboard } from "./pages/Dashboard";
import { LoginPage } from "./pages/LoginPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedPage } from "./pages/ProtectedPage";

function App() {
  return (
    <NextUIProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <LoginPage />
          } />
          <Route
            path="/chat"
            element={
              <ProtectedPage>
                <Dashboard />
              </ProtectedPage>
            }
          />
          <Route path="/chat/:chatId" 
          element={
            <ProtectedPage>
                <Dashboard />
              </ProtectedPage>
          } />
        </Routes>
      </Router>
    </NextUIProvider>
  );
}

export default App;