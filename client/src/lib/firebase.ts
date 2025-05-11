import { initializeApp } from 'firebase/app';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const FirebaseApp = initializeApp(firebaseConfig);

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY', 
    'VITE_FIREBASE_PROJECT_ID', 
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Firebase initialization failed: Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
};

// Log validation result
const isConfigValid = validateFirebaseConfig();

if (!isConfigValid) {
  console.error('Firebase is not properly configured. Google authentication may not work.');
}

export default FirebaseApp;