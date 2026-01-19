import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useGetMenuItemsQuery,
    useUpdateFeaturedOrderMutation
} from '@/store/api/menuApi';
import { MenuItem } from '@/types';
import { Star, Search, GripVertical, Save, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FeaturedItemsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface FeaturedItem {
    id: string;
    name: string;
    image_url: string | null;
    category_name: string;
    is_featured: boolean;
    featured_order: number;
}

export const FeaturedItemsModal = ({ open, onOpenChange }: FeaturedItemsModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const { data: menuData, isLoading } = useGetMenuItemsQuery({ category: '' }, { skip: !open });
    const [updateFeaturedOrder, { isLoading: isSaving }] = useUpdateFeaturedOrderMutation();

    // Initialize featured items from menu data
    useEffect(() => {
        if (menuData?.items) {
            const items = menuData.items
                .filter(item => item.is_featured)
                .sort((a, b) => (a.featured_order || 999) - (b.featured_order || 999))
                .map((item, index) => ({
                    id: item.id,
                    name: item.name,
                    image_url: item.image_url,
                    category_name: item.category_name || '',
                    is_featured: true,
                    featured_order: index + 1,
                }));
            setFeaturedItems(items);
        }
    }, [menuData?.items]);

    // All menu items for selection
    const allItems = useMemo(() => {
        if (!menuData?.items) return [];
        return menuData.items.filter(item =>
            !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [menuData?.items, searchQuery]);

    const toggleFeatured = (item: MenuItem) => {
        const isCurrentlyFeatured = featuredItems.some(f => f.id === item.id);

        if (isCurrentlyFeatured) {
            // Remove from featured
            setFeaturedItems(prev => prev.filter(f => f.id !== item.id));
        } else {
            // Add to featured at the end
            const newOrder = featuredItems.length + 1;
            setFeaturedItems(prev => [
                ...prev,
                {
                    id: item.id,
                    name: item.name,
                    image_url: item.image_url,
                    category_name: item.category_name || '',
                    is_featured: true,
                    featured_order: newOrder,
                }
            ]);
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newItems = [...featuredItems];
        const draggedItem = newItems[draggedIndex];
        newItems.splice(draggedIndex, 1);
        newItems.splice(index, 0, draggedItem);

        // Update featured_order for all items
        newItems.forEach((item, i) => {
            item.featured_order = i + 1;
        });

        setFeaturedItems(newItems);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleSave = async () => {
        try {
            const payload = {
                items: featuredItems.map(item => ({
                    id: item.id,
                    featured_order: item.featured_order,
                }))
            };

            await updateFeaturedOrder(payload).unwrap();
            toast.success('Featured items updated successfully');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to update featured items');
        }
    };

    const isFeatured = (itemId: string) => featuredItems.some(f => f.id === itemId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Manage Featured Items
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row gap-4 px-1">
                    {/* Left: All Items Selection */}
                    <div className="flex-1 min-h-[300px] md:min-h-0 flex flex-col overflow-hidden border rounded-lg">
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-9"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                            ) : allItems.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8 text-sm">No items found</p>
                            ) : (
                                allItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                            isFeatured(item.id)
                                                ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                                                : "hover:bg-muted/50"
                                        )}
                                        onClick={() => toggleFeatured(item)}
                                    >
                                        <Checkbox
                                            checked={isFeatured(item.id)}
                                            onCheckedChange={() => toggleFeatured(item)}
                                        />
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-10 h-10 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.category_name}</p>
                                        </div>
                                        {isFeatured(item.id) && (
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Featured Items Order */}
                    <div className="w-full md:w-64 min-h-[300px] md:min-h-0 flex flex-col overflow-hidden border rounded-lg">
                        <div className="p-3 border-b bg-muted/30">
                            <h3 className="font-medium text-sm">Featured Order</h3>
                            <p className="text-xs text-muted-foreground">Drag to reorder or update manually</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {featuredItems.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8 text-xs">
                                    Select items to feature
                                </p>
                            ) : (
                                featuredItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg bg-background border cursor-move transition-colors",
                                            draggedIndex === index && "opacity-50"
                                        )}
                                    >
                                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.featured_order}
                                            onChange={(e) => {
                                                const newOrder = parseInt(e.target.value) || 1;
                                                setFeaturedItems(prev => prev.map(f =>
                                                    f.id === item.id ? { ...f, featured_order: newOrder } : f
                                                ));
                                            }}
                                            className="w-12 h-7 text-center p-1 text-xs font-bold"
                                        />
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-8 h-8 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        )}
                                        <p className="text-xs font-medium truncate flex-1">{item.name}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>


                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="h-4 w-4 mr-2" /> Save Order</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
