// All firebase logic removed. Use Stytch for authentication.

export interface User {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}


  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // First try popup
      try {
        const result = await signInWithPopup(auth, provider);
        return this.createUserFromCredential(result);
      } catch (popupError: any) {
        // If popup is blocked or closed, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          await signInWithRedirect(auth, provider);
          // The page will redirect, so we don't need to return anything here
          throw new Error('Redirect initiated');
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return this.createUserFromCredential(result);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      
      return this.createUserFromCredential(result);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      // Clear any stored tokens
      localStorage.removeItem('firebase_id_token');
      sessionStorage.removeItem('firebase_id_token');
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  private createUserFromCredential(credential: UserCredential): User {
    const { user } = credential;
    return {
      email: user.email || '',
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
    };
  }

  private handleAuthError(error: any): Error {
    let message = 'Authentication failed.';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'An account with this email address already exists.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/operation-not-allowed':
        message = 'This sign-in method is not enabled for this app.';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak. Please choose a stronger password.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        message = 'Invalid password.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed sign-in attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;
      case 'auth/account-exists-with-different-credential':
        message = 'An account already exists with the same email address but different sign-in credentials.';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid sign-in credentials.';
        break;
      case 'auth/popup-blocked':
        message = 'Popup was blocked by your browser. Please allow popups for this site.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in was cancelled. Please try again.';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Sign-in was cancelled. Please try again.';
        break;
      default:
        message = error.message || 'Authentication failed.';
    }

    return new Error(message);
  }
}

export const authService = AuthService.getInstance(); 