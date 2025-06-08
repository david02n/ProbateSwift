# Firebase Configuration Documentation

This document records the Firebase authorized domains and environment variables (secrets) stored in Replit for the ProbateSwift project.

## 🔐 Firebase Authorized Domains

### Current Authorized Domains (as of latest update)

| Domain | Type | Purpose |
|--------|------|---------|
| `localhost` | Default | Local development |
| `probate-458709.firebaseapp.com` | Default | Firebase hosting |
| `probate-458709.web.app` | Default | Firebase hosting (alternative) |
| `probateswift.com` | Custom | Production domain |
| `www.probateswift.com` | Custom | Production domain (www) |
| `5bca2899-fa21-4c31-ae3b-96f6f1fd49b8-5000.us-east-1.csb.app` | Custom | CodeSandbox development |
| `workspace.5bca2899-fa21-4c31-ae3b-96f6f1fd49b8.us-east-1.csb.app` | Custom | CodeSandbox workspace |
| `5bca2899-fa21-4c31-ae3b-96f6f1fd49b8-00-1ga9cnt9wumxw.kirk.replit.dev` | Custom | Replit development |
| `probateswift.replit.app` | Custom | Replit custom domain |

### Domain Management

- **Default domains** are automatically provided by Firebase
- **Custom domains** must be manually added in Firebase Console
- **Replit domains** are dynamically generated and need to be added when they change
- **Production domains** (`probateswift.com`, `www.probateswift.com`) are the main application domains

## 🔑 Environment Variables (Replit Secrets)

### Firebase Configuration

| Variable Name | Purpose | Required |
|---------------|---------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key for client-side authentication | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project identifier | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | ✅ |
| `VITE_FIREBASE_APP_ID` | Firebase application ID | ✅ |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase analytics measurement ID | ✅ |

### Firebase Admin (Server-side)

| Variable Name | Purpose | Required |
|---------------|---------|----------|
| `FIREBASE_CLIENT_EMAIL` | Firebase admin service account email | ✅ |
| `FIREBASE_PRIVATE_KEY` | Firebase admin service account private key | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase project identifier (server-side) | ✅ |

### Database Configuration

| Variable Name | Purpose | Required |
|---------------|---------|----------|
| `DATABASE_URL` | Primary database connection string | ✅ |
| `PGDATABASE` | PostgreSQL database name | ✅ |
| `PGHOST` | PostgreSQL host address | ✅ |
| `PGPORT` | PostgreSQL port number | ✅ |
| `PGUSER` | PostgreSQL username | ✅ |
| `PGPASSWORD` | PostgreSQL password | ✅ |

### Application Configuration

| Variable Name | Purpose | Required |
|---------------|---------|----------|
| `SESSION_SECRET` | Session encryption secret | ✅ |
| `COOKIE_SECRET` | Cookie encryption secret | ✅ |
| `NODE_ENV` | Application environment (development/production) | ✅ |
| `ALLOWED_ORIGINS` | CORS allowed origins | ✅ |

### External Services

| Variable Name | Purpose | Required |
|---------------|---------|----------|
| `GET_ADDRESS_API_KEY` | GetAddress.io API key for address validation | ✅ |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID | ❌ |

## 🔧 Configuration Management

### Adding New Domains

When adding new development domains (e.g., new Replit instances):

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `probate-458709`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Enter the new domain
6. Save changes

### Environment Variable Updates

When updating environment variables in Replit:

1. Go to Replit project settings
2. Navigate to **Secrets** tab
3. Add or update the required variables
4. Restart the application to apply changes

### Dynamic Domain Resolution

The application includes automatic domain resolution for Replit domains:

- **Replit domains** automatically use the current domain as `authDomain`
- **Production domains** use the configured `VITE_FIREBASE_AUTH_DOMAIN`
- This prevents `auth/internal-error` issues on development domains

## 🚨 Security Notes

- **Never commit** actual secret values to version control
- **Rotate secrets** regularly, especially after team member changes
- **Use different secrets** for development and production environments
- **Monitor** Firebase Console for unauthorized access attempts
- **Review** authorized domains regularly and remove unused ones

## 📝 Maintenance Checklist

### Monthly Tasks
- [ ] Review and clean up unused authorized domains
- [ ] Verify all environment variables are still required
- [ ] Check Firebase Console for any security alerts
- [ ] Update this documentation with any changes

### When Adding New Features
- [ ] Add new environment variables to this documentation
- [ ] Update authorized domains if new domains are needed
- [ ] Test authentication on all supported domains
- [ ] Update deployment scripts if necessary

## 🔍 Troubleshooting

### Common Issues

1. **`auth/internal-error`**: Usually caused by domain mismatch
   - Check if current domain is in authorized domains list
   - Verify `VITE_FIREBASE_AUTH_DOMAIN` matches current domain

2. **Missing environment variables**: Check Replit secrets
   - Ensure all required variables are set
   - Restart application after adding new secrets

3. **Database connection issues**: Verify database credentials
   - Check `DATABASE_URL` and individual PostgreSQL variables
   - Ensure database is accessible from Replit

### Debug Tools

- Use the `FirebaseTest` component to verify configuration
- Check browser console for detailed error messages
- Review Firebase Console logs for authentication issues

---

**Last Updated**: [Current Date]
**Maintained By**: Development Team
**Project**: ProbateSwift 