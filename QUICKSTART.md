# MovieStack Quick Start Guide

Get MovieStack up and running in 5 minutes! 🚀

## 1. Clone and Install

```bash
git clone https://github.com/villepekkaa/moviestack.git
cd moviestack
npm install
```

## 2. Get TMDB API Key

1. Go to https://www.themoviedb.org/signup
2. Create a free account
3. Go to Settings → API → Request API Key
4. Choose "Developer" option
5. Fill in the form (use http://localhost:3000 for website)
6. Copy your API key

## 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` and add your TMDB API key:

```env
DATABASE_URL="file:./dev.db"
TMDB_API_KEY=paste_your_tmdb_key_here
JWT_SECRET=already_generated_for_you
JWT_REFRESH_SECRET=already_generated_for_you
```

## 4. Setup Database

```bash
npx prisma migrate dev
npx prisma generate
```

## 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## 6. Try It Out

### Register a New Account
1. Click "Register" in the header
2. Enter your email: `test@example.com`
3. Enter password: `Password123!` (meets requirements)
4. Click "Register"

### Search for Movies
1. Type in the search bar in the header
2. See instant results as you type!
3. Click "Save" to add movies to your collection

### View Your Collection
1. Click "My Collection" in the navigation
2. See all your saved movies
3. Click "Remove" to delete from collection

### Logout and Login
1. Click "Logout" in the header
2. Click "Login" to sign back in
3. Your collection is still there!

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Run production build

# Database
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create new migration
npx prisma generate      # Regenerate Prisma client

# Generate new JWT secrets
openssl rand -base64 32
```

## Troubleshooting

### "TMDB server key not configured"
- Make sure you added `TMDB_API_KEY` to `.env`
- Restart the dev server (`Ctrl+C` then `npm run dev`)

### "Module not found" errors
```bash
npm install
npx prisma generate
```

### "Database locked" or schema errors
```bash
npx prisma migrate reset
npx prisma generate
```

### Login/Register not working
- Check browser console for errors
- Ensure JWT secrets are in `.env`
- Try clearing browser cookies

### Search not returning results
- Verify TMDB API key is correct
- Check network tab for API errors
- Try a simple search like "batman"

## What's Next?

✅ You're all set! Now you can:
- Browse popular movies on the home page
- Search for your favorite movies
- Build your personal collection
- Explore the codebase and customize

## Need Help?

- 📚 [Full Documentation](./README.md)
- 🔐 [Authentication Guide](./AUTH_SETUP.md)
- 🐛 [Open an Issue](https://github.com/villepekkaa/moviestack/issues)

Happy movie hunting! 🎬