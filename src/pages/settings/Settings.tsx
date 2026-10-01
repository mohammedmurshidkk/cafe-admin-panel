import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Plus, Pencil, Trash2, Upload, Check } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useGetBusinessProfileQuery,
  useUpdateBusinessProfileMutation,
  useUploadBusinessLogoMutation,
  useCreateOutletMutation,
  useUpdateOutletMutation,
  useDeleteOutletMutation,
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
  WeightPricing,
  FlavorPricing,
  FlavorSize,
  DesignElement,
} from '@/store/api/cakePricingApi';
import {
  useGetAiSettingsQuery,
  useUpdateAiSettingsMutation,
  useListTemplatesQuery,
  AIPersonality,
} from '@/store/api/aiPromptsApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Outlet } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useFeatures } from '@/hooks/useFeatures';

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-surface-container-low rounded-lg border border-transparent focus:outline-none focus:border-primary-container text-on-surface placeholder:text-on-surface-variant/60 transition-colors';
const labelClass = 'block text-xs font-medium text-on-surface-variant mb-1.5';

type Section = 'business' | 'fulfillment' | 'outlets' | 'ai' | 'cake' | 'menu';

const navItems: { id: Section; label: string; icon: string; feature?: string }[] = [
  { id: 'business', label: 'Business Info', icon: 'business' },
  { id: 'fulfillment', label: 'Fulfillment', icon: 'local_shipping', feature: 'delivery_management' },
  { id: 'outlets', label: 'Outlets', icon: 'store', feature: 'outlets' },
  { id: 'ai', label: 'AI Configuration', icon: 'smart_toy', feature: 'ai_settings' },
  { id: 'cake', label: 'Cake Pricing', icon: 'cake', feature: 'cake_pricing' },
  { id: 'menu', label: 'Menu PDF', icon: 'picture_as_pdf', feature: 'menu_pdf' },
];

const PERSONALITIES = [
  { id: 'friendly', label: 'Friendly', desc: 'Warm, empathetic, uses emojis sparingly.', emoji: '😊' },
  { id: 'professional', label: 'Professional', desc: 'Formal, efficient, direct, and helpful.', emoji: '💼' },
  { id: 'casual', label: 'Casual', desc: 'Relaxed, conversational, like a friend.', emoji: '🤙' },
  { id: 'formal', label: 'Formal', desc: 'Very polite, traditional, strictly business.', emoji: '🎩' },
];

const SectionCard = ({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white border border-on-surface/10 rounded-2xl overflow-hidden">
    <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-[20px] text-primary-container">{icon}</span>
      </div>
      <div>
        <h3 className="font-semibold text-sm text-on-surface">{title}</h3>
        {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-on-surface">{label}</p>
      {description && <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-primary-container' : 'bg-surface-container-highest'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  </div>
);

const Settings = () => {
  const [activeSection, setActiveSection] = useState<Section>('business');
  const { isFeatureEnabled } = useFeatures();

  // Business API
  const { data, isLoading } = useGetBusinessProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateBusinessProfileMutation();
  const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadBusinessLogoMutation();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Outlets
  const [createOutlet] = useCreateOutletMutation();
  const [updateOutlet] = useUpdateOutletMutation();
  const [deleteOutletMutation] = useDeleteOutletMutation();

  // Cake Pricing
  const { data: cakePricingData } = useGetCakePricingConfigQuery();
  const [updateCakePricingConfig] = useUpdateCakePricingConfigMutation();
  const [createWeight] = useCreateWeightMutation();
  const [updateWeightApi] = useUpdateWeightMutation();
  const [deleteWeightApi] = useDeleteWeightMutation();
  const [createFlavor] = useCreateFlavorMutation();
  const [updateFlavorApi] = useUpdateFlavorMutation();
  const [deleteFlavorApi] = useDeleteFlavorMutation();
  const [createDesignElement] = useCreateDesignElementMutation();
  const [updateDesignElementApi] = useUpdateDesignElementMutation();
  const [deleteDesignElementApi] = useDeleteDesignElementMutation();

  // AI Settings
  const { data: aiSettings } = useGetAiSettingsQuery();
  const { data: templates } = useListTemplatesQuery();
  const [updateAiSettings, { isLoading: isAiSaving }] = useUpdateAiSettingsMutation();

  // Business form state
  const [businessName, setBusinessName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [criticalMessage, setCriticalMessage] = useState('');
  const [criticalEnabled, setCriticalEnabled] = useState(false);
  const [orderNumberPrefix, setOrderNumberPrefix] = useState('');
  const [customerSupportPhone, setCustomerSupportPhone] = useState('');

  // Fulfillment form state
  const [supportsDelivery, setSupportsDelivery] = useState(true);
  const [supportsTakeaway, setSupportsTakeaway] = useState(true);
  const [freeRadiusMeters, setFreeRadiusMeters] = useState(0);
  const [minimumDeliveryCharge, setMinimumDeliveryCharge] = useState(0);
  const [minimumChargeDistanceMeters, setMinimumChargeDistanceMeters] = useState(0);
  const [incrementPerKm, setIncrementPerKm] = useState(0);
  const [maxDeliveryRadiusMeters, setMaxDeliveryRadiusMeters] = useState(0);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(0);
  const [minimumWaitMinutes, setMinimumWaitMinutes] = useState(30);

  // AI form state
  const [personality, setPersonality] = useState<AIPersonality>('friendly');
  const [instructionsEnabled, setInstructionsEnabled] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [greetingId, setGreetingId] = useState<string | null>(null);
  const [farewellId, setFarewellId] = useState<string | null>(null);

  // Outlet modals
  const [isOutletFormOpen, setIsOutletFormOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [deleteOutletTarget, setDeleteOutletTarget] = useState<Outlet | null>(null);
  const [outletData, setOutletData] = useState({
    outlet_name: '',
    address: '',
    phone: '',
    is_active: true,
    opening_time: '',
    closing_time: '',
    opening_buffer_minutes: 0,
    closing_buffer_minutes: 0,
    opening_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as string[],
    printer_ip: '',
  });

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
  const [weightFormData, setWeightFormData] = useState({ weight_grams: 500, base_price: 0 });
  const [flavorFormData, setFlavorFormData] = useState<{ flavor_name: string; sizes: FlavorSize[] }>({
    flavor_name: '',
    sizes: [{ name: '500g', price: 0, is_base: false }],
  });
  const [designFormData, setDesignFormData] = useState({
    element_key: '',
    element_label: '',
    price: 0,
    price_type: 'fixed' as 'fixed' | 'per_unit',
  });

  // Populate business form from API
  useEffect(() => {
    if (data?.business) {
      const b = data.business;
      setBusinessName(b.name);
      setWelcomeMessage(b.welcome_message);
      setThankYouMessage(b.thank_you_message);
      setCustomAiPrompt(b.custom_ai_prompt);
      setCriticalMessage(b.critical_message);
      setCriticalEnabled(b.critical_message_enabled);
      setOrderNumberPrefix(b.order_number_prefix || '');
      setCustomerSupportPhone(b.customer_support_phone || '');
      setSupportsDelivery(b.supports_delivery);
      setSupportsTakeaway(b.supports_takeaway);
      setFreeRadiusMeters(b.free_radius_meters || 0);
      setMinimumDeliveryCharge(b.minimum_delivery_charge || 0);
      setMinimumChargeDistanceMeters(b.minimum_charge_distance_meters || 0);
      setIncrementPerKm(b.increment_per_km || 0);
      setMaxDeliveryRadiusMeters(b.max_delivery_radius_meters || 0);
      setFreeDeliveryAbove(b.free_delivery_above || 0);
      setMinimumWaitMinutes(b.minimum_wait_minutes || 30);
    }
  }, [data]);

  // Populate AI form from API
  useEffect(() => {
    if (aiSettings) {
      setPersonality(aiSettings.ai_personality);
      setInstructionsEnabled(aiSettings.ai_instructions_enabled);
      setCustomInstructions(aiSettings.ai_custom_instructions || '');
      setGreetingId(aiSettings.ai_greeting_template_id);
      setFarewellId(aiSettings.ai_farewell_template_id);
    }
  }, [aiSettings]);

  const cakePricingConfig = cakePricingData?.data;
  const weightPricing = cakePricingConfig?.weights || [];
  const flavorPricing = cakePricingConfig?.flavors || [];
  const designElements = cakePricingConfig?.elements || [];
  const greetingTemplates = templates?.filter((t) => t?.template_type === 'greeting') || [];
  const farewellTemplates = templates?.filter((t) => t?.template_type === 'farewell') || [];

  const visibleNavItems = navItems.filter(
    (item) => !item.feature || isFeatureEnabled(item.feature as any)
  );

  // Save handlers
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
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleSaveAi = async () => {
    try {
      await updateAiSettings({
        ai_personality: personality,
        ai_instructions_enabled: instructionsEnabled,
        ai_custom_instructions: customInstructions,
        ai_greeting_template_id: greetingId,
        ai_farewell_template_id: farewellId,
      }).unwrap();
      toast.success('AI settings saved');
    } catch {
      toast.error('Failed to save AI settings');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      await uploadLogo(formData).unwrap();
      toast.success('Logo uploaded');
    } catch {
      toast.error('Failed to upload logo');
    }
  };

  // Outlet handlers
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
        printer_ip: outlet.printer_ip || '',
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
        opening_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        printer_ip: '',
      });
    }
    setIsOutletFormOpen(true);
  };

  const handleSubmitOutlet = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editingOutlet) {
        await updateOutlet({ id: editingOutlet.id, ...outletData }).unwrap();
        toast.success('Outlet updated');
      } else {
        await createOutlet(outletData).unwrap();
        toast.success('Outlet created');
      }
      setIsOutletFormOpen(false);
    } catch {
      toast.error('Failed to save outlet');
    }
  };

  const handleDeleteOutlet = async () => {
    if (!deleteOutletTarget) return;
    try {
      await deleteOutletMutation(deleteOutletTarget.id).unwrap();
      toast.success('Outlet deleted');
      setDeleteOutletTarget(null);
    } catch {
      toast.error('Failed to delete outlet');
    }
  };

  // Cake pricing handlers
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
      setFlavorFormData({ flavor_name: flavor.flavor_name, sizes: flavor.sizes || [] });
    } else {
      setEditingFlavor(null);
      setFlavorFormData({ flavor_name: '', sizes: [{ name: '500g', price: 0, is_base: false }] });
    }
    setIsFlavorModalOpen(true);
  };

  const openDesignElementModal = (element?: DesignElement) => {
    if (element) {
      setEditingDesignElement(element);
      setDesignFormData({ element_key: element.element_key, element_label: element.element_label, price: element.price, price_type: element.price_type });
    } else {
      setEditingDesignElement(null);
      setDesignFormData({ element_key: '', element_label: '', price: 0, price_type: 'fixed' });
    }
    setIsDesignElementModalOpen(true);
  };

  const handleSubmitWeight = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editingWeight) {
        await updateWeightApi({ id: editingWeight.id, base_price: weightFormData.base_price }).unwrap();
        toast.success('Weight updated');
      } else {
        await createWeight(weightFormData).unwrap();
        toast.success('Weight added');
      }
      setIsWeightModalOpen(false);
    } catch {
      toast.error('Failed to save weight pricing');
    }
  };

  const handleSubmitFlavor = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editingFlavor) {
        await updateFlavorApi({ id: editingFlavor.id, ...flavorFormData }).unwrap();
        toast.success('Flavor updated');
      } else {
        await createFlavor(flavorFormData).unwrap();
        toast.success('Flavor added');
      }
      setIsFlavorModalOpen(false);
    } catch {
      toast.error('Failed to save flavor');
    }
  };

  const handleSubmitDesignElement = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editingDesignElement) {
        await updateDesignElementApi({ id: editingDesignElement.id, ...designFormData }).unwrap();
        toast.success('Element updated');
      } else {
        await createDesignElement(designFormData).unwrap();
        toast.success('Element added');
      }
      setIsDesignElementModalOpen(false);
    } catch {
      toast.error('Failed to save element');
    }
  };

  const handleDeleteWeight = async () => {
    if (!deleteWeightItem) return;
    try {
      await deleteWeightApi(deleteWeightItem.id).unwrap();
      toast.success('Weight deleted');
      setDeleteWeightItem(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteFlavor = async () => {
    if (!deleteFlavorItem) return;
    try {
      await deleteFlavorApi(deleteFlavorItem.id).unwrap();
      toast.success('Flavor deleted');
      setDeleteFlavorItem(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteDesignElement = async () => {
    if (!deleteDesignItem) return;
    try {
      await deleteDesignElementApi(deleteDesignItem.id).unwrap();
      toast.success('Element deleted');
      setDeleteDesignItem(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCakePricingToggle = async (enabled: boolean) => {
    try {
      await updateCakePricingConfig({ enabled }).unwrap();
    } catch {
      toast.error('Failed to update');
    }
  };

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const toggleDay = (day: string) => {
    setOutletData((prev) => ({
      ...prev,
      opening_days: prev.opening_days.includes(day)
        ? prev.opening_days.filter((d) => d !== day)
        : [...prev.opening_days, day],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Manage your business profile, fulfillment, and AI configuration.</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left Sub-Nav */}
        <div className="w-52 flex-shrink-0 sticky top-6">
          <div className="bg-white border border-on-surface/10 rounded-2xl overflow-hidden">
            <nav className="py-2">
              {visibleNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                    activeSection === item.id
                      ? 'bg-blush text-brand-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  )}
                >
                  <span className={cn(
                    'material-symbols-outlined text-[18px] flex-shrink-0',
                    activeSection === item.id ? 'text-brand-primary' : ''
                  )}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── BUSINESS INFO ── */}
          {activeSection === 'business' && (
            <>
              <SectionCard icon="business" title="Business Info" subtitle="Your public business identity">
                <div className="space-y-4">
                  {/* Logo */}
                  <div>
                    <label className={labelClass}>Business Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-surface-container-low flex items-center justify-center overflow-hidden flex-shrink-0">
                        {data?.business?.logo_url ? (
                          <img src={data.business.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">store</span>
                        )}
                      </div>
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-on-surface/15 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Business Name</label>
                      <input className={inputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Baker's Delight" />
                    </div>
                    <div>
                      <label className={labelClass}>Customer Support Phone</label>
                      <input className={inputClass} value={customerSupportPhone} onChange={(e) => setCustomerSupportPhone(e.target.value)} placeholder="+91 9876543210" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Order Number Prefix</label>
                    <input className={inputClass} value={orderNumberPrefix} onChange={(e) => setOrderNumberPrefix(e.target.value)} placeholder="e.g. ORD" />
                    <p className="text-xs text-on-surface-variant mt-1.5">Orders will be numbered like {orderNumberPrefix || 'ORD'}-001</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon="chat" title="Messaging" subtitle="WhatsApp chat messages sent to customers">
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Welcome Message</label>
                    <textarea className={cn(inputClass, 'resize-none')} rows={3} value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Greeting message when customer first messages..." />
                  </div>
                  <div>
                    <label className={labelClass}>Thank You Message</label>
                    <textarea className={cn(inputClass, 'resize-none')} rows={3} value={thankYouMessage} onChange={(e) => setThankYouMessage(e.target.value)} placeholder="Message sent after order is placed..." />
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon="warning" title="Critical Alert" subtitle="Override AI with an urgent message">
                <div className="space-y-4">
                  <Toggle
                    checked={criticalEnabled}
                    onChange={setCriticalEnabled}
                    label="Enable Critical Message"
                    description="When enabled, this message is shown to all customers instead of normal AI responses."
                  />
                  {criticalEnabled && (
                    <div>
                      <label className={labelClass}>Message</label>
                      <textarea className={cn(inputClass, 'resize-none')} rows={3} value={criticalMessage} onChange={(e) => setCriticalMessage(e.target.value)} placeholder="e.g. We're closed today for a holiday. We'll be back tomorrow!" />
                    </div>
                  )}
                </div>
              </SectionCard>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    if (data?.business) {
                      const b = data.business;
                      setBusinessName(b.name);
                      setWelcomeMessage(b.welcome_message);
                      setThankYouMessage(b.thank_you_message);
                      setCriticalMessage(b.critical_message);
                      setCriticalEnabled(b.critical_message_enabled);
                      setOrderNumberPrefix(b.order_number_prefix || '');
                      setCustomerSupportPhone(b.customer_support_phone || '');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-container text-white hover:bg-brand-primary transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}

          {/* ── FULFILLMENT ── */}
          {activeSection === 'fulfillment' && (
            <>
              <SectionCard icon="local_shipping" title="Fulfillment Methods" subtitle="Control delivery and takeaway availability">
                <div className="space-y-4">
                  <Toggle checked={supportsDelivery} onChange={setSupportsDelivery} label="Delivery" description="Accept orders for delivery to customer addresses" />
                  <div className="border-t border-outline-variant/30 pt-4">
                    <Toggle checked={supportsTakeaway} onChange={setSupportsTakeaway} label="Takeaway / Pickup" description="Allow customers to collect orders from your outlet" />
                  </div>
                </div>
              </SectionCard>

              {supportsDelivery && (
                <SectionCard icon="payments" title="Delivery Charges" subtitle="Configure delivery fee structure">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Free Delivery Radius (meters)</label>
                      <input type="number" className={inputClass} value={freeRadiusMeters} onChange={(e) => setFreeRadiusMeters(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelClass}>Minimum Delivery Charge (₹)</label>
                      <input type="number" className={inputClass} value={minimumDeliveryCharge} onChange={(e) => setMinimumDeliveryCharge(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelClass}>Min Charge Distance (meters)</label>
                      <input type="number" className={inputClass} value={minimumChargeDistanceMeters} onChange={(e) => setMinimumChargeDistanceMeters(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelClass}>Charge per km (₹)</label>
                      <input type="number" className={inputClass} value={incrementPerKm} onChange={(e) => setIncrementPerKm(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelClass}>Max Delivery Radius (meters)</label>
                      <input type="number" className={inputClass} value={maxDeliveryRadiusMeters} onChange={(e) => setMaxDeliveryRadiusMeters(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelClass}>Free Delivery Above (₹)</label>
                      <input type="number" className={inputClass} value={freeDeliveryAbove} onChange={(e) => setFreeDeliveryAbove(Number(e.target.value))} />
                    </div>
                  </div>
                </SectionCard>
              )}

              <SectionCard icon="schedule" title="Order Timing" subtitle="Minimum preparation time for orders">
                <div className="max-w-xs">
                  <label className={labelClass}>Minimum Wait Time (minutes)</label>
                  <input type="number" className={inputClass} value={minimumWaitMinutes} onChange={(e) => setMinimumWaitMinutes(Number(e.target.value))} />
                  <p className="text-xs text-on-surface-variant mt-1.5">Customers will be told orders take at least {minimumWaitMinutes} minutes.</p>
                </div>
              </SectionCard>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    if (data?.business) {
                      const b = data.business;
                      setSupportsDelivery(b.supports_delivery);
                      setSupportsTakeaway(b.supports_takeaway);
                      setFreeRadiusMeters(b.free_radius_meters || 0);
                      setMinimumDeliveryCharge(b.minimum_delivery_charge || 0);
                      setMinimumChargeDistanceMeters(b.minimum_charge_distance_meters || 0);
                      setIncrementPerKm(b.increment_per_km || 0);
                      setMaxDeliveryRadiusMeters(b.max_delivery_radius_meters || 0);
                      setFreeDeliveryAbove(b.free_delivery_above || 0);
                      setMinimumWaitMinutes(b.minimum_wait_minutes || 30);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-container text-white hover:bg-brand-primary transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}

          {/* ── OUTLETS ── */}
          {activeSection === 'outlets' && (
            <>
              <SectionCard icon="store" title="Outlets" subtitle="Manage your physical store locations">
                <div className="space-y-3">
                  {data?.outlets?.length ? (
                    data.outlets.map((outlet) => (
                      <div key={outlet.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            outlet.is_active ? 'bg-tertiary-ds/10' : 'bg-surface-container-highest'
                          )}>
                            <span className={cn(
                              'material-symbols-outlined text-[18px]',
                              outlet.is_active ? 'text-tertiary-ds' : 'text-on-surface-variant'
                            )}>store</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">{outlet.outlet_name}</p>
                            <p className="text-xs text-on-surface-variant">{outlet.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            outlet.is_active ? 'bg-tertiary-ds/10 text-tertiary-ds' : 'bg-surface-container-highest text-on-surface-variant'
                          )}>
                            {outlet.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <button onClick={() => openOutletForm(outlet)} className="p-1.5 rounded-lg hover:bg-white transition-colors text-on-surface-variant">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteOutletTarget(outlet)} className="p-1.5 rounded-lg hover:bg-error-container transition-colors text-on-surface-variant hover:text-on-error-container">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant text-center py-6">No outlets yet</p>
                  )}

                  <button
                    onClick={() => openOutletForm()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-on-surface/20 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Outlet
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── AI CONFIGURATION ── */}
          {activeSection === 'ai' && (
            <>
              <SectionCard icon="psychology" title="AI Personality" subtitle="Set the tone of your AI assistant">
                <div className="grid sm:grid-cols-2 gap-3">
                  {PERSONALITIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPersonality(p.id as AIPersonality)}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border text-left transition-colors',
                        personality === p.id
                          ? 'border-primary-container bg-blush'
                          : 'border-on-surface/10 bg-surface-container-low hover:bg-surface-container'
                      )}
                    >
                      <span className="text-xl flex-shrink-0">{p.emoji}</span>
                      <div>
                        <p className={cn(
                          'text-sm font-semibold',
                          personality === p.id ? 'text-brand-primary' : 'text-on-surface'
                        )}>{p.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{p.desc}</p>
                      </div>
                      {personality === p.id && (
                        <Check className="h-4 w-4 text-primary-container ml-auto flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard icon="chat_bubble" title="Message Templates" subtitle="Default greeting and farewell messages">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Greeting Template</label>
                    <Select value={greetingId || 'none'} onValueChange={(v) => setGreetingId(v === 'none' ? null : v)}>
                      <SelectTrigger className={inputClass + ' h-auto'}>
                        <SelectValue placeholder="Select greeting..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {greetingTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className={labelClass}>Farewell Template</label>
                    <Select value={farewellId || 'none'} onValueChange={(v) => setFarewellId(v === 'none' ? null : v)}>
                      <SelectTrigger className={inputClass + ' h-auto'}>
                        <SelectValue placeholder="Select farewell..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {farewellTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon="tune" title="Custom Instructions" subtitle="Fine-tune AI behaviour beyond personality">
                <div className="space-y-4">
                  <Toggle
                    checked={instructionsEnabled}
                    onChange={setInstructionsEnabled}
                    label="Enable Custom Instructions"
                    description="Provide additional guidance to the AI on how to handle conversations."
                  />
                  {instructionsEnabled && (
                    <div>
                      <label className={labelClass}>Instructions</label>
                      <textarea
                        className={cn(inputClass, 'resize-none')}
                        rows={5}
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="e.g. Always suggest the daily special. Never discuss competitor products..."
                      />
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard icon="edit_note" title="AI Prompt Override" subtitle="Advanced: inject text directly into the system prompt">
                <div>
                  <textarea
                    className={cn(inputClass, 'resize-none')}
                    rows={6}
                    value={customAiPrompt}
                    onChange={(e) => setCustomAiPrompt(e.target.value)}
                    placeholder="Optional additional context injected into every AI call..."
                  />
                </div>
              </SectionCard>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    if (aiSettings) {
                      setPersonality(aiSettings.ai_personality);
                      setInstructionsEnabled(aiSettings.ai_instructions_enabled);
                      setCustomInstructions(aiSettings.ai_custom_instructions || '');
                      setGreetingId(aiSettings.ai_greeting_template_id);
                      setFarewellId(aiSettings.ai_farewell_template_id);
                    }
                    if (data?.business) {
                      setCustomAiPrompt(data.business.custom_ai_prompt);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  onClick={async () => {
                    await Promise.all([handleSaveAi(), handleSaveProfile()]);
                  }}
                  disabled={isSaving || isAiSaving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-container text-white hover:bg-brand-primary transition-colors disabled:opacity-50"
                >
                  {isSaving || isAiSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}

          {/* ── CAKE PRICING ── */}
          {activeSection === 'cake' && (
            <>
              <SectionCard icon="cake" title="Cake Pricing" subtitle="Configure weights, flavors, and design elements">
                <div className="space-y-5">
                  <Toggle
                    checked={cakePricingConfig?.enabled ?? false}
                    onChange={handleCakePricingToggle}
                    label="Enable Cake Pricing"
                    description="AI will provide custom quotes based on weight, flavor, and design choices."
                  />

                  {/* Weights */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-on-surface">Weight Pricing</h4>
                      <button onClick={() => openWeightModal()} className="flex items-center gap-1.5 text-xs text-primary-container font-medium hover:text-brand-primary">
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {/* {weightPricing?.map((w) => (
                        <div key={w.id} className="flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-xl">
                          <span className="text-sm text-on-surface">{w.weight_grams}g</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-on-surface">₹{w.base_price}</span>
                            <button onClick={() => openWeightModal(w)} className="p-1 rounded hover:bg-white text-on-surface-variant"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeleteWeightItem(w)} className="p-1 rounded hover:bg-error-container text-on-surface-variant hover:text-on-error-container"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))} */}
                      {!weightPricing.length && <p className="text-xs text-on-surface-variant text-center py-4">No weights added yet</p>}
                    </div>
                  </div>

                  {/* Flavors */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-on-surface">Flavors</h4>
                      <button onClick={() => openFlavorModal()} className="flex items-center gap-1.5 text-xs text-primary-container font-medium hover:text-brand-primary">
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {flavorPricing.map((f) => (
                        <div key={f.id} className="flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-xl">
                          <span className="text-sm text-on-surface">{f.flavor_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-on-surface-variant">{f.sizes?.length || 0} sizes</span>
                            <button onClick={() => openFlavorModal(f)} className="p-1 rounded hover:bg-white text-on-surface-variant"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeleteFlavorItem(f)} className="p-1 rounded hover:bg-error-container text-on-surface-variant hover:text-on-error-container"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))}
                      {!flavorPricing.length && <p className="text-xs text-on-surface-variant text-center py-4">No flavors added yet</p>}
                    </div>
                  </div>

                  {/* Design Elements */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-on-surface">Design Elements</h4>
                      <button onClick={() => openDesignElementModal()} className="flex items-center gap-1.5 text-xs text-primary-container font-medium hover:text-brand-primary">
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {designElements.map((el) => (
                        <div key={el.id} className="flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-xl">
                          <span className="text-sm text-on-surface">{el.element_label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-on-surface">₹{el.price}</span>
                            <button onClick={() => openDesignElementModal(el)} className="p-1 rounded hover:bg-white text-on-surface-variant"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeleteDesignItem(el)} className="p-1 rounded hover:bg-error-container text-on-surface-variant hover:text-on-error-container"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))}
                      {!designElements.length && <p className="text-xs text-on-surface-variant text-center py-4">No elements added yet</p>}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── MENU PDF ── */}
          {activeSection === 'menu' && (
            <SectionCard icon="picture_as_pdf" title="Menu PDF" subtitle="Upload or generate a PDF menu for customers">
              <div className="text-center py-10 text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] opacity-25 block mb-3">picture_as_pdf</span>
                <p className="text-sm">Menu PDF management coming soon.</p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Outlet Form Modal */}
      <FormModal
        open={isOutletFormOpen}
        onClose={() => setIsOutletFormOpen(false)}
        title={editingOutlet ? 'Edit Outlet' : 'Add Outlet'}
        onSubmit={handleSubmitOutlet}
      >
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Outlet Name</label>
            <input className={inputClass} value={outletData.outlet_name} onChange={(e) => setOutletData((p) => ({ ...p, outlet_name: e.target.value }))} required />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={outletData.address} onChange={(e) => setOutletData((p) => ({ ...p, address: e.target.value }))} required />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={outletData.phone} onChange={(e) => setOutletData((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Opening Time</label>
              <input type="time" className={inputClass} value={outletData.opening_time} onChange={(e) => setOutletData((p) => ({ ...p, opening_time: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Closing Time</label>
              <input type="time" className={inputClass} value={outletData.closing_time} onChange={(e) => setOutletData((p) => ({ ...p, closing_time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Open Days</label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors',
                    outletData.opening_days.includes(day)
                      ? 'bg-primary-container text-white'
                      : 'bg-surface-container-low text-on-surface-variant'
                  )}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Printer IP (optional)</label>
            <input className={inputClass} value={outletData.printer_ip} onChange={(e) => setOutletData((p) => ({ ...p, printer_ip: e.target.value }))} placeholder="192.168.1.100" />
          </div>
          <Toggle checked={outletData.is_active} onChange={(v) => setOutletData((p) => ({ ...p, is_active: v }))} label="Active" />
        </div>
      </FormModal>

      {/* Weight Modal */}
      <FormModal
        open={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title={editingWeight ? 'Edit Weight' : 'Add Weight'}
        onSubmit={handleSubmitWeight}
      >
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Weight (grams)</label>
            <input type="number" className={inputClass} value={weightFormData.weight_grams} onChange={(e) => setWeightFormData((p) => ({ ...p, weight_grams: Number(e.target.value) }))} disabled={!!editingWeight} />
          </div>
          <div>
            <label className={labelClass}>Base Price (₹)</label>
            <input type="number" className={inputClass} value={weightFormData.base_price} onChange={(e) => setWeightFormData((p) => ({ ...p, base_price: Number(e.target.value) }))} />
          </div>
        </div>
      </FormModal>

      {/* Flavor Modal */}
      <FormModal
        open={isFlavorModalOpen}
        onClose={() => setIsFlavorModalOpen(false)}
        title={editingFlavor ? 'Edit Flavor' : 'Add Flavor'}
        onSubmit={handleSubmitFlavor}
      >
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Flavor Name</label>
            <input className={inputClass} value={flavorFormData.flavor_name} onChange={(e) => setFlavorFormData((p) => ({ ...p, flavor_name: e.target.value }))} required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Sizes</label>
              <button
                type="button"
                onClick={() => setFlavorFormData((p) => ({ ...p, sizes: [...p.sizes, { name: '', price: 0, is_base: false }] }))}
                className="text-xs text-primary-container font-medium"
              >
                + Add Size
              </button>
            </div>
            <div className="space-y-2">
              {flavorFormData.sizes.map((size, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className={cn(inputClass, 'flex-1')} placeholder="e.g. 500g" value={size.name} onChange={(e) => {
                    const s = [...flavorFormData.sizes];
                    s[i] = { ...s[i], name: e.target.value };
                    setFlavorFormData((p) => ({ ...p, sizes: s }));
                  }} />
                  <input type="number" className={cn(inputClass, 'w-24')} placeholder="₹" value={size.price} onChange={(e) => {
                    const s = [...flavorFormData.sizes];
                    s[i] = { ...s[i], price: Number(e.target.value) };
                    setFlavorFormData((p) => ({ ...p, sizes: s }));
                  }} />
                  {flavorFormData.sizes.length > 1 && (
                    <button type="button" onClick={() => setFlavorFormData((p) => ({ ...p, sizes: p.sizes.filter((_, idx) => idx !== i) }))} className="p-1.5 text-on-surface-variant hover:text-on-error-container">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </FormModal>

      {/* Design Element Modal */}
      <FormModal
        open={isDesignElementModalOpen}
        onClose={() => setIsDesignElementModalOpen(false)}
        title={editingDesignElement ? 'Edit Element' : 'Add Design Element'}
        onSubmit={handleSubmitDesignElement}
      >
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Element Key</label>
            <input className={inputClass} value={designFormData.element_key} onChange={(e) => setDesignFormData((p) => ({ ...p, element_key: e.target.value }))} placeholder="e.g. photo_print" disabled={!!editingDesignElement} />
          </div>
          <div>
            <label className={labelClass}>Label</label>
            <input className={inputClass} value={designFormData.element_label} onChange={(e) => setDesignFormData((p) => ({ ...p, element_label: e.target.value }))} placeholder="e.g. Photo Print" />
          </div>
          <div>
            <label className={labelClass}>Price (₹)</label>
            <input type="number" className={inputClass} value={designFormData.price} onChange={(e) => setDesignFormData((p) => ({ ...p, price: Number(e.target.value) }))} />
          </div>
          <div>
            <label className={labelClass}>Price Type</label>
            <div className="flex gap-2">
              {(['fixed', 'per_unit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDesignFormData((p) => ({ ...p, price_type: t }))}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
                    designFormData.price_type === t ? 'bg-primary-container text-white' : 'bg-surface-container-low text-on-surface-variant'
                  )}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormModal>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!deleteOutletTarget}
        title="Delete Outlet"
        description={`Remove "${deleteOutletTarget?.outlet_name}"? This cannot be undone.`}
        onConfirm={handleDeleteOutlet}
        onCancel={() => setDeleteOutletTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteWeightItem}
        title="Delete Weight"
        description={`Remove ${deleteWeightItem?.weight_grams}g pricing?`}
        onConfirm={handleDeleteWeight}
        onCancel={() => setDeleteWeightItem(null)}
      />
      <ConfirmDialog
        open={!!deleteFlavorItem}
        title="Delete Flavor"
        description={`Remove "${deleteFlavorItem?.flavor_name}"?`}
        onConfirm={handleDeleteFlavor}
        onCancel={() => setDeleteFlavorItem(null)}
      />
      <ConfirmDialog
        open={!!deleteDesignItem}
        title="Delete Design Element"
        description={`Remove "${deleteDesignItem?.element_label}"?`}
        onConfirm={handleDeleteDesignElement}
        onCancel={() => setDeleteDesignItem(null)}
      />
    </div>
  );
};

export default Settings;
