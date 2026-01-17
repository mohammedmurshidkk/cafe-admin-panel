import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';
import {
    useGetInterventionsBySessionQuery
} from '@/store/api/interventionApi';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTime, formatCurrency } from '@/utils/formatters';
import {
    Lightbulb,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Calendar,
    Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterventionHistorySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId: string;
}

export const InterventionHistorySheet = ({
    open,
    onOpenChange,
    sessionId
}: InterventionHistorySheetProps) => {
    const { data: interventions, isLoading } = useGetInterventionsBySessionQuery(sessionId, {
        skip: !open || !sessionId
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved':
                return <CheckCircle2 className="h-4 w-4 text-success" />;
            case 'cancelled':
            case 'expired':
                return <XCircle className="h-4 w-4 text-destructive" />;
            case 'pending':
            case 'in_review':
                return <Clock className="h-4 w-4 text-warning" />;
            default:
                return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'resolved':
                return 'completed';
            case 'cancelled':
            case 'expired':
                return 'destructive';
            case 'pending':
            case 'in_review':
                return 'pending';
            default:
                return 'secondary';
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
                <SheetHeader className="p-6 border-b border-border text-left">
                    <SheetTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Intervention History
                    </SheetTitle>
                    <SheetDescription>
                        History of AI interventions and manual resolutions for this session.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse space-y-2">
                                        <div className="h-20 bg-muted rounded-lg w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : !interventions || interventions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                <p>No intervention history found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {interventions.slice().reverse().map((intervention) => (
                                    <div
                                        key={intervention.id}
                                        className="group relative rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm capitalize">
                                                        {intervention.type.replace(/_/g, ' ')}
                                                    </span>
                                                    <Badge variant={getStatusBadgeVariant(intervention.status)}>
                                                        <span className="flex items-center gap-1">
                                                            {getStatusIcon(intervention.status)}
                                                            {intervention.status}
                                                        </span>
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDateTime(intervention.created_at)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Customer Request Details */}
                                            <div className="bg-muted/30 rounded-lg p-3 text-sm">
                                                <p className="text-muted-foreground text-xs mb-1 font-medium">Request</p>
                                                {intervention.message && (
                                                    <p className="line-clamp-2">{intervention.message}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {intervention.customer_weight && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            Wt: {intervention.customer_weight}
                                                        </Badge>
                                                    )}
                                                    {intervention.customer_flavor && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            Flavor: {intervention.customer_flavor}
                                                        </Badge>
                                                    )}
                                                    {intervention.image_url && (
                                                        <Badge variant="secondary" className="text-[10px] gap-1">
                                                            <ImageIcon className="h-3 w-3" /> Image Provided
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Admin Response Details */}
                                            {(intervention.admin_response || intervention.status === 'resolved') && (
                                                <div className="bg-primary/5 rounded-lg p-3 text-sm border border-primary/10">
                                                    <p className="text-primary/70 text-xs mb-1 font-medium italic">Resolution</p>
                                                    {intervention.admin_response?.message ? (
                                                        <p className="line-clamp-2 text-foreground/90 font-medium">
                                                            "{intervention.admin_response.message}"
                                                        </p>
                                                    ) : (
                                                        <p className="text-muted-foreground italic">No response message provided.</p>
                                                    )}

                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-muted-foreground">Resolved At</span>
                                                            <span className="text-[11px] font-medium">
                                                                {intervention.resolved_at ? formatDateTime(intervention.resolved_at) : 'N/A'}
                                                            </span>
                                                        </div>
                                                        {intervention.admin_response?.price && (
                                                            <div className="text-right">
                                                                <span className="text-[10px] text-muted-foreground block text-right">Price Set</span>
                                                                <span className="text-sm font-bold text-primary">
                                                                    {formatCurrency(intervention.admin_response.price)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
