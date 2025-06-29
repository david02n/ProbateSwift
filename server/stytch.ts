import * as stytch from 'stytch';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

if (!process.env.STYTCH_PROJECT_ID || !process.env.STYTCH_SECRET) {
  throw new Error('STYTCH_PROJECT_ID and STYTCH_SECRET must be set');
}

// Initialize Stytch client
export const stytchClient = new stytch.Client({
  project_id: process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
  env: process.env.NODE_ENV === 'production' ? stytch.envs.live : stytch.envs.test,
});

// Middleware to verify Stytch session
export const verifyStytchSession: RequestHandler = async (req, res, next) => {
  try {
    const sessionToken = (req.session as any)?.stytchSessionToken;
    
    if (!sessionToken) {
      console.log('No session token found in request');
      return res.status(401).json({ message: 'No session token' });
    }

    console.log('Verifying session token with Stytch...');
    // Verify the session with Stytch
    const authResult = await stytchClient.sessions.authenticate({
      session_token: sessionToken,
    });

    if (authResult.status_code !== 200) {
      console.log('Invalid session from Stytch:', authResult.status_code);
      return res.status(401).json({ message: 'Invalid session' });
    }

    // Get user from our database
    const user = await storage.getUser(authResult.session.user_id);
    
    if (!user) {
      console.log('User not found in database:', authResult.session.user_id);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User authenticated successfully:', user.id);
    // Store user info in request for use in routes
    (req as any).user = user;

    next();
  } catch (error) {
    console.error('Stytch session verification error:', error);
    res.status(401).json({ message: 'Session verification failed' });
  }
};

// Setup Stytch authentication routes
export function setupStytchAuth(app: Express) {
  // Magic link authentication endpoint
  app.post('/api/auth/magic-link', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' });
      }

      const result = await stytchClient.magicLinks.email.loginOrCreate({
        email,
        login_magic_link_url: `${req.protocol}://${req.get('host')}/auth/callback`,
        signup_magic_link_url: `${req.protocol}://${req.get('host')}/auth/callback`,
      });

      if (result.status_code === 200) {
        res.json({ message: 'Magic link sent successfully' });
      } else {
        res.status(400).json({ message: 'Failed to send magic link' });
      }
    } catch (error) {
      console.error('Magic link error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Send magic link endpoint
  app.post('/api/auth/send-magic-link', async (req, res) => {
    try {
      const { email, loginRedirectURL, signupRedirectURL } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Send magic link via Stytch
      const result = await stytchClient.magicLinks.email.loginOrCreate({
        email,
        login_magic_link_url: loginRedirectURL || `${req.protocol}://${req.get('host')}/auth/callback`,
        signup_magic_link_url: signupRedirectURL || `${req.protocol}://${req.get('host')}/auth/callback`,
      });

      if (result.status_code === 200) {
        res.json({ success: true, message: 'Magic link sent successfully' });
      } else {
        res.status(400).json({ message: 'Failed to send magic link' });
      }
    } catch (error) {
      console.error('Magic link error:', error);
      res.status(500).json({ message: 'Failed to send magic link' });
    }
  });

  // Password signup endpoint
  app.post('/api/auth/password-signup', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      // Create user in Stytch
      const result = await stytchClient.passwords.create({
        email,
        password,
        session_duration_minutes: 60 * 24 * 30, // 30 days
      });
      if (result.status_code === 200 && result.session_token) {
        // Upsert user in local DB
        await storage.upsertUser({
          id: result.user_id,
          email: result.email,
          firstName: result.user?.name?.first_name || null,
          lastName: result.user?.name?.last_name || null,
          profileImageUrl: null,
        });
        // Set session token in Express session
        (req.session as any).stytchSessionToken = result.session_token;
        res.json({ success: true, user_id: result.user_id });
      } else {
        res.status(400).json({ message: 'Failed to sign up with password' });
      }
    } catch (error: any) {
      console.error('Stytch password signup error:', error);
      const msg = error?.error_message || error?.message || 'Internal server error';
      res.status(500).json({ message: msg });
    }
  });

  // Password login endpoint
  app.post('/api/auth/password-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      // Authenticate user with Stytch
      const result = await stytchClient.passwords.authenticate({
        email,
        password,
        session_duration_minutes: 60 * 24 * 30, // 30 days
      });
      if (result.status_code === 200 && result.session_token) {
        // Upsert user in local DB
        await storage.upsertUser({
          id: result.user_id,
          email: result.email,
          firstName: result.user?.name?.first_name || null,
          lastName: result.user?.name?.last_name || null,
          profileImageUrl: null,
        });
        // Set session token in Express session
        (req.session as any).stytchSessionToken = result.session_token;
        res.json({ success: true, user_id: result.user_id });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (error: any) {
      console.error('Stytch password login error:', error);
      const msg = error?.error_message || error?.message || 'Internal server error';
      res.status(401).json({ message: msg });
    }
  });

  // Google OAuth initiation endpoint
  app.get('/api/auth/google', async (req, res) => {
    try {
      const redirectUrl = `${req.protocol}://${req.get('host')}/api/auth/callback`;
      console.log('Starting Google OAuth with redirect URL:', redirectUrl);
      
      // For development, redirect to magic link flow since OAuth needs proper Stytch configuration
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: redirecting to auth page with Google provider hint');
        return res.redirect('/auth?provider=google&message=google_oauth_unavailable');
      }
      
      // Production OAuth flow (requires proper Stytch OAuth configuration)
      const result = await stytchClient.oauth.start({
        oauth_provider: 'google' as any,
        login_redirect_url: redirectUrl,
        signup_redirect_url: redirectUrl,
      });

      console.log('Stytch OAuth result:', result.status_code, result);

      if (result.status_code === 200) {
        console.log('Redirecting to Google OAuth URL:', (result as any).oauth_url);
        res.redirect((result as any).oauth_url);
      } else {
        console.error('Failed to start Google OAuth:', result);
        res.redirect('/auth?error=oauth_start_failed');
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.redirect('/auth?error=oauth_error');
    }
  });

  // Authentication callback endpoint (handles both magic links and OAuth)
  app.get('/api/auth/callback', async (req, res) => {
    try {
      const { token, stytch_token_type } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.redirect('/auth?error=invalid_token');
      }

      let result;
      
      // Handle different authentication types
      if (stytch_token_type === 'oauth') {
        result = await stytchClient.oauth.authenticate({
          token,
        });
      } else {
        // Default to magic link authentication
        result = await stytchClient.magicLinks.authenticate({
          token,
        });
      }

      if (result.status_code === 200) {
        // Store session token
        (req.session as any).stytchSessionToken = result.session_token;
        
        // Upsert user in our database
        await storage.upsertUser({
          id: result.user.user_id,
          email: result.user.emails?.[0]?.email || null,
          firstName: result.user.name?.first_name || null,
          lastName: result.user.name?.last_name || null,
          profileImageUrl: null,
        });

        res.redirect('/?auth_success=true');
      } else {
        res.redirect('/auth?error=authentication_failed');
      }
    } catch (error) {
      console.error('Authentication callback error:', error);
      res.redirect('/auth?error=server_error');
    }
  });

  // Get current user endpoint - with development bypass
  app.get('/api/auth/user', async (req, res) => {
    try {
      // Development bypass - create a test user if no authentication
      if (process.env.NODE_ENV === 'development') {
        const testUser = {
          id: 'dev-user-123',
          email: 'dev@example.com',
          firstName: 'Development',
          lastName: 'User',
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Try to upsert the test user to ensure it exists in database
        try {
          await storage.upsertUser(testUser);
        } catch (error) {
          console.log('Note: Could not create test user in database, using in-memory user');
        }
        
        return res.json(testUser);
      }

      // Production authentication flow
      const sessionToken = (req.session as any)?.stytchSessionToken;
      
      if (!sessionToken) {
        console.log('No session token found in request');
        return res.status(401).json({ message: 'No session token' });
      }

      const authResult = await stytchClient.sessions.authenticate({
        session_token: sessionToken,
      });

      if (authResult.status_code !== 200) {
        console.log('Invalid session from Stytch:', authResult.status_code);
        return res.status(401).json({ message: 'Invalid session' });
      }

      const user = await storage.getUser(authResult.session.user_id);
      
      if (!user) {
        console.log('User not found in database:', authResult.session.user_id);
        return res.status(401).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', verifyStytchSession, async (req, res) => {
    try {
      const sessionToken = (req.session as any)?.stytchSessionToken;
      
      if (sessionToken) {
        // Revoke the session in Stytch
        await stytchClient.sessions.revoke({
          session_token: sessionToken,
        });
      }

      // Clear session
      req.session.destroy(() => {
        res.json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

// Type extensions for Express
declare module 'express-session' {
  interface SessionData {
    stytchSessionToken?: string;
  }
}