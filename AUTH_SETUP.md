# Authentication System Documentation

## Overview

MovieStack now includes a complete authentication system with:
- User registration and login
- JWT-based authentication with refresh token rotation
- Password validation and security
- Protected routes
- Custom React Context provider and hooks

## Features

### 1. User Registration
- Email as username (validated format)
- Password requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter OR 1 special character
- Automatic login after registration

### 2. User Login
- Email and password authentication
- Secure password hashing with bcrypt
- JWT access tokens (15 minutes expiry)
- Refresh tokens (7 days expiry) stored in httpOnly cookies

### 3. Token Management
- **Access Tokens**: Short-lived (15 min), used for API authentication
- **Refresh Tokens**: Long-lived (7 days), stored in httpOnly cookies
- **Token Rotation**: New refresh token issued on each refresh
- **Automatic Refresh**: Tokens auto-refresh every 14 minutes when user is active

### 4. Security Features
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens signed with HS256
- Refresh tokens stored in database for validation
- httpOnly cookies prevent XSS attacks
- Token rotation prevents replay attacks
- Expired/invalid tokens automatically cleaned up

## API Routes

### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "clxxxx",
    "email": "user@example.com"
  },
  "accessToken": "eyJhbGc..."
}
```

### POST `/api/auth/login`
Login existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clxxxx",
    "email": "user@example.com"
  },
  "accessToken": "eyJhbGc..."
}
```

### POST `/api/auth/refresh`
Refresh access token using refresh token cookie.

**Headers:**
- Cookie: `refreshToken=xxx` (automatic)

**Response (200):**
```json
{
  "user": {
    "id": "clxxxx",
    "email": "user@example.com"
  },
  "accessToken": "eyJhbGc..."
}
```

### POST `/api/auth/logout`
Logout user and invalidate refresh token.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### GET `/api/auth/me`
Get current user information.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "user": {
    "id": "clxxxx",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## React Hooks

### `useAuth()`
Access authentication state and methods.

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const {
    user,              // Current user object or null
    accessToken,       // Current access token or null
    isLoading,         // Loading state
    isAuthenticated,   // Boolean: is user logged in?
    login,             // Login function
    register,          // Register function
    logout,            // Logout function
    refreshAuth,       // Manual refresh function
  } = useAuth();

  // Use auth state...
}
```

### `useRequireAuth(redirectUrl?)`
Protect routes that require authentication.

```tsx
import { useRequireAuth } from "@/contexts/AuthContext";

function ProtectedPage() {
  const { isAuthenticated, isLoading } = useRequireAuth("/login");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <div>Protected content</div>;
}
```

## Usage Examples

### Protecting a Page

```tsx
"use client";
import { useRequireAuth } from "@/contexts/AuthContext";

export default function MyCollectionPage() {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Your collection...</div>;
}
```

### Login Form

```tsx
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields... */}
    </form>
  );
}
```

### Making Authenticated API Calls

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { accessToken } = useAuth();

  const fetchProtectedData = async () => {
    const response = await fetch("/api/protected-route", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.json();
  };

  // Use fetchProtectedData...
}
```

## Database Schema

### User Model
```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  refreshTokens RefreshToken[]
}
```

### RefreshToken Model
```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
}
```

## Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# TMDB API (existing)
TMDB_API_KEY=your_tmdb_api_key_here
```

## Security Best Practices

1. **Always use HTTPS in production** - Set `secure: true` in cookie options
2. **Change JWT secrets** - Use strong random secrets in production
3. **Environment variables** - Never commit secrets to git
4. **Token expiry** - Access tokens expire in 15 minutes
5. **Refresh rotation** - New refresh token on each refresh prevents reuse
6. **Password hashing** - bcrypt with 12 rounds
7. **httpOnly cookies** - Prevents JavaScript access to refresh tokens

## Development Setup

1. Install dependencies:
```bash
npm install bcryptjs jsonwebtoken jose @types/bcryptjs @types/jsonwebtoken prisma @prisma/client
```

2. Generate JWT secrets:
```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

3. Run Prisma migrations:
```bash
npx prisma migrate dev
```

4. Generate Prisma client:
```bash
npx prisma generate
```

## Testing Authentication

1. Register a new user at `/register`
2. Login at `/login`
3. Visit protected route `/my-collection`
4. Logout from header
5. Try accessing `/my-collection` (should redirect to login)

## Troubleshooting

### "No refresh token provided" error
- Check that cookies are enabled
- Ensure credentials: "include" in fetch calls
- Check cookie domain/path settings

### "Invalid or expired access token"
- Token expires after 15 minutes
- Should auto-refresh, check refresh token flow
- Manually call `refreshAuth()` if needed

### Password validation fails
- Check password meets requirements (8+ chars, 1 uppercase or special char)
- Error message will indicate specific issue

### Token refresh loop
- Check JWT secrets match in .env
- Verify refresh token exists in database
- Check token expiry dates

## Next Steps

Potential enhancements:
- Add email verification
- Implement "Forgot Password" flow
- Add OAuth providers (Google, GitHub, etc.)
- Rate limiting on auth endpoints
- Two-factor authentication (2FA)
- User profile management
- Role-based access control (RBAC)