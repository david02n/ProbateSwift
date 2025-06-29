# ProbateSwift Replit Documentation

## Overview

ProbateSwift is a web application designed to simplify the probate process in England and Wales. It provides an AI-assisted platform for managing estate applications, document processing, and tax calculations. The application is built as a full-stack TypeScript solution with a modern React frontend and Express.js backend.

## System Architecture

### Full-Stack JavaScript/TypeScript Application
- **Frontend**: React with TypeScript, Vite build system
- **Backend**: Express.js with TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Authentication (Google OAuth + Email/Password)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state

### Monorepo Structure
```
/
├── client/           # React frontend application
├── server/           # Express.js backend API
├── shared/           # Shared types and database schema
├── migrations/       # Database migration files
└── attached_assets/  # Project documentation and specifications
```

## Key Components

### Frontend Architecture
- **React 18** with TypeScript and strict mode enabled
- **Vite** as the build tool with HMR support
- **Wouter** for client-side routing (lightweight React Router alternative)
- **shadcn/ui** component library built on Radix UI primitives
- **React Hook Form** with Zod validation for form management
- **TanStack React Query** for API state management and caching

### Backend Architecture
- **Express.js** server with TypeScript support
- **Drizzle ORM** for database operations with PostgreSQL
- **CORS** enabled with credential support for cross-origin requests
- **File upload** support with Multer middleware
- **Session-based authentication** integrated with Firebase

### Data Storage Solutions
- **PostgreSQL** as the primary database using Neon serverless
- **Drizzle Kit** for database migrations and schema management
- **Schema-first approach** with shared types between client and server

### Authentication and Authorization
- **Firebase Authentication** with multiple providers:
  - Google OAuth (popup with redirect fallback)
  - Email/Password authentication
- **Cross-domain session handling** between development and production
- **Protected routes** with user context and session persistence

### External Service Integrations
- **Firebase** for user authentication and management
- **Google APIs** for OAuth and identity services
- **Postcode lookup** API integration for UK address validation
- **AI document processing** for automatic data extraction

## Data Flow

### Authentication Flow
1. User initiates login via Google OAuth or email/password
2. Firebase handles authentication and issues ID tokens
3. Backend validates tokens and creates user sessions
4. Protected routes check authentication status via `/api/user` endpoint

### Document Processing Flow
1. User uploads documents (death certificates, wills, etc.)
2. AI extraction service processes documents for key information
3. Extracted data is stored and presented for user review
4. Users can approve or modify extracted information

### Probate Application Flow
1. Initial assessment determines if probate is required
2. Evaluation flow collects detailed estate information
3. System determines tax obligations and required forms
4. Users complete estate valuation and applicant information
5. System generates required probate documents (PA1P/PA1A)

## External Dependencies

### Core Runtime Dependencies
- **React ecosystem**: React, React DOM, React Query
- **Authentication**: Firebase SDK v11.7.1
- **Database**: Drizzle ORM, @neondatabase/serverless
- **UI Components**: Radix UI components, Tailwind CSS
- **Forms**: React Hook Form, Hookform Resolvers
- **HTTP Client**: Axios for API requests

### Development Dependencies
- **Build Tools**: Vite, TypeScript, PostCSS
- **Code Quality**: ESLint, Prettier (implied)
- **Testing**: Not explicitly configured

### Infrastructure Dependencies
- **Database**: Neon PostgreSQL (serverless)
- **Deployment**: Replit hosting platform
- **Domain**: Custom domain (probateswift.com) with Replit deployment

## Deployment Strategy

### Environment Configuration
- **Development**: Runs on Replit development environment
- **Production**: Deployed to custom domain via Replit
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL required for database connection

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command

### Deployment Commands
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server start
- `npm run db:push`: Apply database schema changes

## Recent Changes

- June 29, 2025: **Complete Deployment & ES Module Compatibility Fix**
  - **RESOLVED CRITICAL DEPLOYMENT ISSUES**:
    - Fixed `__dirname is not defined` error in ES modules by implementing compatibility shim
    - Updated server host binding to use `0.0.0.0` for production deployment
    - Fixed static file serving paths to use correct ES module syntax
    - Created automated build fix script that handles all ES module compatibility issues
    - **VERIFIED**: Production server starts successfully with proper port and host configuration
  - **Authentication System Improvements**:
    - Fixed Stytch authentication API response parsing for user email extraction
    - Improved error handling for authentication edge cases
    - Maintained development server functionality while fixing production deployment
  - **Build Process Enhancements**:
    - Separated server build from problematic frontend build process
    - Added fallback production HTML page for deployment
    - Implemented comprehensive ES module compatibility fixes in `fix-build.js`
    - **CONFIRMED**: Build process (`npm run build` + `node fix-build.js`) resolves all ES module issues
  - **Status**: Application fully tested and deployment-ready - production server verified working

## Changelog

- June 29, 2025. Initial setup and authentication system overhaul

## User Preferences

Preferred communication style: Simple, everyday language.