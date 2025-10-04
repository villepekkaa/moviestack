"use client";
import React from "react";
import Link from "next/link";
import NavSearch from "./NavSearch";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { WishlistProvider } from "@/contexts/WishlistContext";

function HeaderContent() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  return (
    <header className="bg-white/80 dark:bg-black/80 border-b">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          <span className="font-bold text-lg">MovieStack</span>
          <nav>
            <ul className="flex gap-4">
              <li>
                <Link href="/" className="hover:underline">
                  Home
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li>
                    <Link href="/my-collection" className="hover:underline">
                      My Collection
                    </Link>
                  </li>
                  <li>
                    <Link href="/my-wishlist" className="hover:underline">
                      My Wishlist
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <NavSearch />
          {!isLoading && (
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {user?.email}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="max-w-5xl mx-auto px-6 py-6 text-sm text-center">
        © {new Date().getFullYear()} MovieStack
      </div>
    </footer>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CollectionProvider>
        <WishlistProvider>
          <HeaderContent />
          <main className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">
            {children}
          </main>
          <Footer />
        </WishlistProvider>
      </CollectionProvider>
    </AuthProvider>
  );
}
