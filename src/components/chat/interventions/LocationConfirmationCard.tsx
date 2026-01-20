import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Truck, Store, Check, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPhone } from '@/utils/formatters';
import { Intervention } from '@/store/api/interventionApi';

interface LocationConfirmationCardProps {
    intervention: Intervention;
    isExpanded: boolean;
    onExpandToggle: (expanded: boolean) => void;
    onResolve: (approved: boolean, message?: string, customDeliveryFee?: number) => void;
    isResolving: boolean;
}

export const LocationConfirmationCard = ({
    intervention,
    isExpanded,
    onExpandToggle,
    onResolve,
    isResolving,
}: LocationConfirmationCardProps) => {
    const [customMessage, setCustomMessage] = useState('');
    const [deliveryFee, setDeliveryFee] = useState<number>(intervention.request_data?.suggested_fee || 0);

    const getApprovalMessage = (fee: number) =>
        `നിങ്ങളുടെ ലൊക്കേഷനിലേക്ക് ₹${fee} ഡെലിവറി ചാർജിൽ ഞങ്ങൾക്ക് ഡെലിവറി ചെയ്യാൻ കഴിയും. ഓർഡർ സ്ഥിരീകരിക്കാൻ "Yes" എന്ന് പറയുക, നന്ദി!`;
    const rejectionMessage = `ക്ഷമിക്കണം, നിങ്ങളുടെ ലൊക്കേഷൻ ഞങ്ങളുടെ ഡെലിവറി പരിധിക്ക് പുറത്താണ്. ദയവായി ഷോപ്പിൽ നിന്ന് നേരിട്ട് വന്ന് വാങ്ങാൻ (Takeaway) അല്ലെങ്കിൽ ഔട്ട്‌ലെറ്റിന് അടുത്തുള്ള ഏതെങ്കിലും ലൊക്കേഷൻ തിരിഞ്ഞെടുക്കാമോ?`;

    // Render collapsed view
    if (!isExpanded) {
        return (
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-500/5 transition-colors"
                onClick={() => onExpandToggle(true)}
            >
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        Confirm Location: {intervention.request_data?.address || 'N/A'} ({intervention.request_data?.distance_km} km)
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
                    <MapPin className="h-5 w-5" />
                    <span className="font-semibold">Confirm Delivery Location</span>
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
                <div className="grid grid-cols-1 gap-4 text-sm bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                    <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wide">Requested Address</span>
                        <span className="font-medium text-lg leading-tight">
                            {intervention.request_data?.address || 'N/A'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wide">Distance</span>
                            <span className="font-medium">{intervention.request_data?.distance_km} km</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wide">Delivery fee</span>
                            <div className="mt-1 flex items-center gap-1">
                                <span className="text-gray-500 font-medium">₹</span>
                                <input
                                    type="number"
                                    value={deliveryFee}
                                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                                />
                            </div>
                        </div>
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
                            onClick={() => setCustomMessage(getApprovalMessage(deliveryFee))}
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
                        onClick={() => onResolve(true, customMessage, deliveryFee)}
                        disabled={isResolving || !customMessage.trim()}
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Location
                    </Button>
                </div>
            </div>
        </div>
    );
};
