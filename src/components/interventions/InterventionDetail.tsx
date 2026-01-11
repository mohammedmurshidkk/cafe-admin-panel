import { Intervention } from '@/store/api/interventionApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Phone, Info } from 'lucide-react';
import { format } from 'date-fns';
import { formatPhone } from '@/utils/formatters';

interface InterventionDetailProps {
    intervention: Intervention;
}

export const InterventionDetail = ({ intervention }: InterventionDetailProps) => {
    return (
        <div className="space-y-6">
            {/* Customer Context */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Customer Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">{intervention.customer?.name}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="h-3 w-3 mr-1" />
                                {formatPhone(intervention.customer?.phone)}
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href={`/chat/${intervention.session_id}`} target="_blank" rel="noopener noreferrer">
                                View Chat
                            </a>
                        </Button>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Session ID</p>
                            <p className="font-mono">{intervention.session_id || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Created At</p>
                            <p>{format(new Date(intervention.created_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Intervention Specifics */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base capitalize">
                            {intervention.type.replace('_', ' ')} Request
                        </CardTitle>
                        <Badge variant={intervention.status === 'pending' ? 'default' : 'secondary'}>
                            {intervention.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Image (Common for custom_cake) */}
                    {intervention.image_url && (
                        <div className="rounded-lg overflow-hidden border">
                            <img src={intervention.image_url} alt="Reference" className="w-full h-64 object-contain bg-muted/20" />
                        </div>
                    )}

                    {/* Message */}
                    {intervention.message && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium mb-1">Customer Message</p>
                            <p className="text-sm">{intervention.message}</p>
                        </div>
                    )}

                    {/* Extra Context Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        {intervention.customer_weight && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Weight</p>
                                <p className="text-sm font-medium">{intervention.customer_weight}</p>
                            </div>
                        )}
                        {intervention.customer_flavor && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Flavor</p>
                                <p className="text-sm font-medium">{intervention.customer_flavor}</p>
                            </div>
                        )}
                    </div>

                    {/* AI Analysis */}
                    {intervention.ai_analysis && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg space-y-2 border border-yellow-100 dark:border-yellow-900/30">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-yellow-600" />
                                <span className="font-medium text-sm text-yellow-700">AI Insights</span>
                            </div>
                            <pre className="text-xs text-muted-foreground overflow-auto">
                                {JSON.stringify(intervention.ai_analysis, null, 2)}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
