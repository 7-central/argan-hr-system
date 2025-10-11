'use client';

import { useCallback, useEffect, useState } from 'react';

import { Search, Clock, X } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import type { Client } from '@/lib/types/client';

interface DocumentsPageWidgetsProps {
  clients: Client[];
  onSearchChange: (searchTerm: string) => void;
}

interface RecentSearch {
  clientId: number;
  clientName: string;
  searchedAt: number;
}

export function DocumentsPageWidgets({ clients, onSearchChange }: DocumentsPageWidgetsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('documentRecentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save a search to recent searches
  const saveRecentSearch = useCallback(
    (searchValue: string) => {
      if (!searchValue.trim()) return;

      // Find matching client
      const matchedClient = clients.find((client) =>
        client.companyName.toLowerCase().includes(searchValue.toLowerCase())
      );

      if (!matchedClient) return;

      const newSearch: RecentSearch = {
        clientId: matchedClient.id,
        clientName: matchedClient.companyName,
        searchedAt: Date.now(),
      };

      setRecentSearches((prev) => {
        // Remove duplicate if exists
        const filtered = prev.filter((s) => s.clientId !== matchedClient.id);
        // Add new search at the beginning
        const updated = [newSearch, ...filtered].slice(0, 3); // Keep only last 3
        // Save to localStorage
        localStorage.setItem('documentRecentSearches', JSON.stringify(updated));
        return updated;
      });
    },
    [clients]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
      if (searchTerm.trim()) {
        saveRecentSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange, saveRecentSearch]);

  // Handle recent search click
  const handleRecentSearchClick = (clientName: string) => {
    setSearchTerm(clientName);
  };

  // Delete a recent search
  const deleteRecentSearch = (clientId: number) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.clientId !== clientId);
      localStorage.setItem('documentRecentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-1">
      {/* Recent Searches Widget */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                Recent Searches
              </CardTitle>
              <CardDescription>Your last 3 client searches</CardDescription>
            </div>
            {recentSearches.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <div
                    key={search.clientId}
                    className="inline-flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer pr-1"
                    onClick={() => handleRecentSearchClick(search.clientName)}
                  >
                    <span>{search.clientName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecentSearch(search.clientId);
                      }}
                      className="h-6 w-6 rounded-sm hover:bg-muted flex items-center justify-center transition-colors"
                      aria-label="Delete recent search"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        {recentSearches.length === 0 && (
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent searches yet
            </p>
          </CardContent>
        )}
      </Card>

      {/* Client Search Widget */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Search className="h-5 w-5" />
                Search Clients
              </CardTitle>
              <CardDescription>Find client documents by company name</CardDescription>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by client name..."
                className="pl-8 pr-8"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
