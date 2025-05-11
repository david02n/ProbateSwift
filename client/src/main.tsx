import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./serviceWorkerRegistration";

// Register service worker for better performance and offline functionality
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
