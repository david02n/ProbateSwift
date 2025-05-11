import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult 
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { apiRequest } from "./queryClient";

// Function to handle sign in with Google via popup
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Get Google access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    // Send the user info to our backend
    await handleFirebaseUser(user);
    
    return { user, token };
  } catch (error: any) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error(`Error signing in with Google: ${errorCode} - ${errorMessage}`);
    throw error;
  }
};

// Alternative: Sign in with redirect (better for mobile)
export const signInWithGoogleRedirect = () => {
  signInWithRedirect(auth, googleProvider);
};

// Handle redirect result - call this function when the app loads
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      await handleFirebaseUser(user);
      return user;
    }
    return null;
  } catch (error: any) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
};

// Helper function to send Firebase user to our backend
const handleFirebaseUser = async (firebaseUser: any) => {
  if (!firebaseUser) return;
  
  try {
    // Extract relevant user information
    const userData = {
      email: firebaseUser.email,
      firstName: firebaseUser.displayName?.split(' ')[0] || null,
      lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || null,
      firebaseUid: firebaseUser.uid,
      photoURL: firebaseUser.photoURL
    };
    
    // Send to our backend to create/update the user and establish session
    const response = await apiRequest('POST', '/api/auth/google', userData);
    return await response.json();
  } catch (error) {
    console.error("Error sending Firebase user to backend:", error);
    throw error;
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    await auth.signOut();
    // Also sign out from our backend
    await apiRequest('POST', '/api/logout');
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};