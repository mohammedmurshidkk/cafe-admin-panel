import { useState } from 'react';
import { Plus, Pencil, Trash2, PlusCircle, ChevronDown, ChevronRight } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  useGetAddonGroupsQuery,
  useCreateAddonGroupMutation,
  useDeleteAddonGroupMutation,
  useCreateAddonMutation,
  useUpdateAddonMutation,
  useDeleteAddonMutation
} from '@/store/api/addonsApi';
import { AddonGroup, Addon } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

const Addons = () => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [isAddonFormOpen, setIsAddonFormOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [addonData, setAddonData] = useState({ name: '', price: 0, group_id: '' });
  const [deleteGroup, setDeleteGroup] = useState<AddonGroup | null>(null);
  const [deleteAddon, setDeleteAddon] = useState<Addon | null>(null);

  const { data, isLoading } = useGetAddonGroupsQuery();
  const [createGroup, { isLoading: isCreatingGroup }] = useCreateAddonGroupMutation();
  const [deleteGroupMutation, { isLoading: isDeletingGroup }] = useDeleteAddonGroupMutation();
  const [createAddon, { isLoading: isCreatingAddon }] = useCreateAddonMutation();
  const [updateAddon, { isLoading: isUpdatingAddon }] = useUpdateAddonMutation();
  const [deleteAddonMutation, { isLoading: isDeletingAddon }] = useDeleteAddonMutation();

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const openAddonForm = (groupId?: string, addon?: Addon) => {
    if (addon) {
      setEditingAddon(addon);
      setAddonData({ name: addon.name, price: addon.price, group_id: groupId || '' });
    } else {
      setEditingAddon(null);
      setAddonData({ name: '', price: 0, group_id: groupId || '' });
    }
    setIsAddonFormOpen(true);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup({ name: groupName }).unwrap();
      toast.success('Addon group created');
      setIsGroupFormOpen(false);
      setGroupName('');
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleSubmitAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddon) {
        await updateAddon({ 
          id: editingAddon.id, 
          name: addonData.name, 
          category: addonData.group_id,
          price: addonData.price 
        }).unwrap();
        toast.success('Addon updated');
      } else {

        const finalData = {
          ...addonData,
          category: addonData.group_id
        }

        await createAddon(finalData).unwrap();
        toast.success('Addon created');
      }
      setIsAddonFormOpen(false);
    } catch (error) {
      toast.error('Failed to save addon');
    }
  };

  const handleToggleAddon = async (addon: Addon) => {
    try {
      await updateAddon({ id: addon.id, is_available: !addon.is_available }).unwrap();
    } catch (error) {
      toast.error('Failed to update addon');
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroup) return;
    try {
      await deleteGroupMutation(deleteGroup.id).unwrap();
      toast.success('Group deleted');
      setDeleteGroup(null);
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleDeleteAddon = async () => {
    if (!deleteAddon) return;
    try {
      await deleteAddonMutation(deleteAddon.id).unwrap();
      toast.success('Addon deleted');
      setDeleteAddon(null);
    } catch (error) {
      toast.error('Failed to delete addon');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Addons" 
        description="Manage addon groups and individual addons"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsGroupFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
            <Button variant="gradient" onClick={() => openAddonForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Addon
            </Button>
          </div>
        }
      />

      {/* Addon Groups */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : data?.groups?.length ? (
        <div className="space-y-4">
          {data.groups.map((group) => (
            <Collapsible
              key={group.id}
              open={expandedGroups.includes(group.id)}
              onOpenChange={() => toggleGroup(group.id)}
            >
              <div className="card-warm">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {expandedGroups.includes(group.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-semibold">{group.name}</p>
                        <p className="text-sm text-muted-foreground">{group.addons.length} addons</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddonForm(group.id);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteGroup(group);
                        }}
                        className="text-destructive hover:text-destructive"
                        disabled={group.addons.length > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-border">
                    {group.addons.length > 0 ? (
                      group.addons.map((addon) => (
                        <div 
                          key={addon.id}
                          className="flex items-center justify-between px-4 py-3 pl-12 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={addon.is_available}
                              onCheckedChange={() => handleToggleAddon(addon)}
                            />
                            <div>
                              <p className="font-medium">{addon.name}</p>
                              <p className="text-sm text-primary font-semibold">
                                {formatCurrency(addon.price)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openAddonForm(group.id, addon)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeleteAddon(addon)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-6 text-muted-foreground">
                        No addons in this group
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PlusCircle}
          title="No addon groups"
          description="Create your first addon group to get started"
          action={{ label: 'Add Group', onClick: () => setIsGroupFormOpen(true) }}
        />
      )}

      {/* Group Form Modal */}
      <FormModal
        open={isGroupFormOpen}
        onOpenChange={setIsGroupFormOpen}
        title="Add Addon Group"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Extra Toppings, Size Options"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsGroupFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreatingGroup}>
              Create
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Addon Form Modal */}
      <FormModal
        open={isAddonFormOpen}
        onOpenChange={setIsAddonFormOpen}
        title={editingAddon ? 'Edit Addon' : 'Add Addon'}
      >
        <form onSubmit={handleSubmitAddon} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addonName">Addon Name</Label>
            <Input
              id="addonName"
              value={addonData.name}
              onChange={(e) => setAddonData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Extra Cheese"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addonPrice">Price</Label>
            <Input
              id="addonPrice"
              type="number"
              min="0"
              step="0.01"
              value={addonData.price}
              onChange={(e) => setAddonData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>

          {!editingAddon && (
            <div className="space-y-2">
              <Label htmlFor="addonGroup">Group</Label>
              <Select 
                value={addonData.group_id}
                onValueChange={(v) => setAddonData(prev => ({ ...prev, group_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {data?.groups.map((group) => (
                    <SelectItem key={group.name} value={group.name}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddonFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreatingAddon || isUpdatingAddon}>
              {editingAddon ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmations */}
      <ConfirmDialog
        open={!!deleteGroup}
        onOpenChange={() => setDeleteGroup(null)}
        title="Delete Addon Group"
        description={`Are you sure you want to delete "${deleteGroup?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteGroup}
        isLoading={isDeletingGroup}
      />

      <ConfirmDialog
        open={!!deleteAddon}
        onOpenChange={() => setDeleteAddon(null)}
        title="Delete Addon"
        description={`Are you sure you want to delete "${deleteAddon?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteAddon}
        isLoading={isDeletingAddon}
      />
    </div>
  );
};

export default Addons;
