# Authentication System Documentation

## Overview

This authentication system provides a robust, production-ready authentication solution for ProbateSwift with support for both Google OAuth and email/password authentication. It's designed to work seamlessly across different environments including Replit development and production domains.

## Key Features

### 🔐 Multiple Authentication Methods
- **Google OAuth**: One-click sign-in with Google accounts
- **Email/Password**: Traditional email and password authentication
- **Sign-up**: New user registration with email verification

### 🌐 Cross-Domain Support
- **Replit Domains**: Automatic detection and configuration for `*.replit.dev` domains
- **Production Domains**: Support for custom production domains
- **Domain Mismatch Detection**: Real-time warnings for configuration issues

### 🛡️ Robust Error Handling
- **Popup-First, Redirect-Fallback**: Attempts popup authentication first, falls back to redirect if blocked
- **Comprehensive Error Messages**: User-friendly error messages for all common scenarios
- **Network Resilience**: Handles network failures and connection issues

### 📱 Mobile-Friendly
- **Responsive Design**: Works seamlessly on mobile devices
- **Touch-Optimized**: Large buttons and touch-friendly interface
- **Cross-Browser Support**: Compatible with all modern browsers

## Architecture

### Components

#### Core Pages
- **`/auth`** - Main sign-in page
- **`/signup`** - User registration page  
- **`/auth/callback`** - OAuth redirect handler

#### Key Components
- **`AuthPage`** - Main authentication interface
- **`SignupPage`** - User registration interface
- **`AuthCallback`** - Handles OAuth redirects
- **`EmailSignInForm`** - Email/password authentication
- **`AuthTest`** - Debug and testing component

#### Providers & Stores
- **`FirebaseProvider`** - Firebase initialization and configuration
- **`AuthStore`** - Authentication state management
- **`AuthProvider`** - Higher-level auth context

### Authentication Flow

1. **Initialization**
   - Firebase app initialization with environment-specific config
   - Domain detection and auth domain configuration
   - Auth state listener setup

2. **Sign-In Process**
   - User clicks Google sign-in or enters email/password
   - Popup authentication attempted first
   - Redirect fallback if popup fails
   - Token generation and storage
   - Backend session establishment

3. **Session Management**
   - Automatic token refresh
   - Cross-domain token injection
   - Persistent authentication state

## Configuration

### Environment Variables

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Domain Configuration

The system automatically detects the current domain and configures authentication accordingly:

- **Replit Domains**: Uses current domain as auth domain
- **Production Domains**: Uses configured auth domain
- **Domain Mismatch**: Shows warnings and handles gracefully

## Usage

### Basic Authentication

```tsx
import { useAuthStore } from '@/stores/auth-store';
import { useFirebase } from '@/providers/FirebaseProvider';

function MyComponent() {
  const { isAuthenticated, user } = useAuthStore();
  const { auth } = useFirebase();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {user?.firstName}!</div>;
}
```

### Protected Routes

```tsx
import { useAuth } from '@/hooks/use-auth';

function ProtectedComponent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <div>Protected content</div>;
}
```

### Testing Authentication

```tsx
import { AuthTest } from '@/components/auth/AuthTest';

function TestPage() {
  return (
    <div className="container mx-auto p-4">
      <AuthTest />
    </div>
  );
}
```

## Error Handling

### Common Error Codes

- **`auth/popup-closed-by-user`** - User cancelled authentication
- **`auth/popup-blocked`** - Popup was blocked by browser
- **`auth/internal-error`** - Domain configuration issue
- **`auth/network-request-failed`** - Network connectivity issue
- **`auth/account-exists-with-different-credential`** - Email already exists with different provider

### Error Recovery

The system automatically:
- Falls back from popup to redirect authentication
- Provides clear error messages to users
- Logs detailed error information for debugging
- Offers retry mechanisms

## Security Features

### Token Management
- Automatic token refresh
- Secure token storage
- Cross-domain token injection
- Token validation

### Domain Security
- Authorized domain validation
- Cross-origin request protection
- Secure cookie handling

### User Data Protection
- Minimal data collection
- Secure data transmission
- Privacy-compliant practices

## Development

### Testing

1. **Local Development**
   ```bash
   npm run dev
   ```

2. **Auth Testing**
   - Visit `/auth` for sign-in testing
   - Visit `/signup` for registration testing
   - Use `AuthTest` component for system status

3. **Domain Testing**
   - Test on Replit domains
   - Test on production domains
   - Verify domain mismatch handling

### Debugging

The system includes comprehensive logging:

```javascript
// Enable debug logging
console.log('[AuthPage] Starting Google sign-in process');
console.log('[AuthPage] Domain info:', domainInfo);
console.log('[AuthPage] Popup sign-in successful:', result);
```

### Common Issues

1. **Domain Mismatch**
   - Add current domain to Firebase Console > Authentication > Settings > Authorized domains
   - Update environment variables to match current domain

2. **Popup Blocked**
   - System automatically falls back to redirect
   - User can allow popups in browser settings

3. **Network Issues**
   - Check internet connectivity
   - Verify Firebase configuration
   - Check CORS settings

## Production Deployment

### Firebase Console Setup

1. **Authentication**
   - Enable Google sign-in provider
   - Enable email/password authentication
   - Configure authorized domains

2. **Security Rules**
   - Set up appropriate security rules
   - Configure CORS policies
   - Enable HTTPS only

3. **Environment Variables**
   - Set production environment variables
   - Configure domain-specific settings
   - Enable analytics (optional)

### Monitoring

- **Firebase Analytics**: Track authentication events
- **Error Logging**: Monitor authentication errors
- **Performance**: Monitor authentication performance

## Support

For issues or questions:

1. Check the debug information in the `AuthTest` component
2. Review browser console logs
3. Verify Firebase Console configuration
4. Test on different domains and browsers

## Changelog

### v1.0.0
- Initial implementation
- Google OAuth support
- Email/password authentication
- Cross-domain support
- Comprehensive error handling
- Mobile-friendly design 