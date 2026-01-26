import { useState, useRef } from 'react';
import { MenuImportModal } from '@/components/menu/MenuImportModal';
import { Plus, Pencil, Trash2, UtensilsCrossed, ImageIcon, X, Upload, Search, RefreshCw, FileText, ExternalLink, Settings, Star } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useUploadMenuItemImageMutation,
  useSyncMenuPdfMutation,
  useLazyGetMenuPdfQuery,
  // PDF Config hooks
  useGetMenuPdfConfigsQuery,
  useCreateMenuPdfConfigMutation,
  useUpdateMenuPdfConfigMutation,
  useDeleteMenuPdfConfigMutation,
  useSyncMenuPdfConfigMutation,
  useToggleFeaturedMutation,
  MenuPdfConfig,
} from '@/store/api/menuApi';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { MenuItem, MenuItemFormData } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import { FeaturedItemsModal } from '@/components/menu/FeaturedItemsModal';

type PricingType = 'single' | 'sizes';
type SizePrice = { name: string; price: number };

interface FormData {
  name: string;
  description: string;
  category_id: string;
  pricing_type: PricingType;
  price: number;
  sizes: SizePrice[];
  is_customizable: boolean;
  requires_date: boolean;
  is_available: boolean;
  is_featured: boolean;
  special_notes: string;
}

const defaultFormData: FormData = {
  name: '',
  description: '',
  category_id: '',
  pricing_type: 'single',
  price: 0,
  sizes: [{ name: '', price: 0 }],
  is_customizable: false,
  requires_date: false,
  is_available: true,
  is_featured: false,
  special_notes: '',
};

const Menu = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: menuData, isLoading } = useGetMenuItemsQuery({ category: categoryFilter === 'all' ? '' : categoryFilter });
  const { data: categoriesData } = useGetCategoriesQuery();

  // Filter menu items by search query
  const filteredItems = menuData?.items?.filter(item =>
    !searchQuery ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];
  const [createItem, { isLoading: isCreating }] = useCreateMenuItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateMenuItemMutation();
  const [deleteMenuItem, { isLoading: isDeleting }] = useDeleteMenuItemMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadMenuItemImageMutation();
  const [syncMenuPdf, { isLoading: isSyncingPdf }] = useSyncMenuPdfMutation();
  const [getMenuPdf] = useLazyGetMenuPdfQuery();
  const [toggleFeatured] = useToggleFeaturedMutation();

  // === PDF Config State ===
  const { data: pdfConfigs, isLoading: isLoadingConfigs } = useGetMenuPdfConfigsQuery();
  const [createPdfConfig, { isLoading: isCreatingConfig }] = useCreateMenuPdfConfigMutation();
  const [updatePdfConfig, { isLoading: isUpdatingConfig }] = useUpdateMenuPdfConfigMutation();
  const [deletePdfConfig, { isLoading: isDeletingConfig }] = useDeleteMenuPdfConfigMutation();
  const [syncPdfConfig] = useSyncMenuPdfConfigMutation();

  const [isPdfConfigsModalOpen, setIsPdfConfigsModalOpen] = useState(false); // Main listing modal
  const [isPdfConfigModalOpen, setIsPdfConfigModalOpen] = useState(false); // Create/Edit form modal
  const [editingPdfConfig, setEditingPdfConfig] = useState<MenuPdfConfig | null>(null);
  const [deletePdfConfigItem, setDeletePdfConfigItem] = useState<MenuPdfConfig | null>(null);
  const [pdfConfigFormData, setPdfConfigFormData] = useState<{ name: string; name_local: string; categoryIds: string[] }>({ name: '', name_local: '', categoryIds: [] });
  const [syncingConfigId, setSyncingConfigId] = useState<string | null>(null);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // PDF Config Handlers
  const openPdfConfigModal = (config?: MenuPdfConfig) => {
    if (config) {
      setEditingPdfConfig(config);
      setPdfConfigFormData({
        name: config.name,
        name_local: config.name_local || '',
        categoryIds: config.category_ids
      });
    } else {
      setEditingPdfConfig(null);
      setPdfConfigFormData({ name: '', name_local: '', categoryIds: [] });
    }
    setIsPdfConfigModalOpen(true);
  };

  const handlePdfConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPdfConfig) {
        await updatePdfConfig({ id: editingPdfConfig.id, data: pdfConfigFormData }).unwrap();
        toast.success('PDF Config updated');
      } else {
        await createPdfConfig(pdfConfigFormData).unwrap();
        toast.success('PDF Config created');
      }
      setIsPdfConfigModalOpen(false);
    } catch (error) {
      toast.error('Failed to save PDF Config');
    }
  };

  const handleDeletePdfConfig = async () => {
    if (!deletePdfConfigItem) return;
    try {
      await deletePdfConfig(deletePdfConfigItem.id).unwrap();
      toast.success('PDF Config deleted');
      setDeletePdfConfigItem(null);
    } catch (error) {
      toast.error('Failed to delete PDF Config');
    }
  };

  const handleSyncPdfConfig = async (configId: string) => {
    setSyncingConfigId(configId);
    try {
      const result = await syncPdfConfig(configId).unwrap();
      toast.success('PDF synced successfully');
      if (result.pdf_url) {
        window.open(result.pdf_url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to sync PDF');
    } finally {
      setSyncingConfigId(null);
    }
  };

  const togglePdfConfigCategory = (categoryId: string) => {
    setPdfConfigFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const openForm = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      const hasSizes = item.sizes && item.sizes.length > 0;
      setFormData({
        name: item.name,
        description: item.description,
        category_id: item.category_id,
        pricing_type: hasSizes ? 'sizes' : 'single',
        price: item.price || 0,
        sizes: hasSizes ? item.sizes : [{ name: '', price: 0 }],
        is_customizable: item.is_customizable,
        requires_date: item.requires_date,
        is_available: item.is_available,
        is_featured: item.is_featured || false,
        special_notes: item.special_notes || '',
      });
      setImagePreview(item.image_url || null);
    } else {
      setEditingItem(null);
      setFormData(defaultFormData);
      setImagePreview(null);
    }
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { name: '', price: 0 }]
    }));
  };

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const updateSize = (index: number, field: 'name' | 'price', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) =>
        i === index ? { ...size, [field]: field === 'price' ? Number(value) : value } : size
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build payload based on pricing type
      const payload: Record<string, unknown> = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        is_customizable: formData.is_customizable,
        requires_date: formData.requires_date,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        special_notes: formData.special_notes,
      };

      if (formData.pricing_type === 'single') {
        payload.price = formData.price;
      } else {
        payload.sizes = formData.sizes.filter(s => s.name && s.price > 0);
      }

      let itemId: string;
      if (editingItem) {
        await updateItem({ itemId: editingItem.id, data: payload }).unwrap();
        itemId = editingItem.id;
        toast.success('Menu item updated');
      } else {
        const result = await createItem(payload).unwrap();
        itemId = result.item.id;
        toast.success('Menu item created');
      }

      // Upload image if selected
      if (imageFile) {
        const formDataImg = new window.FormData();
        formDataImg.append('image', imageFile);
        await uploadImage({ itemId, formData: formDataImg }).unwrap();
      }

      setIsFormOpen(false);
    } catch (error) {
      toast.error('Failed to save menu item');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteMenuItem(deleteItem.id).unwrap();
      toast.success('Menu item deleted');
      setDeleteItem(null);
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await updateItem({
        itemId: item.id,
        data: { is_available: !item.is_available }
      }).unwrap();
      toast.success(item.is_available ? 'Item marked unavailable' : 'Item marked available');
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const handleToggleFeatured = async (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFeatured({
        itemId: item.id,
        is_featured: !item.is_featured
      }).unwrap();
      toast.success(item.is_featured ? 'Removed from featured' : 'Added to featured');
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleSyncPdf = async () => {
    try {
      const result = await syncMenuPdf().unwrap();
      toast.success(result.message || 'Menu PDF synced successfully');
    } catch (error) {
      toast.error('Failed to sync PDF');
    }
  };

  const handleViewPdf = async () => {
    try {
      const result = await getMenuPdf().unwrap();
      window.open(result.url, '_blank');
    } catch (error) {
      toast.error('Failed to get PDF');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Menu Items"
        description="Manage your menu items and prices"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFeaturedModalOpen(true)}>
              <Star className="h-4 w-4 mr-2" />
              Featured
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={() => setIsPdfConfigsModalOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              PDF Menus
            </Button>
            <Button variant="gradient" onClick={() => openForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoriesData?.categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredItems.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="card-warm overflow-hidden">
              {/* Image */}
              <div className="h-40 bg-muted flex items-center justify-center">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category_name}</p>
                  </div>
                  {item.sizes && item.sizes.length > 0 ? (
                    <div className="text-right">
                      {item.sizes.map((size, idx) => (
                        <p key={idx} className="text-sm">
                          <span className="text-muted-foreground">{size.name}:</span>{' '}
                          <span className="font-bold text-primary">{formatCurrency(size.price)}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-bold text-primary">{formatCurrency(item.price || 0)}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={() => handleToggleAvailable(item)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleToggleFeatured(item, e)}
                      title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <Star
                        className={`h-4 w-4 transition-colors ${item.is_featured
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground hover:text-amber-400'
                          }`}
                      />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openForm(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteItem(item)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu items"
          description="Add your first menu item to get started"
          action={{ label: 'Add Item', onClick: () => openForm() }}
        />
      )}

      {/* Form Modal */}
      <FormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? 'Change' : 'Upload'}
              </Button>
            </div>
          </div>

          {/* Pricing Type Toggle */}
          <div className="space-y-2">
            <Label>Pricing Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricing_type"
                  checked={formData.pricing_type === 'single'}
                  onChange={() => setFormData(prev => ({ ...prev, pricing_type: 'single' }))}
                  className="accent-primary"
                />
                <span>Single Price</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricing_type"
                  checked={formData.pricing_type === 'sizes'}
                  onChange={() => setFormData(prev => ({ ...prev, pricing_type: 'sizes' }))}
                  className="accent-primary"
                />
                <span>Size-Based Pricing</span>
              </label>
            </div>
          </div>

          {/* Single Price Input */}
          {formData.pricing_type === 'single' ? (
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                required
              />
            </div>
          ) : (
            /* Size-Based Pricing Inputs */
            <div className="space-y-3">
              <Label>Sizes & Prices *</Label>
              {formData.sizes.map((size, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Size (e.g., 500g, Small)"
                    value={size.name}
                    onChange={(e) => updateSize(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    value={size.price || ''}
                    onChange={(e) => updateSize(index, 'price', e.target.value)}
                    className="w-28"
                  />
                  {formData.sizes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSize(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSize}>
                <Plus className="h-4 w-4 mr-1" /> Add Size
              </Button>
            </div>
          )}

          {/* Hidden fields - Is Customizable, Requires Date, Special Notes
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customizable"
                checked={formData.is_customizable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_customizable: !!checked }))}
              />
              <Label htmlFor="customizable">Is Customizable</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresDate"
                checked={formData.requires_date}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_date: !!checked }))}
              />
              <Label htmlFor="requiresDate">Requires Date</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Notes</Label>
            <Textarea
              id="notes"
              value={formData.special_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
            />
          </div>
          */}

          {/* Featured Item Toggle */}
          <div className="flex items-center space-x-3 py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Checkbox
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: !!checked }))}
            />
            <div className="flex-1">
              <Label htmlFor="featured" className="font-medium cursor-pointer">Featured Item</Label>
              <p className="text-xs text-muted-foreground">Show this item in featured section for customers</p>
            </div>
            <Star className={`h-5 w-5 ${formData.is_featured ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreating || isUpdating || isUploading}>
              {isUploading ? 'Uploading...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* ====== PDF CONFIGS MODAL ====== */}
      <FormModal
        open={isPdfConfigsModalOpen}
        onOpenChange={setIsPdfConfigsModalOpen}
        title="Menu PDF Configurations"
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Create and manage custom PDF menus for different categories</p>
            <Button size="sm" onClick={() => openPdfConfigModal()}>
              <Plus className="h-4 w-4 mr-2" />
              New Config
            </Button>
          </div>

          {isLoadingConfigs ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : pdfConfigs && pdfConfigs.length > 0 ? (
            <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Categories</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">PDF</th>
                    <th className="px-3 py-2 text-right text-xs font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pdfConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2">
                        <div className="font-medium text-sm">{config.name}</div>
                        <div className="text-xs text-muted-foreground">{config.name_local} | {config.slug}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs">{config.category_ids.length}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        {config.pdf_url ? (
                          <a
                            href={config.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSyncPdfConfig(config.id)}
                            disabled={syncingConfigId === config.id}
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${syncingConfigId === config.id ? 'animate-spin' : ''}`} />
                            {syncingConfigId === config.id ? '...' : 'Sync'}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPdfConfigModal(config)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeletePdfConfigItem(config)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No PDF configurations yet</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => openPdfConfigModal()}>
                Create First Config
              </Button>
            </div>
          )}
        </div>
      </FormModal>

      {/* PDF Config Form Modal */}
      <FormModal
        open={isPdfConfigModalOpen}
        onOpenChange={setIsPdfConfigModalOpen}
        title={editingPdfConfig ? 'Edit PDF Config' : 'Create PDF Config'}
        className='overflow-hidden'
      >
        <form onSubmit={handlePdfConfigSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="configName">Name *</Label>
            <Input
              id="configName"
              placeholder="e.g., Cakes Menu"
              value={pdfConfigFormData.name}
              onChange={(e) => setPdfConfigFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="configNameLocal">Local Name *</Label>
            <Input
              id="configNameLocal"
              placeholder="e.g., کیک مینی"
              value={pdfConfigFormData.name_local}
              onChange={(e) => setPdfConfigFormData(prev => ({ ...prev, name_local: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Select Categories *</Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {categoriesData?.categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                  <Checkbox
                    checked={pdfConfigFormData.categoryIds.includes(cat.id)}
                    onCheckedChange={() => togglePdfConfigCategory(cat.id)}
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
            {pdfConfigFormData.categoryIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{pdfConfigFormData.categoryIds.length} categories selected</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPdfConfigModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isCreatingConfig || isUpdatingConfig || pdfConfigFormData.categoryIds.length === 0}
            >
              {editingPdfConfig ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* PDF Config Delete Confirmation */}
      <ConfirmDialog
        open={!!deletePdfConfigItem}
        onOpenChange={() => setDeletePdfConfigItem(null)}
        title="Delete PDF Config"
        description={`Are you sure you want to delete "${deletePdfConfigItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeletePdfConfig}
        isLoading={isDeletingConfig}
      />

      {/* Featured Items Modal */}
      <FeaturedItemsModal
        open={isFeaturedModalOpen}
        onOpenChange={setIsFeaturedModalOpen}
      />
      <MenuImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />
    </div>
  );
};

export default Menu;
