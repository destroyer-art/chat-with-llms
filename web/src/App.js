import { NextUIProvider } from "@nextui-org/react";
import { Dashboard } from "./pages/Dashboard";
import { LoginPage } from "./pages/LoginPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedPage } from "./pages/ProtectedPage";
import { DashboardV2 } from "./pages/DashboardV2";

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
          <Route path="/chatv2" 
          element={
            <ProtectedPage>
                <DashboardV2 />
              </ProtectedPage>
          } />
          <Route path="/chatv2/:chatIdParams" 
          element={
            <ProtectedPage>
                <DashboardV2 />
              </ProtectedPage>
          } />
        </Routes>
      </Router>
    </NextUIProvider>
  );
}

export default App;