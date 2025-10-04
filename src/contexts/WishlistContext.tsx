"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Movie } from "@/types/movie";

// Types
export type WishlistItem = {
  id: string;
  movieId: number;
  addedAt: string;
  movieData: Movie;
};

type WishlistContextType = {
  wishlist: WishlistItem[];
  isLoading: boolean;
  isSaving: boolean;
  isRemoving: boolean;
  isInWishlist: (movieId: number) => boolean;
  addToWishlist: (movie: Movie) => Promise<void>;
  removeFromWishlist: (movieId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch wishlist from server
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setWishlist([]);
      return;
    }
    setIsLoading(true);
    try {
      console.log("[WishlistProvider] Fetching wishlist...");
      const res = await fetch("/api/wishlist", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });
      console.log("[WishlistProvider] Fetch response status:", res.status);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(
          "[WishlistProvider] Fetch failed:",
          res.status,
          errorData,
        );
        throw new Error("Failed to fetch wishlist");
      }
      const data = await res.json();
      console.log(
        "[WishlistProvider] Fetched wishlist:",
        data.wishlist?.length || 0,
        "items",
      );
      setWishlist(Array.isArray(data.wishlist) ? data.wishlist : []);
    } catch (err) {
      console.error("[WishlistProvider] Error fetching wishlist:", err);
      setWishlist([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Add to wishlist
  const addToWishlist = useCallback(
    async (movie: Movie) => {
      if (!isAuthenticated || !accessToken) return;
      setIsSaving(true);
      try {
        console.log(
          "[WishlistProvider] Adding movie to wishlist:",
          movie.id,
        );
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({
            movieId: movie.id,
            movieData: movie,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("[WishlistProvider] Add failed:", res.status, data);
          throw new Error(data.error || "Failed to add to wishlist");
        }
        const item = await res.json();
        console.log("[WishlistProvider] Movie added successfully:", item.id);
        setWishlist((prev) => [item, ...prev]);
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, accessToken],
  );

  // Remove from wishlist
  const removeFromWishlist = useCallback(
    async (movieId: number) => {
      if (!isAuthenticated || !accessToken) return;
      setIsRemoving(true);
      try {
        // Find the wishlist item by movieId
        const item = wishlist.find((w) => w.movieId === movieId);
        if (!item) {
          console.warn(
            "[WishlistProvider] Movie not found in wishlist:",
            movieId,
          );
          return;
        }
        console.log(
          "[WishlistProvider] Removing movie from wishlist:",
          movieId,
        );
        const res = await fetch(`/api/wishlist/${item.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });
        if (!res.ok) {
          console.error("[WishlistProvider] Remove failed:", res.status);
          throw new Error("Failed to remove from wishlist");
        }
        console.log(
          "[WishlistProvider] Movie removed successfully:",
          movieId,
        );
        setWishlist((prev) => prev.filter((w) => w.movieId !== movieId));
      } finally {
        setIsRemoving(false);
      }
    },
    [isAuthenticated, accessToken, wishlist],
  );

  // Check if movie is in wishlist
  const isInWishlist = useCallback(
    (movieId: number) => wishlist.some((w) => w.movieId === movieId),
    [wishlist],
  );

  // Manual refresh
  const refreshWishlist = fetchWishlist;

  const value: WishlistContextType = {
    wishlist,
    isLoading,
    isSaving,
    isRemoving,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    refreshWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
