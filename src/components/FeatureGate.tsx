import { Navigate } from 'react-router-dom';
import { useFeatures, FeatureKey } from '@/hooks/useFeatures';
import { Skeleton } from '@/components/ui/skeleton';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
}

/**
 * Protects routes based on feature flags.
 * Redirects to dashboard if feature is disabled.
 */
export const FeatureGate = ({ feature, children }: FeatureGateProps) => {
  const { isFeatureEnabled, isLoading } = useFeatures();

  // Show loading state while checking features
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Redirect to dashboard if feature is disabled
  if (!isFeatureEnabled(feature)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default FeatureGate;
