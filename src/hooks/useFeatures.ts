import { useMemo } from 'react';
import { useGetMyFeaturesQuery } from '@/store/api/businessApi';

export type FeatureKey =
  | 'delivery_management'
  | 'campaigns'
  | 'crm_customers'
  | 'ai_settings'
  | 'analytics'
  | 'cake_pricing'
  | 'amenities'
  | 'notifications'
  | 'interventions'
  | 'order_print'
  | 'menu_addons';

export interface FeatureFlags {
  delivery_management: boolean;
  campaigns: boolean;
  crm_customers: boolean;
  ai_settings: boolean;
  analytics: boolean;
  cake_pricing: boolean;
  amenities: boolean;
  notifications: boolean;
  interventions: boolean;
  order_print: boolean;
  menu_addons: boolean;
}

// Default features (all enabled) for loading state
const defaultFeatures: FeatureFlags = {
  delivery_management: true,
  campaigns: true,
  crm_customers: true,
  ai_settings: true,
  analytics: true,
  cake_pricing: true,
  amenities: true,
  notifications: true,
  interventions: true,
  order_print: true,
  menu_addons: true,
};

export const useFeatures = () => {
  const { data, isLoading, error } = useGetMyFeaturesQuery();

  const featureFlags: FeatureFlags = useMemo(() => {
    if (!data?.features) return defaultFeatures;

    return data.features.reduce((acc, f) => {
      acc[f.feature_key as FeatureKey] = f.is_enabled;
      return acc;
    }, { ...defaultFeatures } as FeatureFlags);
  }, [data]);

  const isFeatureEnabled = (key: FeatureKey): boolean => {
    return featureFlags[key] ?? true;
  };

  return {
    featureFlags,
    isFeatureEnabled,
    isLoading,
    error,
  };
};

export default useFeatures;
