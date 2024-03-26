import {NextUIProvider} from "@nextui-org/react";
import { Chat } from "./pages/Chat";

function App() {
  return (
    <NextUIProvider>
        <Chat />
    </NextUIProvider>
  );
}

export default App;
