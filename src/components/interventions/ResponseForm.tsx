import { useState } from 'react';
import { Intervention, useResolveInterventionMutation, useClaimInterventionMutation } from '@/store/api/interventionApi';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, UserCheck } from 'lucide-react';

interface ResponseFormProps {
    intervention: Intervention;
    onSuccess: () => void;
}

export const ResponseForm = ({ intervention, onSuccess }: ResponseFormProps) => {
    const [message, setMessage] = useState('');
    const [price, setPrice] = useState<string>('');
    const [notes, setNotes] = useState('');

    const [resolveIntervention, { isLoading: isResolving }] = useResolveInterventionMutation();
    const [claimIntervention, { isLoading: isClaiming }] = useClaimInterventionMutation();

    const handleClaim = async () => {
        try {
            await claimIntervention(intervention.id).unwrap();
            toast.success('Intervention claimed');
            onSuccess();
        } catch (error) {
            toast.error('Failed to claim intervention');
        }
    };

    const handleResolve = async (approved: boolean) => {
        try {
            await resolveIntervention({
                id: intervention.id,
                approved,
                price: price ? parseFloat(price) : undefined,
                message: message || undefined,
                notes: notes || undefined
            }).unwrap();

            toast.success(approved ? 'Intervention resolved successfully' : 'Intervention rejected');
            onSuccess();
        } catch (error) {
            toast.error('Failed to resolve intervention');
        }
    };

    // If pending, first action is often to claim (though we can allow direct resolve too)
    // For simplicity, we show the resolve form immediately but maybe highlight "Claiming..." state if needed.

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Take Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {intervention.type === 'custom_cake' && (
                    <div className="space-y-2">
                        <Label htmlFor="price">Quoted Price (₹)</Label>
                        <Input
                            id="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="message">Message to Customer</Label>
                    <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Prepare a response..."
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Internal Notes</Label>
                    <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes for other admins..."
                        rows={2}
                        className="bg-muted/50"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                {intervention.status === 'pending' && (
                    <Button
                        variant="outline"
                        onClick={handleClaim}
                        disabled={isClaiming || isResolving}
                        className="flex-1"
                    >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Claim
                    </Button>
                )}
                <Button
                    className="flex-[2]"
                    onClick={() => handleResolve(true)}
                    disabled={isResolving}
                >
                    <Send className="w-4 h-4 mr-2" />
                    Resolve & Send
                </Button>
            </CardFooter>
        </Card>
    );
};
