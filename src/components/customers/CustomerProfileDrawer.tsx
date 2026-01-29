import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import {
    useGetCustomerProfileQuery,
    useUpdateCustomerTagsMutation,
    useUpdateCustomerNotesMutation
} from "@/store/api/customersApi";
import { formatCurrency, formatPhone, formatDateTime } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Phone,
    Mail,
    Calendar,
    TrendingUp,
    ShoppingBag,
    Tag as TagIcon,
    MessageSquare,
    Heart,
    Truck,
    Plus,
    Users
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
    customerId: string | null;
    onClose: () => void;
}

export const CustomerProfileDrawer = ({ customerId, onClose }: Props) => {
    const { data: profile, isLoading } = useGetCustomerProfileQuery(customerId!, {
        skip: !customerId
    });


    const [updateTags] = useUpdateCustomerTagsMutation();
    const [updateNotes] = useUpdateCustomerNotesMutation();

    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (profile) {
            setTags(profile.tags || []);
            setNotes(profile.notes || "");
        }
    }, [profile]);

    const handleAddTag = async () => {
        if (!newTag.trim() || !customerId) return;
        const updatedTags = [...tags, newTag.trim()];
        try {
            await updateTags({ customerId, tags: updatedTags }).unwrap();
            setTags(updatedTags);
            setNewTag("");
            toast.success("Tag added");
        } catch (e) {
            toast.error("Failed to add tag");
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!customerId) return;
        const updatedTags = tags.filter(t => t !== tagToRemove);
        try {
            await updateTags({ customerId, tags: updatedTags }).unwrap();
            setTags(updatedTags);
            toast.success("Tag removed");
        } catch (e) {
            toast.error("Failed to remove tag");
        }
    };

    const handleSaveNotes = async () => {
        if (!customerId) return;
        try {
            await updateNotes({ customerId, notes }).unwrap();
            toast.success("Notes updated");
        } catch (e) {
            toast.error("Failed to update notes");
        }
    };

    return (
        <Sheet open={!!customerId} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                {isLoading ? (
                    <div className="space-y-6 pt-6">
                        <Skeleton className="h-12 w-3/4" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : profile ? (
                    <div className="space-y-8 pt-6">
                        <SheetHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <SheetTitle className="text-2xl font-display font-bold">
                                        {profile.customer.name || formatPhone(profile.customer.phone)}
                                    </SheetTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={profile.segment === 'vip' ? 'default' : 'secondary'}>
                                            {profile.segment.toUpperCase()}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {formatPhone(profile.customer.phone)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <ShoppingBag className="h-4 w-4" />
                                    <span className="text-xs uppercase font-bold tracking-wider">Orders</span>
                                </div>
                                <p className="text-xl font-bold">{profile.total_orders}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Avg: {formatCurrency(profile.avg_order_value)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-xs uppercase font-bold tracking-wider">Spent</span>
                                </div>
                                <p className="text-xl font-bold text-success">{formatCurrency(profile.total_spent)}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Since {formatDateTime(profile.first_order_at)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <TagIcon className="h-4 w-4" /> Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="pl-2 pr-1 py-1 flex items-center gap-1 group"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-destructive p-0.5 rounded-full hover:bg-destructive/10"
                                        >
                                            <Plus className="h-3 w-3 rotate-45" />
                                        </button>
                                    </Badge>
                                ))}
                                <div className="flex items-center gap-2 w-full mt-2">
                                    <Input
                                        placeholder="Add tag..."
                                        className="h-8 text-xs"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                    />
                                    <Button size="sm" className="h-8" onClick={handleAddTag}>Add</Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Heart className="h-4 w-4" /> Favorites & Preferences
                            </h3>
                            <div className="space-y-3">
                                {profile.preferences.favorite_items && Object.keys(profile.preferences.favorite_items).length > 0 ? (
                                    <div className="text-sm space-y-2">
                                        <p className="text-xs text-muted-foreground">Most Ordered Items:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(profile.preferences.favorite_items)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 5)
                                                .map(([name, count]) => (
                                                    <Badge key={name} variant="outline" className="text-[10px]">
                                                        {name} ({count})
                                                    </Badge>
                                                ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">No order history to determine favorites yet.</p>
                                )}

                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                                        <Truck className="h-4 w-4 text-info" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Preferred Fulfillment</p>
                                        <p className="text-sm font-medium capitalize">{profile.preferences.preferred_fulfillment || 'takeaway'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Internal Notes
                            </h3>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder="Add private notes about this customer..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[100px] text-sm"
                                />
                                <Button variant="secondary" className="w-full" onClick={handleSaveNotes}>
                                    Save Notes
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Users className="h-12 w-12 mb-2 opacity-20" />
                        <p>Select a customer to view profile</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
