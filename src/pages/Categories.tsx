import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, Search, Upload, X, ImageIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useUploadCategoryImageMutation
} from '@/store/api/categoriesApi';
import { Category, CategoryFormData } from '@/types';
import { toast } from 'sonner';

const defaultFormData: CategoryFormData = {
  name: '',
  description: '',
  custom_text_prompt: '',
  category_note: '',
};

const Categories = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCat, { isLoading: isDeleting }] = useDeleteCategoryMutation();
  const [uploadImage] = useUploadCategoryImageMutation();

  // Filter categories by search
  const filteredCategories = data?.categories?.filter(cat =>
    !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const openForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        custom_text_prompt: category.custom_text_prompt || '',
        category_note: (category as any).category_note || '',
      });
      setImagePreview(category.image_url || null);
    } else {
      setEditingCategory(null);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let categoryId: string;
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, ...formData }).unwrap();
        categoryId = editingCategory.id;
        toast.success('Category updated');
      } else {
        const result = await createCategory(formData).unwrap();
        categoryId = result.category.id;
        toast.success('Category created');
      }

      if (imageFile) {
        const imgFormData = new window.FormData();
        imgFormData.append('image', imageFile);
        await uploadImage({ id: categoryId, formData: imgFormData }).unwrap();
      }

      setIsFormOpen(false);
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    try {
      await deleteCat(deleteCategory.id).unwrap();
      toast.success('Category deleted');
      setDeleteCategory(null);
    } catch (error: any) {
      const message = error?.data?.error || 'Failed to delete category';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Categories" 
        description="Organize your menu items into categories"
        action={
          <Button variant="gradient" onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCategories.length ? (
        <div className="card-warm divide-y divide-border">
          {filteredCategories.map((category) => (
            <div 
              key={category.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.items_count} items</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openForm(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDeleteCategory(category)}
                  className="text-destructive hover:text-destructive"
                  disabled={category.items_count > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No categories"
          description={searchQuery ? 'No categories match your search' : 'Create your first category to organize menu items'}
          action={!searchQuery ? { label: 'Add Category', onClick: () => openForm() } : undefined}
        />
      )}

      {/* Form Modal */}
      <FormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Cakes, Pastries, Beverages"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this category"
            />
          </div>

          {/* Image Upload - Hidden
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-16 h-16">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? 'Change' : 'Upload'}
              </Button>
            </div>
          </div>
          */}

          <div className="space-y-2">
            <Label htmlFor="category_note">Custom Note</Label>
            <Textarea
              id="category_note"
              value={formData.category_note || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, category_note: e.target.value }))}
              placeholder="Add a custom note for this category..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_text_prompt">Custom AI Prompt</Label>
            <Textarea
              id="custom_text_prompt"
              value={formData.custom_text_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, custom_text_prompt: e.target.value }))}
              placeholder="Custom instructions for AI when handling this category..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Special instructions for how the AI should handle items in this category.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreating || isUpdating}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteCategory}
        onOpenChange={() => setDeleteCategory(null)}
        title="Delete Category"
        description={
          deleteCategory?.items_count && deleteCategory.items_count > 0
            ? `Cannot delete "${deleteCategory?.name}" because it has ${deleteCategory?.items_count} items. Move or delete items first.`
            : `Are you sure you want to delete "${deleteCategory?.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Categories;