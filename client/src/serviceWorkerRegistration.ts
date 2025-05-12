// This function registers a service worker to improve performance and enable offline functionality
export function registerServiceWorker() {
  // Log current domain and full URL for debugging
  console.log('Current domain:', window.location.hostname);
  console.log('Full host:', window.location.host);
  console.log('Full URL:', window.location.href);
  
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Only register the service worker in production to avoid development issues
  if ('serviceWorker' in navigator) {
    // In production mode or on mobile
    if (import.meta.env.MODE === 'production' || isMobile) {
      // For mobile, register service worker immediately to improve performance
      if (isMobile) {
        console.log('Mobile browser detected, registering service worker immediately');
        
        // On mobile, use a more specific scope to avoid path issues
        const scope = '/';
        navigator.serviceWorker.register('/sw.js', { scope })
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            
            // Force service worker update for mobile browsers
            registration.update();
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      } else {
        // For desktop, wait until load event
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
              console.error('Service Worker registration failed:', error);
            });
        });
      }
    } else if (import.meta.env.MODE === 'development') {
      // Only in development mode, unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('Service Worker unregistered for development');
        }
      });
    }
  } else {
    console.log('Service Worker not supported in this browser');
  }
}