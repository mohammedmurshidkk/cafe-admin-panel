import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Intervention } from '@/store/api/interventionApi';

interface GenericInterventionCardProps {
    intervention: Intervention;
    isExpanded: boolean;
    onExpandToggle: (expanded: boolean) => void;
    onResolve: (approved: boolean, message?: string) => void;
    isResolving: boolean;
}

export const GenericInterventionCard = ({
    intervention,
    isExpanded,
    onExpandToggle,
    onResolve,
    isResolving,
}: GenericInterventionCardProps) => {
    const [replyMessage, setReplyMessage] = useState('');

    const reason = intervention.request_data?.reason || intervention.request_data?.message || 'Attention needed';

    // Render collapsed view
    if (!isExpanded) {
        return (
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-orange-500/5 transition-colors"
                onClick={() => onExpandToggle(true)}
            >
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                        {reason}
                    </span>
                </div>
                <ChevronUp className="h-4 w-4 text-orange-600" />
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Action Required</span>
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
                <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-1">Reason / Request</span>
                    <p className="text-sm font-medium leading-relaxed">
                        {reason}
                    </p>
                </div>

                <div className="space-y-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Reply to Customer:
                    </span>
                    <Textarea
                        placeholder="Type your response or action taken..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="resize-none"
                        rows={3}
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
                        onClick={() => onResolve(true, replyMessage)}
                        disabled={isResolving || !replyMessage.trim()}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply & Resolve
                    </Button>
                </div>
            </div>
        </div>
    );
};
