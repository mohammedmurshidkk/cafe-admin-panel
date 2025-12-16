import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAddonsByCategoryQuery, useLinkAddonToCategoryMutation, useUnlinkAddonFromCategoryMutation } from '@/store/api/addonsApi';
import { Addon } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

interface CategoryAddonLinkerProps {
    categoryId: string;
    allAddons: Addon[];
}

export const CategoryAddonLinker = ({ categoryId, allAddons }: CategoryAddonLinkerProps) => {
    const { data: linkedAddonsData, isLoading } = useGetAddonsByCategoryQuery(categoryId);
    const [linkAddon] = useLinkAddonToCategoryMutation();
    const [unlinkAddon] = useUnlinkAddonFromCategoryMutation();

    const linkedAddonIds = new Set(linkedAddonsData?.addons?.map(a => a.addon_id) || []);

    const handleToggleLink = async (addonId: string, isCurrentlyLinked: boolean) => {
        try {
            if (isCurrentlyLinked) {
                // Currently linked, so unlink it
                await unlinkAddon({ addon_id: addonId, category_id: categoryId }).unwrap();
                toast.success('Addon unlinked from category');
            } else {
                // Currently not linked, so link it
                await linkAddon({ addon_id: addonId, category_id: categoryId }).unwrap();
                toast.success('Addon linked to category');
            }
        } catch (error) {
            toast.error('Failed to update link');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (allAddons.length === 0) {
        return (
            <p className="text-center py-6 text-muted-foreground">
                No addons available. Create addons first.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {allAddons.map((addon) => {
                const isLinked = linkedAddonIds.has(addon.id);
                return (
                    <div
                        key={addon.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Switch
                                checked={isLinked}
                                onCheckedChange={() => handleToggleLink(addon.id, isLinked)}
                            />
                            <div>
                                <p className="font-medium">{addon.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatCurrency(addon.price)}
                                    {addon.description && ` • ${addon.description}`}
                                </p>
                            </div>
                        </div>
                        {isLinked && (
                            <Badge variant="secondary">Linked</Badge>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
