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
        
        // SKIP Session management for token-based auth in production
        // This solves the cross-domain issue where cookies/sessions don't work
        
        // We're now using pure token-based auth for production
        // Just attach the user to the request object and let routes use it
        
        // CRITICAL: Even if we can't set session properties, we still 
        // want to attach the authenticated user to the request
        
        // Set a property that routes can check for authentication
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