import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  MessagesSquare,
  MessageSquare,
  UtensilsCrossed,
  FolderOpen,
  PlusCircle,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Truck,
  Megaphone,
  BarChart3,
  Users,
  Bot,
  Heart,
  UserSearch,
  Bell,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ClipboardList },
  { path: '/chat', label: 'Chat', icon: MessagesSquare },
  // { path: '/sessions', label: 'Sessions', icon: MessageSquare },
  { path: '/menu', label: 'Menu Items', icon: UtensilsCrossed },
  { path: '/categories', label: 'Categories', icon: FolderOpen },
  { path: '/addons', label: 'Addons', icon: PlusCircle, feature: 'menu_addons' },
  { path: '/amenities', label: 'Amenities', icon: Sparkles, feature: 'amenities' },
  { path: '/delivery-boys', label: 'Delivery Boys', icon: Truck, feature: 'delivery_management' },
  // { path: '/company', label: 'Company Profile', icon: Building2 },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone, feature: 'campaigns' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, feature: 'analytics' },
  { path: '/customers', label: 'Customers', icon: Users, feature: 'crm_customers' },
  { path: '/settings/ai', label: 'AI Settings', icon: Bot, feature: 'ai_settings' },
  // Marriage Matching plugin nav items
  { path: '/marriage/profiles', label: 'Profiles', icon: Heart, plugin: PluginId.MARRIAGE_MATCHING },
  { path: '/marriage/seekers', label: 'Seekers', icon: UserSearch, plugin: PluginId.MARRIAGE_MATCHING },
  { path: '/marriage/interests', label: 'Interest Requests', icon: Bell, plugin: PluginId.MARRIAGE_MATCHING },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isFeatureEnabled } = useFeatures();

  const visibleNavItems = useMemo(() => {
    const pluginId = (user?.plugin_id ?? PluginId.CAKE_CAFE) as PluginId;
    const orderingOnlyPaths = ['/orders', '/menu', '/categories', '/addons', '/amenities', '/delivery-boys'];
    return navItems.filter(item => {
      if (item.plugin && item.plugin !== pluginId) return false;
      if (!item.plugin && pluginId === PluginId.MARRIAGE_MATCHING && orderingOnlyPaths.includes(item.path)) return false;
      return !item.feature || isFeatureEnabled(item.feature);
    });
  }, [isFeatureEnabled, user?.plugin_id]);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 bg-white border-r border-outline-variant/40 transition-all duration-300 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-14 flex items-center border-b border-outline-variant/40 flex-shrink-0',
        collapsed ? 'justify-center px-0' : 'justify-between px-4'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-[16px]">bolt</span>
            </div>
            <span className="font-bold text-sm text-on-surface tracking-wide">RELAYET</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[16px]">bolt</span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {visibleNavItems.map((item) => {
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
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-blush text-brand-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] flex-shrink-0', isActive ? 'text-brand-primary' : '')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings + User / Logout */}
      <div className={cn('border-t border-outline-variant/40 p-3 space-y-0.5', collapsed && 'flex flex-col items-center')}>
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full',
            collapsed && 'justify-center px-2 w-auto',
            isActive
              ? 'bg-blush text-brand-primary font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
          )}
        >
          <Settings className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {!collapsed && user && (
          <div className="px-2 pt-2 pb-1">
            <p className="text-xs font-semibold text-on-surface truncate">{user.business_name}</p>
            <p className="text-[11px] text-on-surface-variant truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors w-full',
            collapsed && 'justify-center w-auto'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
