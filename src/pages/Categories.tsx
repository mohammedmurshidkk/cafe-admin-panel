import { useState } from 'react';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from '@/store/api/categoriesApi';
import { Category } from '@/types';
import { toast } from 'sonner';

const Categories = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');

  const { data, isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCat, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const openForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
    } else {
      setEditingCategory(null);
      setName('');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, name }).unwrap();
        toast.success('Category updated');
      } else {
        await createCategory({ name }).unwrap();
        toast.success('Category created');
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

      {/* Categories List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : data?.categories?.length ? (
        <div className="card-warm divide-y divide-border">
          {data.categories.map((category) => (
            <div 
              key={category.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
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
          description="Create your first category to organize menu items"
          action={{ label: 'Add Category', onClick: () => openForm() }}
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
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Cakes, Pastries, Beverages"
              required
            />
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
