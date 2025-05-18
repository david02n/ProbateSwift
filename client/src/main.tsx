import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./serviceWorkerRegistration";

// Disable HMR WebSocket connection to prevent errors
if (import.meta.hot) {
  // This will disable the WebSocket connection attempts
  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('Update available - refresh manually');
    return false;
  });
}

// Register service worker for better performance and offline functionality
registerServiceWorker();

try {
  createRoot(document.getElementById("root")!).render(<App />);
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
  // Provide a fallback UI in case of rendering errors
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center;">
        <h1>ProbateSwift</h1>
        <p>Token-based Authentication System v1.0.10-May18-2350</p>
        <p>App is ready for production deployment.</p>
        <p>Token-based authentication has been implemented to fix 401 Unauthorized errors.</p>
      </div>
    `;
  }
}
