import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryTimeout, setRetryTimeout] = useState<number | null>(null);

  const { login, isLoading, isAuthenticated } = useAuth();
  const { user } = useSelector((state: RootState) => state.auth);

  // Countdown for rate limiting
  useEffect(() => {
    if (retryTimeout === null) return;
    if (retryTimeout <= 0) {
      setRetryTimeout(null);
      return;
    }
    const timer = setInterval(() => {
      setRetryTimeout((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryTimeout]);

  // Redirect based on role
  if (isAuthenticated && user) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin/businesses" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m === 0 ? `${s}s` : `${m}m ${s}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const result = await login(email, password);
    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials');
      if (result.retryAfter) setRetryTimeout(result.retryAfter);
    }
  };

  return (
    <main className="flex min-h-screen overflow-hidden bg-surface font-body text-on-surface">
      {/* ── Left Column: Auth Form ── */}
      <section className="w-full lg:w-[45%] flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 bg-surface relative z-10">
        <div className="w-full max-w-sm">

          {/* Brand */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
              </div>
              <span className="text-lg font-black text-on-surface tracking-tighter">CONVERSA</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Welcome back</h1>
            <p className="text-on-surface-variant text-sm">Enter your credentials to access the admin console.</p>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {errorMessage}
              {retryTimeout !== null && (
                <span className="block mt-1 text-xs font-semibold italic">
                  Please wait {formatTime(retryTimeout)} before trying again.
                </span>
              )}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="name@company.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary-container rounded-lg transition-all outline-none text-on-surface placeholder:text-on-surface-variant/50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  className="block text-xs font-bold uppercase tracking-widest text-on-surface"
                  htmlFor="password"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  className="text-xs font-semibold text-brand-primary hover:text-primary-container transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary-container rounded-lg transition-all outline-none text-on-surface"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || retryTimeout !== null}
              className="w-full bg-primary-container hover:bg-brand-primary text-white font-bold py-4 rounded-lg transition-all active:scale-[0.98] editorial-shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : retryTimeout !== null ? (
                `Try again in ${formatTime(retryTimeout)}`
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-outline-variant/20 text-center">
            <p className="text-sm text-on-surface-variant">
              Don't have an account?{' '}
              <a href="mailto:support@conversa.ai" className="text-brand-primary font-semibold hover:underline">
                Request Access
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-8 lg:left-24">
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold">
            © {new Date().getFullYear()} Conversa — WhatsApp AI Platform
          </p>
        </div>
      </section>

      {/* ── Right Column: Visual Panel ── */}
      <section className="hidden lg:flex w-[55%] relative overflow-hidden items-center justify-center">
        {/* Gradient background */}
        <div
          className="absolute inset-0 z-0"
          style={{ backgroundImage: 'linear-gradient(135deg, #b22b00 0%, #ff5b2e 50%, #881f00 100%)' }}
        />

        {/* Radial light overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #ffffff 0%, transparent 40%), radial-gradient(circle at 80% 70%, #ffffff 0%, transparent 40%)',
          }}
        />

        {/* Floating chat bubbles */}
        <div className="relative z-10 w-full max-w-2xl px-12 space-y-8">
          {/* Bubble 1 — AI insight */}
          <div className="glass-effect p-6 rounded-2xl rounded-bl-none editorial-shadow max-w-md -rotate-2 ml-auto">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">auto_awesome</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-20 bg-outline-variant/30 rounded" />
                <p className="text-on-surface font-medium leading-snug text-sm">
                  "Today's orders are up 18% — 3 new customers placed their first order in the last hour."
                </p>
              </div>
            </div>
          </div>

          {/* Bubble 2 — Customer message */}
          <div className="glass-effect p-5 rounded-2xl rounded-br-none editorial-shadow max-w-xs rotate-1 ml-16">
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-outline-variant/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-base">person</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Aisha K.</p>
                <p className="text-xs text-on-surface-variant">Can I customize the cake design?</p>
              </div>
            </div>
          </div>

          {/* Bubble 3 — Status chip */}
          <div className="glass-effect p-4 rounded-xl editorial-shadow w-fit -rotate-1 ml-auto mr-16 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">AI Active · 12 sessions</span>
          </div>

          {/* Floating icons */}
          <div className="absolute -top-20 -left-8 w-20 h-20 glass-effect rounded-full flex items-center justify-center editorial-shadow animate-pulse">
            <span className="material-symbols-outlined text-primary-container text-3xl">hub</span>
          </div>
          <div className="absolute -bottom-12 right-0 w-28 h-28 glass-effect rounded-3xl flex items-center justify-center editorial-shadow rotate-12">
            <span className="material-symbols-outlined text-[#b22b00] text-4xl">campaign</span>
          </div>
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t border-white/20 pt-6">
          <div className="max-w-[240px]">
            <h3 className="text-white text-xl font-bold mb-1">Automate with confidence</h3>
            <p className="text-white/70 text-xs">
              The unified dashboard for WhatsApp AI ordering and conversation management.
            </p>
          </div>
          <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm">north_east</span>
          </div>
        </div>
      </section>

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </main>
  );
};

export default Login;
