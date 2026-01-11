import { useGetInterventionsQuery, Intervention } from '@/store/api/interventionApi';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';

interface InterventionListProps {
    onSelect: (intervention: Intervention) => void;
    selectedId?: string;
}

export const InterventionList = ({ onSelect, selectedId }: InterventionListProps) => {
    const { data, isLoading, error } = useGetInterventionsQuery({
        status: 'pending',
        page: 1,
        limit: 50,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load interventions</p>
            </div>
        );
    }

    const interventions = data?.data || [];

    const getVariant = (type: string) => {
        switch (type) {
            case 'urgent_delivery': return 'destructive';
            case 'custom_cake': return 'default';
            case 'party_hall': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <Card className="h-full flex flex-col border-0 rounded-none md:rounded-lg shadow-none md:shadow-sm">
            <CardHeader className="px-4 py-3 border-b">
                <CardTitle className="text-lg font-medium">Pending Interventions</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="divide-y">
                    {interventions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No pending interventions
                        </div>
                    ) : (
                        interventions.map((intervention) => {
                            const isSelected = selectedId === intervention.id;

                            return (
                                <button
                                    key={intervention.id}
                                    onClick={() => onSelect(intervention)}
                                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${isSelected ? 'bg-muted border-l-4 border-primary' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium truncate pr-2">
                                            {intervention.customer?.name || 'Unknown Customer'}
                                        </span>
                                        <Badge variant={getVariant(intervention.type)} className="shrink-0 text-[10px] uppercase">
                                            {intervention.type.replace('_', ' ')}
                                        </Badge>
                                    </div>

                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p className="flex items-center gap-1">
                                            <span className="truncate">Session #{intervention.session_id?.slice(-6) || 'N/A'}</span>
                                        </p>
                                        <p className="text-xs">
                                            {format(new Date(intervention.created_at), 'MMM d, h:mm a')}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
};
