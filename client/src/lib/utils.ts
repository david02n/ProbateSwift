import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fix for Vite HMR WebSocket connection in Replit environment
// This prevents "Failed to construct 'WebSocket': The URL 'wss://localhost:undefined/?token=...' is invalid" errors
if (typeof window !== 'undefined') {
  // @ts-ignore - Fix Vite WebSocket connection in Replit
  window.__vite_ws_port = parseInt(window.location.port || '80', 10);
}
