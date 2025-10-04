# Wishlist Features Documentation 🎬⭐

This document provides detailed information about the Wishlist functionality and JustWatch streaming integration in MovieStack.

## Overview

The Wishlist feature allows users to:
- Save movies they want to watch in the future
- View streaming availability in Finland via JustWatch
- See rental and purchase prices across different platforms
- Manage their wishlist separately from their collection

## Features

### 1. Add Movies to Wishlist

Movies can be added to your wishlist from two places:

#### From Home Page
- Browse popular movies in the carousels
- Click the **heart icon** (top-left of poster) to add to wishlist
- Icon turns yellow when the movie is in your wishlist

#### From Search Results
- Search for any movie
- Click the **heart button** (♡/♥) next to the Save button
- Button shows filled heart (♥) when in wishlist

### 2. View Your Wishlist

Navigate to **My Wishlist** from the header menu to see:
- All movies in your wishlist
- Streaming availability information
- Rental and purchase prices
- When each movie was added

### 3. Streaming Availability

For each movie in your wishlist, the app automatically fetches:

#### Subscription Services (Flatrate)
Shows which streaming services include the movie:
- Netflix
- Disney+
- Amazon Prime Video
- HBO Max
- And more...

#### Rental Options
Displays cheapest rental price:
- Price in EUR
- Provider name
- Quality (HD, 4K, etc.)

#### Purchase Options
Shows cheapest purchase price:
- Price in EUR
- Provider name
- Quality (HD, 4K, etc.)

#### Not Available
If a movie isn't available in Finland, it will show:
> "Not available in Finland"

## How It Works

### Backend Architecture

```
User adds movie to wishlist
        ↓
Movie saved to database (WishlistItem)
        ↓
Frontend requests streaming data
        ↓
API calls JustWatch service (Finland locale)
        ↓
Streaming data cached in database
        ↓
Data refreshed after 24 hours
```

### Data Caching

To minimize API calls and improve performance:
- Streaming data is cached for **24 hours**
- After 24 hours, data is automatically refreshed
- Cached data is stored in the database with each wishlist item
- No manual refresh needed

### API Endpoints

```
GET  /api/wishlist              - Fetch user's wishlist
POST /api/wishlist              - Add movie to wishlist
DELETE /api/wishlist/[id]       - Remove movie from wishlist
POST /api/wishlist/streaming    - Update streaming data
GET  /api/justwatch             - Query JustWatch API (optional)
```

## User Interface

### Wishlist Page Layout

```
┌─────────────────────────────────────────────┐
│ My Wishlist 🎬                              │
│ Movies you want to watch with streaming     │
│ availability in Finland. (3 items)          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐             │
│  │      │  │      │  │      │             │
│  │Poster│  │Poster│  │Poster│             │
│  │      │  │      │  │      │             │
│  └──────┘  └──────┘  └──────┘             │
│   Movie 1    Movie 2    Movie 3            │
│                                             │
│   Streaming: Netflix, Disney+              │
│   Rent: 4.99 EUR (iTunes)                  │
│   Buy: 9.99 EUR (Google Play)              │
│                                             │
│   [Remove]  [View on TMDB]                 │
│                                             │
└─────────────────────────────────────────────┘
```

### Visual Indicators

| Icon | Meaning |
|------|---------|
| ♡ (Outline heart) | Movie not in wishlist |
| ♥ (Filled heart, yellow) | Movie in wishlist |
| ⭐ (Star) | Movie in collection |
| 🎬 | Wishlist page indicator |

## Code Examples

### Using the Wishlist Context

```typescript
import { useWishlist } from "@/contexts/WishlistContext";

function MyComponent() {
  const {
    wishlist,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    fetchStreamingData,
  } = useWishlist();

  // Check if movie is in wishlist
  const inWishlist = isInWishlist(movieId);

  // Add to wishlist
  await addToWishlist(movie);

  // Remove from wishlist
  await removeFromWishlist(movieId);

  // Manually fetch streaming data
  await fetchStreamingData(movieId);
}
```

### Accessing Streaming Data

```typescript
// Each wishlist item includes:
type WishlistItem = {
  id: string;
  movieId: number;
  addedAt: string;
  movieData: Movie;
  streamingData?: {
    flatrate: StreamingOffer[];    // Subscription services
    rent: StreamingOffer[];         // Rental options
    buy: StreamingOffer[];          // Purchase options
    cheapestRent?: PriceInfo;       // Cheapest rental
    cheapestBuy?: PriceInfo;        // Cheapest purchase
    lastUpdated: string;
  };
  lastStreamingUpdate?: string;
};
```

## JustWatch API Details

### Unofficial API Usage

This app uses the **unofficial** JustWatch API. Important notes:

⚠️ **Disclaimer:**
- This is NOT an official API
- For non-commercial use only
- May change or become unavailable
- No guarantee of accuracy or uptime
- Be respectful with API calls

### Country Configuration

Default: **Finland (FI)**

To change country, edit:
```typescript
// src/lib/justwatch/client.ts
export const justWatchClient = new JustWatchClient('FI');
```

Supported country codes:
- `FI` - Finland
- `US` - United States
- `GB` - United Kingdom
- `DE` - Germany
- `SE` - Sweden
- `NO` - Norway
- `DK` - Denmark
- And more...

### API Rate Limiting

To avoid overloading the JustWatch API:
- Streaming data cached for 24 hours
- Only fetches when viewing wishlist page
- Data stored in database
- No redundant API calls

## Database Schema

### WishlistItem Model

```prisma
model WishlistItem {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  movieId              Int
  addedAt              DateTime  @default(now())
  movieData            Json
  streamingData        Json?
  lastStreamingUpdate  DateTime?

  @@unique([userId, movieId])
  @@index([userId])
}
```

### Fields Explanation

- `id`: Unique identifier for the wishlist item
- `userId`: Owner of the wishlist item
- `movieId`: TMDB movie ID
- `addedAt`: When movie was added to wishlist
- `movieData`: Complete TMDB movie data (title, poster, etc.)
- `streamingData`: JustWatch streaming availability data
- `lastStreamingUpdate`: Last time streaming data was fetched

## Troubleshooting

### No Streaming Data Showing

**Possible causes:**
1. Movie not available in Finland
2. JustWatch API temporarily unavailable
3. Network error

**Solutions:**
- Check browser console for errors
- Verify movie is released in Finland
- Try refreshing the page
- Check [JustWatch.com](https://www.justwatch.com/fi) directly

### Streaming Data is Outdated

**Automatic refresh:**
- Data older than 24 hours is automatically refreshed
- Happens when you visit the wishlist page

**Manual refresh:**
- Remove and re-add the movie to wishlist
- Or wait for automatic 24-hour refresh

### "Not available in Finland"

This means:
- Movie hasn't been released in Finland yet
- Movie is no longer available on any platform
- JustWatch doesn't have data for this movie

**What to do:**
- Keep the movie in your wishlist
- Check back later as availability changes
- Verify on JustWatch.com for accuracy

## Future Enhancements

Potential features for future versions:

### Price Alerts
- Notify users when price drops
- Email notifications
- Price history tracking

### Multi-Country Support
- Switch country in settings
- Compare prices across countries
- Show availability in multiple regions

### Provider Filtering
- Filter by streaming service
- Show only Netflix titles
- Custom provider preferences

### Watchlist Sharing
- Share wishlist with friends
- Public/private wishlists
- Collaborative wishlists

### Advanced Sorting
- Sort by price
- Sort by availability
- Sort by release date
- Sort by rating

## Best Practices

### For Users

1. **Regular Checks**: Visit your wishlist weekly to see new availability
2. **Price Comparison**: Compare rental vs purchase prices
3. **Subscription Value**: Notice which services have most of your wishlist
4. **Clean Up**: Remove watched movies to keep wishlist relevant

### For Developers

1. **Respect API Limits**: Don't bypass the 24-hour cache
2. **Error Handling**: Always handle JustWatch API failures gracefully
3. **User Privacy**: Never share wishlist data without permission
4. **Performance**: Lazy-load streaming data, don't block UI
5. **Testing**: Test with various locales and edge cases

## Resources

- [JustWatch Website (Finland)](https://www.justwatch.com/fi)
- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## Contributing

To contribute to wishlist features:

1. Test with different locales
2. Improve error handling
3. Add new streaming providers
4. Enhance UI/UX
5. Report bugs and suggestions

## License

Same as the main project - MIT License.

---

**Note:** JustWatch API is unofficial and for educational/personal use only. For commercial use, contact JustWatch directly at data-partner@justwatch.com.