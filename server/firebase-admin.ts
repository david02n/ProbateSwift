import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for server-side token verification
const app = admin.initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

export const auth = admin.auth();

// Utility function to verify a Firebase ID token
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('Successfully verified Firebase token');
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    
    // For development, return a partial object with email to allow testing
    // This should be removed in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using development fallback for Firebase token verification');
      // Parse the token to extract email (assuming it's a JWT)
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          return payload;
        }
      } catch (parseError) {
        console.error('Error parsing token in development mode:', parseError);
      }
    }
    
    throw error;
  }
}