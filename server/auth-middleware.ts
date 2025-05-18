import { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "./firebase-admin";
import { storage } from "./storage";

// Extend Express Request type with user property
declare global {
  namespace Express {
    interface Request {
      user?: any; // Will hold the authenticated user data
      firebaseUser?: any; // Will hold the decoded Firebase token
    }
  }
}

/**
 * Firebase authentication middleware
 * Verifies the Bearer token in the Authorization header
 * and attaches the user to the request object
 */
export async function firebaseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No valid authentication token provided'
      });
    }

    // Extract token
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format'
      });
    }

    try {
      // Verify Firebase token
      const decodedToken = await verifyIdToken(idToken);
      
      // Store the Firebase user info on the request
      req.firebaseUser = decodedToken;
      
      // Get the email from decoded token
      const email = decodedToken.email;
      if (!email) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token does not contain user email'
        });
      }
      
      // Look up user in database by email
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'User not found in database'
          });
        }
        
        // Attach user to request
        req.user = user;
        
        // Update last login time if necessary
        const now = new Date();
        const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
        if (!lastLogin || (now.getTime() - lastLogin.getTime() > 3600000)) {
          // Update last login time if it's been more than an hour
          await storage.updateUser(user.id, { lastLogin: now });
        }
        
        // Proceed to route handler
        next();
      } catch (dbError) {
        console.error('Database error in auth middleware:', dbError);
        return res.status(500).json({
          error: 'Server error',
          message: 'Error accessing user database'
        });
      }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Authentication process failed'
    });
  }
}