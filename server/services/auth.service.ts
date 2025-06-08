import { Request, Response } from 'express';
import { auth as firebaseAuth } from '../firebase-admin';
import { storage } from '../storage';
import { config } from '../config';
import { AppError, AuthenticationError, ValidationError } from '../errors';
import { z } from 'zod';
import { User, InsertUser } from '../../shared/schema';

// Validation schemas
const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  firebaseUid: z.string().optional(),
});

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Handle Google authentication
   */
  async handleGoogleAuth(req: Request, res: Response) {
    try {
      // Validate request data
      const data = googleAuthSchema.parse(req.body);
      
      // Verify Firebase token
      const decodedToken = await firebaseAuth.verifyIdToken(data.idToken);
      
      // Extract user information
      const email = decodedToken.email || data.email;
      const displayName = decodedToken.name || data.displayName || '';
      const photoURL = decodedToken.picture || data.photoURL || '';
      const firebaseUid = decodedToken.uid || data.firebaseUid;
      
      if (!email) {
        throw new ValidationError('Email is required for authentication');
      }

      // Get or create user
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        const newUser: InsertUser = {
          email,
          firstName: displayName.split(' ')[0] || undefined,
          lastName: displayName.split(' ').slice(1).join(' ') || undefined,
          photoURL: photoURL || undefined,
          firebaseUid: firebaseUid || undefined,
          isGuest: false,
          password: '', // Required by schema but not used for Google auth
        };
        
        user = await storage.createUser(newUser);
      } else {
        // Update existing user
        await storage.updateUser(user.id, {
          firstName: displayName.split(' ')[0] || user.firstName || undefined,
          lastName: displayName.split(' ').slice(1).join(' ') || user.lastName || undefined,
          photoURL: photoURL || user.photoURL || undefined,
          firebaseUid: firebaseUid || user.firebaseUid || undefined,
        });
        await storage.updateUserLastLogin(user.id);
      }

      // Create session
      await this.createSession(req, user);

      // Return user data (excluding sensitive fields)
      const { password: _, ...userData } = user;
      return userData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid authentication data', error.errors);
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AuthenticationError('Authentication failed');
    }
  }

  /**
   * Create a new session for the user
   */
  private async createSession(req: Request, user: User) {
    return new Promise((resolve, reject) => {
      req.login(user, (err) => {
        if (err) {
          reject(new AuthenticationError('Failed to create session'));
          return;
        }
        resolve(true);
      });
    });
  }

  /**
   * Handle user logout
   */
  async handleLogout(req: Request, res: Response) {
    return new Promise((resolve, reject) => {
      req.logout((err) => {
        if (err) {
          reject(new AuthenticationError('Logout failed'));
          return;
        }
        resolve(true);
      });
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(req: Request): Promise<User> {
    if (!req.isAuthenticated()) {
      throw new AuthenticationError('Not authenticated');
    }
    return req.user as User;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(req: Request): boolean {
    return req.isAuthenticated();
  }

  /**
   * Middleware to require authentication
   */
  requireAuth(req: Request, res: Response, next: Function) {
    if (!this.isAuthenticated(req)) {
      throw new AuthenticationError('Authentication required');
    }
    next();
  }
} 