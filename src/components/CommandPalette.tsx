import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, ArrowRight, Command } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { usePageShortcuts, type PageShortcut } from "@/hooks/usePageShortcuts";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const {
    shortcuts,
    search,
    findByCode,
    getRecentPages,
    addRecentPage,
    toggleFavorite,
    isFavorite,
  } = usePageShortcuts();

  // Ctrl+K handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (url: string) => {
      addRecentPage(url);
      navigate(url);
      setOpen(false);
      setQuery("");
    },
    [navigate, addRecentPage]
  );

  const results = search(query);
  const recentUrls = getRecentPages();
  const recentShortcuts = recentUrls
    .map((url) => shortcuts.find((s) => s.page_url === url))
    .filter(Boolean) as PageShortcut[];
  const favoriteShortcuts = shortcuts.filter((s) => isFavorite(s.page_url));

  const showRecentsAndFavorites = !query.trim();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search pages, shortcuts, or modules..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No pages found.</CommandEmpty>

        {showRecentsAndFavorites && favoriteShortcuts.length > 0 && (
          <CommandGroup heading="Favorites">
            {favoriteShortcuts.map((s) => (
              <ShortcutItem
                key={s.id}
                shortcut={s}
                onSelect={handleSelect}
                onToggleFavorite={toggleFavorite}
                isFav={true}
              />
            ))}
          </CommandGroup>
        )}

        {showRecentsAndFavorites && favoriteShortcuts.length > 0 && recentShortcuts.length > 0 && (
          <CommandSeparator />
        )}

        {showRecentsAndFavorites && recentShortcuts.length > 0 && (
          <CommandGroup heading="Recent">
            {recentShortcuts.map((s) => (
              <ShortcutItem
                key={`recent-${s.id}`}
                shortcut={s}
                onSelect={handleSelect}
                onToggleFavorite={toggleFavorite}
                isFav={isFavorite(s.page_url)}
                icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />}
              />
            ))}
          </CommandGroup>
        )}

        {showRecentsAndFavorites && (recentShortcuts.length > 0 || favoriteShortcuts.length > 0) && (
          <CommandSeparator />
        )}

        <CommandGroup heading={query ? "Results" : "All Pages"}>
          {results.map((s) => (
            <ShortcutItem
              key={s.id}
              shortcut={s}
              onSelect={handleSelect}
              onToggleFavorite={toggleFavorite}
              isFav={isFavorite(s.page_url)}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function ShortcutItem({
  shortcut,
  onSelect,
  onToggleFavorite,
  isFav,
  icon,
}: {
  shortcut: PageShortcut;
  onSelect: (url: string) => void;
  onToggleFavorite: (url: string) => void;
  isFav: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <CommandItem
      value={`${shortcut.shortcut_code} ${shortcut.page_name} ${shortcut.module_name}`}
      onSelect={() => onSelect(shortcut.page_url)}
      className="flex items-center justify-between gap-2 cursor-pointer"
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon || <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <span className="truncate font-medium">{shortcut.page_name}</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
          {shortcut.module_name}
        </Badge>
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {shortcut.shortcut_code}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(shortcut.page_url);
        }}
        className="shrink-0 p-0.5 hover:text-primary transition-colors"
      >
        <Star
          className={`w-3.5 h-3.5 ${isFav ? "fill-primary text-primary" : "text-muted-foreground"}`}
        />
      </button>
    </CommandItem>
  );
}
