import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="h-16 shrink-0 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shadow-soft">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="md:hidden flex items-center gap-2">
          <img
            src="/appLogo.svg"
            alt="Conversa"
            className="w-8 h-8"
          />
          <span className="font-display font-semibold">Conversa</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />
        {user && (
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium">{user.business_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-semibold text-sm">
            {user?.business_name?.charAt(0) || 'U'}
          </span>
        </div>
      </div>
    </header>
  );
};
