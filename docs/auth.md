# Authentication System Documentation

## Overview

This application uses Firebase Authentication with the official Firebase NPM SDK (v11.7.1) to provide secure, modern authentication flows. The system supports Google Sign-in and Email/Password authentication with intelligent fallback mechanisms.

## Architecture

### Components

1. **AuthEntry** (`src/components/auth/AuthEntry.tsx`)
   - Main orchestrator component that renders the appropriate authentication UI
   - Handles user state and browser capability detection
   - Integrates Google One Tap, Google Sign-in button, and Email forms

2. **GoogleSignInButton** (`src/components/auth/GoogleSignInButton.tsx`)
   - Handles Google authentication with popup/redirect fallback
   - Automatically falls back to redirect if popup is blocked
   - Includes comprehensive error handling

3. **GoogleOneTapLogin** (`src/components/auth/GoogleOneTapLogin.tsx`)
   - Integrates with Google Identity Services for One Tap sign-in
   - Only shows on supported browsers (Chrome desktop/mobile)
   - Provides seamless authentication experience

4. **EmailSignInForm** (`src/components/auth/EmailSignInForm.tsx`)
   - Handles email/password sign-in and sign-up
   - Uses React Hook Form with Zod validation
   - Includes comprehensive form validation and error handling

### Authentication Flow

1. **Google One Tap** (if supported)
   - Automatically prompts on supported browsers
   - Provides instant sign-in for returning users

2. **Google Sign-in Button**
   - Primary Google authentication method
   - Tries popup first, falls back to redirect if blocked
   - Forces account selection for better UX

3. **Email/Password Form**
   - Traditional email/password authentication
   - Supports both sign-in and sign-up
   - Includes comprehensive validation

### Error Handling

The system includes comprehensive error handling for:
- Popup blocking
- Network failures
- Invalid credentials
- Account conflicts
- Rate limiting
- Browser compatibility issues

## Setup Requirements

### Environment Variables

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Firebase Console Configuration

1. **Enable Authentication Providers**
   - Google Sign-in
   - Email/Password

2. **Configure OAuth Consent Screen**
   - Add authorized domains
   - Configure scopes (email, profile)

3. **Set up reCAPTCHA** (if using phone auth)

### Google Identity Services

Add the Google Identity Services script to `index.html`:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

## Usage

### Basic Implementation

```tsx
import { AuthEntry } from '@/components/auth/AuthEntry';

function App() {
  return (
    <div>
      <AuthEntry />
    </div>
  );
}
```

### Custom Callbacks

```tsx
<AuthEntry
  onSignInSuccess={(user) => {
    console.log('User signed in:', user);
  }}
  onSignInError={(error) => {
    console.error('Sign in failed:', error);
  }}
/>
```

### Individual Components

```tsx
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { EmailSignInForm } from '@/components/auth/EmailSignInForm';

// Use individual components for custom layouts
<GoogleSignInButton variant="outline" size="lg" />
<EmailSignInForm />
```

## Security Features

1. **Token Management**
   - Automatic ID token refresh
   - Secure token storage in localStorage
   - Backend session establishment

2. **Error Handling**
   - Comprehensive error mapping
   - User-friendly error messages
   - Graceful fallback mechanisms

3. **Browser Compatibility**
   - Automatic capability detection
   - Fallback for unsupported features
   - Mobile-optimized flows

## Testing

### Manual Testing Checklist

- [ ] Google One Tap on Chrome desktop
- [ ] Google One Tap on Chrome mobile
- [ ] Google popup sign-in
- [ ] Google redirect sign-in (with popup blocked)
- [ ] Email/password sign-in
- [ ] Email/password sign-up
- [ ] Error handling for invalid credentials
- [ ] Error handling for network failures
- [ ] Session persistence across page reloads
- [ ] Logout functionality

### Browser Testing

- Chrome (desktop & mobile)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Common Issues

1. **Popup Blocked**
   - System automatically falls back to redirect
   - User sees notification about redirect

2. **One Tap Not Showing**
   - Check browser compatibility
   - Verify Google Client ID configuration
   - Check for incognito mode

3. **Session Not Persisting**
   - Verify Firebase configuration
   - Check backend session endpoint
   - Review token storage

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'auth');
```

## Migration from FirebaseUI

This system replaces FirebaseUI with a custom implementation that:
- Uses only the official Firebase NPM SDK
- Provides better TypeScript support
- Offers more customization options
- Includes comprehensive error handling
- Supports modern authentication flows

## Future Enhancements

- Phone number authentication
- Multi-factor authentication
- Social login providers (Facebook, Twitter, etc.)
- Biometric authentication
- SSO integration 