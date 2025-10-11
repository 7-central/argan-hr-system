'use client';

import { useCallback, useEffect, useState } from 'react';

import { Search, Clock, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Client Search Widget */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Search className="h-5 w-5" />
            Search Clients
          </CardTitle>
          <CardDescription>Find client documents by company name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name..."
              className="pl-8"
            />
          </div>
          {searchTerm && (
            <Button variant="ghost" size="sm" onClick={clearSearch} className="mt-2 w-full">
              Clear Search
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Searches Widget */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Clock className="h-5 w-5" />
            Recent Searches
          </CardTitle>
          <CardDescription>Your last 3 client searches</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSearches.length > 0 ? (
            <div className="space-y-2">
              {recentSearches.map((search) => (
                <Button
                  key={search.clientId}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleRecentSearchClick(search.clientName)}
                >
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  {search.clientName}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent searches yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
