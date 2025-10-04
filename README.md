# MovieStack 🎬

A modern movie discovery and collection management app built with Next.js, featuring authentication, instant search, and integration with The Movie Database (TMDB).

## Features

- 🔐 **Full Authentication System**
  - User registration and login with JWT tokens
  - Refresh token rotation for security
  - Password validation (8+ chars, 1 uppercase or special character)
  - Protected routes

- 🎬 **Movie Discovery**
  - Browse popular and top-rated movies with carousels
  - Instant search with real-time results
  - Server-side rendering for SEO
  - Beautiful poster grid layout with consistent sizing
  - Save movies directly from home page carousels

- 📚 **Personal Collection**
  - Save movies from anywhere (home, search)
  - One-click add/remove with visual feedback
  - Manage saved movies in dedicated collection page
  - Persistent storage in the database (requires authentication)

- ⭐ **Wishlist with Streaming Availability**
  - Create a wishlist of movies you want to watch
  - Automatic streaming availability lookup via JustWatch (Finland)
  - See which streaming services offer each movie
  - View cheapest rental and purchase prices
  - Data cached for 24 hours to minimize API calls
  - Works alongside collection feature

- **Performance**
  - Hybrid server/client rendering
  - Optimized images with Next.js Image component
  - Fixed aspect ratio posters (2:3) for consistent layout
  - Smooth horizontal scrolling carousels
  - Debounced search for better UX
  - Automatic token refresh

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with refresh token rotation
- **APIs**: 
  - The Movie Database (TMDB) for movie data
  - JustWatch (unofficial) for streaming availability
- **Security**: bcrypt password hashing, httpOnly cookies

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- TMDB API key ([Get one here](https://www.themoviedb.org/settings/api))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/villepekkaa/moviestack.git
cd moviestack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
# Database
DATABASE_URL="file:./dev.db"

# TMDB API
TMDB_API_KEY=your_tmdb_api_key_here

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
moviestack/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── collection/    # Collection management endpoints
│   │   │   └── search/        # Movie search endpoint
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── search/            # Search page with instant results
│   │   ├── my-collection/     # Protected collection page
│   │   ├── my-wishlist/       # Protected wishlist page with streaming data
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ClientLayout.tsx               # Client-side layout wrapper
│   │   ├── NavSearch.tsx                  # Header search bar
│   │   ├── SearchInstantClient.tsx        # Instant search component
│   │   └── SearchInstantClientWrapper.tsx # Wrapper for instant search (client boundary)
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx                # Authentication context & hooks
│   │   ├── CollectionContext.tsx          # Collection context & hooks
│   │   └── WishlistContext.tsx            # Wishlist context & hooks
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts            # JWT & password utilities
│   │   ├── prisma.ts          # Prisma client
│   │   └── justwatch/         # JustWatch API client
│   │       └── client.ts      # Streaming availability service
│   └── generated/            # Prisma generated files
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
└── public/                   # Static files
```

## Authentication System

### User Registration
- Navigate to `/register`
- Enter email and password (must meet requirements)
- Automatically logged in after registration

### User Login
- Navigate to `/login`
- Enter credentials
- JWT access token (15 min) + refresh token (7 days)

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter OR 1 special character

### Protected Routes
Pages like `/my-collection` require authentication. Unauthenticated users are redirected to `/login`.

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Movies
- `GET /api/search?q=query&page=1` - Search movies

### Collection
- `GET /api/collection` - Get current user's collection
- `POST /api/collection` - Add a movie to user's collection
- `DELETE /api/collection/[id]` - Remove a movie from user's collection

### Wishlist
- `GET /api/wishlist` - Get current user's wishlist with streaming data
- `POST /api/wishlist` - Add a movie to user's wishlist
- `DELETE /api/wishlist/[id]` - Remove a movie from user's wishlist
- `POST /api/wishlist/streaming` - Update streaming availability for a movie

### Streaming Data
- `GET /api/justwatch?tmdbId={id}&title={title}` - Get streaming availability from JustWatch

## React Hooks

### `useAuth()`
Access authentication state and methods:
```tsx
import { useAuth } from "@/contexts/AuthContext";

const { user, accessToken, isAuthenticated, login, logout } = useAuth();
```

### `useRequireAuth(redirectUrl?)`
Protect components/pages that require authentication:
```tsx
import { useRequireAuth } from "@/contexts/AuthContext";

const { isAuthenticated, isLoading } = useRequireAuth("/login");
```

### `useCollection()`
Access the user's movie collection and collection management methods:
```tsx
import { useCollection } from "@/contexts/CollectionContext";

const {
  collection,
  isLoading,
  isSaving,
  isRemoving,
  isInCollection,
  addToCollection,
  removeFromCollection,
  refreshCollection,
} = useCollection();
```
- `collection`: Array of collection items
- `isLoading`, `isSaving`, `isRemoving`: Status flags
- `isInCollection(movieId)`: Check if a movie is in the collection
- `addToCollection(movie)`: Add a movie
- `removeFromCollection(movieId)`: Remove a movie
- `refreshCollection()`: Manually refresh collection from server

### `useWishlist()`
Access the user's wishlist with streaming availability:
```tsx
import { useWishlist } from "@/contexts/WishlistContext";

const {
  wishlist,
  isLoading,
  isSaving,
  isRemoving,
  isFetchingStreaming,
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
  refreshWishlist,
  fetchStreamingData,
} = useWishlist();
```
- `wishlist`: Array of wishlist items with streaming data
- `isLoading`, `isSaving`, `isRemoving`, `isFetchingStreaming`: Status flags
- `isInWishlist(movieId)`: Check if a movie is in the wishlist
- `addToWishlist(movie)`: Add a movie
- `removeFromWishlist(movieId)`: Remove a movie
- `refreshWishlist()`: Manually refresh wishlist from server
- `fetchStreamingData(movieId)`: Fetch/update streaming availability


## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT tokens with HS256 signing
- ✅ Refresh token rotation
- ✅ httpOnly cookies for refresh tokens
- ✅ Automatic token refresh (every 14 minutes)
- ✅ Secure password validation
- ✅ TMDB API key stored server-side

## Database Schema

### User
- `id`: Unique identifier
- `email`: User email (unique)
- `passwordHash`: Hashed password
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### RefreshToken
- `id`: Token identifier
- `token`: JWT refresh token (unique)
- `userId`: Associated user
- `expiresAt`: Expiration timestamp
- `createdAt`: Creation timestamp

### CollectionItem
- `id`: Unique identifier
- `userId`: Associated user
- `movieId`: TMDB movie ID
- `addedAt`: Timestamp when added
- `movieData`: JSON blob with movie details

### WishlistItem
- `id`: Unique identifier
- `userId`: Associated user
- `movieId`: TMDB movie ID
- `addedAt`: Timestamp when added
- `movieData`: JSON blob with movie details
- `streamingData`: JSON blob with JustWatch streaming offers
- `lastStreamingUpdate`: Timestamp of last streaming data fetch

## Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Database Commands
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database (warning: deletes all data)
npx prisma migrate reset
```

### Generate JWT Secrets
```bash
openssl rand -base64 32
```

## Troubleshooting

### "No refresh token provided"
- Ensure cookies are enabled in browser
- Check that `credentials: "include"` is set in fetch calls

### "TMDB server key not configured"
- Add `TMDB_API_KEY` to your `.env` file
- Restart the dev server

### Password validation fails
- Check password meets requirements (8+ chars, 1 uppercase or special char)

### Database errors
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset
```

### JustWatch streaming data not showing
- JustWatch uses an unofficial API that may change or be unavailable
- Streaming data is cached for 24 hours per movie
- If no data appears, the movie may not be available in Finland
- Check browser console for API errors
- JustWatch API is for non-commercial use only

### Streaming data shows "Not available in Finland"
- The movie may not be released in Finland yet
- Try checking on [JustWatch.com](https://www.justwatch.com/fi) directly
- Data is specific to Finland (FI) locale

## JustWatch Integration

### About JustWatch API

This app uses the **unofficial** JustWatch API to fetch streaming availability and pricing information. 

**Important Disclaimers:**
- This is NOT an official API
- Use for non-commercial purposes only
- The API may change or become unavailable at any time
- Be respectful with API calls to prevent overload
- Currently configured for **Finland (FI)** locale

### How It Works

1. When you add a movie to your wishlist, it's saved to the database
2. The app automatically fetches streaming availability from JustWatch
3. Data is cached in the database for 24 hours
4. After 24 hours, data is refreshed when you view your wishlist

### Streaming Data Includes

- **Subscription services** (Netflix, Disney+, etc.)
- **Rental prices** with cheapest option highlighted
- **Purchase prices** with cheapest option highlighted
- **Free options** (with ads or completely free)

### Changing Country/Locale

To change from Finland to another country, edit:
```typescript
// src/lib/justwatch/client.ts
export const justWatchClient = new JustWatchClient('FI'); // Change 'FI' to your country code
```

Common country codes: `US`, `GB`, `DE`, `SE`, `NO`, `DK`, `FI`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Movie data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Built with [Next.js](https://nextjs.org/)
- UI styled with [Tailwind CSS](https://tailwindcss.com/)

## Learn More

- [Authentication Documentation](./AUTH_SETUP.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Prisma Documentation](https://www.prisma.io/docs)

---

Made with ❤️ by [villepekkaa](https://github.com/villepekkaa)
