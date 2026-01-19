import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useGetPopularItemsQuery,
    useToggleFeaturedMutation,
    PopularItemPeriod
} from '@/store/api/menuApi';
import { RefreshCw, Star, TrendingUp, TrendingDown, Minus, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS: { value: PopularItemPeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'all_time', label: 'All Time' },
];

export const TrendingItemsWidget = () => {
    const [period, setPeriod] = useState<PopularItemPeriod>('weekly');

    const { data, isLoading, isFetching, refetch } = useGetPopularItemsQuery(
        { period },
        { pollingInterval: 5 * 60 * 1000 } // 5 minutes
    );

    const [toggleFeatured, { isLoading: isToggling }] = useToggleFeaturedMutation();

    const handleToggleFeatured = async (itemId: string, currentlyFeatured: boolean) => {
        try {
            await toggleFeatured({
                itemId,
                is_featured: !currentlyFeatured
            }).unwrap();
            toast.success(currentlyFeatured ? 'Removed from featured' : 'Added to featured');
        } catch (error) {
            toast.error('Failed to update featured status');
        }
    };

    const getTrendIcon = (trend: number) => {
        if (trend > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
        if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    };

    const getTrendColor = (trend: number) => {
        if (trend > 0) return 'text-emerald-500';
        if (trend < 0) return 'text-red-500';
        return 'text-muted-foreground';
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Trending Items
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={period} onValueChange={(v) => setPeriod(v as PopularItemPeriod)}>
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIOD_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : !data?.items?.length ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No order data yet.</p>
                        <p className="text-xs">Items will appear here as orders come in.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.items.slice(0, 5).map((item, index) => (
                            <div
                                key={item.menu_item_id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                {/* Rank */}
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                    {index + 1}
                                </div>

                                {/* Image */}
                                {item.menu_item.image_url ? (
                                    <img
                                        src={item.menu_item.image_url}
                                        alt={item.item_name}
                                        className="w-10 h-10 rounded-md object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}

                                {/* Name & Orders */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.item_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.order_count} orders
                                    </p>
                                </div>

                                {/* Revenue & Trend */}
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{formatCurrency(item.revenue)}</p>
                                    {item.trend_percentage !== undefined && (
                                        <div className={cn("flex items-center justify-end gap-1 text-xs", getTrendColor(item.trend_percentage))}>
                                            {getTrendIcon(item.trend_percentage)}
                                            <span>{Math.abs(item.trend_percentage).toFixed(0)}%</span>
                                        </div>
                                    )}
                                </div>

                                {/* Featured Star */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0"
                                    onClick={() => handleToggleFeatured(item.menu_item_id, item.is_featured)}
                                    disabled={isToggling}
                                    title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                                >
                                    <Star
                                        className={cn(
                                            "h-4 w-4 transition-colors",
                                            item.is_featured
                                                ? "fill-amber-400 text-amber-400"
                                                : "text-muted-foreground hover:text-amber-400"
                                        )}
                                    />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
