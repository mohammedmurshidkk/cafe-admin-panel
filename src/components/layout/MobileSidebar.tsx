import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  MessagesSquare,
  UtensilsCrossed,
  FolderOpen,
  PlusCircle,
  Building2,
  LogOut,
  X,
  Sparkles,
  Truck,
  Megaphone,
  BarChart3,
  Users,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ClipboardList },
  { path: '/chat', label: 'Chat', icon: MessagesSquare },
  { path: '/sessions', label: 'Sessions', icon: MessageSquare },
  { path: '/menu', label: 'Menu Items', icon: UtensilsCrossed },
  { path: '/categories', label: 'Categories', icon: FolderOpen },
  { path: '/addons', label: 'Addons', icon: PlusCircle },
  { path: '/amenities', label: 'Amenities', icon: Sparkles },
  { path: '/delivery-boys', label: 'Delivery Boys', icon: Truck },
  { path: '/company', label: 'Company Profile', icon: Building2 },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/settings/ai', label: 'AI Settings', icon: Bot },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export const MobileSidebar = ({ open, onClose }: MobileSidebarProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        <SheetHeader className="h-16 flex flex-row items-center justify-between px-4 border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">WA</span>
            </div>
            <span className="font-display font-semibold text-sidebar-foreground">Conversa</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "nav-item",
                  isActive && "nav-item-active"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border mt-auto">
          {user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.business_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
