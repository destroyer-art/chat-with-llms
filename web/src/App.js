import { NextUIProvider } from "@nextui-org/react";
import { Chat } from "./pages/Chat";
import { LoginPage } from "./pages/LoginPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <NextUIProvider>
    <Router>
      <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
    </NextUIProvider>
  );
}

export default App;
