import { useRef, useState } from 'react';
import { Search, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const focusSearch = () => {
    searchRef.current?.focus();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/sign-in');
  };

  return (
    <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
      {/* Left side: Search */}
      <div className="flex-1 max-w-xl">
        <div
          onClick={focusSearch}
          className="w-full flex items-center gap-2 px-4 py-2 bg-elevated/50 border border-border rounded-xl text-sm text-muted-foreground hover:bg-elevated transition-colors group cursor-text"
        >
          <Search className="w-4 h-4 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search workspaces..."
            className="bg-transparent border-none outline-none flex-1 text-foreground placeholder:text-muted-foreground text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                navigate(`/home?search=${encodeURIComponent(e.currentTarget.value.trim())}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right side: Create + User */}
      <div className="flex items-center gap-3 ml-4">
        <Button
          onClick={() => navigate('/home')}
          className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <Avatar className="w-9 h-9 border border-border/50">
              <AvatarImage src={user?.photo || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username || 'User'}`} />
              <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-12 z-50 w-52 bg-surface border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-semibold truncate">{user?.username || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-elevated transition-colors text-left"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-red-500/10 text-red-400 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
