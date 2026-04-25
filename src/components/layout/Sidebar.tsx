import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  FileText,
  Monitor,
  Video,
  Calendar,
  Folder,
  Settings,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Hexagon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { name: 'Chats', path: '/home', icon: MessageCircle },
  { name: 'Notes', path: '/notes', icon: FileText },
  { name: 'Whiteboards', path: '/whiteboards', icon: Monitor },
  { name: 'Meetings', path: '/meetings', icon: Video },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Files', path: '/files', icon: Folder },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      className="h-screen bg-surface border-r border-border flex flex-col relative z-20 flex-shrink-0"
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 bg-surface border border-border rounded-full p-1 hover:bg-elevated transition-colors z-30 luxury-shadow"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-border/50">
        <Hexagon className="text-primary w-8 h-8 flex-shrink-0" />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-3 font-semibold text-lg tracking-tight"
          >
            StudyHive
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 hide-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-elevated hover:text-foreground'
              }`
            }
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && (
              <span className="ml-3 text-sm truncate">{item.name}</span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Profile Section */}
      <div className="p-4 border-t border-border/50">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-2 rounded-xl hover:bg-elevated transition-colors cursor-pointer group`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative">
              <Avatar className="w-9 h-9 border border-border/50">
                <AvatarImage src={user?.photo || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username || 'User'}`} />
                <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-surface rounded-full"></span>
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium truncate">{user?.username || 'User'}</span>
                <span className="text-xs text-muted-foreground truncate">Free Plan</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <MoreVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </motion.aside>
  );
}
