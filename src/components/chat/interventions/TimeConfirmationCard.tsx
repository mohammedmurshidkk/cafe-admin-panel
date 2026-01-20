import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Truck, Store, Check, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPhone } from '@/utils/formatters';
import { Intervention } from '@/store/api/interventionApi';

interface TimeConfirmationCardProps {
    intervention: Intervention;
    isExpanded: boolean;
    onExpandToggle: (expanded: boolean) => void;
    onResolve: (approved: boolean, message?: string) => void;
    isResolving: boolean;
}

export const TimeConfirmationCard = ({
    intervention,
    isExpanded,
    onExpandToggle,
    onResolve,
    isResolving,
}: TimeConfirmationCardProps) => {
    const [customMessage, setCustomMessage] = useState('');

    const approvalMessage = `നിങ്ങളുടെ ഓർഡർ ആ സമയത്ത് ഡെലിവറി ചെയ്യാൻ കഴിയും. നിങ്ങളുടെ ഓർഡർ സ്ഥിരീകരിക്കാൻ "Yes" എന്ന് പറയുക, നന്ദി!`;
    const rejectionMessage = `ക്ഷമിക്കണം, നിങ്ങൾ അഭ്യർത്ഥിച്ച സമയത്ത് ഞങ്ങൾക്ക് ഡെലിവർ ചെയ്യാൻ കഴിയില്ല. ദയവായി മറ്റൊരു സമയം തിരഞ്ഞെടുക്കുക.`;

    // Render collapsed view
    if (!isExpanded) {
        const timeStr = intervention.request_data?.requestedTime
            ? new Date(intervention.request_data.requestedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            : 'N/A';

        return (
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-500/5 transition-colors"
                onClick={() => onExpandToggle(true)}
            >
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        Confirm Time: {timeStr}
                    </span>
                </div>
                <ChevronUp className="h-4 w-4 text-purple-600" />
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">Confirm Delivery Time</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onExpandToggle(false)}
                    className="h-7 w-7 p-0"
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                    <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wide">Requested Time</span>
                        <span className="font-medium text-lg">
                            {intervention.request_data?.requestedTime
                                ? new Date(intervention.request_data.requestedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                                : 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                            {intervention.request_data?.requestedTime
                                ? new Date(intervention.request_data.requestedTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                                : ''}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wide">Fulfillment</span>
                        <div className="flex items-center gap-1 font-medium mt-1">
                            {intervention.request_data?.fulfillmentType === 'delivery' ? (
                                <>
                                    <Truck className="h-4 w-4 text-blue-500" />
                                    <span>Delivery</span>
                                </>
                            ) : (
                                <>
                                    <Store className="h-4 w-4 text-orange-500" />
                                    <span>Takeaway</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wide">Customer Phone</span>
                        <span className="font-medium">{formatPhone(intervention.request_data?.phone)}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <span className="text-sm font-medium">Message to Customer (Required):</span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => setCustomMessage(approvalMessage)}
                        >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Approval
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                            onClick={() => setCustomMessage(rejectionMessage)}
                        >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Rejection
                        </Button>
                    </div>
                    <Textarea
                        placeholder="Select a template above or type your message..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="resize-none overflow-y-auto"
                        rows={3}
                        style={{ maxHeight: '4.5rem', lineHeight: '1.5rem' }}
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => onResolve(false, customMessage)}
                        disabled={isResolving || !customMessage.trim()}
                    >
                        Suggest Alternative
                    </Button>
                    <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onResolve(true, customMessage)}
                        disabled={isResolving || !customMessage.trim()}
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Time
                    </Button>
                </div>
            </div>
        </div>
    );
};
