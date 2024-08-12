import { NextUIProvider } from "@nextui-org/react";
import React, { useEffect } from "react";
import { LoginPage } from "./pages/LoginPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedPage } from "./pages/ProtectedPage";
import { DashboardV2 } from "./pages/DashboardV2";
import TermsAndConditions from "./components/TermsAndConditions";
import PrivacyPolicy from "./components/PrivacyPolicy";



function App() {
  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    loadScript("https://checkout.razorpay.com/v1/checkout.js");
  });


  return (
    <NextUIProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <LoginPage />
          } />
          {/* <Route
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
          } /> */}
          <Route path="/terms-and-conditions" element={
            <TermsAndConditions />
          } />
          <Route path="/privacy" element={
            <PrivacyPolicy />
          } />
          <Route path="/chat" 
          element={
            <ProtectedPage>
                <DashboardV2 />
              </ProtectedPage>
          } />
          <Route path="/chat/:chatIdParams" 
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