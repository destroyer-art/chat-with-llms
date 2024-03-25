import {NextUIProvider} from "@nextui-org/react";
import "./output.css";
import { Chat } from "./pages/Chat";

function App() {
  return (
    <NextUIProvider>
        <Chat />
    </NextUIProvider>
  );
}

export default App;
