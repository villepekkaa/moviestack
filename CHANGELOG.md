# Changelog

All notable changes to MovieStack will be documented in this file.

## [Unreleased]

### Added - 2024-01-03

#### Authentication System
- ✅ Complete JWT-based authentication with refresh token rotation
- ✅ User registration with email validation
- ✅ Password validation (8+ chars, 1 uppercase or special character)
- ✅ Login/logout functionality
- ✅ Protected routes (My Collection requires authentication)
- ✅ Custom React Context provider (`AuthContext`)
- ✅ Custom hooks (`useAuth`, `useRequireAuth`)
- ✅ Automatic token refresh every 14 minutes
- ✅ httpOnly cookies for refresh token security
- ✅ Prisma + SQLite database for user management
- ✅ bcrypt password hashing (12 rounds)

#### Save to Collection Feature
- ✅ Save movies from home page carousels
- ✅ Save movies from search results
- ✅ Visual feedback (+ icon changes to filled star when saved)
- ✅ One-click add/remove functionality
- ✅ Persistent storage with localStorage
- ✅ Collection count in My Collection page
- ✅ Requires authentication to save movies

#### My Collection Page
- ✅ Protected route (requires login)
- ✅ Display all saved movies in grid layout
- ✅ Remove movies from collection
- ✅ Shows movie posters, titles, years, ratings
- ✅ Links to TMDB for more info
- ✅ Empty state with call-to-action

### Fixed - 2024-01-03

#### Carousel Poster Sizing
- 🐛 Fixed inconsistent poster sizes in carousels
- 🐛 Fixed zoomed/cropped posters appearing larger
- 🐛 Simplified CSS to use consistent aspect ratio (2:3)
- 🐛 Removed conflicting height constraints
- 🐛 Used Next.js Image component with `fill` prop for proper sizing
- 🐛 Consistent widths: 150px (mobile), 170px (tablet), 190px (desktop)
- 🐛 Smooth hover animations without layout shifts

#### UI/UX Improvements
- ✨ Better carousel navigation buttons (hover effects)
- ✨ Smooth scroll behavior with snap points
- ✨ Improved mobile responsiveness
- ✨ Authentication-aware UI (show/hide save buttons)
- ✨ User email display in header when logged in
- ✨ Login/Register buttons in header when logged out
- ✨ Conditional navigation (My Collection only shows when authenticated)

### Changed - 2024-01-03
- 🔄 Converted My Collection page to client component with auth protection
- 🔄 Updated layout to use ClientLayout with AuthProvider
- 🔄 Simplified carousel CSS (removed complex media queries)
- 🔄 Improved home page structure with max-width containers
- 🔄 Updated header to show authentication status

### Technical
- 📦 Added dependencies: bcryptjs, jsonwebtoken, jose, prisma, @prisma/client
- 🗄️ Database schema with User and RefreshToken models
- 🔧 Environment variables for JWT secrets
- 📝 Comprehensive documentation (README, AUTH_SETUP, QUICKSTART)

---

## How to Use This Changelog

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for new functionality (backwards compatible)
- PATCH version for bug fixes (backwards compatible)

---

## Future Roadmap

### Planned Features
- [ ] Email verification for new users
- [ ] Password reset functionality
- [ ] OAuth providers (Google, GitHub)
- [ ] Movie details page with trailers
- [ ] User reviews and ratings
- [ ] Watchlist vs Watched lists
- [ ] Social features (share collections)
- [ ] Advanced search filters
- [ ] Recommendations based on collection
- [ ] Dark/Light mode toggle
- [ ] Export collection to JSON/CSV

### Potential Improvements
- [ ] Rate limiting on auth endpoints
- [ ] Two-factor authentication (2FA)
- [ ] Server-side collection storage (sync across devices)
- [ ] Image optimization and caching
- [ ] Skeleton loading states
- [ ] Error boundary components
- [ ] Analytics integration
- [ ] PWA support (offline mode)
- [ ] Accessibility improvements (ARIA labels)
- [ ] Internationalization (i18n)

---

**Note**: This project is under active development. Breaking changes may occur before v1.0.0.