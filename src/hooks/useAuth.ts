import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/store';
import { logout as logoutAction, setCredentials } from '@/store/authSlice';
import { useLoginMutation } from '@/store/api/authApi';
import { toast } from 'sonner';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [loginMutation, { isLoading }] = useLoginMutation();

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation({ email, password }).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.token }));
      toast.success('Welcome back!');
      // Redirect based on role
      if (result.user.role === 'superadmin') {
        navigate('/superadmin/businesses');
      } else {
        navigate('/dashboard');
      }
      return { success: true };
    } catch (error: any) {
      const message = error?.data?.error || 'Invalid credentials';
      const retryAfter = error?.data?.retryAfter;
      toast.error(message);
      return { success: false, error: message, retryAfter };
    }
  };

  const logout = () => {
    dispatch(logoutAction());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
