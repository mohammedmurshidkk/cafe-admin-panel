import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, isAuthenticated } = useAuth();
  const { user } = useSelector((state: RootState) => state.auth);

  // Redirect based on role
  if (isAuthenticated && user) {
    if (user.role === 'superadmin') {
      return <Navigate to="/superadmin/businesses" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/appLogo.svg"
            alt="Conversa"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-display font-bold">Conversa</h1>
          <p className="text-muted-foreground mt-2">WhatsApp AI Ordering System</p>
        </div>

        {/* Login Card */}
        <div className="card-warm p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Welcome back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="gradient"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Manage your WhatsApp ordering system
        </p>
      </div>
    </div>
  );
};

export default Login;
