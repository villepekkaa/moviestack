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
export type CollectionItem = {
  id: string;
  movieId: number;
  addedAt: string;
  movieData: Movie;
};

type CollectionContextType = {
  collection: CollectionItem[];
  isLoading: boolean;
  isSaving: boolean;
  isRemoving: boolean;
  isInCollection: (movieId: number) => boolean;
  addToCollection: (movie: Movie) => Promise<void>;
  removeFromCollection: (movieId: number) => Promise<void>;
  refreshCollection: () => Promise<void>;
};

const CollectionContext = createContext<CollectionContextType | undefined>(
  undefined,
);

export function CollectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, isAuthenticated } = useAuth();
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch collection from server
  const fetchCollection = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setCollection([]);
      return;
    }
    setIsLoading(true);
    try {
      console.log("[CollectionProvider] Fetching collection...");
      const res = await fetch("/api/collection", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });
      console.log("[CollectionProvider] Fetch response status:", res.status);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(
          "[CollectionProvider] Fetch failed:",
          res.status,
          errorData,
        );
        throw new Error("Failed to fetch collection");
      }
      const data = await res.json();
      console.log(
        "[CollectionProvider] Fetched collection:",
        data.collection?.length || 0,
        "items",
      );
      setCollection(Array.isArray(data.collection) ? data.collection : []);
    } catch (err) {
      console.error("[CollectionProvider] Error fetching collection:", err);
      setCollection([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  // Add to collection
  const addToCollection = useCallback(
    async (movie: Movie) => {
      if (!isAuthenticated || !accessToken) return;
      setIsSaving(true);
      try {
        console.log(
          "[CollectionProvider] Adding movie to collection:",
          movie.id,
        );
        const res = await fetch("/api/collection", {
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
          console.error("[CollectionProvider] Add failed:", res.status, data);
          throw new Error(data.error || "Failed to add to collection");
        }
        const item = await res.json();
        console.log("[CollectionProvider] Movie added successfully:", item.id);
        setCollection((prev) => [item, ...prev]);
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, accessToken],
  );

  // Remove from collection
  const removeFromCollection = useCallback(
    async (movieId: number) => {
      if (!isAuthenticated || !accessToken) return;
      setIsRemoving(true);
      try {
        // Find the collection item by movieId
        const item = collection.find((c) => c.movieId === movieId);
        if (!item) {
          console.warn(
            "[CollectionProvider] Movie not found in collection:",
            movieId,
          );
          return;
        }
        console.log(
          "[CollectionProvider] Removing movie from collection:",
          movieId,
        );
        const res = await fetch(`/api/collection/${item.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });
        if (!res.ok) {
          console.error("[CollectionProvider] Remove failed:", res.status);
          throw new Error("Failed to remove from collection");
        }
        console.log(
          "[CollectionProvider] Movie removed successfully:",
          movieId,
        );
        setCollection((prev) => prev.filter((c) => c.movieId !== movieId));
      } finally {
        setIsRemoving(false);
      }
    },
    [isAuthenticated, accessToken, collection],
  );

  // Check if movie is in collection
  const isInCollection = useCallback(
    (movieId: number) => collection.some((c) => c.movieId === movieId),
    [collection],
  );

  // Manual refresh
  const refreshCollection = fetchCollection;

  const value: CollectionContextType = {
    collection,
    isLoading,
    isSaving,
    isRemoving,
    isInCollection,
    addToCollection,
    removeFromCollection,
    refreshCollection,
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx)
    throw new Error("useCollection must be used within a CollectionProvider");
  return ctx;
}
