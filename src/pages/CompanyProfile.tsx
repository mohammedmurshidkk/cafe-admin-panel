import { useState, useEffect } from 'react';
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
  ImageIcon
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
import { 
  useGetBusinessProfileQuery,
  useUpdateBusinessProfileMutation,
  useCreateOutletMutation,
  useUpdateOutletMutation,
  useDeleteOutletMutation
} from '@/store/api/businessApi';
import { Outlet } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CompanyProfile = () => {
  const { data, isLoading } = useGetBusinessProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateBusinessProfileMutation();
  const [createOutlet, { isLoading: isCreatingOutlet }] = useCreateOutletMutation();
  const [updateOutlet, { isLoading: isUpdatingOutlet }] = useUpdateOutletMutation();
  const [deleteOutletMutation, { isLoading: isDeletingOutlet }] = useDeleteOutletMutation();

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [criticalMessage, setCriticalMessage] = useState('');
  const [criticalEnabled, setCriticalEnabled] = useState(false);

  // Outlet states
  const [isOutletFormOpen, setIsOutletFormOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [deleteOutlet, setDeleteOutlet] = useState<Outlet | null>(null);
  const [outletData, setOutletData] = useState({ name: '', address: '', phone: '', is_active: true });

  useEffect(() => {
    if (data?.business) {
      setBusinessName(data.business.name);
      setWelcomeMessage(data.business.welcome_message);
      setThankYouMessage(data.business.thank_you_message);
      setCustomAiPrompt(data.business.custom_ai_prompt);
      setCriticalMessage(data.business.critical_message);
      setCriticalEnabled(data.business.critical_message_enabled);
    }
  }, [data]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: businessName,
        welcome_message: welcomeMessage,
        thank_you_message: thankYouMessage,
        custom_ai_prompt: customAiPrompt,
        critical_message: criticalMessage,
        critical_message_enabled: criticalEnabled,
      }).unwrap();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const openOutletForm = (outlet?: Outlet) => {
    if (outlet) {
      setEditingOutlet(outlet);
      setOutletData({
        name: outlet.outlet_name,
        address: outlet.address,
        phone: outlet.phone,
        is_active: outlet.is_active,
      });
    } else {
      setEditingOutlet(null);
      setOutletData({ name: '', address: '', phone: '', is_active: true });
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
              value={data?.business.phone_number || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Registered with Meta - cannot be changed
            </p>
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
            <Button variant="outline">Upload Logo</Button>
          </div>
        </div>
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

      {/* Message Templates */}
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
            <Label htmlFor="thankyou">Thank You Message</Label>
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
              value={outletData.name}
              onChange={(e) => setOutletData(prev => ({ ...prev, name: e.target.value }))}
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
        description={`Are you sure you want to delete "${deleteOutlet?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteOutlet}
        isLoading={isDeletingOutlet}
      />
    </div>
  );
};

export default CompanyProfile;
