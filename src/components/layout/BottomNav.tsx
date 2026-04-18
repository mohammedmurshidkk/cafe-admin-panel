import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  MessagesSquare,
  UtensilsCrossed,
  MoreHorizontal,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderOpen,
  PlusCircle,
  Building2,
  LogOut,
  MessageSquare,
  Sparkles,
  Megaphone,
  BarChart3,
  Users,
  Bot,
  Heart,
  UserSearch,
  Bell,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFeatures, FeatureKey } from '@/hooks/useFeatures';
import { PluginId } from '@/types';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  feature?: FeatureKey;
  plugin?: string;
}

const mainNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ClipboardList },
  { path: '/chat', label: 'Chat', icon: MessagesSquare },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
  // Marriage main nav
  { path: '/marriage/profiles', label: 'Profiles', icon: Heart, plugin: PluginId.MARRIAGE_MATCHING },
];

const moreNavItems: NavItem[] = [
  // { path: '/sessions', label: 'Sessions', icon: MessageSquare },
  { path: '/categories', label: 'Categories', icon: FolderOpen },
  { path: '/addons', label: 'Addons', icon: PlusCircle, feature: 'menu_addons' },
  { path: '/amenities', label: 'Amenities', icon: Sparkles, feature: 'amenities' },
  { path: '/delivery-boys', label: 'Delivery Boys', icon: Truck, feature: 'delivery_management' },
  // { path: '/company', label: 'Company Profile', icon: Building2 },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone, feature: 'campaigns' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, feature: 'analytics' },
  { path: '/customers', label: 'Customers', icon: Users, feature: 'crm_customers' },
  { path: '/settings/ai', label: 'AI Settings', icon: Bot, feature: 'ai_settings' },
  { path: '/settings', label: 'Settings', icon: Settings },
  // Marriage more nav
  { path: '/marriage/seekers', label: 'Seekers', icon: UserSearch, plugin: PluginId.MARRIAGE_MATCHING },
  { path: '/marriage/interests', label: 'Interest Requests', icon: Bell, plugin: PluginId.MARRIAGE_MATCHING },
];

export const BottomNav = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isFeatureEnabled } = useFeatures();

  console.log('######## user', user)

  const pluginId = (user?.plugin_id ?? PluginId.CAKE_CAFE) as PluginId;
  const orderingOnlyPaths = ['/orders', '/menu', '/categories', '/addons', '/amenities', '/delivery-boys'];

  const visibleMainItems = useMemo(() => {
    return mainNavItems.filter(item => {
      if (item.plugin && item.plugin !== pluginId) return false;
      if (!item.plugin && pluginId === PluginId.MARRIAGE_MATCHING && orderingOnlyPaths.includes(item.path)) return false;
      return true;
    });
  }, [pluginId]);

  // Filter more items based on enabled features and plugin
  const visibleMoreItems = useMemo(() => {
    return moreNavItems.filter(item => {
      if (item.plugin && item.plugin !== pluginId) return false;
      if (!item.plugin && pluginId === PluginId.MARRIAGE_MATCHING && orderingOnlyPaths.includes(item.path)) return false;
      return !item.feature || isFeatureEnabled(item.feature);
    });
  }, [isFeatureEnabled, pluginId]);

  const isMoreActive = visibleMoreItems.some(item => location.pathname === item.path);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleMainItems.map((item) => {
          // For chat, restore last active session if available
          const isChatItem = item.path === '/chat';
          const isOnChatSession = location.pathname.startsWith('/chat/');
          const lastChatSession = localStorage.getItem('lastChatSessionId');
          const targetPath = isChatItem
            ? isOnChatSession
              ? location.pathname
              : lastChatSession
                ? `/chat/${lastChatSession}`
                : '/chat'
            : item.path;
          const isActive = isChatItem
            ? location.pathname.startsWith('/chat')
            : location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={targetPath}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isMoreActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {visibleMoreItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.path} asChild>
                  <NavLink to={item.path} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
