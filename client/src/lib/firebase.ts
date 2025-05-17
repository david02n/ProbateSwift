import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration with your provided values
const firebaseConfig = {
  apiKey: "AIzaSyCWeCvuiXsoQCdn_E4yRDh2QT4j4-fQBo0",
  authDomain: "probate-458709.firebaseapp.com",
  projectId: "probate-458709",
  storageBucket: "probate-458709.firebasestorage.app",
  messagingSenderId: "321971954611",
  appId: "1:321971954611:web:580f68844b10e7e6e6e1c6",
  measurementId: "G-1YW4Q67L65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;

// Only initialize analytics in browser environment
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn('Analytics initialization error:', e);
  }
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider with optimal parameters
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;