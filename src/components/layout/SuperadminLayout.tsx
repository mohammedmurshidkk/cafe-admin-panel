import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { logout } from '@/store/authSlice';
import { Button } from '@/components/ui/button';
import { Building2, LayoutDashboard, LogOut, Shield, ToggleRight, Trash2 } from 'lucide-react';

export const SuperadminLayout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Super Admin</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <a href="/superadmin/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <a href="/superadmin/businesses">
                <Building2 className="h-4 w-4" />
                Businesses
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <a href="/superadmin/tenant-features">
                <ToggleRight className="h-4 w-4" />
                Features
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <a href="/superadmin/data-clear">
                <Trash2 className="h-4 w-4" />
                Data Clear
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
