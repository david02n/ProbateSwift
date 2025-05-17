import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Call this function when the user clicks on the "Login with Google" button
export function loginWithGoogle() {
  signInWithRedirect(auth, googleProvider);
}

// Call this function on page load when the user is redirected back to your site
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // This gives you a Google Access Token. You can use it to access Google APIs.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // The signed-in user info.
      const user = result.user;
      
      // Return user info for authentication with backend
      return {
        user,
        token,
        success: true
      };
    }
    return { success: false };
  } catch (error: any) {
    // Handle Errors here.
    console.error("Firebase auth error:", error);
    const errorCode = error.code;
    const errorMessage = error.message;
    
    // The email of the user's account used.
    const email = error.customData?.email;
    
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    
    return {
      success: false,
      errorCode,
      errorMessage,
      email,
      credential
    };
  }
}