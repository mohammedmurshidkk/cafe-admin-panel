import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, X, ImageIcon, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  useGetAmenitiesQuery,
  useCreateAmenityMutation,
  useUpdateAmenityMutation,
  useDeleteAmenityMutation,
  useUploadAmenityImageMutation,
  useToggleAmenityMutation,
  BusinessAmenity,
} from '@/store/api/amenitiesApi';
import { toast } from 'sonner';

interface AmenityFormData {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  images: string[];
}

const defaultFormData: AmenityFormData = {
  name: '',
  slug: '',
  description: '',
  is_active: true,
  images: [],
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');
};

const Amenities = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<BusinessAmenity | null>(null);
  const [deleteAmenity, setDeleteAmenity] = useState<BusinessAmenity | null>(null);
  const [formData, setFormData] = useState<AmenityFormData>(defaultFormData);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useGetAmenitiesQuery();
  const [createAmenity, { isLoading: isCreating }] = useCreateAmenityMutation();
  const [updateAmenity, { isLoading: isUpdating }] = useUpdateAmenityMutation();
  const [deleteAmenityMutation, { isLoading: isDeleting }] = useDeleteAmenityMutation();
  const [uploadImage] = useUploadAmenityImageMutation();
  const [toggleAmenity] = useToggleAmenityMutation();

  const filteredAmenities = data?.amenities?.filter(amenity =>
    !searchQuery || amenity.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const openForm = (amenity?: BusinessAmenity) => {
    if (amenity) {
      setEditingAmenity(amenity);
      setFormData({
        name: amenity.name,
        slug: amenity.slug,
        description: amenity.description,
        is_active: amenity.is_active,
        images: amenity.images || (amenity.image_url ? [amenity.image_url] : []),
      });
      setImagePreviews(amenity.images || (amenity.image_url ? [amenity.image_url] : []));
    } else {
      setEditingAmenity(null);
      setFormData(defaultFormData);
      setImagePreviews([]);
    }
    setImageFiles([]);
    setIsFormOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingAmenity ? prev.slug : generateSlug(name),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };



  const removeImageByIndex = (index: number) => {
    // Check if it's an existing image (from formData.images) or a new file
    // This depends on how we constructed `imagePreviews`.
    // We constructed it as: [...existing, ...newFilesPreviews]

    const existingCount = formData.images.length;

    if (index < existingCount) {
      // Identify it's an existing image
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // Identify it's a new file
      const fileIndex = index - existingCount;
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let amenityId: string;
      if (editingAmenity) {
        // For updates, we might need to send the list of kept images as part of the body
        // and upload new ones.
        // The API definition shows `updateAmenity` takes `images`.
        // So we satisfy that with `formData.images`.
        await updateAmenity({ id: editingAmenity.id, ...formData }).unwrap();
        amenityId = editingAmenity.id;
        toast.success('Amenity updated');
      } else {
        const result = await createAmenity(formData).unwrap();
        amenityId = result.amenity.id;
        toast.success('Amenity created');
      }

      if (imageFiles.length > 0) {
        const imgFormData = new FormData();
        imageFiles.forEach((file) => {
          imgFormData.append('image', file); // Use 'images' key for multiple, or loop? 
          // Usually 'images' or 'images[]' depends on backend. 
          // Given the task is to support "images": ["url"], I'd guess the upload endpoint 
          // might also benefit from multiple file support. 
          // The existing was `append('image', imageFile)`.
          // I will use `append('images', file)` multiple times which is standard for array uploads.
        });
        await uploadImage({ id: amenityId, formData: imgFormData }).unwrap();
      }

      setIsFormOpen(false);
    } catch (error) {
      toast.error('Failed to save amenity');
    }
  };

  const handleDelete = async () => {
    if (!deleteAmenity) return;
    try {
      await deleteAmenityMutation(deleteAmenity.id).unwrap();
      toast.success('Amenity deleted');
      setDeleteAmenity(null);
    } catch (error: any) {
      const message = error?.data?.error || 'Failed to delete amenity';
      toast.error(message);
    }
  };

  const handleToggle = async (amenity: BusinessAmenity) => {
    try {
      await toggleAmenity(amenity.id).unwrap();
      toast.success(`Amenity ${amenity.is_active ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Amenities"
        description="Manage services like Party Hall, Catering, etc."
        action={
          <Button variant="gradient" onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Amenity
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search amenities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredAmenities.length ? (
        <div className="card-warm divide-y divide-border">
          {filteredAmenities.map((amenity) => (
            <div
              key={amenity.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3 overflow-hidden">
                  {amenity.images && amenity.images.length > 0 ? (
                    amenity.images.slice(0, 3).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={amenity.name}
                        className="inline-block w-12 h-12 rounded-lg object-cover ring-2 ring-background z-0"
                        style={{ zIndex: 3 - i }}
                      />
                    ))
                  ) : amenity.image_url ? (
                    <img
                      src={amenity.image_url}
                      alt={amenity.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  {amenity.images && amenity.images.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background z-0">
                      +{amenity.images.length - 3}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{amenity.name}</p>
                    <Badge variant={amenity.is_active ? 'active' : 'secondary'}>
                      {amenity.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {amenity.description.split('\n')[0]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={amenity.is_active}
                  onCheckedChange={() => handleToggle(amenity)}
                />
                <Button variant="ghost" size="icon" onClick={() => openForm(amenity)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteAmenity(amenity)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No amenities"
          description={searchQuery ? 'No amenities match your search' : 'Add amenities like Party Hall, Catering, etc.'}
          action={!searchQuery ? { label: 'Add Amenity', onClick: () => openForm() } : undefined}
        />
      )}

      <FormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingAmenity ? 'Edit Amenity' : 'Add Amenity'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Party Hall, Catering"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="party_hall"
            />
            <p className="text-xs text-muted-foreground">
              Used by AI to identify this amenity. Auto-generated from name.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Full message sent to customers..."
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              This exact message is sent to customers when they ask about this amenity.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <div className="grid grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative w-20 h-20 group">
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageByIndex(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Images sent along with the description to customers.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreating || isUpdating}>
              {editingAmenity ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteAmenity}
        onOpenChange={() => setDeleteAmenity(null)}
        title="Delete Amenity"
        description={`Are you sure you want to delete "${deleteAmenity?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Amenities;
