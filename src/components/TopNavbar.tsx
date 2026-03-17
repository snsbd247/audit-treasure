import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Moon, Sun, Search, Bell, UserCircle, KeyRound, LogOut, Command, MessageSquare } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { usePageShortcuts } from "@/hooks/usePageShortcuts";

interface TopNavbarProps {
  onOpenCommandPalette?: () => void;
}

export const TopNavbar = ({ onOpenCommandPalette }: TopNavbarProps) => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { search, findByCode, addRecentPage } = usePageShortcuts();
  const { unreadCount } = useUnreadMessages();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchValue.trim() ? search(searchValue) : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchValue.trim()) {
      const exact = findByCode(searchValue.trim());
      if (exact) {
        addRecentPage(exact.page_url);
        navigate(exact.page_url);
        setSearchValue("");
        setShowResults(false);
        return;
      }
      if (results.length === 1) {
        addRecentPage(results[0].page_url);
        navigate(results[0].page_url);
        setSearchValue("");
        setShowResults(false);
      }
    }
    if (e.key === "Escape") {
      setShowResults(false);
      setSearchValue("");
    }
  };

  const handleSelect = (url: string) => {
    addRecentPage(url);
    navigate(url);
    setSearchValue("");
    setShowResults(false);
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative max-w-sm w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search or type shortcut..."
            className="pl-9 pr-16 h-9 bg-muted/50 border-none text-sm"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setShowResults(!!e.target.value.trim());
            }}
            onFocus={() => searchValue.trim() && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono">
            Ctrl+K
          </kbd>
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
              {results.map((s) => (
                <button
                  key={s.id}
                  className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-accent text-left transition-colors"
                  onMouseDown={() => handleSelect(s.page_url)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.page_name}</p>
                    <p className="text-xs text-muted-foreground">Module: {s.module_name}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                    {s.shortcut_code}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Mobile: just open command palette */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:hidden text-muted-foreground"
          onClick={onOpenCommandPalette}
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground relative"
          onClick={() => navigate("/messaging")}
          title="Messages"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm ml-1 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
              {(profile?.name || "U").charAt(0).toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground truncate">{profile?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
              <UserCircle className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/change-password")} className="cursor-pointer">
              <KeyRound className="w-4 h-4 mr-2" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
