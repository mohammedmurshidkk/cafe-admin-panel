import { useState } from 'react';
import { Plus, Pencil, Trash2, UtensilsCrossed, ImageIcon } from 'lucide-react';
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
  useDeleteMenuItemMutation 
} from '@/store/api/menuApi';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { MenuItem, MenuItemFormData } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

const defaultFormData: MenuItemFormData = {
  name: '',
  description: '',
  category_id: '',
  base_price: 0,
  sizes: [],
  is_customizable: false,
  requires_date: false,
  is_available: true,
  special_notes: '',
};

const Menu = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>(defaultFormData);

  const { data: menuData, isLoading } = useGetMenuItemsQuery({ category: categoryFilter });
  const { data: categoriesData } = useGetCategoriesQuery();
  const [createItem, { isLoading: isCreating }] = useCreateMenuItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateMenuItemMutation();
  const [deleteMenuItem, { isLoading: isDeleting }] = useDeleteMenuItemMutation();

  const openForm = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        category_id: item.category_id,
        base_price: item.base_price,
        sizes: item.sizes,
        is_customizable: item.is_customizable,
        requires_date: item.requires_date,
        is_available: item.is_available,
        special_notes: item.special_notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData(defaultFormData);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateItem({ itemId: editingItem.id, data: formData }).unwrap();
        toast.success('Menu item updated');
      } else {
        await createItem(formData).unwrap();
        toast.success('Menu item created');
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Menu Items" 
        description="Manage your menu items and prices"
        action={
          <Button variant="gradient" onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        }
      />

      {/* Category Filter */}
      <div className="flex justify-end">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
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
      ) : menuData?.items?.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuData.items.map((item) => (
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
                  <p className="font-bold text-primary">{formatCurrency(item.base_price)}</p>
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
                  <div className="flex gap-2">
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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="price">Base Price *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreating || isUpdating}>
              {editingItem ? 'Update' : 'Create'}
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
    </div>
  );
};

export default Menu;
