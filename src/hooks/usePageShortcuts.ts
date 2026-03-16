import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PageShortcut {
  id: string;
  shortcut_code: string;
  page_name: string;
  page_url: string;
  module_name: string;
  is_active: boolean;
}

const RECENT_PAGES_KEY = "erp_recent_pages";
const MAX_RECENT = 8;

export function usePageShortcuts() {
  const [shortcuts, setShortcuts] = useState<PageShortcut[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isSuperAdmin, permissions } = useAuth();

  const fetchShortcuts = useCallback(async () => {
    const { data } = await supabase
      .from("page_shortcuts")
      .select("*")
      .eq("is_active", true)
      .order("shortcut_code");
    if (data) setShortcuts(data as PageShortcut[]);
    setLoading(false);
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_favorite_pages")
      .select("page_url")
      .eq("user_id", user.id);
    if (data) setFavorites(data.map((d: any) => d.page_url));
  }, [user]);

  useEffect(() => {
    fetchShortcuts();
    fetchFavorites();
  }, [fetchShortcuts, fetchFavorites]);

  // Filter by permissions
  const adminPaths = ["/admin/"];
  const filteredShortcuts = shortcuts.filter((s) => {
    if (isSuperAdmin || isAdmin) return true;
    if (adminPaths.some((p) => s.page_url.startsWith(p))) return false;
    return true;
  });

  // Recent pages
  const getRecentPages = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_PAGES_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const addRecentPage = (url: string) => {
    const recents = getRecentPages().filter((r) => r !== url);
    recents.unshift(url);
    localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(recents.slice(0, MAX_RECENT)));
  };

  // Favorites
  const toggleFavorite = async (pageUrl: string) => {
    if (!user) return;
    if (favorites.includes(pageUrl)) {
      await supabase
        .from("user_favorite_pages")
        .delete()
        .eq("user_id", user.id)
        .eq("page_url", pageUrl);
      setFavorites((prev) => prev.filter((f) => f !== pageUrl));
    } else {
      await supabase
        .from("user_favorite_pages")
        .insert({ user_id: user.id, page_url: pageUrl });
      setFavorites((prev) => [...prev, pageUrl]);
    }
  };

  const isFavorite = (pageUrl: string) => favorites.includes(pageUrl);

  // Search
  const search = (query: string): PageShortcut[] => {
    if (!query.trim()) return filteredShortcuts;
    const q = query.toLowerCase();
    return filteredShortcuts.filter(
      (s) =>
        s.shortcut_code.toLowerCase().includes(q) ||
        s.page_name.toLowerCase().includes(q) ||
        s.module_name.toLowerCase().includes(q)
    );
  };

  // Exact shortcut match
  const findByCode = (code: string): PageShortcut | undefined => {
    return filteredShortcuts.find(
      (s) => s.shortcut_code.toLowerCase() === code.toLowerCase()
    );
  };

  return {
    shortcuts: filteredShortcuts,
    loading,
    search,
    findByCode,
    getRecentPages,
    addRecentPage,
    toggleFavorite,
    isFavorite,
    favorites,
    refetch: fetchShortcuts,
  };
}
