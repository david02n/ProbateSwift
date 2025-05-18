import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../firebase-admin';
import { storage } from '../storage';
import { SessionData } from 'express-session';

// Extend the Session interface to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    isLoggedIn?: boolean;
    firebaseUid?: string;
  }
}

// Add user property to Express Request
declare global {
  namespace Express {
    interface Request {
      firebaseUser?: {
        email: string;
        uid: string;
        verified: boolean;
      };
    }
  }
}

/**
 * Firebase Authentication Middleware
 * 
 * This middleware handles both token-based authentication (via Bearer token)
 * and traditional session-based authentication for backward compatibility.
 */
export function createFirebaseAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // STEP 1: First check if session is already authenticated (backward compatibility)
    if (req.session?.isLoggedIn && req.session?.userId) {
      try {
        // Use the storage interface to find user
        const user = await storage.getUser(req.session.userId);
        if (user) {
          // User found in session - attach to request and continue
          req.user = user;
          return next();
        }
      } catch (error) {
        console.error('Session authentication error:', error);
        // Clear invalid session
        req.session.isLoggedIn = false;
        req.session.userId = undefined;
        // Continue to token auth
      }
    }

    // STEP 2: Check for Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without authentication
      return next();
    }

    // STEP 3: Process the Firebase token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Firebase auth: Processing bearer token');
    
    try {
      // Verify the token with Firebase
      const decodedToken = await verifyIdToken(token);
      
      // Extract key user information
      const email = decodedToken.email;
      const uid = decodedToken.uid || decodedToken.sub;
      
      if (!email) {
        console.warn('Firebase token missing email claim');
        return next();
      }
      
      // STEP 4: Find or create the user
      try {
        // Look up existing user by email
        let user = await storage.getUserByEmail(email);
        
        // Store Firebase identity on request
        req.firebaseUser = {
          email,
          uid: uid as string,
          verified: true
        };
        
        if (!user) {
          // Auto-create user for smooth authentication experience
          const name = decodedToken.name || '';
          const nameParts = name ? name.split(' ') : [email.split('@')[0], ''];
          
          // Create new user in database
          user = await storage.createUser({
            email,
            password: '', // No password for Firebase auth users
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            firebaseUid: uid as string,
            isGuest: false
          });
          
          console.log('Firebase auth: Created new user from token:', email);
        } else if (!user.firebaseUid && uid) {
          // Update existing user with Firebase UID if missing
          await storage.updateUser(user.id, { 
            firebaseUid: uid as string 
          });
          console.log('Firebase auth: Updated user with Firebase UID');
        }
        
        // STEP 5: Session compatibility - maintain for backward compatibility
        // Check if session exists before trying to set properties
        if (req.session) {
          req.session.userId = user.id;
          req.session.isLoggedIn = true;
          req.session.firebaseUid = uid as string;
        } else {
          console.log('Firebase auth: Session object not available for token auth');
        }
        
        // Attach user to request for route handlers
        req.user = user;
        
        console.log('Firebase auth: Successfully authenticated user:', email);
      } catch (error) {
        console.error('Error processing Firebase user:', error);
      }
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      // Continue without authentication rather than blocking the request
    }
    
    // Continue to next middleware or route handler
    next();
  };
}