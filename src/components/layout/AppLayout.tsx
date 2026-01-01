import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { MobileSidebar } from './MobileSidebar';
import { ViewingAsBanner } from './ViewingAsBanner';
import { cn } from '@/lib/utils';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Hide bottom nav only when chat session is active (mobile)
  const isChatWithSession = location.pathname.startsWith('/chat/');

  // Global WebSocket connections - active on all pages
  useChatWebSocket();
  useNotificationWebSocket();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar />
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ViewingAsBanner />
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className={cn(
          "flex-1 p-4 md:p-6 overflow-auto",
          isChatWithSession ? "pb-0" : "pb-20 md:pb-6"
        )}>
          <Outlet />
        </main>

        {!isChatWithSession && <BottomNav />}
      </div>
    </div>
  );
};
