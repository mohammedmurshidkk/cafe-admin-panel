import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  useGetBusinessesQuery,
  useGetBusinessFeaturesQuery,
  useUpdateBusinessFeaturesMutation,
} from '@/store/api/superadminApi';
import { BusinessFeature, FeatureUpdate } from '@/types';
import { toast } from 'sonner';
import {
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Save,
  Search,
  Building2,
  Truck,
  Megaphone,
  Users,
  Bot,
  BarChart3,
  Cake,
  Sparkles,
  Bell,
  AlertCircle,
} from 'lucide-react';

// Icon mapping for features
const featureIcons: Record<string, typeof Truck> = {
  delivery_management: Truck,
  campaigns: Megaphone,
  crm_customers: Users,
  ai_settings: Bot,
  analytics: BarChart3,
  cake_pricing: Cake,
  amenities: Sparkles,
  notifications: Bell,
  interventions: AlertCircle,
};

// Category colors
const categoryColors: Record<string, string> = {
  operations: 'bg-blue-100 text-blue-700',
  marketing: 'bg-green-100 text-green-700',
  ai: 'bg-purple-100 text-purple-700',
  analytics: 'bg-orange-100 text-orange-700',
};

interface BusinessFeaturesCardProps {
  businessId: string;
  businessName: string;
  isActive: boolean;
}

const BusinessFeaturesCard = ({ businessId, businessName, isActive }: BusinessFeaturesCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFeatures, setLocalFeatures] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useGetBusinessFeaturesQuery(businessId, {
    skip: !isOpen,
  });
  const [updateFeatures, { isLoading: isSaving }] = useUpdateBusinessFeaturesMutation();

  const features = data?.features || [];

  // Group features by category
  const groupedFeatures = useMemo(() => {
    const groups: Record<string, BusinessFeature[]> = {};
    features.forEach((feature) => {
      const category = feature.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(feature);
    });
    return groups;
  }, [features]);

  const handleToggle = (featureKey: string, isEnabled: boolean) => {
    setLocalFeatures((prev) => ({ ...prev, [featureKey]: isEnabled }));
    setHasChanges(true);
  };

  const getFeatureValue = (feature: BusinessFeature) => {
    if (featureKey in localFeatures) {
      return localFeatures[feature.feature_key];
    }
    return feature.is_enabled;
  };

  const handleSave = async () => {
    const updates: FeatureUpdate[] = Object.entries(localFeatures).map(([key, value]) => ({
      feature_key: key,
      is_enabled: value,
    }));

    try {
      await updateFeatures({ businessId, features: updates }).unwrap();
      toast.success('Features updated successfully');
      setLocalFeatures({});
      setHasChanges(false);
    } catch {
      toast.error('Failed to update features');
    }
  };

  const featureKey = (feature: BusinessFeature) => feature.feature_key;

  return (
    <Card className={!isActive ? 'opacity-60' : ''}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{businessName}</CardTitle>
                  <CardDescription>
                    {isActive ? 'Active' : 'Inactive'} business
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="warning" className="mr-2">
                    Unsaved changes
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={categoryColors[category] || 'bg-gray-100 text-gray-700'}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {categoryFeatures.map((feature) => {
                        const Icon = featureIcons[feature.feature_key] || ToggleRight;
                        const isEnabled = feature.feature_key in localFeatures
                          ? localFeatures[feature.feature_key]
                          : feature.is_enabled;

                        return (
                          <div
                            key={feature.feature_key}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{feature.display_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {feature.default_enabled && (
                                <Badge variant="outline" className="text-xs">
                                  Default
                                </Badge>
                              )}
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) =>
                                  handleToggle(feature.feature_key, checked)
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {hasChanges && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSave} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const SuperAdminTenantFeatures = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useGetBusinessesQuery({ search: '', page: 1, limit: 100 });

  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  const businesses = data?.businesses || [];

  const filteredBusinesses = businesses.filter((business) =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Features"
        description="Manage feature flags for each business"
        icon={<ToggleRight className="h-6 w-6" />}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Business List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No businesses found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBusinesses.map((business) => (
            <BusinessFeaturesCard
              key={business.id}
              businessId={business.id}
              businessName={business.name}
              isActive={business.is_active}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperAdminTenantFeatures;
