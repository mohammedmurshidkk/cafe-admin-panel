import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  MapPin,
  MessageSquare,
  Brain,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Save,
  ImageIcon,
  Truck,
  ShoppingBag,
  Settings,
  Upload,
  Cake,
  GripVertical,
  Clock
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetBusinessProfileQuery,
  useUpdateBusinessProfileMutation,
  useUploadBusinessLogoMutation,
  useCreateOutletMutation,
  useUpdateOutletMutation,
  useDeleteOutletMutation
} from '@/store/api/businessApi';
import {
  useGetCakePricingConfigQuery,
  useUpdateCakePricingConfigMutation,
  useCreateWeightMutation,
  useUpdateWeightMutation,
  useDeleteWeightMutation,
  useCreateFlavorMutation,
  useUpdateFlavorMutation,
  useDeleteFlavorMutation,
  useCreateDesignElementMutation,
  useUpdateDesignElementMutation,
  useDeleteDesignElementMutation,
  useSeedDesignElementsMutation,
  WeightPricing,
  FlavorPricing,
  FlavorSize,
  DesignElement,
} from '@/store/api/cakePricingApi';
import { Outlet } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CompanyProfile = () => {
  const { data, isLoading } = useGetBusinessProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateBusinessProfileMutation();
  const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadBusinessLogoMutation();
  const [createOutlet, { isLoading: isCreatingOutlet }] = useCreateOutletMutation();
  const [updateOutlet, { isLoading: isUpdatingOutlet }] = useUpdateOutletMutation();
  const [deleteOutletMutation, { isLoading: isDeletingOutlet }] = useDeleteOutletMutation();

  // Cake Pricing API hooks
  const { data: cakePricingData, isLoading: isCakePricingLoading } = useGetCakePricingConfigQuery();
  const [updateCakePricingConfig] = useUpdateCakePricingConfigMutation();
  const [createWeight, { isLoading: isCreatingWeight }] = useCreateWeightMutation();
  const [updateWeightApi, { isLoading: isUpdatingWeight }] = useUpdateWeightMutation();
  const [deleteWeightApi, { isLoading: isDeletingWeight }] = useDeleteWeightMutation();
  const [createFlavor, { isLoading: isCreatingFlavor }] = useCreateFlavorMutation();
  const [updateFlavorApi, { isLoading: isUpdatingFlavor }] = useUpdateFlavorMutation();
  const [deleteFlavorApi, { isLoading: isDeletingFlavor }] = useDeleteFlavorMutation();
  const [createDesignElement, { isLoading: isCreatingElement }] = useCreateDesignElementMutation();
  const [updateDesignElementApi, { isLoading: isUpdatingElement }] = useUpdateDesignElementMutation();
  const [deleteDesignElementApi, { isLoading: isDeletingElement }] = useDeleteDesignElementMutation();
  const [seedDesignElements, { isLoading: isSeeding }] = useSeedDesignElementsMutation();

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [criticalMessage, setCriticalMessage] = useState('');
  const [criticalEnabled, setCriticalEnabled] = useState(false);
  const [orderNumberPrefix, setOrderNumberPrefix] = useState('');
  const [customerSupportPhone, setCustomerSupportPhone] = useState('');
  const [supportsDelivery, setSupportsDelivery] = useState(true);
  const [supportsTakeaway, setSupportsTakeaway] = useState(true);
  const [freeRadiusMeters, setFreeRadiusMeters] = useState(0);
  const [minimumDeliveryCharge, setMinimumDeliveryCharge] = useState(0);
  const [minimumChargeDistanceMeters, setMinimumChargeDistanceMeters] = useState(0);
  const [incrementPerKm, setIncrementPerKm] = useState(0);
  const [maxDeliveryRadiusMeters, setMaxDeliveryRadiusMeters] = useState(0);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(0);
  const [minimumWaitMinutes, setMinimumWaitMinutes] = useState(30);

  // Outlet states
  const [isOutletFormOpen, setIsOutletFormOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [deleteOutlet, setDeleteOutlet] = useState<Outlet | null>(null);
  const [outletData, setOutletData] = useState({
    outlet_name: '',
    address: '',
    phone: '',
    is_active: true,
    opening_time: '',
    closing_time: '',
    opening_buffer_minutes: 0,
    closing_buffer_minutes: 0,
    opening_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as string[]
  });

  // Cake pricing data from API
  const cakePricingConfig = cakePricingData?.data;
  const weightPricing = cakePricingConfig?.weights || [];
  const flavorPricing = cakePricingConfig?.flavors || [];
  const designElements = cakePricingConfig?.elements || [];

  // Cake pricing modals
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false);
  const [isDesignElementModalOpen, setIsDesignElementModalOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WeightPricing | null>(null);
  const [editingFlavor, setEditingFlavor] = useState<FlavorPricing | null>(null);
  const [editingDesignElement, setEditingDesignElement] = useState<DesignElement | null>(null);
  const [deleteWeightItem, setDeleteWeightItem] = useState<WeightPricing | null>(null);
  const [deleteFlavorItem, setDeleteFlavorItem] = useState<FlavorPricing | null>(null);
  const [deleteDesignItem, setDeleteDesignItem] = useState<DesignElement | null>(null);

  // Cake pricing form data
  const [weightFormData, setWeightFormData] = useState({ weight_grams: 500, base_price: 0 });
  const [flavorFormData, setFlavorFormData] = useState<{ flavor_name: string; sizes: FlavorSize[] }>({
    flavor_name: '',
    sizes: [{ name: '500g', price: 0, is_base: false }]
  });
  const [designFormData, setDesignFormData] = useState({
    element_key: '',
    element_label: '',
    price: 0,
    price_type: 'fixed' as 'fixed' | 'per_unit'
  });

  useEffect(() => {
    if (data?.business) {
      setBusinessName(data.business.name);
      setWelcomeMessage(data.business.welcome_message);
      setThankYouMessage(data.business.thank_you_message);
      setCustomAiPrompt(data.business.custom_ai_prompt);
      setCriticalMessage(data.business.critical_message);
      setCriticalEnabled(data.business.critical_message_enabled);
      setOrderNumberPrefix(data.business.order_number_prefix || '');
      setCustomerSupportPhone(data.business.customer_support_phone || '');
      setSupportsDelivery(data.business.supports_delivery);
      setSupportsTakeaway(data.business.supports_takeaway);
      setFreeRadiusMeters(data.business.free_radius_meters || 0);
      setMinimumDeliveryCharge(data.business.minimum_delivery_charge || 0);
      setMinimumChargeDistanceMeters(data.business.minimum_charge_distance_meters || 0);
      setIncrementPerKm(data.business.increment_per_km || 0);
      setMaxDeliveryRadiusMeters(data.business.max_delivery_radius_meters || 0);
      setFreeDeliveryAbove(data.business.free_delivery_above || 0);
      setMinimumWaitMinutes(data.business.minimum_wait_minutes || 30);
    }
  }, [data]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: businessName,
        welcome_message: welcomeMessage,
        closing_message: thankYouMessage,
        custom_ai_prompt: customAiPrompt,
        critical_message: criticalMessage,
        critical_message_enabled: criticalEnabled,
        order_number_prefix: orderNumberPrefix,
        customer_support_phone: customerSupportPhone,
        supports_delivery: supportsDelivery,
        supports_takeaway: supportsTakeaway,
        free_radius_meters: freeRadiusMeters,
        minimum_delivery_charge: minimumDeliveryCharge,
        minimum_charge_distance_meters: minimumChargeDistanceMeters,
        increment_per_km: incrementPerKm,
        max_delivery_radius_meters: maxDeliveryRadiusMeters,
        free_delivery_above: freeDeliveryAbove,
        minimum_wait_minutes: minimumWaitMinutes,
      }).unwrap();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      await uploadLogo(formData).unwrap();
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload logo');
    }
  };

  const openOutletForm = (outlet?: Outlet) => {
    if (outlet) {
      setEditingOutlet(outlet);
      setOutletData({
        outlet_name: outlet.outlet_name,
        address: outlet.address,
        phone: outlet.phone,
        is_active: outlet.is_active,
        opening_time: outlet.opening_time || '',
        closing_time: outlet.closing_time || '',
        opening_buffer_minutes: outlet.opening_buffer_minutes || 0,
        closing_buffer_minutes: outlet.closing_buffer_minutes || 0,
        opening_days: outlet.opening_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      });
    } else {
      setEditingOutlet(null);
      setOutletData({
        outlet_name: '',
        address: '',
        phone: '',
        is_active: true,
        opening_time: '',
        closing_time: '',
        opening_buffer_minutes: 0,
        closing_buffer_minutes: 0,
        opening_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      });
    }
    setIsOutletFormOpen(true);
  };

  const handleSubmitOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOutlet) {
        await updateOutlet({ id: editingOutlet.id, ...outletData }).unwrap();
        toast.success('Outlet updated');
      } else {
        await createOutlet(outletData).unwrap();
        toast.success('Outlet created');
      }
      setIsOutletFormOpen(false);
    } catch (error) {
      toast.error('Failed to save outlet');
    }
  };

  const handleDeleteOutlet = async () => {
    if (!deleteOutlet) return;
    try {
      await deleteOutletMutation(deleteOutlet.id).unwrap();
      toast.success('Outlet deleted');
      setDeleteOutlet(null);
    } catch (error) {
      toast.error('Failed to delete outlet');
    }
  };

  // Cake Pricing Helper Functions
  const openWeightModal = (weight?: WeightPricing) => {
    if (weight) {
      setEditingWeight(weight);
      setWeightFormData({ weight_grams: weight.weight_grams, base_price: weight.base_price });
    } else {
      setEditingWeight(null);
      setWeightFormData({ weight_grams: 500, base_price: 0 });
    }
    setIsWeightModalOpen(true);
  };

  const openFlavorModal = (flavor?: FlavorPricing) => {
    if (flavor) {
      setEditingFlavor(flavor);
      setFlavorFormData({
        flavor_name: flavor.flavor_name,
        sizes: flavor.sizes || []
      });
    } else {
      setEditingFlavor(null);
      setFlavorFormData({
        flavor_name: '',
        sizes: [{ name: '500g', price: 0, is_base: false }]
      });
    }
    setIsFlavorModalOpen(true);
  };

  const openDesignElementModal = (element?: DesignElement) => {
    if (element) {
      setEditingDesignElement(element);
      setDesignFormData({
        element_key: element.element_key,
        element_label: element.element_label,
        price: element.price,
        price_type: element.price_type
      });
    } else {
      setEditingDesignElement(null);
      setDesignFormData({ element_key: '', element_label: '', price: 0, price_type: 'fixed' });
    }
    setIsDesignElementModalOpen(true);
  };

  const handleSubmitWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWeight) {
        await updateWeightApi({
          id: editingWeight.id,
          base_price: weightFormData.base_price,
        }).unwrap();
        toast.success('Weight pricing updated');
      } else {
        await createWeight(weightFormData).unwrap();
        toast.success('Weight pricing added');
      }
      setIsWeightModalOpen(false);
    } catch (error) {
      toast.error('Failed to save weight pricing');
    }
  };

  const handleSubmitFlavor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFlavor) {
        await updateFlavorApi({
          id: editingFlavor.id,
          ...flavorFormData,
        }).unwrap();
        toast.success('Flavor pricing updated');
      } else {
        await createFlavor(flavorFormData).unwrap();
        toast.success('Flavor pricing added');
      }
      setIsFlavorModalOpen(false);
    } catch (error) {
      toast.error('Failed to save flavor pricing');
    }
  };

  const handleSubmitDesignElement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDesignElement) {
        await updateDesignElementApi({
          id: editingDesignElement.id,
          ...designFormData,
        }).unwrap();
        toast.success('Design element updated');
      } else {
        await createDesignElement(designFormData).unwrap();
        toast.success('Design element added');
      }
      setIsDesignElementModalOpen(false);
    } catch (error) {
      toast.error('Failed to save design element');
    }
  };

  const handleDeleteWeight = async () => {
    if (!deleteWeightItem) return;
    try {
      await deleteWeightApi(deleteWeightItem.id).unwrap();
      toast.success('Weight pricing deleted');
      setDeleteWeightItem(null);
    } catch (error) {
      toast.error('Failed to delete weight pricing');
    }
  };

  const handleDeleteFlavor = async () => {
    if (!deleteFlavorItem) return;
    try {
      await deleteFlavorApi(deleteFlavorItem.id).unwrap();
      toast.success('Flavor pricing deleted');
      setDeleteFlavorItem(null);
    } catch (error) {
      toast.error('Failed to delete flavor pricing');
    }
  };

  const handleDeleteDesignElement = async () => {
    if (!deleteDesignItem) return;
    try {
      await deleteDesignElementApi(deleteDesignItem.id).unwrap();
      toast.success('Design element deleted');
      setDeleteDesignItem(null);
    } catch (error) {
      toast.error('Failed to delete design element');
    }
  };

  const handleCakePricingToggle = async (enabled: boolean) => {
    try {
      await updateCakePricingConfig({ enabled }).unwrap();
    } catch (error) {
      toast.error('Failed to update cake pricing settings');
    }
  };

  const handleAutoSendToggle = async (auto_send: boolean) => {
    try {
      await updateCakePricingConfig({ auto_send }).unwrap();
    } catch (error) {
      toast.error('Failed to update auto-send setting');
    }
  };

  const handleQuoteExpiryChange = async (quote_expiry_hours: number) => {
    try {
      await updateCakePricingConfig({ quote_expiry_hours }).unwrap();
    } catch (error) {
      toast.error('Failed to update quote expiry');
    }
  };

  const handleSeedElements = async () => {
    try {
      await seedDesignElements().unwrap();
      toast.success('Standard design elements added');
    } catch (error) {
      toast.error('Failed to seed design elements');
    }
  };

  const formatWeight = (grams: number) => {
    if (grams >= 1000) return `${grams / 1000}kg`;
    return `${grams}g`;
  };

  console.log('## flavorPricing', flavorPricing)

  const predefinedDesignElements = [
    { key: 'extra_tier', label: 'Extra Tier' },
    { key: 'fondant_covering', label: 'Fondant Covering' },
    { key: 'buttercream_finish', label: 'Buttercream Finish' },
    { key: 'fondant_bow', label: 'Fondant Bow' },
    { key: 'crown_topper', label: 'Crown/Tiara Topper' },
    { key: 'doll_topper', label: 'Doll/Figurine Topper' },
    { key: 'number_topper', label: 'Number Topper' },
    { key: 'name_letters', label: 'Name Letters' },
    { key: 'decorative_spheres', label: 'Decorative Spheres/Balls' },
    { key: 'edible_print', label: 'Edible Print' },
    { key: 'hand_painted', label: 'Hand-Painted Details' },
    { key: 'quilted_pattern', label: 'Quilted/Textured Pattern' },
    { key: 'gold_accents', label: 'Gold Accents' },
    { key: 'silver_accents', label: 'Silver Accents' },
    { key: 'fresh_flowers', label: 'Fresh Flowers' },
    { key: 'chocolate_drizzle', label: 'Chocolate Drizzle' },
    { key: 'macarons', label: 'Macarons' },
    { key: 'meringue_kisses', label: 'Meringue Kisses' },
    { key: 'butterfly_decor', label: 'Butterfly Decorations' },
    { key: 'theme_decorations', label: 'Theme Decorations' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Company Profile" />
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Company Profile"
        description="Manage your business settings and AI configuration"
        action={
          <Button variant="gradient" onClick={handleSaveProfile} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />

      {/* Basic Info */}
      <div className="card-warm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-lg">Basic Information</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">WhatsApp Phone Number</Label>
            <Input
              id="phone"
              value={data?.business.phone || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Registered with Meta - cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderPrefix">Order Number Prefix</Label>
            <Input
              id="orderPrefix"
              value={orderNumberPrefix}
              onChange={(e) => setOrderNumberPrefix(e.target.value)}
              placeholder="e.g., ORD"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportPhone">Customer Support Phone</Label>
            <Input
              id="supportPhone"
              value={customerSupportPhone}
              onChange={(e) => setCustomerSupportPhone(e.target.value)}
              placeholder="Enter"
            />
          </div>
        </div>

        {/* Logo */}
        <div className="mt-6">
          <Label>Business Logo</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {data?.business.logo_url ? (
                <img src={data.business.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              variant="outline"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </Button>
          </div>
        </div>
      </div>

      {/* Order Settings */}
      <div className="card-warm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-secondary" />
          </div>
          <h2 className="font-display font-semibold text-lg">Order Settings</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="supportsDelivery" className="cursor-pointer font-medium">
                  Delivery
                </Label>
                <p className="text-xs text-muted-foreground">Enable delivery orders</p>
              </div>
            </div>
            <Switch
              id="supportsDelivery"
              checked={supportsDelivery}
              onCheckedChange={setSupportsDelivery}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="supportsTakeaway" className="cursor-pointer font-medium">
                  Takeaway
                </Label>
                <p className="text-xs text-muted-foreground">Enable takeaway orders</p>
              </div>
            </div>
            <Switch
              id="supportsTakeaway"
              checked={supportsTakeaway}
              onCheckedChange={setSupportsTakeaway}
            />
          </div>
        </div>

        {supportsDelivery && (
          <div className="mt-6 p-4 border border-border rounded-lg space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Delivery Settings
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="freeRadiusMeters">Free Delivery Radius (m)</Label>
                <Input
                  id="freeRadiusMeters"
                  type="number"
                  min="0"
                  value={freeRadiusMeters}
                  onChange={(e) => setFreeRadiusMeters(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumDeliveryCharge">Minimum Delivery Charge</Label>
                <Input
                  id="minimumDeliveryCharge"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimumDeliveryCharge}
                  onChange={(e) => setMinimumDeliveryCharge(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumChargeDistanceMeters">Min Charge Distance (m)</Label>
                <Input
                  id="minimumChargeDistanceMeters"
                  type="number"
                  min="0"
                  value={minimumChargeDistanceMeters}
                  onChange={(e) => setMinimumChargeDistanceMeters(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incrementPerKm">Increment per km</Label>
                <Input
                  id="incrementPerKm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={incrementPerKm}
                  onChange={(e) => setIncrementPerKm(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDeliveryRadiusMeters">Max Delivery Radius (m)</Label>
                <Input
                  id="maxDeliveryRadiusMeters"
                  type="number"
                  min="0"
                  value={maxDeliveryRadiusMeters}
                  onChange={(e) => setMaxDeliveryRadiusMeters(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeDeliveryAbove">Free Delivery Above</Label>
                <Input
                  id="freeDeliveryAbove"
                  type="number"
                  min="0"
                  step="0.01"
                  value={freeDeliveryAbove}
                  onChange={(e) => setFreeDeliveryAbove(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Minimum Wait Time - Hidden
        <div className="mt-6 space-y-2">
          <Label htmlFor="minimumWait">Minimum Wait Time (minutes)</Label>
          <Input
            id="minimumWait"
            type="number"
            min="0"
            value={minimumWaitMinutes}
            onChange={(e) => setMinimumWaitMinutes(parseInt(e.target.value) || 0)}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Minimum preparation time before order can be ready
          </p>
        </div>
        */}
      </div>

      {/* Outlets */}
      <div className="card-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-secondary" />
            </div>
            <h2 className="font-display font-semibold text-lg">Outlets</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => openOutletForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Outlet
          </Button>
        </div>

        {data?.business.outlets?.length ? (
          <div className="space-y-3">
            {data.business.outlets.map((outlet) => (
              <div
                key={outlet.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{outlet.outlet_name}</p>
                      <Badge variant={outlet.is_active ? 'active' : 'secondary'}>
                        {outlet.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{outlet.address}</p>
                    <p className="text-sm text-muted-foreground">{outlet.phone}</p>
                    {outlet.opening_time && outlet.closing_time && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{outlet.opening_time} - {outlet.closing_time}</span>
                        {(outlet.opening_buffer_minutes > 0 || outlet.closing_buffer_minutes > 0) && (
                          <span className="text-xs">
                            (buffer: +{outlet.opening_buffer_minutes}/-{outlet.closing_buffer_minutes}min)
                          </span>
                        )}
                      </div>
                    )}
                    {outlet.opening_days && outlet.opening_days.length < 7 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {outlet.opening_days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openOutletForm(outlet)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteOutlet(outlet)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No outlets configured</p>
        )}
      </div>

      {/* Message Templates - Hidden
      <div className="card-warm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-lg">Message Templates</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="welcome">Welcome Message</Label>
            <Textarea
              id="welcome"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Message sent when a new customer starts chatting"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thankyou">Closing Message</Label>
            <Textarea
              id="thankyou"
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              placeholder="Message sent after order confirmation"
              rows={3}
            />
          </div>
        </div>
      </div>
      */}

      {/* Custom AI Prompt */}
      <div className="card-warm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-secondary" />
          </div>
          <h2 className="font-display font-semibold text-lg">Custom AI Prompt</h2>
        </div>

        <div className="space-y-4">
          <Textarea
            value={customAiPrompt}
            onChange={(e) => setCustomAiPrompt(e.target.value)}
            placeholder="Add custom instructions for your AI assistant. These have highest priority."
            rows={6}
          />

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Example instructions:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• "If customer sends image, reply: I'm a bot and can't view images. Please describe your order in text."</li>
              <li>• "For Fruits/Vegetables category, inform: Sorry, we don't deliver fresh produce."</li>
              <li>• "Always ask for delivery date when ordering cakes."</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Critical Message */}
      <div className={cn(
        "card-warm p-6 border-2",
        criticalEnabled ? "border-destructive" : "border-transparent"
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="font-display font-semibold text-lg">Critical Message</h2>
          </div>
          <Switch
            checked={criticalEnabled}
            onCheckedChange={setCriticalEnabled}
          />
        </div>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-4">
          <p className="text-sm text-destructive font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            When enabled, this message will be sent to ALL customers instead of normal AI responses. Use for emergencies only.
          </p>
        </div>

        <Textarea
          value={criticalMessage}
          onChange={(e) => setCriticalMessage(e.target.value)}
          placeholder="e.g., Our ordering service is temporarily unavailable. Please call 04223-XXXXX. Sorry for inconvenience."
          rows={3}
          disabled={!criticalEnabled}
          className={cn(!criticalEnabled && "opacity-50")}
        />
      </div>

      {/* Custom Cake Pricing */}
      <div className="card-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Cake className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Custom Cake Pricing</h2>
              <p className="text-sm text-muted-foreground">AI-powered cake quote generation from images</p>
            </div>
          </div>
          <Switch
            checked={cakePricingConfig?.enabled ?? false}
            onCheckedChange={handleCakePricingToggle}
            disabled={isCakePricingLoading}
          />
        </div>

        {cakePricingConfig?.enabled && (
          <div className="space-y-6">
            {/* Settings Row */}
            <div className="flex flex-wrap gap-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Switch
                  id="cakeAutoSend"
                  checked={cakePricingConfig?.auto_send ?? false}
                  onCheckedChange={handleAutoSendToggle}
                />
                <div>
                  <Label htmlFor="cakeAutoSend" className="cursor-pointer">Auto-send quotes</Label>
                  <p className="text-xs text-muted-foreground">Send quotes without admin approval</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="quoteExpiry">Quote expires in</Label>
                <Input
                  id="quoteExpiry"
                  type="number"
                  min="1"
                  max="168"
                  value={cakePricingConfig?.quote_expiry_hours ?? 24}
                  onBlur={(e) => handleQuoteExpiryChange(parseInt(e.target.value) || 24)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </div>

            {cakePricingConfig?.auto_send && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Auto-send is enabled. Quotes will be sent to customers without review.
                </p>
              </div>
            )}

            {/* Pricing Tabs */}
            <Tabs defaultValue="flavors" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="flavors">Pricing (Flavor & Weight)</TabsTrigger>
                <TabsTrigger value="design">Design Elements</TabsTrigger>
              </TabsList>

              {/* Weights Tab Removed */}

              {/* Flavor Pricing Tab */}
              <TabsContent value="flavors" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">Manage pricing by flavor and size</p>
                  <Button variant="outline" size="sm" onClick={() => openFlavorModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Flavor
                  </Button>
                </div>

                {flavorPricing.length > 0 ? (
                  <div className="space-y-2">
                    {flavorPricing.map((flavor) => (
                      <div
                        key={flavor.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{flavor.flavor_name}</p>
                            <Badge variant={flavor.is_active ? 'active' : 'secondary'}>
                              {flavor.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {flavor.sizes?.map((size, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {size.name}: ₹{size.price}
                                {size.is_base && <span className="ml-1 text-[10px] text-muted-foreground">(Base)</span>}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openFlavorModal(flavor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteFlavorItem(flavor)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cake className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No flavor pricing configured</p>
                    <p className="text-sm">Add flavor options to get started</p>
                  </div>
                )}
              </TabsContent>

              {/* Design Elements Tab */}
              <TabsContent value="design" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">Decorative elements detected by AI</p>
                  <div className="flex gap-2">
                    {designElements.length === 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSeedElements}
                        disabled={isSeeding}
                      >
                        {isSeeding ? 'Adding...' : 'Add Standard Elements'}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openDesignElementModal()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Element
                    </Button>
                  </div>
                </div>

                {designElements.length > 0 ? (
                  <div className="space-y-2">
                    {designElements.map((element) => (
                      <div
                        key={element.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div>
                            <p className="font-medium">{element.element_label}</p>
                            <p className="text-sm text-muted-foreground">
                              ₹{element.price} {element.price_type === 'per_unit' ? '/ unit' : '(fixed)'}
                            </p>
                          </div>
                          <Badge variant={element.is_active ? 'active' : 'secondary'}>
                            {element.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{element.price_type}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openDesignElementModal(element)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDesignItem(element)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cake className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No design elements configured</p>
                    <p className="text-sm">Add elements that AI should detect and price</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Outlet Form Modal */}
      <FormModal
        open={isOutletFormOpen}
        onOpenChange={setIsOutletFormOpen}
        title={editingOutlet ? 'Edit Outlet' : 'Add Outlet'}
      >
        <form onSubmit={handleSubmitOutlet} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="outletName">Outlet Name</Label>
            <Input
              id="outletName"
              value={outletData.outlet_name}
              onChange={(e) => setOutletData(prev => ({ ...prev, outlet_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outletAddress">Address</Label>
            <Textarea
              id="outletAddress"
              value={outletData.address}
              onChange={(e) => setOutletData(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outletPhone">Phone</Label>
            <Input
              id="outletPhone"
              value={outletData.phone}
              onChange={(e) => setOutletData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>

          {/* Operating Hours Section */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Operating Hours
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={outletData.opening_time}
                  onChange={(e) => setOutletData(prev => ({ ...prev, opening_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={outletData.closing_time}
                  onChange={(e) => setOutletData(prev => ({ ...prev, closing_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingBuffer">Buffer after opening (min)</Label>
                <Input
                  id="openingBuffer"
                  type="number"
                  min="0"
                  value={outletData.opening_buffer_minutes}
                  onChange={(e) => setOutletData(prev => ({ ...prev, opening_buffer_minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingBuffer">Buffer before closing (min)</Label>
                <Input
                  id="closingBuffer"
                  type="number"
                  min="0"
                  value={outletData.closing_buffer_minutes}
                  onChange={(e) => setOutletData(prev => ({ ...prev, closing_buffer_minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {(outletData.opening_time && outletData.closing_time) && (
              <p className="text-xs text-muted-foreground">
                Orders accepted: {outletData.opening_time} + {outletData.opening_buffer_minutes}min to {outletData.closing_time} - {outletData.closing_buffer_minutes}min
              </p>
            )}

            <div className="space-y-2">
              <Label>Open Days</Label>
              <div className="flex flex-wrap gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <label
                    key={day}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer text-sm border transition-colors",
                      outletData.opening_days.includes(day)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 border-border hover:bg-muted"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={outletData.opening_days.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOutletData(prev => ({ ...prev, opening_days: [...prev.opening_days, day] }));
                        } else {
                          setOutletData(prev => ({ ...prev, opening_days: prev.opening_days.filter(d => d !== day) }));
                        }
                      }}
                      className="sr-only"
                    />
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="outletActive"
              checked={outletData.is_active}
              onCheckedChange={(checked) => setOutletData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="outletActive">Active</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOutletFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreatingOutlet || isUpdatingOutlet}>
              {editingOutlet ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Delete Outlet Confirmation */}
      <ConfirmDialog
        open={!!deleteOutlet}
        onOpenChange={() => setDeleteOutlet(null)}
        title="Delete Outlet"
        description={`Are you sure you want to delete "${deleteOutlet?.outlet_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteOutlet}
        isLoading={isDeletingOutlet}
      />

      {/* Weight Pricing Modal */}
      <FormModal
        open={isWeightModalOpen}
        onOpenChange={setIsWeightModalOpen}
        title={editingWeight ? 'Edit Weight Pricing' : 'Add Weight Pricing'}
      >
        <form onSubmit={handleSubmitWeight} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weightGrams">Weight</Label>
            <Select
              value={String(weightFormData.weight_grams)}
              onValueChange={(value) => setWeightFormData(prev => ({ ...prev, weight_grams: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="250">250g</SelectItem>
                <SelectItem value="500">500g</SelectItem>
                <SelectItem value="750">750g</SelectItem>
                <SelectItem value="1000">1kg</SelectItem>
                <SelectItem value="1500">1.5kg</SelectItem>
                <SelectItem value="2000">2kg</SelectItem>
                <SelectItem value="2500">2.5kg</SelectItem>
                <SelectItem value="3000">3kg</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price (₹)</Label>
            <Input
              id="basePrice"
              type="number"
              min="0"
              value={weightFormData.base_price}
              onChange={(e) => setWeightFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsWeightModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreatingWeight || isUpdatingWeight}>
              {isCreatingWeight || isUpdatingWeight ? 'Saving...' : editingWeight ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Flavor Pricing Modal */}
      <FormModal
        open={isFlavorModalOpen}
        onOpenChange={setIsFlavorModalOpen}
        title={editingFlavor ? 'Edit Pricing' : 'Add Pricing'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmitFlavor} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="flavorName">Flavor Name</Label>
            <Input
              id="flavorName"
              value={flavorFormData.flavor_name}
              onChange={(e) => setFlavorFormData(prev => ({ ...prev, flavor_name: e.target.value }))}
              placeholder="e.g., Chocolate, Red Velvet"
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sizes & Prices</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFlavorFormData(prev => ({
                  ...prev,
                  sizes: [...prev.sizes, { name: '', price: 0, is_base: false }]
                }))}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Size
              </Button>
            </div>

            <div className="space-y-3">
              {flavorFormData.sizes.map((size, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground">Size Name / Weight</Label>
                    <Input
                      value={size.name}
                      onChange={(e) => {
                        const newSizes = [...flavorFormData.sizes];
                        newSizes[index].name = e.target.value;
                        setFlavorFormData(prev => ({ ...prev, sizes: newSizes }));
                      }}
                      placeholder="e.g. 500g, 1kg"
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="text-xs text-muted-foreground">Price (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={size.price}
                      onChange={(e) => {
                        const newSizes = [...flavorFormData.sizes];
                        newSizes[index].price = parseFloat(e.target.value) || 0;
                        setFlavorFormData(prev => ({ ...prev, sizes: newSizes }));
                      }}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-8">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`is-base-${index}`}
                        checked={size.is_base}
                        onChange={(e) => {
                          const newSizes = [...flavorFormData.sizes];
                          // Ensure we update using boolean
                          newSizes[index].is_base = e.target.checked;
                          setFlavorFormData(prev => ({ ...prev, sizes: newSizes }));
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`is-base-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Base
                      </label>
                    </div>
                  </div>
                  <div className="pt-8">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => {
                        const newSizes = flavorFormData.sizes.filter((_, i) => i !== index);
                        setFlavorFormData(prev => ({ ...prev, sizes: newSizes }));
                      }}
                      disabled={flavorFormData.sizes.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFlavorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreatingFlavor || isUpdatingFlavor}>
              {isCreatingFlavor || isUpdatingFlavor ? 'Saving...' : editingFlavor ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Design Element Modal */}
      <FormModal
        open={isDesignElementModalOpen}
        onOpenChange={setIsDesignElementModalOpen}
        title={editingDesignElement ? 'Edit Design Element' : 'Add Design Element'}
      >
        <form onSubmit={handleSubmitDesignElement} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="elementKey">Element Type</Label>
            <Select
              value={designFormData.element_key}
              onValueChange={(value) => {
                const found = predefinedDesignElements.find(e => e.key === value);
                setDesignFormData(prev => ({
                  ...prev,
                  element_key: value,
                  element_label: found?.label || prev.element_label
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select element type" />
              </SelectTrigger>
              <SelectContent>
                {predefinedDesignElements.map((elem) => (
                  <SelectItem key={elem.key} value={elem.key}>
                    {elem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="elementLabel">Display Label</Label>
            <Input
              id="elementLabel"
              value={designFormData.element_label}
              onChange={(e) => setDesignFormData(prev => ({ ...prev, element_label: e.target.value }))}
              placeholder="Label shown to customers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="elementPrice">Price (₹)</Label>
            <Input
              id="elementPrice"
              type="number"
              min="0"
              value={designFormData.price}
              onChange={(e) => setDesignFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Price Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priceType"
                  checked={designFormData.price_type === 'fixed'}
                  onChange={() => setDesignFormData(prev => ({ ...prev, price_type: 'fixed' }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">Fixed price</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priceType"
                  checked={designFormData.price_type === 'per_unit'}
                  onChange={() => setDesignFormData(prev => ({ ...prev, price_type: 'per_unit' }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">Per unit</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {designFormData.price_type === 'per_unit'
                ? 'Price multiplied by quantity (e.g., name letters, macarons)'
                : 'One-time charge regardless of quantity'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDesignElementModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreatingElement || isUpdatingElement}>
              {isCreatingElement || isUpdatingElement ? 'Saving...' : editingDesignElement ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Delete Weight Confirmation */}
      <ConfirmDialog
        open={!!deleteWeightItem}
        onOpenChange={() => setDeleteWeightItem(null)}
        title="Delete Weight Pricing"
        description={`Are you sure you want to delete pricing for ${deleteWeightItem ? formatWeight(deleteWeightItem.weight_grams) : ''}?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteWeight}
        isLoading={isDeletingWeight}
      />

      {/* Delete Flavor Confirmation */}
      <ConfirmDialog
        open={!!deleteFlavorItem}
        onOpenChange={() => setDeleteFlavorItem(null)}
        title="Delete Flavor Pricing"
        description={`Are you sure you want to delete "${deleteFlavorItem?.flavor_name}" flavor?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteFlavor}
        isLoading={isDeletingFlavor}
      />

      {/* Delete Design Element Confirmation */}
      <ConfirmDialog
        open={!!deleteDesignItem}
        onOpenChange={() => setDeleteDesignItem(null)}
        title="Delete Design Element"
        description={`Are you sure you want to delete "${deleteDesignItem?.element_label}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteDesignElement}
        isLoading={isDeletingElement}
      />
    </div>
  );
};

export default CompanyProfile;
