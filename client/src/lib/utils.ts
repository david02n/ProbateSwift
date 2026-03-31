import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fix invalid dev HMR websocket URLs in proxy-based environments.
if (typeof window !== 'undefined') {
  const originalWebSocket = window.WebSocket;
  
  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      if (typeof url === 'string' && url.includes('localhost:undefined')) {
        const correctedUrl = url.replace(
          'wss://localhost:undefined',
          `wss://${window.location.host}`
        ).replace(
          'ws://localhost:undefined', 
          `ws://${window.location.host}`
        );
        console.log('Fixed WebSocket URL:', correctedUrl);
        super(correctedUrl, protocols);
      } else {
        super(url, protocols);
      }
    }
  };
  
  // @ts-ignore
  window.__vite_ws_port = window.location.port ? parseInt(window.location.port, 10) : 443;
}
